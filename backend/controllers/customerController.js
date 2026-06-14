const Product = require('../models/Product');
const User = require('../models/User');
const SearchAnalytics = require('../models/SearchAnalytics');
const { trackSearch } = require('../services/searchAnalyticsService');
// const Order = require('../models/Order'); // DEPRECATED: Replaced by CustomerVisit
const { SHOP_CATEGORIES } = require('../utils/shopCategoryConfig');
const { calculateSellerConfidence, calculateStockConfidence, calculateRankingScore } = require('../utils/confidenceUtils');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const { SUBSCRIPTION_PLANS, VISIBILITY_BOOST } = require('../config/subscriptionConfig');
const { getRedisClient, isRedisActive } = require('../config/redis');
const searchCache = require('../utils/searchCache');

// Helper: Calculate distance (Haversine Formula) - MVP version
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

// @desc    Search Exact Items (Customer)
const searchProducts = async (req, res) => {
    try {
        const { q, lat, lng, radius, cursor, limit } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        let userLat = parseFloat(lat);
        let userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius) || 5;
        const userHasCoords = !isNaN(userLat) && !isNaN(userLng);
        const limitVal = parseInt(limit, 10) || 20;

        const cleanQuery = q.toLowerCase().trim();

        // 1. QUERY CACHE SYSTEM FIRST
        const cacheKey = `search:cache:customer:${cleanQuery}:${lat || 'null'}:${lng || 'null'}:${radius || '5'}:${cursor || 'start'}:${limitVal}`;
        if (isRedisActive()) {
            const cachedResults = await searchCache.get(cacheKey);
            if (cachedResults) {
                console.log(`[SearchEngine] Cache hit for customer search: "${q}"`);
                return res.json(cachedResults);
            }
        }

        // 2. TRACK USER SEARCH HISTORY IN REDIS FOR CLICKS/CONVERSIONS
        if (req.user?._id && isRedisActive()) {
            const redis = getRedisClient();
            await redis.set(`user:last_search:${req.user._id}`, cleanQuery, 'EX', 3600); // 1 hr expiry
        }

        // 3. GEOSPATIAL SELLER LOOKUP FIRST (No Collection Scans)
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
                        $maxDistance: searchRadius * 1000
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

        productQuery.$and = [
            {
                $or: [
                    { isExact: true },
                    { shopType: 'HOME_BUSINESS' }
                ]
            },
            {
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { brand: { $regex: q, $options: 'i' } },
                    { category: { $regex: q, $options: 'i' } }
                ]
            }
        ];

        // Populate seller details to obtain rating, subscription details, etc.
        const products = await Product.find(productQuery).populate('seller', 'shopDetails subscription visibilityBoost sellerStats');

        // 5. SEARCH SHOPS
        const shopQuery = {
            role: "seller",
            verificationStatus: 'approved',
            $or: [
                { "shopDetails.shopName": { $regex: q, $options: 'i' } },
                { "shopDetails.shopCategory": { $regex: q, $options: 'i' } }
            ]
        };

        if (userHasCoords) {
            shopQuery._id = { $in: sellerIds };
        }

        const shops = await User.find(shopQuery).select("shopDetails subscription visibilityBoost sellerStats _id");

        // 6. MULTI-FACTOR SCORE CALCULATION
        const productResults = products.map(p => {
            let distance = 999999;
            const sellerDetails = p.seller || sellersMap.get(p.sellerId?.toString());
            
            if (sellerDetails?.shopDetails?.shopLocation?.coordinates && userHasCoords) {
                distance = calculateDistance(
                    userLat, userLng,
                    sellerDetails.shopDetails.shopLocation.coordinates[1],
                    sellerDetails.shopDetails.shopLocation.coordinates[0]
                );
            }

            // A. Distance Score (40%)
            const distanceScore = userHasCoords && distance !== 999999
                ? Math.max(0, (1 - distance / (searchRadius * 1000)) * 40)
                : 0;

            // B. Availability Score (25%)
            let availabilityScore = 0;
            if (p.stockStatus === 'AVAILABLE' || p.stockStatus === 'IN_STOCK') availabilityScore = 25;
            else if (p.stockStatus === 'LIMITED') availabilityScore = 15;

            // C. Popularity Score (20%)
            const popularityScore = Math.min(p.views || 0, 100) / 100 * 20;

            // D. Rating Score (15%)
            const ratingScore = ((sellerDetails?.shopDetails?.rating || 0) / 5) * 15;

            const totalScore = distanceScore + availabilityScore + popularityScore + ratingScore;

            // E. Apply Subscription/Visibility Boosts (Additive on top of score)
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
                type: p.shopType === 'HOME_BUSINESS' ? 'creation' : 'product',
                _id: p._id,
                name: p.name,
                imageUrl: p.imageUrl,
                price: p.sellingPrice || p.price || 0,
                stockStatus: p.stockStatus,
                shopName: sellerDetails?.shopDetails?.shopName || 'Unknown Shop',
                shopId: sellerDetails?._id,
                distance: distance,
                planId: sellerDetails?.subscription?.planId || 'free',
                isOpen: sellerDetails ? (sellerDetails.shopDetails?.isOpen || deriveShopStatus(sellerDetails.shopDetails) === 'ONLINE') : false,
                _score: finalScore,
                stockConfidence: sellerDetails ? calculateStockConfidence(p, sellerDetails) : 'MEDIUM',
                operatingMode: sellerDetails?.shopDetails?.operatingMode || 'GUARANTEED'
            };
        });

        const shopResults = shops.map(s => {
            let distance = 999999;
            if (s.shopDetails?.shopLocation?.coordinates && userHasCoords) {
                distance = calculateDistance(
                    userLat, userLng,
                    s.shopDetails.shopLocation.coordinates[1],
                    s.shopDetails.shopLocation.coordinates[0]
                );
            }

            const distanceScore = userHasCoords && distance !== 999999
                ? Math.max(0, (1 - distance / (searchRadius * 1000)) * 40)
                : 0;

            const ratingScore = ((s.shopDetails?.rating || 0) / 5) * 15;
            const baseScore = distanceScore + ratingScore;

            let priorityScore = calculateRankingScore(s, s.sellerStats);
            if (s.visibilityBoost?.isActive) {
                const boostType = s.visibilityBoost.boostType?.toUpperCase();
                priorityScore += (VISIBILITY_BOOST[boostType]?.visibilityScoreBonus || 0.5);
            }

            const finalScore = baseScore + priorityScore;

            return {
                type: s.shopDetails?.shopType === 'HOME_BUSINESS' ? 'creator' : 'shop',
                _id: s._id,
                name: s.shopDetails?.shopName,
                category: s.shopDetails?.shopCategory,
                shopImage: s.shopDetails?.photos?.[0] || null,
                distance: distance,
                planId: s.subscription?.planId || 'free',
                isOpen: s.shopDetails?.isOpen || deriveShopStatus(s.shopDetails) === 'ONLINE',
                operatingMode: s.shopDetails?.operatingMode || 'GUARANTEED',
                _score: finalScore
            };
        });

        const results = [...productResults, ...shopResults]
            .filter(item => !userHasCoords || item.distance <= searchRadius * 1000)
            .sort((a, b) => b._score - a._score);

        // 7. CURSOR PAGINATION
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

        // 8. LOG SEARCH ANALYTICS ASYNCHRONOUSLY
        let userId = req.user?._id;
        if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_CURRENT);
                userId = decoded.id;
            } catch (err) {}
        }

        let userCity = req.query.city;
        let userState = req.query.state;
        let searchRecordId = null;

        try {
            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    userCity = userCity || user.shopDetails?.city || user.city;
                    userState = userState || user.shopDetails?.state || user.state;
                    if (isNaN(userLat) && user.shopDetails?.shopLocation?.coordinates) {
                        userLng = user.shopDetails.shopLocation.coordinates[0];
                        userLat = user.shopDetails.shopLocation.coordinates[1];
                    }
                }
            }

            const trackedSearch = await trackSearch({
                userId,
                keyword: q,
                city: userCity || 'Indore',
                state: userState || 'Madhya Pradesh',
                latitude: isNaN(userLat) ? null : userLat,
                longitude: isNaN(userLng) ? null : userLng,
                resultsCount: results.length,
                category: products[0]?.category || (shops[0]?.shopDetails?.shopCategory) || null,
                source: req.query.source || 'search_bar'
            });

            if (trackedSearch) {
                searchRecordId = trackedSearch._id;
            }
        } catch (analyticsErr) {
            console.error('[AnalyticsEngine] Failed to save customer search log:', analyticsErr.message);
        }

        // Map searchId to paginated results for click tracking
        const finalResults = paginatedResults.map(item => ({
            ...item,
            searchId: searchRecordId
        }));

        // Format return format dynamically for backwards compatibility
        const outputPayload = cursor || limit 
            ? { results: finalResults, nextCursor, hasMore }
            : finalResults;

        // Cache response payload for 60 seconds
        if (isRedisActive()) {
            await searchCache.set(cacheKey, outputPayload, 60);
        }

        res.json(outputPayload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Popular/Nearby Items (Home Feed)
const getPopularProducts = async (req, res) => {
    try {
        const { lat, lng, category, radius } = req.query;
        const query = { isExact: true, isAvailable: { $ne: false } };
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius) || 5;

        const products = await Product.find(query)
            .sort({ updatedAt: -1 })
            .limit(50)
            .populate('seller', 'shopDetails');

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
                imageUrl: p.imageUrl,
                price: p.price,
                stockStatus: p.stockStatus,
                shopName: p.seller?.shopDetails?.shopName,
                distance: distance,
                stockConfidence: p.seller ? calculateStockConfidence(p, p.seller) : 'MEDIUM',
                operatingMode: p.seller?.shopDetails?.operatingMode || 'GUARANTEED' // Step 5
            };
        }).filter(item => {
            if (!isNaN(userLat) && item.distance !== null) {
                return item.distance <= searchRadius * 1000;
            }
            return true;
        });

        if (!isNaN(userLat)) {
            results.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
        }

        res.json(results.slice(0, 20));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Single Product Detail
