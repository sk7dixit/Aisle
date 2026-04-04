const Product = require('../models/Product');
const User = require('../models/User');
// const Order = require('../models/Order'); // DEPRECATED: Replaced by CustomerVisit
const { SHOP_CATEGORIES } = require('../utils/shopCategoryConfig');
const { calculateSellerConfidence, calculateStockConfidence, calculateRankingScore } = require('../utils/confidenceUtils');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const { SUBSCRIPTION_PLANS, VISIBILITY_BOOST } = require('../config/subscriptionConfig');

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
        const { q, lat, lng, radius } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius) || 5;

        // 1. SEARCH PRODUCTS
        const products = await Product.find({
            isExact: true,
            isAvailable: { $ne: false },
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        }).populate('seller', 'shopDetails subscription visibilityBoost');

        // 2. SEARCH SHOPS
        const shops = await User.find({
            role: "seller",
            $or: [
                { "shopDetails.shopName": { $regex: q, $options: 'i' } },
                { "shopDetails.shopCategory": { $regex: q, $options: 'i' } }
            ]
        }).select("shopDetails subscription visibilityBoost _id");

        const productResults = products.map(p => {
            let distance = 999999;
            if (p.seller?.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    p.seller.shopDetails.shopLocation.coordinates[1],
                    p.seller.shopDetails.shopLocation.coordinates[0]
                );
            }

            // Step 7: Centralized Ranking Score
            let priorityScore = 0;
            if (p.seller) {
                priorityScore = calculateRankingScore(p.seller, null);

                // Keep Visibility Boost Logic (Short term boost on top of Pro)
                if (p.seller.visibilityBoost?.isActive) {
                    const type = p.seller.visibilityBoost.boostType?.toUpperCase();
                    priorityScore += (VISIBILITY_BOOST[type]?.visibilityScoreBonus || 5); // Add small boost
                }
            }

            return {
                type: 'product',
                _id: p._id,
                name: p.name,
                imageUrl: p.imageUrl,
                price: p.price,
                stockStatus: p.stockStatus,
                shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
                shopId: p.seller?._id,
                distance: distance,
                planId: p.seller?.subscription?.planId || 'free',
                isOpen: deriveShopStatus(p.seller?.shopDetails) === 'ONLINE',
                // New Scoring: Distance + Priority (Subscription) + Stock Confidence
                _score: (p.stockStatus === 'AVAILABLE' ? 1000 : 0)
                    + (100 - Math.min(100, distance / 100))
                    + priorityScore
                    + (p.seller && calculateStockConfidence(p, p.seller) === 'HIGH' ? 50 : 0),
                stockConfidence: p.seller ? calculateStockConfidence(p, p.seller) : 'MEDIUM',
                operatingMode: p.seller?.shopDetails?.operatingMode || 'GUARANTEED' // Step 5
            };
        });

        const shopResults = shops.map(s => {
            let distance = 999999;
            if (s.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    s.shopDetails.shopLocation.coordinates[1],
                    s.shopDetails.shopLocation.coordinates[0]
                );
            }

            let priorityScore = 0;
            let boostScore = 0;

            // Step 7: Centralized Ranking Score
            priorityScore = calculateRankingScore(s, null);

            if (s.visibilityBoost?.isActive) {
                const type = s.visibilityBoost.boostType?.toUpperCase();
                boostScore = VISIBILITY_BOOST[type]?.visibilityScoreBonus || 0.5;
            }

            return {
                type: 'shop',
                _id: s._id,
                name: s.shopDetails?.shopName,
                category: s.shopDetails?.shopCategory,
                shopImage: s.shopDetails?.photos?.[0] || null,
                distance: distance,
                planId: s.subscription?.planId || 'free',
                isOpen: deriveShopStatus(s.shopDetails) === 'ONLINE',
                operatingMode: s.shopDetails?.operatingMode || 'GUARANTEED', // Step 5
                _score: (100 - Math.min(100, distance / 100)) + (priorityScore * 10) + (boostScore * 10)
            };
        });

        const results = [...productResults, ...shopResults]
            .filter(item => isNaN(userLat) || item.distance <= searchRadius * 1000)
            .sort((a, b) => b._score - a._score);

        res.json(results);
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
        const product = await Product.findOne({ _id: req.params.id, isAvailable: { $ne: false } })
            .populate('seller', 'shopDetails sellerStats');
        if (product) {
            res.json({
                ...product._doc,
                shopName: product.seller?.shopDetails?.shopName,
                shopId: product.seller?._id,
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
            isAvailable: { $ne: false }
        });

        // 1. Get Master Categories based on shopType
        const masterCategories = getCategoriesForShop(shopUser.shopDetails?.shopType || 'GROCERY_KIRANA');

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
            // If the product category is in our master list, add it there
            if (categoriesMap[cat]) {
                categoriesMap[cat].push(p);
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
                planId: user.subscription?.planId || 'free'
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
            planId: shop.subscription?.planId || 'free'
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
            "shopDetails.city": city
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
                planId: user.subscription?.planId || 'free'
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
