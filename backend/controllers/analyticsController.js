const Product = require('../models/Product');
const SellerProduct = require('../models/MasterCatalogSellerProduct');
const MasterCatalogProduct = require('../models/MasterCatalogProduct');
const SearchAnalytics = require('../models/SearchAnalytics');
const SellerAnalytics = require('../models/SellerAnalytics');
const User = require('../models/User');
const SellerIntelligence = require('../models/SellerIntelligence');
const SellerRecommendation = require('../models/SellerRecommendation');
const {
    calculateSellerIntelligence,
    generateSellerRecommendations,
    learnFromFeedback,
    INDORE_AREAS
} = require('../services/sellerIntelligenceService');

const { getRedisClient, isRedisActive } = require('../config/redis');
const jwt = require('jsonwebtoken');

// @desc    Increment product views asynchronously (Customer view trigger)
// @route   POST /api/seller/analytics/view/:id
// @access  Public
const trackProductView = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: 'Storefront product not found' });
        }

        // Search CTR click hook
        let userId = req.user?._id || req.body?.userId;
        if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_CURRENT);
                userId = decoded.id;
            } catch (err) {}
        }

        if (userId && isRedisActive()) {
            const redis = getRedisClient();
            const lastSearch = await redis.get(`user:last_search:${userId}`);
            if (lastSearch) {
                await SearchAnalytics.findOneAndUpdate(
                    { query: lastSearch, shopType: product.shopType?.toLowerCase() || 'grocery_kirana' },
                    { $inc: { clicks: 1 } }
                ).catch(err => console.error('[AnalyticsEngine] Click tracking error:', err));
            }
        }

        res.json({ success: true, views: product.views });
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to track product view:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Seller Dashboard Analytics (Total Products, Total Views, Most Viewed, Low Stock, Trending Category, Search Misses)
// @route   GET /api/seller/analytics/dashboard
// @access  Private (Seller Only)
const getDashboardStats = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const shopType = req.user.shopDetails?.shopType || req.user.shopType || 'GROCERY_KIRANA';
        const standardShopType = shopType.toLowerCase();

        // 1. Total Products
        const totalProducts = await Product.countDocuments({ seller: sellerId });

        // 2. Total Views
        const totalViewsResult = await Product.aggregate([
            { $match: { seller: sellerId } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const totalViews = totalViewsResult[0]?.total || 0;

        // 3. Most Viewed Product
        const mostViewedProduct = await Product.findOne({ seller: sellerId })
            .sort({ views: -1 })
            .select('name views');
        const topProduct = mostViewedProduct ? `${mostViewedProduct.name} (${mostViewedProduct.views} views)` : 'None';

        // 4. Low Stock Count
        const lowStockCount = await Product.countDocuments({
            seller: sellerId,
            quantity: { $lt: 5 }
        });

        // 5. Trending Category (based on product views)
        const trendingCategoryResult = await Product.aggregate([
            { $match: { seller: sellerId } },
            { $group: { _id: '$category', totalViews: { $sum: '$views' } } },
            { $sort: { totalViews: -1 } },
            { $limit: 1 }
        ]);
        const topCategory = trendingCategoryResult[0]?._id || 'General';

        // 6. Search Misses (Queries in seller's shop type returning 0 results)
        const searchMisses = await SearchAnalytics.aggregate([
            { $match: { shopType: standardShopType, results: 0 } },
            { $group: { _id: '$query', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 7. Update/Cache in SellerAnalytics
        await SellerAnalytics.findOneAndUpdate(
            { seller: sellerId },
            {
                totalProducts,
                totalViews,
                topCategory,
                topProduct,
                lowStockCount
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            totalProducts,
            totalViews,
            topProduct,
            lowStockCount,
            topCategory,
            searchMisses: searchMisses.map(item => ({ query: item._id, count: item.count }))
        });

    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get dashboard stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Trending Products in Shop's Area (Most viewed products in shopType)
// @route   GET /api/seller/analytics/trending
// @access  Private (Seller Only)
const getTrendingProducts = async (req, res) => {
    try {
        const shopType = req.user?.shopDetails?.shopType || req.user?.shopType || 'GROCERY_KIRANA';
        const standardShopType = shopType.toLowerCase();

        const products = await Product.find({ shopType: standardShopType })
            .sort({ views: -1 })
            .limit(10);

        res.json(products);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get trending products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Low Stock Alerts (Storefront products or MasterCatalogSellerProduct with stock/quantity < 5)
// @route   GET /api/seller/analytics/low-stock/:sellerId
// @access  Private (Seller Only)
const getLowStockAlerts = async (req, res) => {
    try {
        const sellerId = req.params.sellerId;

        // 1. Fetch from standard storefront inventory
        const storefrontLowStock = await Product.find({
            seller: sellerId,
            quantity: { $lt: 5 }
        });

        // 2. Fetch from MasterCatalogSellerProduct
        const catalogLowStock = await SellerProduct.find({
            seller: sellerId,
            stock: { $lt: 5 }
        }).populate('product');

        res.json({
            storefrontProducts: storefrontLowStock,
            catalogProducts: catalogLowStock
        });
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get low-stock alerts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Category Performance (Total views grouped by product category)
// @route   GET /api/seller/analytics/category-performance
// @access  Private (Seller Only)
const getCategoryPerformance = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const performance = await Product.aggregate([
            { $match: { seller: sellerId } },
            { $group: { _id: '$category', totalViews: { $sum: '$views' } } },
            { $sort: { totalViews: -1 } }
        ]);

        const formatted = performance.map(item => ({
            category: item._id || 'General',
            views: item.totalViews || 0
        }));

        res.json(formatted);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get category performance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Gamified Inventory Health Score (Availability, Diversity, Warning Stock, Demand Alignment)
// @route   GET /api/seller/analytics/inventory-health
// @access  Private (Seller Only)
const getInventoryHealthScore = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const totalCount = await Product.countDocuments({ seller: sellerId });

        if (totalCount === 0) {
            return res.json({ score: 100, message: 'No inventory uploaded yet.' });
        }

        // 1. Stock Availability (Weight: 40%) - percentage of items in stock
        const inStockCount = await Product.countDocuments({ seller: sellerId, quantity: { $gt: 0 } });
        const stockAvailabilityScore = (inStockCount / totalCount) * 100;

        // 2. Product Diversity (Weight: 20%) - count of distinct subcategories
        const distinctSubcategories = await Product.distinct('subCategory', { seller: sellerId });
        const diversityScore = Math.min(100, (distinctSubcategories.length / 5) * 100);

        // 3. Low Stock Ratio (Weight: 20%) - percentage of items NOT low stock
        const healthyStockCount = await Product.countDocuments({ seller: sellerId, quantity: { $gte: 5 } });
        const stockRatioScore = (healthyStockCount / totalCount) * 100;

        // 4. Demand Alignment (Weight: 20%) - how many trending products do we have?
        const shopType = req.user.shopDetails?.shopType || req.user.shopType || 'GROCERY_KIRANA';
        const topTrending = await Product.find({ shopType: shopType.toLowerCase() })
            .sort({ views: -1 })
            .limit(10)
            .select('catalogProductId name')
            .lean();
        
        let matchingTrending = 0;
        if (topTrending.length > 0) {
            const catalogIds = topTrending.map(tp => tp.catalogProductId).filter(Boolean);
            const matchesCount = await Product.countDocuments({
                seller: sellerId,
                catalogProductId: { $in: catalogIds }
            });
            matchingTrending = Math.min(100, (matchesCount / topTrending.length) * 100);
        } else {
            matchingTrending = 100;
        }

        // Weighted Average
        const score = Math.round(
            (stockAvailabilityScore * 0.4) +
            (diversityScore * 0.2) +
            (stockRatioScore * 0.2) +
            (matchingTrending * 0.2)
        );

        res.json({
            score: Math.min(100, Math.max(0, score)),
            metrics: {
                stockAvailability: Math.round(stockAvailabilityScore),
                productDiversity: Math.round(diversityScore),
                healthyStockRatio: Math.round(stockRatioScore),
                demandAlignment: Math.round(matchingTrending)
            }
        });

    } catch (error) {
        console.error('[AnalyticsEngine] Failed to calculate inventory health score:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Smart Pricing Insights (Compare against average pricing of local competitors)
// @route   GET /api/seller/analytics/price-insights
// @access  Private (Seller Only)
const getSmartPriceInsights = async (req, res) => {
    try {
        const sellerId = req.user._id;
        // Limit price insights comparison to the top 10 most-viewed products to prevent memory and connection exhaustion
        const products = await Product.find({ seller: sellerId })
            .sort({ views: -1 })
            .limit(10)
            .lean();

        const insights = [];

        for (const p of products) {
            if (!p.catalogProductId && !p.name) continue;

            const matchQuery = {
                seller: { $ne: sellerId },
                $or: []
            };

            if (p.catalogProductId) matchQuery.$or.push({ catalogProductId: p.catalogProductId });
            if (p.name) matchQuery.$or.push({ name: p.name });

            // Query competitors' sellingPrice only, using lean for maximum speed
            const competitors = await Product.find(matchQuery)
                .select('sellingPrice')
                .lean();
            if (competitors.length > 0) {
                const avgPrice = competitors.reduce((sum, item) => sum + item.sellingPrice, 0) / competitors.length;
                const differencePercentage = ((p.sellingPrice - avgPrice) / avgPrice) * 100;

                if (Math.abs(differencePercentage) > 5) {
                    insights.push({
                        productId: p._id,
                        productName: p.name,
                        yourPrice: p.sellingPrice,
                        marketAverage: Math.round(avgPrice * 100) / 100,
                        difference: Math.round(differencePercentage * 10) / 10,
                        status: differencePercentage > 0 ? 'HIGHER' : 'LOWER',
                        recommendation: differencePercentage > 0 
                            ? `Consider lowering by ${Math.round(differencePercentage)}% to match market averages.`
                            : `Your price is competitive! You are ${Math.round(Math.abs(differencePercentage))}% cheaper.`
                    });
                }
            }
        }

        res.json(insights);

    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get smart pricing insights:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Smart Seller Recommendations (Products to stock based on category popularity)
// @route   GET /api/seller/analytics/recommendations
// @access  Private (Seller Only)
const getSellerRecommendations = async (req, res) => {
    try {
        const sellerId = req.user._id;
        
        let recommendations = await SellerRecommendation.find({ sellerId, status: 'pending' });
        
        if (recommendations.length === 0) {
            await generateSellerRecommendations(sellerId);
            recommendations = await SellerRecommendation.find({ sellerId, status: 'pending' });
        }
        
        res.json(recommendations);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get recommendations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSellerOpportunities = async (req, res) => {
    try {
        const sellerCity = req.user?.shopDetails?.city || 'Indore';

        // 1. Group searches in the seller's city
        const match = {};
        if (sellerCity) {
            match.city = sellerCity;
        }

        const searchAggregation = await SearchAnalytics.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$normalizedKeyword",
                    searchCount: { $sum: 1 }
                }
            },
            { $sort: { searchCount: -1 } },
            { $limit: 20 }
        ]);

        const opportunities = [];

        for (const item of searchAggregation) {
            const keyword = item._id;
            const searchCount = item.searchCount;
            if (!keyword) continue;

            // Find sellers in this city
            const localSellers = await User.find({
                role: 'seller',
                'shopDetails.city': sellerCity
            }).select('_id');
            const localSellerIds = localSellers.map(s => s._id);

            // Count available products matching the keyword locally
            const productCount = await Product.countDocuments({
                seller: { $in: localSellerIds },
                isAvailable: { $ne: false },
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { brand: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } }
                ]
            });

            // Classify Demand
            let demand = 'low';
            if (searchCount >= 50) demand = 'high';
            else if (searchCount >= 10) demand = 'medium';

            // Classify Supply
            let supply = 'high';
            if (productCount <= 5) supply = 'low';
            else if (productCount <= 20) supply = 'medium';

            // Classify Opportunity
            let opportunity = 'low';
            if (demand === 'high' && supply === 'low') opportunity = 'high';
            else if (demand === 'high' && supply === 'medium') opportunity = 'high';
            else if (demand === 'medium' && supply === 'low') opportunity = 'medium';
            else if (demand === 'medium' && supply === 'medium') opportunity = 'medium';
            else if (demand === 'high' && supply === 'high') opportunity = 'medium';

            opportunities.push({
                keyword,
                demand,
                supply,
                opportunity,
                searchCount,
                availableProductsCount: productCount
            });
        }

        res.json(opportunities);
    } catch (error) {
        console.error('[AnalyticsController] Get Seller Opportunities Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSellerTrendsDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const sellerCity = req.user?.shopDetails?.city || 'Indore';
        const sellerCategory = req.user?.shopDetails?.shopCategory || req.user?.shopDetails?.shopType || 'Grocery';

        const ProductTrend = require('../models/ProductTrend');
        const SellerOpportunity = require('../models/SellerOpportunity');
        const MasterCatalogProduct = require('../models/MasterCatalogProduct');

        // 1. Opportunity Alerts
        const opportunityAlerts = await SellerOpportunity.find({ sellerId })
            .sort({ createdAt: -1 })
            .limit(10);

        // 2. Trending Nearby (top trends in the seller's city)
        const trendingNearby = await ProductTrend.find({ city: { $regex: new RegExp(`^${sellerCity}$`, 'i') } })
            .sort({ trendScore: -1 })
            .limit(10);

        // 3. Recommended Products
        const recommendedProducts = await MasterCatalogProduct.find({
            category: { $regex: sellerCategory.split(' ')[0], $options: 'i' }
        })
        .sort({ views: -1 })
        .limit(10);

        // 4. Expected Demand
        const expectedDemand = trendingNearby.map(t => ({
            product: t.keyword,
            score: t.trendScore,
            demandLevel: t.demandLevel,
            searchCount: t.searchCount
        }));

        res.json({
            opportunityAlerts,
            trendingNearby,
            recommendedProducts,
            expectedDemand
        });
    } catch (error) {
        console.error('[AnalyticsController] Get Seller Trends Dashboard Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Seller Intelligence Profile
// @route   GET /api/seller/analytics/insights
// @access  Private (Seller Only)
const getSellerIntelligenceInsights = async (req, res) => {
    try {
        const sellerId = req.user._id;
        let insights = await SellerIntelligence.findOne({ sellerId });
        if (!insights) {
            insights = await calculateSellerIntelligence(sellerId);
        }
        res.json(insights);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get seller intelligence insights:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Respond to opportunity recommendation (Accept/Ignore)
// @route   POST /api/seller/analytics/recommendations/:id/respond
// @access  Private (Seller Only)
const respondToRecommendation = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const recommendationId = req.params.id;
        const { action } = req.body;

        if (!['accept', 'ignore'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Must be accept or ignore.' });
        }

        const result = await learnFromFeedback(recommendationId, sellerId, action);
        res.json({ success: true, result });
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to respond to recommendation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Ask AI Seller Business Assistant
// @route   POST /api/seller/analytics/assistant
// @access  Private (Seller Only)
const askSellerAssistant = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        const q = query.toLowerCase().trim();
        const profile = await SellerIntelligence.findOne({ sellerId }) || await calculateSellerIntelligence(sellerId);
        
        let reply = "";

        if (q.includes("stock") || q.includes("recommend") || q.includes("opportunity") || q.includes("missing")) {
            const opportunities = await SellerRecommendation.find({ sellerId, type: "inventory_opportunity", status: "pending" }).limit(3);
            if (opportunities.length > 0) {
                reply = `Based on local customer searches in your area, here are the top items you should stock:\n\n` +
                    opportunities.map((opp, idx) => `${idx + 1}. **${opp.product}** (Confidence: ${opp.confidence}%, Est. Revenue: ₹${opp.estimatedRevenue.toLocaleString()}/month)\n   *Insight:* ${opp.competitorInsights}`).join("\n\n") +
                    `\n\nYou can click "Add to Shop" next to any of these on your dashboard to instantly sync them.`;
            } else {
                reply = "Good news! You have aligned your catalog perfectly with local customer demand. I don't see any major missing high-demand products right now.";
            }
        } else if (q.includes("restock") || q.includes("warning") || q.includes("out of stock") || q.includes("days")) {
            const warnings = await SellerRecommendation.find({ sellerId, type: "restock_prediction", status: "pending" });
            if (warnings.length > 0) {
                reply = `⚠️ Here are your upcoming restock warnings:\n\n` +
                    warnings.map(w => `- **${w.product}** is likely to run out of stock soon.\n  *Details:* ${w.competitorInsights}`).join("\n\n");
            } else {
                reply = "I've checked your inventory levels against local demand trends, and all your active products have healthy stock levels. No stockouts predicted in the next 7 days!";
            }
        } else if (q.includes("trend") || q.includes("nearby") || q.includes("popular")) {
            const trends = await ProductTrend.find({ city: profile.city }).sort({ trendScore: -1 }).limit(3);
            if (trends.length > 0) {
                reply = `🔥 Top trending products nearby in ${profile.city.toUpperCase()}:\n\n` +
                    trends.map((t, idx) => `${idx + 1}. **${t.keyword}** (Growth: +${t.growthPercentage}% in searches, Demand: ${t.demandLevel.toUpperCase()})`).join("\n");
            } else {
                reply = "I couldn't fetch local trend data right now. Check back in an hour as Indore's trend aggregator runs periodically.";
            }
        } else if (q.includes("health") || q.includes("score") || q.includes("performance")) {
            reply = `📊 **AI Business Health Score: ${profile.opportunityScore}/100**\n\n` +
                `- **Trend Alignment:** ${profile.trendAffinity}/100 (matching local search trends)\n` +
                `- **Inventory Strength:** ${profile.inventoryStrength}/100 (percentage of products well-stocked)\n` +
                `- **Demand Coverage:** ${profile.demandCoverage}/100 (percentage of high-demand items you stock)\n` +
                `- **Response Speed:** ${profile.responseRate}/100 (how fast you respond to leads/orders)\n\n` +
                `*Recommendation:* To boost your score, check your High Demand Opportunities tab and stock missing items.`;
        } else {
            reply = `Hello! I am your Aisle Business Assistant. Your Business Health Score is **${profile.opportunityScore}/100**.\n\n` +
                `You can ask me questions like:\n` +
                `- "What should I stock this week?"\n` +
                `- "Are there any products about to run out of stock?"\n` +
                `- "What is trending nearby?"\n` +
                `- "Show me my business health score summary"`;
        }

        res.json({ success: true, reply });
    } catch (error) {
        console.error('[AnalyticsEngine] Assistant error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Weekly Monday Intelligence Report
// @route   GET /api/seller/analytics/weekly-report
// @access  Private (Seller Only)
const getWeeklyIntelligenceReport = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const profile = await SellerIntelligence.findOne({ sellerId }) || await calculateSellerIntelligence(sellerId);
        const city = profile.city;

        const opportunities = await SellerRecommendation.find({ sellerId, type: "inventory_opportunity", status: "pending" }).limit(3).select('product estimatedRevenue');
        const missedDemand = await DemandGap.find({ city }).sort({ gapScore: -1 }).limit(3).select('keyword gapScore');
        const trendingProducts = await ProductTrend.find({ city }).sort({ growthPercentage: -1 }).limit(3).select('keyword growthPercentage');
        const stockWarnings = await SellerRecommendation.find({ sellerId, type: "restock_prediction", status: "pending" }).limit(3).select('product competitorInsights');

        const totalEstRevenue = opportunities.reduce((sum, o) => sum + o.estimatedRevenue, 0);

        const report = {
            reportDate: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            healthScore: profile.opportunityScore,
            topOpportunities: opportunities.map(o => o.product),
            missedDemand: missedDemand.map(m => m.keyword),
            trendingProducts: trendingProducts.map(t => ({ product: t.keyword, growth: `+${t.growthPercentage}%` })),
            stockWarnings: stockWarnings.map(s => s.product),
            revenuePotential: totalEstRevenue > 0 ? `₹${Math.round(totalEstRevenue * 0.8).toLocaleString()} - ₹${Math.round(totalEstRevenue * 1.2).toLocaleString()}/month` : "₹0/month"
        };

        res.json(report);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get weekly report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Demand Heat Map
// @route   GET /api/seller/analytics/heatmap
// @access  Private (Seller Only)
const getDemandHeatmap = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const profile = await SellerIntelligence.findOne({ sellerId }) || await calculateSellerIntelligence(sellerId);
        const city = profile.city;

        // Group searches in seller's city by rounded coordinates
        const searches = await SearchAnalytics.aggregate([
            { $match: { city: new RegExp(`^${city}$`, 'i') } },
            {
                $group: {
                    _id: {
                        lat: { $round: ["$latitude", 3] },
                        lng: { $round: ["$longitude", 3] }
                    },
                    demandScore: { $sum: 1 }
                }
            },
            { $sort: { demandScore: -1 } },
            { $limit: 10 }
        ]);

        // Integrate Indore Areas mapping to enrich coordinates with names and pincodes
        const zones = INDORE_AREAS.map(area => {
            // Find if there's aggregated search demand close to this area
            const matchingSearch = searches.find(s => {
                const latDiff = Math.abs((s._id?.lat || 0) - area.lat);
                const lngDiff = Math.abs((s._id?.lng || 0) - area.lng);
                return latDiff < 0.05 && lngDiff < 0.05;
            });
            const searchCount = matchingSearch ? matchingSearch.demandScore : 0;
            // Simulated baseline + search count
            const demandScore = Math.min(100, Math.max(30, 45 + searchCount * 5));

            return {
                area: area.area,
                pincode: area.pincode,
                latitude: area.lat,
                longitude: area.lng,
                demandScore
            };
        }).sort((a, b) => b.demandScore - a.demandScore);

        res.json(zones);
    } catch (error) {
        console.error('[AnalyticsEngine] Failed to get heatmap data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    trackProductView,
    getDashboardStats,
    getTrendingProducts,
    getLowStockAlerts,
    getCategoryPerformance,
    getInventoryHealthScore,
    getSmartPriceInsights,
    getSellerRecommendations,
    getSellerOpportunities,
    getSellerTrendsDashboard,
    getSellerIntelligenceInsights,
    respondToRecommendation,
    askSellerAssistant,
    getWeeklyIntelligenceReport,
    getDemandHeatmap
};
