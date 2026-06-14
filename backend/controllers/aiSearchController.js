const aiSearchService = require('../services/aiSearchService');
const Product = require('../models/Product');
const User = require('../models/User');
const { deriveShopStatus } = require('../utils/shopStatusUtils');

// Helper: Calculate distance (Haversine Formula) - MVP version
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 1000); // Return in meters
};

// POST /api/ai/search
const search = async (req, res) => {
    try {
        const { query, lat, lng, radius = 5, limit = 15, cursor = null } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const userId = req.user?._id || null;
        
        // Execute AI Intent Search
        const aiResults = await aiSearchService.searchAI(query, lat, lng, radius, userId, limit, cursor);

        // Fallback strategy: If AI doesn't understand intent, perform standard keyword search
        if (aiResults.fallback) {
            console.log(`[AISearchController] Intent low confidence. Falling back to normal keyword search for: "${query}"`);
            
            const cleanQuery = query.toLowerCase().trim();
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const userHasCoords = !isNaN(userLat) && !isNaN(userLng);
            const searchRadiusMeters = radius * 1000;

            // Geospatial Seller Lookup
            let sellerIds = [];
            let sellersMap = new Map();
            if (userHasCoords) {
                const sellers = await User.find({
                    role: 'seller',
                    verificationStatus: 'approved',
                    "shopDetails.shopLocation": {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: [userLng, userLat]
                            },
                            $maxDistance: searchRadiusMeters
                        }
                    }
                }).select('_id shopDetails subscription visibilityBoost sellerStats');
                sellerIds = sellers.map(s => s._id);
                sellers.forEach(s => sellersMap.set(s._id.toString(), s));
            } else {
                const sellers = await User.find({ role: 'seller', verificationStatus: 'approved' })
                    .select('_id shopDetails subscription visibilityBoost sellerStats');
                sellerIds = sellers.map(s => s._id);
                sellers.forEach(s => sellersMap.set(s._id.toString(), s));
            }

            // Normal Product query
            const productQuery = {
                seller: { $in: sellerIds },
                isAvailable: { $ne: false },
                isDraft: { $ne: true },
                adminStatus: 'Active',
                $or: [
                    { name: { $regex: cleanQuery, $options: 'i' } },
                    { brand: { $regex: cleanQuery, $options: 'i' } },
                    { category: { $regex: cleanQuery, $options: 'i' } }
                ]
            };

            if (cursor) {
                productQuery._id = { $gt: cursor };
            }

            const startMongo = Date.now();
            let products;
            try {
                products = await Product.find(productQuery).populate('seller', 'shopDetails subscription').limit(parseInt(limit, 10) + 1);
            } catch (err) {
                console.error('[AISearchController] MongoDB standard search failed:', err.message);
                products = [];
            }
            const mongoDuration = Date.now() - startMongo;

            const MONGO_LATENCY_THRESHOLD = 300;
            let isMongoHealthy = products && products.length > 0;
            if (mongoDuration > MONGO_LATENCY_THRESHOLD) {
                console.warn(`[Search Resilience] MongoDB standard query latency of ${mongoDuration}ms exceeded threshold. Checking fallback cache.`);
                isMongoHealthy = false;
            }

            const { getRedisClient, isRedisActive } = require('../config/redis');
            const fallbackKey = `ai:search:fallback:keyword:${cleanQuery}`;

            if (!isMongoHealthy && isRedisActive()) {
                try {
                    const redis = getRedisClient();
                    const cachedFallback = await redis.get(fallbackKey);
                    if (cachedFallback) {
                        console.log(`[Search Resilience] Serving fallback cached results for keyword: "${cleanQuery}"`);
                        const payload = JSON.parse(cachedFallback);
                        payload.fallbackServed = true;
                        return res.json(payload);
                    }
                } catch (fallbackErr) {
                    console.error('[Search Resilience] Failed to fetch fallback keyword cache:', fallbackErr.message);
                }
            }

            let hasNextPage = false;
            if (products.length > limit) {
                hasNextPage = true;
                products.pop();
            }
            
            // Fetch trust scores for fallback ranking
            const SellerTrust = require('../models/SellerTrust');
            const trusts = await SellerTrust.find({ sellerId: { $in: sellerIds } }).lean();
            const trustMap = {};
            trusts.forEach(t => {
                trustMap[t.sellerId.toString()] = t.trustScore;
            });

            const formattedProducts = products.map(p => {
                const seller = p.seller || sellersMap.get(p.sellerId?.toString());
                let distance = 999999;

                if (seller?.shopDetails?.shopLocation?.coordinates && userHasCoords) {
                    distance = calculateDistance(
                        userLat, userLng,
                        seller.shopDetails.shopLocation.coordinates[1],
                        seller.shopDetails.shopLocation.coordinates[0]
                    );
                }

                const sellerTrustVal = trustMap[p.sellerId?.toString() || p.seller?._id?.toString()] !== undefined
                    ? trustMap[p.sellerId?.toString() || p.seller?._id?.toString()]
                    : 80;

                // Availability: 25%
                let availabilityScore = p.quantity > 0 ? 25 : 0;
                // Distance: 20%
                const distanceScore = userHasCoords && distance !== 999999
                    ? Math.max(0, (1 - distance / searchRadiusMeters) * 20)
                    : 10;
                // Trust: 15%
                const trustScore = (sellerTrustVal / 100) * 15;
                const totalScore = 40 + availabilityScore + distanceScore + trustScore;

                return {
                    _id: p._id,
                    name: p.name,
                    brand: p.brand || 'Local Brand',
                    price: p.sellingPrice || p.price || 0,
                    imageUrl: p.imageUrl,
                    stockStatus: p.stockStatus || (p.quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
                    shopName: seller?.shopDetails?.shopName || 'Local Shop',
                    shopId: seller?._id,
                    distance,
                    isOpen: seller ? (seller.shopDetails?.isOpen || deriveShopStatus(seller.shopDetails) === 'ONLINE') : false,
                    score: Math.round(totalScore),
                    category: p.category
                };
            }).filter(p => !userHasCoords || p.distance <= searchRadiusMeters)
              .sort((a, b) => b.score - a.score);

            const nextCursor = hasNextPage && formattedProducts.length > 0
                ? formattedProducts[formattedProducts.length - 1]._id.toString()
                : null;

            // Normal Shop query
            const shops = await User.find({
                role: 'seller',
                verificationStatus: 'approved',
                _id: { $in: sellerIds },
                $or: [
                    { 'shopDetails.shopName': { $regex: cleanQuery, $options: 'i' } },
                    { 'shopDetails.shopCategory': { $regex: cleanQuery, $options: 'i' } }
                ]
            });

            const formattedShops = shops.map(s => {
                let distance = 999999;
                if (s.shopDetails?.shopLocation?.coordinates && userHasCoords) {
                    distance = calculateDistance(
                        userLat, userLng,
                        s.shopDetails.shopLocation.coordinates[1],
                        s.shopDetails.shopLocation.coordinates[0]
                    );
                }

                return {
                    _id: s._id,
                    name: s.shopDetails?.shopName || 'Unknown Shop',
                    category: s.shopDetails?.shopCategory || 'Grocery',
                    distance,
                    rating: s.shopDetails?.rating || 4.0,
                    shopImage: s.shopDetails?.photos?.[0] || null,
                    isOpen: deriveShopStatus(s.shopDetails) === 'ONLINE'
                };
            });

            const responsePayload = {
                searchIntentId: null,
                intent: 'keyword_fallback',
                confidence: 0,
                extractedEntities: [],
                category: null,
                products: formattedProducts,
                nextCursor,
                shops: formattedShops,
                bundleRecommendations: [],
                fallback: true
            };

            // Set fallback cache in Redis
            if (isRedisActive()) {
                try {
                    const redis = getRedisClient();
                    await redis.set(fallbackKey, JSON.stringify(responsePayload), 'EX', 86400); // 24 hours
                } catch (cacheErr) {
                    console.error('[AISearchController] Redis cache set failed:', cacheErr.message);
                }
            }

            return res.json(responsePayload);
        }

        res.json(aiResults);
    } catch (error) {
        console.error('[AISearchController] Search Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/search/click
const trackClick = async (req, res) => {
    try {
        const { searchIntentId } = req.body;
        if (!searchIntentId) {
            return res.status(400).json({ success: false, message: 'searchIntentId is required' });
        }

        const updated = await aiSearchService.recordSearchClick(searchIntentId);
        res.json({ success: true, analytics: updated });
    } catch (error) {
        console.error('[AISearchController] Track Click Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/search/conversion
const trackConversion = async (req, res) => {
    try {
        const { searchIntentId } = req.body;
        if (!searchIntentId) {
            return res.status(400).json({ success: false, message: 'searchIntentId is required' });
        }

        const updated = await aiSearchService.recordSearchConversion(searchIntentId);
        res.json({ success: true, analytics: updated });
    } catch (error) {
        console.error('[AISearchController] Track Conversion Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/search/suggestions
const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }

        const suggestions = await aiSearchService.getSearchSuggestions(q);
        res.json(suggestions);
    } catch (error) {
        console.error('[AISearchController] Suggestions Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    search,
    trackClick,
    trackConversion,
    getSuggestions
};