const getProductDetail = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, isAvailable: { $ne: false }, isDraft: { $ne: true } },
            { $inc: { views: 1 } },
            { new: true }
        ).populate('seller', 'phone shopDetails sellerStats');
        if (product) {
            res.json({
                ...product._doc,
                shopName: product.seller?.shopDetails?.shopName,
                shopId: product.seller?._id,
                shopPhone: product.seller?.phone || product.seller?.shopDetails?.phone || "9876543210",
                confidence: product.seller ? calculateSellerConfidence(product.seller) : null,
                stockConfidence: product.seller ? calculateStockConfidence(product, product.seller) : 'MEDIUM'
            });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Shop Detail & Catalog
const getShopDetail = async (req, res) => {
    try {
        const { getCategoriesForShop } = require('../utils/shopCategoryConfig');
        const SellerAccountDetails = require('../models/SellerAccountDetails');

        const shopUser = await User.findById(req.params.id);
        if (!shopUser || shopUser.role !== 'seller') {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Fetch Payment Settings
        const pSettings = await SellerAccountDetails.findOne({ sellerId: shopUser._id });
        const paymentInfo = {
            acceptsOnlinePayment: pSettings?.acceptsOnlinePayment || false,
            paymentSetupCompleted: pSettings?.paymentSetupCompleted || false,
            displayName: pSettings?.paymentDisplayName || shopUser.shopDetails?.shopName,
            upiId: pSettings?.maskedUpiId || null
        };

        const products = await Product.find({
            seller: req.params.id,
            stockStatus: { $ne: 'ARCHIVED' },
            isAvailable: { $ne: false },
            isDraft: { $ne: true }
        });

        // 1. Get Master Categories based on shopType and merge with custom shop categories
        const customCategories = shopUser.shopDetails?.shopCategories || [];
        const masterCategories = Array.from(new Set([
            ...getCategoriesForShop(shopUser.shopDetails?.shopType || 'GROCERY_KIRANA'),
            ...customCategories
        ]));

        // 2. Map products into these categories
        const categoriesMap = {};
        masterCategories.forEach(cat => {
            categoriesMap[cat] = [];
        });

        // Add an 'Other' category just in case there are products not in master list
        // but user says "Tabs shown must come ONLY from seller master"
        // and "No category is hidden just because product count = 0"

        products.forEach(p => {
            const cat = p.category || 'General Provision / Kirana';
            // Find matched category name case-insensitively or exactly
            const matchedCat = masterCategories.find(c => c.toLowerCase() === cat.toLowerCase());
            if (matchedCat) {
                categoriesMap[matchedCat].push(p);
            } else {
                // For safety, put in the first category or a default one if it doesn't match
                // but ideally we should match it correctly. 
                // Let's stick to the master list strictly. 
                // If it doesn't match, we can put it in the first master category? 
                // User said: "tabs must come ONLY from SHOP TYPE CATEGORY MASTER"
                const firstCat = masterCategories[0];
                if (categoriesMap[firstCat]) categoriesMap[firstCat].push(p);
            }
        });

        const categories = masterCategories.map(cat => ({
            categoryName: cat,
            items: categoriesMap[cat]
        }));

        shopUser.shopDetails.totalVisitsToday = (shopUser.shopDetails.totalVisitsToday || 0) + 1;
        shopUser.sellerStats.lastActiveAt = new Date();
        await shopUser.save();

        res.json({
            shop: {
                _id: shopUser._id,
                name: shopUser.shopDetails?.shopName,
                phone: shopUser.phone || shopUser.shopDetails?.phone || "9876543210",
                category: shopUser.shopDetails?.shopType || shopUser.shopDetails?.shopCategory,
                address: shopUser.shopDetails?.address,
                location: shopUser.shopDetails?.shopLocation,
                shopLocation: shopUser.shopDetails?.shopLocation,
                isOpen: deriveShopStatus(shopUser.shopDetails) === 'ONLINE',
                shopImage: shopUser.shopDetails?.photos?.[0],
                logo: shopUser.shopDetails?.logo,
                rating: shopUser.shopDetails?.rating || 0,
                numReviews: shopUser.shopDetails?.numReviews || 0,
                confidence: calculateSellerConfidence(shopUser),
                subscription: shopUser.subscription,
                shopDetails: shopUser.shopDetails,
                paymentSettings: paymentInfo // Added for Step 7
            },
            categories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Nearby Shops (Legacy/Manual)
const getNearbyShops = async (req, res) => {
    try {
        const { lat, lng, radius, category } = req.query;
        const searchRadius = parseFloat(radius) || 5;
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const queries = {
            role: 'seller',
            'shopDetails.shopName': { $exists: true }
        };

        if (category && category !== 'All') {
            queries['shopDetails.shopCategory'] = { $regex: category, $options: 'i' };
        }

        const sellers = await User.find(queries).select('shopDetails subscription visibilityBoost _id');
        const sellerIds = sellers.map(s => s._id);

        // Fetch product counts for all matching sellers
        const productCounts = await Product.aggregate([
            {
                $match: {
                    seller: { $in: sellerIds },
                    stockStatus: { $ne: 'ARCHIVED' },
                    isAvailable: { $ne: false }
                }
            },
            {
                $group: {
                    _id: '$seller',
                    count: { $sum: 1 }
                }
            }
        ]);

        const countsMap = productCounts.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        let shops = sellers.map(user => {
            const sd = user.shopDetails || {};
            let distance = null;

            if (userLat && userLng && sd.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    sd.shopLocation.coordinates[1],
                    sd.shopLocation.coordinates[0]
                );
            }

            let priorityScore = 1;
            let boostScore = 0;
            const planId = user.subscription?.planId?.toUpperCase();
            priorityScore = SUBSCRIPTION_PLANS[planId]?.visibilityPriority || 1;

            if (user.visibilityBoost?.isActive) {
                const type = user.visibilityBoost.boostType?.toUpperCase();
                boostScore = VISIBILITY_BOOST[type]?.visibilityScoreBonus || 0.5;
            }

            return {
                _id: user._id,
                name: sd.shopName,
                category: sd.shopCategory || 'General',
                address: sd.address,
                isOpen: deriveShopStatus(sd) === 'ONLINE',
                distance: distance ? `${distance < 1000 ? distance + 'm' : (distance / 1000).toFixed(1) + 'km'}` : 'Unknown',
                distanceValue: distance || 999999,
                shopImage: sd.photos?.[0] || null,
                confidence: calculateSellerConfidence(user),
                productCount: countsMap[user._id.toString()] || 0,
                _finalPriority: priorityScore + boostScore,
                planId: user.subscription?.planId || 'free',
                coordinates: sd.shopLocation?.coordinates || null,
                rating: sd.rating || 0,
                numReviews: sd.numReviews || 0,
                shopDetails: sd,
                operatingMode: sd.operatingMode || 'GUARANTEED'
            };
        }).filter(shop => {
            if (!isNaN(userLat) && shop.distanceValue !== 999999) {
                return shop.distanceValue <= searchRadius * 1000;
            }
            return true;
        });

        shops.sort((a, b) => {
            if (b._finalPriority !== a._finalPriority) return b._finalPriority - a._finalPriority;
            return a.distanceValue - b.distanceValue;
        });

        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get nearby verified shops using Geospatial Aggregation
// @route   GET /api/customer/shops-nearby
const getShopsNearby = async (req, res) => {
    try {
        const { lat, lng, radiusKm = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: "lat and lng required" });
        }

        const radiusMeters = Number(radiusKm) * 1000;

        const shops = await User.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)]
                    },
                    distanceField: "distanceMeters",
                    maxDistance: radiusMeters,
                    spherical: true,
                    query: {
                        role: "seller",
                        "shopDetails.shopLocation.coordinates": {
                            $exists: true,
                            $size: 2
                        }
                    }
                }
            },
            {
                $project: {
                    shopDetails: 1,
                    subscription: 1,
                    visibilityBoost: 1,
                    distanceMeters: 1,
                    distanceKm: { $divide: ["$distanceMeters", 1000] }
                }
            }
        ]);

        const formattedShops = shops.map(shop => ({
            _id: shop._id,
            name: shop.shopDetails?.shopName,
            category: shop.shopDetails?.shopType || shop.shopDetails?.shopCategory || 'General',
            address: shop.shopDetails?.address,
            shopLocation: shop.shopDetails?.shopLocation,
            isOpen: deriveShopStatus(shop.shopDetails) === 'ONLINE',
            distanceMeters: shop.distanceMeters,
            distanceKm: shop.distanceKm.toFixed(2),
            shopImage: shop.shopDetails?.photos?.[0] || null,
            rating: shop.shopDetails?.rating || 0,
            confidence: calculateSellerConfidence(shop),
            planId: shop.subscription?.planId || 'free',
            operatingMode: shop.shopDetails?.operatingMode || 'GUARANTEED'
        }));

        res.json(formattedShops);
    } catch (error) {
        console.error("Aggregation error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getShopsByCity = async (req, res) => {
    try {
        const { city } = req.query;
        const sellers = await User.find({
            role: "seller",
            $or: [
                { "shopDetails.shopLocation.city": city },
                { "shopDetails.location.city": city },
                { "shopDetails.city": city }
            ]
        }).select("shopDetails subscription visibilityBoost _id");

        const shops = sellers.map(user => {
            const sd = user.shopDetails || {};
            let priorityScore = 1;
            let boostScore = 0;
            const planId = user.subscription?.planId?.toUpperCase();
            priorityScore = SUBSCRIPTION_PLANS[planId]?.visibilityPriority || 1;
            if (user.visibilityBoost?.isActive) {
                const type = user.visibilityBoost.boostType?.toUpperCase();
                boostScore = VISIBILITY_BOOST[type]?.visibilityScoreBonus || 0.5;
            }

            return {
                _id: user._id,
                name: sd.shopName,
                category: sd.shopType || sd.shopCategory || 'General',
                address: sd.address,
                isOpen: deriveShopStatus(sd) === 'ONLINE',
                shopImage: sd.photos?.[0] || null,
                location: sd.shopLocation,
                rating: sd.rating || 0,
                _finalPriority: priorityScore + boostScore,
                planId: user.subscription?.planId || 'free',
                operatingMode: sd.operatingMode || 'GUARANTEED'
            };
        });

        shops.sort((a, b) => b._finalPriority - a._finalPriority);
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create New Order (Now creates CustomerVisit)
// @route   POST /api/customer/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
    try {
        const { sellerId, items, paymentMode, visitDate, visitTime } = req.body;
        const customerId = req.user._id;
        const SellerAccountDetails = require('../models/SellerAccountDetails');
        const CustomerVisit = require('../models/CustomerVisit');

        // Security Check: If PREPAID, verify seller accepts it
        if (paymentMode === 'PREPAID' || paymentMode === 'PAID_ONLINE') {
            const pSettings = await SellerAccountDetails.findOne({ sellerId });
            if (!pSettings || !pSettings.acceptsOnlinePayment || !pSettings.paymentSetupCompleted) {
                return res.status(400).json({ message: 'Seller does not accept online payments at this time.' });
            }
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // Helper to clean price (remove '₹', commas, etc.)
        const parsePrice = (priceVal) => {
            if (typeof priceVal === 'number') return priceVal;
            if (!priceVal) return 0;
            const cleaned = priceVal.toString().replace(/[^0-9.]/g, '');
            return parseFloat(cleaned) || 0;
        };

        // Map items to schema format
        let totalAmount = 0;
        const visitProducts = items.map(item => {
            const numericPrice = parsePrice(item.price);
            const qty = parseInt(item.quantity) || 1;
            totalAmount += (numericPrice * qty);

            return {
                productId: item.productId || item._id,
                name: item.name || item.productName || 'Unknown Product',
                quantity: qty,
                priceAtTime: numericPrice,
                image: (item.image && item.image.length < 2000) ? item.image : null
            };
        });

        // CREATE CUSTOMER VISIT
        const visit = await CustomerVisit.create({
            customerId,
            sellerId,
            shopId: sellerId,
            products: visitProducts,
            paymentMode: (paymentMode === 'PREPAID' || paymentMode === 'PAID_ONLINE') ? 'PAID_ONLINE' : 'PAY_ON_VISIT',
            paymentStatus: (paymentMode === 'PREPAID' || paymentMode === 'PAID_ONLINE') ? 'COMPLETED' : 'PENDING',
            visitStatus: 'UPCOMING',
            visitTime: (visitDate && visitTime) ? new Date(`${visitDate}T${visitTime}`) : null
        });

        // Use virtual field safely
        let qrPayloadParsed = {};
        try {
            qrPayloadParsed = JSON.parse(visit.qrPayload);
        } catch (e) {
            console.error("QR Payload Parse Error:", e);
        }

        // Search CTR conversion hook
        if (customerId && isRedisActive()) {
            const redis = getRedisClient();
            const lastSearch = await redis.get(`user:last_search:${customerId}`);
            if (lastSearch) {
                const sellerUser = await User.findById(sellerId);
                const sType = sellerUser?.shopDetails?.shopType || 'grocery_kirana';
                await SearchAnalytics.findOneAndUpdate(
                    { query: lastSearch, shopType: sType.toLowerCase() },
                    { $inc: { conversions: 1 } }
                ).catch(err => console.error('[AnalyticsEngine] Conversion tracking error:', err));
            }
        }

        // Log security audit event
        const { logSecurityEvent } = require('../utils/securityLogger');
        await logSecurityEvent(
            customerId,
            req.user.email,
            'ORDER_CREATED',
            req,
            { visitId: visit._id, sellerId, totalAmount }
        );

        res.status(201).json({
            message: 'Order created successfully',
            orderId: visit._id,
            qrPayload: qrPayloadParsed,
            status: visit.visitStatus,
            totalAmount: totalAmount
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error: ' + error.message });
        }
        res.status(500).json({ message: error.message || 'Failed to create order' });
    }
};

module.exports = {
    searchProducts,
    getPopularProducts,
    getProductDetail,
    getShopDetail,
    getNearbyShops,
    getShopsNearby,
    getShopsByCity,
    createOrder // NEW
};
