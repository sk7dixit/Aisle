const CustomerPreferences = require('../models/CustomerPreferences');
const CustomerSearchHistory = require('../models/CustomerSearchHistory');
const CustomerInteractions = require('../models/CustomerInteractions');
const CustomerRecommendations = require('../models/CustomerRecommendations');
const CustomerReminders = require('../models/CustomerReminders');
const CustomerVisit = require('../models/CustomerVisit');
const Product = require('../models/Product');
const User = require('../models/User');
const { deriveShopStatus } = require('../utils/shopStatusUtils');

// @desc    Get customer profile
// @route   GET /api/customer/profile
const getProfile = async (req, res) => {
    try {
        const customerId = req.user._id;

        // 1. Get or create CustomerPreferences
        let prefs = await CustomerPreferences.findOne({ customerId }).populate('favoriteShops', 'shopDetails');
        if (!prefs) {
            // Try to infer preferences from order history (CustomerVisit)
            const visits = await CustomerVisit.find({ customerId }).populate('sellerId', 'shopDetails');
            const shopMap = {};
            let totalSpent = 0;
            let count = 0;

            visits.forEach(v => {
                if (v.sellerId) {
                    const shopId = v.sellerId._id;
                    if (shopId) {
                        shopMap[shopId] = (shopMap[shopId] || 0) + 1;
                    }
                }
                v.products.forEach(p => {
                    totalSpent += (p.priceAtTime * p.quantity);
                    count++;
                });
            });

            let favShops = Object.keys(shopMap).sort((a,b) => shopMap[b] - shopMap[a]).slice(0, 3);
            if (favShops.length === 0) {
                favShops = ["6a22678de410c49988759fa5", "6a1fc3b95aac6b48b91dafe4"];
            }
            
            let avgBudget = '₹500-₹1500';
            if (count > 0 && visits.length > 0) {
                const avg = totalSpent / visits.length;
                if (avg < 500) avgBudget = '₹100-₹500';
                else if (avg < 1500) avgBudget = '₹500-₹1500';
                else avgBudget = '₹1500-₹3000';
            }

            prefs = await CustomerPreferences.create({
                customerId,
                favoriteCategories: ['Groceries', 'Electronics'],
                favoriteShops: favShops,
                avgBudget
            });
            prefs = await CustomerPreferences.findById(prefs._id).populate('favoriteShops', 'shopDetails');
        }

        // 2. Get search history
        const searchHistory = await CustomerSearchHistory.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(5);
        const recentSearches = searchHistory.map(sh => sh.query);

        // 3. Activity Timeline
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const ordersThisMonth = await CustomerVisit.countDocuments({
            customerId,
            createdAt: { $gte: startOfMonth }
        });

        let bookingsThisMonth = 0;
        try {
            const Booking = require('../models/Booking');
            bookingsThisMonth = await Booking.countDocuments({
                customerId,
                createdAt: { $gte: startOfMonth }
            });
        } catch (e) {
            bookingsThisMonth = 0;
        }

        const uniqueShopsVisited = await CustomerVisit.distinct('sellerId', {
            customerId,
            createdAt: { $gte: startOfMonth }
        });
        const shopsVisitedThisMonth = uniqueShopsVisited.length;

        // 4. Calculate new offerings
        const startOfSevenDays = new Date();
        startOfSevenDays.setDate(startOfSevenDays.getDate() - 7);

        const newGroceryProducts = await Product.countDocuments({
            shopType: 'GROCERY_KIRANA',
            isAvailable: true,
            isDraft: false,
            createdAt: { $gte: startOfSevenDays }
        }) || 12;

        const newHomeBakeries = await User.countDocuments({
            role: 'seller',
            'shopDetails.shopType': 'HOME_BUSINESS',
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1) }
        }) || 3;

        let lastViewedShopNewProducts = 8;
        const lastInteraction = await CustomerInteractions.findOne({
            customerId,
            interactionType: 'view',
            shopId: { $exists: true }
        }).sort({ createdAt: -1 });

        if (lastInteraction && lastInteraction.shopId) {
            const count = await Product.countDocuments({
                seller: lastInteraction.shopId,
                isAvailable: true,
                isDraft: false,
                createdAt: { $gte: startOfSevenDays }
            });
            if (count > 0) lastViewedShopNewProducts = count;
        }

        res.json({
            userName: req.user.name ? req.user.name.split(' ')[0] : 'Shashwat',
            favoriteCategories: prefs.favoriteCategories && prefs.favoriteCategories.length > 0 ? prefs.favoriteCategories : ['Groceries', 'Electronics'],
            favoriteShops: prefs.favoriteShops.map(fs => ({
                _id: fs._id,
                shopName: fs.shopDetails?.shopName || 'Unknown Shop'
            })),
            avgBudget: prefs.avgBudget || '₹500-₹1500',
            recentSearches: recentSearches.length > 0 ? recentSearches : ['Milk', 'Headphones'],
            activityTimeline: {
                ordersThisMonth,
                bookingsThisMonth,
                shopsVisitedThisMonth
            },
            newOfferings: {
                newGroceryProducts,
                newHomeBakeries,
                lastViewedShopNewProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer favorites
// @route   GET /api/customer/favorites
const getFavorites = async (req, res) => {
    try {
        const customerId = req.user._id;
        const prefs = await CustomerPreferences.findOne({ customerId })
            .populate({
                path: 'favoriteShops',
                select: 'shopDetails subscription phone'
            });

        if (!prefs) {
            return res.json({ favoriteShops: [], favoriteProducts: [] });
        }

        const favShops = prefs.favoriteShops.map(s => ({
            _id: s._id,
            name: s.shopDetails?.shopName || 'Unknown Shop',
            category: s.shopDetails?.shopType || s.shopDetails?.shopCategory || 'General',
            address: s.shopDetails?.address || '',
            phone: s.phone || s.shopDetails?.phone || '9876543210',
            isOpen: deriveShopStatus(s.shopDetails) === 'ONLINE',
            rating: s.shopDetails?.rating || 0,
            shopImage: s.shopDetails?.photos?.[0] || null
        }));

        const shopIds = prefs.favoriteShops.map(s => s._id);
        const products = await Product.find({
            seller: { $in: shopIds },
            isAvailable: true,
            isDraft: false
        }).limit(6);

        res.json({
            favoriteShops: favShops,
            favoriteProducts: products.map(p => ({
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: p.category || 'General'
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer recent activity
// @route   GET /api/customer/recent-activity
const getRecentActivity = async (req, res) => {
    try {
        const customerId = req.user._id;

        const interactions = await CustomerInteractions.find({
            customerId,
            interactionType: 'view',
            productId: { $exists: true }
        })
        .populate({
            path: 'productId',
            populate: { path: 'seller', select: 'shopDetails' }
        })
        .sort({ createdAt: -1 })
        .limit(5);

        const productMap = {};
        interactions.forEach(i => {
            if (i.productId && !productMap[i.productId._id.toString()]) {
                productMap[i.productId._id.toString()] = i.productId;
            }
        });

        const recentProducts = Object.values(productMap).map(p => ({
            _id: p._id,
            name: p.name,
            price: p.sellingPrice || p.price || 0,
            imageUrl: p.imageUrl,
            shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
            shopId: p.seller?._id
        }));

        res.json({
            recentProducts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create customer reminder
// @route   POST /api/customer/reminder
const createReminder = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { item, frequency = 'one-time', delayDays = 30 } = req.body;

        if (!item) {
            return res.status(400).json({ message: 'Item name required' });
        }

        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + parseInt(delayDays));

        const reminder = await CustomerReminders.create({
            customerId,
            item,
            frequency,
            reminderDate,
            isActive: true
        });

        res.status(201).json({
            message: 'Reminder saved successfully',
            reminder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update customer preferences
// @route   POST /api/customer/preferences
const updatePreferences = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { favoriteCategories, favoriteShops, avgBudget, preferredLocation } = req.body;

        let prefs = await CustomerPreferences.findOne({ customerId });
        if (prefs) {
            if (favoriteCategories) prefs.favoriteCategories = favoriteCategories;
            if (favoriteShops) prefs.favoriteShops = favoriteShops;
            if (avgBudget) prefs.avgBudget = avgBudget;
            if (preferredLocation) prefs.preferredLocation = preferredLocation;
            await prefs.save();
        } else {
            prefs = await CustomerPreferences.create({
                customerId,
                favoriteCategories: favoriteCategories || [],
                favoriteShops: favoriteShops || [],
                avgBudget: avgBudget || '₹500-₹1500',
                preferredLocation: preferredLocation || {}
            });
        }

        res.json({
            message: 'Preferences updated successfully',
            preferences: prefs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const {
    trackActivity,
    generatePersonalizedFeed,
    getPersonalizedAssistantResponse
} = require('../services/personalizationService');
const RecommendationAnalytics = require('../models/RecommendationAnalytics');

// @desc    Get personalized home feed
// @route   GET /api/customer/home/feed
const getHomeFeed = async (req, res) => {
    try {
        const userId = req.user._id;
        const lat = parseFloat(req.query.lat) || req.user.customerLocation?.lat || 22.7196;
        const lng = parseFloat(req.query.lng) || req.user.customerLocation?.lng || 75.8577;
        const radius = parseFloat(req.query.radius) || 5;

        const feed = await generatePersonalizedFeed(userId, lat, lng, radius);
        res.json(feed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log customer activity manually
// @route   POST /api/customer/activity
const logActivity = async (req, res) => {
    try {
        const userId = req.user._id;
        const { action, targetId, targetType, metadata } = req.body;
        if (!action) {
            return res.status(400).json({ message: 'Action required' });
        }
        const profile = await trackActivity(userId, action, targetId, targetType, metadata);
        res.status(201).json({ message: 'Activity logged', segment: profile?.segment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Track recommendation analytics actions
// @route   POST /api/customer/recommendations/action
const logRecommendationAction = async (req, res) => {
    try {
        const userId = req.user._id;
        const { recommendationType, targetId, action, revenueImpact } = req.body;
        if (!recommendationType || !targetId || !action) {
            return res.status(400).json({ message: 'recommendationType, targetId, and action are required' });
        }
        
        const analytic = await RecommendationAnalytics.create({
            userId,
            recommendationType,
            targetId,
            action,
            revenueImpact: parseFloat(revenueImpact) || 0
        });

        res.status(201).json({ message: 'Analytics action logged', analytic });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get personalized AI assistant response
// @route   POST /api/customer/assistant
const getPersonalizedAssistant = async (req, res) => {
    try {
        const userId = req.user._id;
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }
        const reply = await getPersonalizedAssistantResponse(userId, query);
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    getFavorites,
    getRecentActivity,
    createReminder,
    updatePreferences,
    getHomeFeed,
    logActivity,
    logRecommendationAction,
    getPersonalizedAssistant
};

