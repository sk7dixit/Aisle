const Product = require('../models/Product');
const User = require('../models/User');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const { getRedisClient, isRedisActive } = require('../config/redis');
const searchCache = require('../utils/searchCache');
const { calculateSellerConfidence, calculateStockConfidence, calculateRankingScore } = require('../utils/confidenceUtils');
const { VISIBILITY_BOOST } = require('../config/subscriptionConfig');

// Helper: Calculate distance (Haversine Formula) - meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 1000); // Return in meters
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// @desc    Search products conversationally
// @route   GET /api/customer/search-products
const searchProducts = async (req, res) => {
    try {
        const { q, lat, lng, radius = 5, cursor, limit = 15 } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadiusMeters = parseFloat(radius) * 1000;
        const userHasCoords = !isNaN(userLat) && !isNaN(userLng);
        const limitVal = parseInt(limit, 10) || 15;

        const cleanQuery = q.toLowerCase().trim();

        // 1. QUERY CACHE SYSTEM FIRST
        const cacheKey = `search:cache:customer_intel:product:${cleanQuery}:${lat || 'null'}:${lng || 'null'}:${radius}:${cursor || 'start'}:${limitVal}`;
        if (isRedisActive()) {
            const cachedResults = await searchCache.get(cacheKey);
            if (cachedResults) {
                console.log(`[SearchEngine-Intel] Cache hit for conversational product search: "${q}"`);
                return res.json(cachedResults);
            }
        }

        // 2. TRACK SEARCH HISTORY IN REDIS & DB
        const CustomerSearchHistory = require('../models/CustomerSearchHistory');
        if (req.user) {
            await CustomerSearchHistory.create({
                customerId: req.user._id,
                query: q
            }).catch(e => console.warn("Failed to save search history:", e.message));

            if (isRedisActive()) {
                const redis = getRedisClient();
                await redis.set(`user:last_search:${req.user._id}`, cleanQuery, 'EX', 3600); // 1 hr expiry
            }
        }

        // 3. GEOSPATIAL SELLER LOOKUP FIRST
        let sellerIds = [];
        let nearbySellers = [];
        let sellersMap = new Map();

        if (userHasCoords) {
            nearbySellers = await User.find({
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
            }).select('_id shopDetails subscription visibilityBoost');
            sellerIds = nearbySellers.map(s => s._id);
            nearbySellers.forEach(s => sellersMap.set(s._id.toString(), s));
        }

        // 4. SEARCH PRODUCTS
        const productQuery = {
            isAvailable: { $ne: false },
            isDraft: { $ne: true },
            adminStatus: 'Active'
        };

        if (userHasCoords) {
            productQuery.seller = { $in: sellerIds };
        }

        productQuery.$or = [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
            { subCategory: { $regex: q, $options: 'i' } }
        ];

        const products = await Product.find(productQuery).populate('seller', 'shopDetails subscription visibilityBoost sellerStats');

        // 5. SCORE PRODUCTS
        const results = products.map(p => {
            let distance = 999999;
            const sellerDetails = p.seller || sellersMap.get(p.sellerId?.toString());
            
            if (sellerDetails?.shopDetails?.shopLocation?.coordinates && userHasCoords) {
                distance = calculateDistance(
                    userLat, userLng,
                    sellerDetails.shopDetails.shopLocation.coordinates[1],
                    sellerDetails.shopDetails.shopLocation.coordinates[0]
                );
            }

            // Distance Score (40%)
            const distanceScore = userHasCoords && distance !== 999999
                ? Math.max(0, (1 - distance / searchRadiusMeters) * 40)
                : 0;

            // Availability Score (25%)
            let availabilityScore = 0;
            if (p.stockStatus === 'AVAILABLE' || p.stockStatus === 'IN_STOCK') availabilityScore = 25;
            else if (p.stockStatus === 'LIMITED') availabilityScore = 15;

            // Popularity Score (20%)
            const popularityScore = Math.min(p.views || 0, 100) / 100 * 20;

            // Rating Score (15%)
            const ratingScore = ((sellerDetails?.shopDetails?.rating || 0) / 5) * 15;

            const totalScore = distanceScore + availabilityScore + popularityScore + ratingScore;

            // Sub boosts
            let priorityScore = 0;
            if (sellerDetails) {
                priorityScore = calculateRankingScore(sellerDetails, sellerDetails.sellerStats);
                if (sellerDetails.visibilityBoost?.isActive) {
                    const boostType = sellerDetails.visibilityBoost.boostType?.toUpperCase();
                    priorityScore += (VISIBILITY_BOOST[boostType]?.visibilityScoreBonus || 5);
                }
            }

            const finalScore = totalScore + priorityScore;

            return {
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: sellerDetails?.shopDetails?.shopName || 'Unknown Shop',
                shopId: sellerDetails?._id,
                distance: distance,
                isOpen: sellerDetails ? (sellerDetails.shopDetails?.isOpen || deriveShopStatus(sellerDetails.shopDetails) === 'ONLINE') : false,
                stockStatus: p.stockStatus || 'AVAILABLE',
                brand: p.brand || '',
                category: p.category || '',
                _score: finalScore
            };
        }).filter(item => !userHasCoords || item.distance <= searchRadiusMeters)
          .sort((a, b) => {
              if (a.isOpen !== b.isOpen) return b.isOpen ? -1 : 1;
              return b._score - a._score;
          });

        // 6. CURSOR PAGINATION
        let startIdx = 0;
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'));
                startIdx = decoded.nextOffset || 0;
            } catch (e) {
                startIdx = 0;
            }
        }

        const paginatedResults = results.slice(startIdx, startIdx + limitVal);
        const nextOffset = startIdx + limitVal;
        const hasMore = nextOffset < results.length;
        const nextCursor = hasMore
            ? Buffer.from(JSON.stringify({ nextOffset })).toString('base64')
            : null;

        const outputPayload = cursor
            ? { results: paginatedResults, nextCursor, hasMore }
            : paginatedResults;

        // Cache response payload for 60 seconds
        if (isRedisActive()) {
            await searchCache.set(cacheKey, outputPayload, 60);
        }

        res.json(outputPayload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search shops conversationally
// @route   GET /api/customer/search-shops
const searchShops = async (req, res) => {
    try {
        const { q, lat, lng, radius = 5 } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadiusMeters = parseFloat(radius) * 1000;

        const sellers = await User.find({
            role: 'seller',
            $or: [
                { 'shopDetails.shopName': { $regex: q, $options: 'i' } },
                { 'shopDetails.shopCategory': { $regex: q, $options: 'i' } },
                { 'shopDetails.shopType': { $regex: q, $options: 'i' } }
            ]
        }).select('shopDetails subscription phone');

        const results = sellers.map(s => {
            let distance = null;
            if (s.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    s.shopDetails.shopLocation.coordinates[1],
                    s.shopDetails.shopLocation.coordinates[0]
                );
            }

            return {
                _id: s._id,
                name: s.shopDetails?.shopName || 'Unknown Shop',
                category: s.shopDetails?.shopType || s.shopDetails?.shopCategory || 'General',
                distance: distance,
                address: s.shopDetails?.address || '',
                phone: s.phone || s.shopDetails?.phone || '9876543210',
                isOpen: deriveShopStatus(s.shopDetails) === 'ONLINE',
                rating: s.shopDetails?.rating || 0,
                shopImage: s.shopDetails?.photos?.[0] || null,
                coordinates: s.shopDetails?.shopLocation?.coordinates || null
            };
        }).filter(item => {
            if (!isNaN(userLat) && item.distance !== null) {
                return item.distance <= searchRadiusMeters;
            }
            return true;
        }).sort((a, b) => {
            if (a.isOpen !== b.isOpen) return b.isOpen ? 1 : -1;
            return (a.distance || 999999) - (b.distance || 999999);
        });

        res.json(results.slice(0, 15));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get smart product recommendations
// @route   GET /api/customer/recommendations
const getRecommendations = async (req, res) => {
    try {
        const { q, budget, lat, lng } = req.query;
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const budgetLimit = parseFloat(budget);

        let queryObj = {
            isAvailable: { $ne: false },
            isDraft: { $ne: true },
            adminStatus: 'Active'
        };

        if (budgetLimit) {
            queryObj.sellingPrice = { $lte: budgetLimit };
        }

        if (q) {
            const cleanQ = q.toLowerCase();
            if (cleanQ.includes('gift') || cleanQ.includes('birthday') || cleanQ.includes('mom') || cleanQ.includes('anniversary')) {
                queryObj.$or = [
                    { category: { $regex: 'festive|lifestyle|decor|gift|toy|novelty|chocolate|sweet', $options: 'i' } },
                    { name: { $regex: 'hamper|chocolate|lamp|frame|gift|mug|plant|candle|perfume|decor|saree|shawl|sweets', $options: 'i' } }
                ];
            } else if (cleanQ.includes('rice')) {
                queryObj.name = { $regex: 'rice|basmati', $options: 'i' };
            } else {
                queryObj.name = { $regex: q, $options: 'i' };
            }
        }

        const products = await Product.find(queryObj)
            .populate('seller', 'shopDetails subscription')
            .limit(50);

        const results = products.map(p => {
            let distance = null;
            if (p.seller?.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    p.seller.shopDetails.shopLocation.coordinates[1],
                    p.seller.shopDetails.shopLocation.coordinates[0]
                );
            }

            return {
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
                shopId: p.seller?._id,
                distance: distance,
                isOpen: p.seller ? deriveShopStatus(p.seller.shopDetails) === 'ONLINE' : false,
                stockStatus: p.stockStatus || 'AVAILABLE',
                brand: p.brand || '',
                category: p.category || ''
            };
        });

        if (!isNaN(userLat)) {
            results.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
        }

        res.json(results.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get nearby Home Businesses
// @route   GET /api/customer/home-businesses
const getHomeBusinesses = async (req, res) => {
    try {
        const { q, lat, lng } = req.query;
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const sellers = await User.find({
            role: 'seller',
            'shopDetails.shopType': 'HOME_BUSINESS'
        }).select('shopDetails subscription phone');

        const sellerIds = sellers.map(s => s._id);

        let products = [];
        if (q) {
            products = await Product.find({
                seller: { $in: sellerIds },
                isAvailable: { $ne: false },
                isDraft: { $ne: true },
                name: { $regex: q, $options: 'i' }
            });
        }

        const results = sellers.map(s => {
            let distance = null;
            if (s.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    s.shopDetails.shopLocation.coordinates[1],
                    s.shopDetails.shopLocation.coordinates[0]
                );
            }

            const shopProducts = products.filter(p => p.seller.toString() === s._id.toString());

            return {
                _id: s._id,
                name: s.shopDetails?.shopName || 'Unknown Home Shop',
                category: s.shopDetails?.shopCategory || 'Home Business',
                distance: distance,
                address: s.shopDetails?.address || '',
                phone: s.phone || s.shopDetails?.phone || '9876543210',
                isOpen: deriveShopStatus(s.shopDetails) === 'ONLINE',
                rating: s.shopDetails?.rating || 0,
                shopImage: s.shopDetails?.photos?.[0] || null,
                matchingProducts: shopProducts.map(p => ({
                    _id: p._id,
                    name: p.name,
                    price: p.sellingPrice || p.price || 0,
                    imageUrl: p.imageUrl
                }))
            };
        }).sort((a, b) => {
            if (a.isOpen !== b.isOpen) return b.isOpen ? 1 : -1;
            return (a.distance || 999999) - (b.distance || 999999);
        });

        res.json(results.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get alternative/cheaper options
// @route   GET /api/customer/alternatives
const getAlternatives = async (req, res) => {
    try {
        const { productId, q, cheaper, lat, lng } = req.query;
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        let targetProduct = null;

        if (productId) {
            targetProduct = await Product.findById(productId);
        } else if (q) {
            targetProduct = await Product.findOne({
                isAvailable: { $ne: false },
                isDraft: { $ne: true },
                name: { $regex: q, $options: 'i' }
            });
        }

        if (!targetProduct) {
            const products = await Product.find({
                isAvailable: { $ne: false },
                isDraft: { $ne: true },
                name: { $regex: q || '', $options: 'i' }
            }).populate('seller', 'shopDetails subscription');
            
            const results = products.map(p => {
                let distance = null;
                if (p.seller?.shopDetails?.shopLocation?.coordinates) {
                    distance = calculateDistance(
                        userLat, userLng,
                        p.seller.shopDetails.shopLocation.coordinates[1],
                        p.seller.shopDetails.shopLocation.coordinates[0]
                    );
                }
                return {
                    _id: p._id,
                    name: p.name,
                    price: p.sellingPrice || p.price || 0,
                    imageUrl: p.imageUrl,
                    shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
                    shopId: p.seller?._id,
                    distance
                };
            });
            return res.json(results.slice(0, 5));
        }

        let queryObj = {
            _id: { $ne: targetProduct._id },
            isAvailable: { $ne: false },
            isDraft: { $ne: true },
            categorySlug: targetProduct.categorySlug
        };

        const targetPrice = targetProduct.sellingPrice || targetProduct.price || 0;

        if (cheaper === 'true') {
            queryObj.sellingPrice = { $lt: targetPrice };
        }

        const altProducts = await Product.find(queryObj)
            .populate('seller', 'shopDetails subscription')
            .sort(cheaper === 'true' ? { sellingPrice: 1 } : { views: -1 })
            .limit(20);

        const results = altProducts.map(p => {
            let distance = null;
            if (p.seller?.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    p.seller.shopDetails.shopLocation.coordinates[1],
                    p.seller.shopDetails.shopLocation.coordinates[0]
                );
            }

            return {
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
                shopId: p.seller?._id,
                distance: distance,
                isOpen: p.seller ? deriveShopStatus(p.seller.shopDetails) === 'ONLINE' : false,
                stockStatus: p.stockStatus || 'AVAILABLE',
                brand: p.brand || '',
                category: p.category || ''
            };
        });

        if (!isNaN(userLat)) {
            results.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
        }

        res.json(results.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchProducts,
    searchShops,
    getRecommendations,
    getHomeBusinesses,
    getAlternatives
};
