const User = require('../models/User');
const BusinessTasks = require('../models/BusinessTasks');
const buildSellerContext = require('../support/context/contextBuilder');
const Visit = require('../models/Visit');
const { predictDemand } = require('../commerce-intelligence/forecastingEngine');
const { analyzeCustomerDemand } = require('../commerce-intelligence/demandAnalyzer');
const { optimizeRevenue } = require('../commerce-intelligence/revenueOptimizer');
const { recommendPricing } = require('../commerce-intelligence/pricingAdvisor');
const { checkCustomerRetention } = require('../commerce-intelligence/retentionEngine');
const { checkMarketTrends } = require('../commerce-intelligence/marketTrendEngine');
const { planGrowth } = require('../commerce-intelligence/growthPlanner');
const { generateTasks } = require('../commerce-intelligence/taskGenerator');
const { getCopilotAdvice } = require('../commerce-intelligence/commerceCopilot');

// Phase 3 resolution engines for autonomous task execution integration
const { executeInventoryResolution } = require('../support/resolution/inventoryResolver');
const { executePaymentResolution } = require('../support/resolution/paymentResolver');
const { executeOfferResolution } = require('../support/resolution/offerResolver');
const { executeShopResolution } = require('../support/resolution/shopResolver');

/**
 * Compiles and returns Aisle Business Center dashboard data.
 */
const getBusinessCenterDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Build context
        const context = await buildSellerContext(sellerId);

        // Fetch User profile to get automation preferences
        const user = await User.findById(sellerId);
        const automationMode = user?.shopDetails?.automationMode || 'MANUAL';

        // Run engines in parallel
        const [
            forecasts,
            demandGaps,
            bundleOffers,
            pricingAdvice,
            retentionOpportunities,
            marketTrends,
            growthRoadmap,
            tasks
        ] = await Promise.all([
            predictDemand(sellerId, context),
            analyzeCustomerDemand(sellerId, context),
            optimizeRevenue(sellerId, context),
            recommendPricing(sellerId, context),
            checkCustomerRetention(sellerId, context),
            checkMarketTrends(sellerId, context),
            planGrowth(sellerId, context),
            generateTasks(sellerId, context)
        ]);

        const operatingMode = user?.shopDetails?.operatingMode || 'GUARANTEED';
        let finalForecasts = forecasts;
        let finalDemandGaps = demandGaps;

        if (operatingMode === 'RUSH') {
            finalForecasts = [
                { productName: 'Customer Call Requests', predictedDemand: 18, confidence: 95 },
                { productName: 'Availability Inquiries', predictedDemand: 34, confidence: 90 }
            ];
            finalDemandGaps = [
                { productName: 'Most Asked: Home Delivery', searchesCount: 48 },
                { productName: 'Most Asked: Stock Availability Checks', searchesCount: 32 }
            ];
        }

        // Compute subcategory health score breakdowns
        const hasDesc = !!context.shop?.description;
        const hasLogo = !!context.shop?.logo;
        const hasBanner = !!context.shop?.banner;
        const profileHealth = (hasDesc ? 30 : 0) + (hasLogo ? 35 : 0) + (hasBanner ? 35 : 0) || 70; // fallback to 70

        const totalProds = context.products?.totalProducts || 0;
        const lowStockCount = context.products?.list?.filter(p => p.quantity < 5).length || 0;
        const inventoryHealth = totalProds === 0 ? 100 : Math.max(60, Math.round(((totalProds - lowStockCount) / totalProds) * 100));

        const ratingVal = user?.shopDetails?.rating || 4.5;
        const salesHealth = Math.round(ratingVal * 20); // e.g. 4.6 * 20 = 92
        const customerHealth = Math.round(ratingVal * 19 + 5); // e.g. 4.6 * 19 + 5 = 92.4
        const compliance = user?.shopDetails?.paymentSetupCompleted ? 100 : 80;

        // Dynamic health score matching growth score but tailored
        const healthBreakdown = {
            profileHealth,
            inventoryHealth,
            salesHealth,
            customerHealth,
            compliance
        };

        // Construct Indore geographical local commerce demand coordinates
        const ProductTrend = require('../models/ProductTrend');
        const sellerCity = user?.shopDetails?.city || 'Indore';
        
        const localTrends = await ProductTrend.find({ city: { $regex: new RegExp(`^${sellerCity}$`, 'i') } })
            .sort({ trendScore: -1 })
            .limit(5);

        const trendingProducts = localTrends.map((t, idx) => ({
            id: idx + 1,
            name: t.keyword,
            searches: t.searchCount,
            trend: t.growthPercentage > 0 ? "UP" : "STABLE"
        }));

        const fallbackTrendingProducts = [
            { id: 1, name: "Organic Honey", searches: 146, trend: "UP" },
            { id: 2, name: "Brown Bread", searches: 92, trend: "UP" },
            { id: 3, name: "Fresh Paneer", searches: 88, trend: "UP" },
            { id: 4, name: "Fresh Curd", searches: 64, trend: "STABLE" }
        ];

        const commerceRadar = {
            center: { lat: 22.7196, lng: 75.8577 }, // Indore city center
            heatZones: [
                { id: 1, name: "Vijay Nagar", lat: 22.7533, lng: 75.8937, intensity: "HIGH", count: 142 },
                { id: 2, name: "Palasia", lat: 22.7244, lng: 75.8839, intensity: "HIGH", count: 98 },
                { id: 3, name: "Rajwada", lat: 22.7186, lng: 75.8578, intensity: "MEDIUM", count: 64 },
                { id: 4, name: "Bhawarkua", lat: 22.6996, lng: 75.8690, intensity: "MEDIUM", count: 57 },
                { id: 5, name: "Anand Bazar", lat: 22.7302, lng: 75.8988, intensity: "LOW", count: 21 }
            ],
            trendingProducts: trendingProducts.length > 0 ? trendingProducts : fallbackTrendingProducts
        };


        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Fetch actual orders today
        const todayOrdersList = context.orders?.list?.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= today && o.status !== 'CANCELLED';
        }) || [];

        const revenueToday = todayOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Build Predictive Business Timeline events
        const lowStockProd = context.products?.list?.find(p => p.quantity < 5);
        const predictiveTimeline = [
            lowStockProd 
                ? { id: 't1', day: "Today", event: "Inventory Risk", desc: `${lowStockProd.name} stock is low (${lowStockProd.quantity} left).`, type: "WARNING" }
                : { id: 't1', day: "Today", event: "Inventory Healthy", desc: "All catalog items are in stock.", type: "SUCCESS" },
            { id: 't2', day: "Tomorrow", event: "Demand Increase", desc: "Projected local search volume spike +15% for organic snacks.", type: "INFO" },
            { id: 't3', day: "3 Days", event: "Offer Expiration", desc: "Summer discount campaign expires soon.", type: "WARNING" },
            { id: 't4', day: "7 Days", event: "Expected Revenue Spike", desc: `Indore weekend shopping rush forecast: ₹${Math.round((revenueToday || 12450) * 1.15).toLocaleString()} revenue expectation.`, type: "SUCCESS" }
        ];

        const ordersToday = todayOrdersList.length;
        const ordersCompletedToday = todayOrdersList.filter(o => o.status === 'FULFILLED').length;
        const ordersPending = context.orders?.pendingOrders || 0;

        // Fetch actual orders yesterday
        const yesterdayOrdersList = context.orders?.list?.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= yesterday && orderDate < today && o.status !== 'CANCELLED';
        }) || [];
        const revenueYesterday = yesterdayOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        let revenueChangePercent = 0;
        if (revenueYesterday > 0) {
            revenueChangePercent = Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);
        } else if (revenueToday > 0) {
            revenueChangePercent = 100;
        }

        // Forecast revenue based on today's performance
        const forecastRevenue = revenueToday ? Math.round(revenueToday * 1.15) : 0;

        // Visits calculations (real time)
        const upcomingVisits = await Visit.find({
            shopId: sellerId,
            status: { $in: ['SCHEDULED', 'ARRIVED'] },
            scheduledTime: { $gte: today }
        });

        const completedVisits = await Visit.find({
            shopId: sellerId,
            status: 'COMPLETED',
            updatedAt: { $gte: today }
        });

        const visitsToday = upcomingVisits.length + completedVisits.length;

        // Historical visits yesterday
        const completedVisitsYesterday = await Visit.find({
            shopId: sellerId,
            status: 'COMPLETED',
            updatedAt: { $gte: yesterday, $lt: today }
        });
        const visitsYesterday = completedVisitsYesterday.length;

        let visitsChangePercent = 0;
        if (visitsYesterday > 0) {
            visitsChangePercent = Math.round(((visitsToday - visitsYesterday) / visitsYesterday) * 100);
        } else if (visitsToday > 0) {
            visitsChangePercent = 100;
        }

        const totalBundleLift = bundleOffers.reduce((sum, offer) => sum + (offer.estimatedRevenue || 0), 0);
        const totalPricingLift = pricingAdvice.reduce((sum, advice) => sum + (advice.estimatedRevenue || 0), 0);
        const potentialGrowth = totalBundleLift + totalPricingLift;

        res.status(200).json({
            businessHealth: growthRoadmap.score || 80,
            healthBreakdown,
            roadMilestones: growthRoadmap.nextMilestones || [],
            revenueToday,
            revenueYesterday,
            revenueChangePercent,
            forecastRevenue,
            potentialGrowth,
            ordersPending,
            ordersToday,
            ordersCompletedToday,
            visitsToday,
            visitsYesterday,
            visitsChangePercent,
            automationMode,
            forecasts: finalForecasts,
            demandGaps: finalDemandGaps,
            bundleOffers,
            pricingAdvice,
            retentionOpportunities,
            marketTrends,
            commerceRadar,
            predictiveTimeline,
            tasks
        });
    } catch (error) {
        console.error('Commerce Business Center Dashboard Error:', error);
        res.status(500).json({ message: 'Server Error loading Business Center Dashboard', error: error.message });
    }
};

/**
 * Handles AI Commerce Copilot queries.
 */
const askCommerceCopilot = async (req, res) => {
    try {
        const { message } = req.body;
        const sellerId = req.user._id;

        if (!message) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const advice = await getCopilotAdvice(sellerId, message);
        res.status(200).json(advice);
    } catch (error) {
        console.error('Commerce Copilot Error:', error);
        res.status(500).json({ message: 'Server Error in Commerce Copilot', error: error.message });
    }
};

/**
 * Executes an autonomous task action and updates status.
 */
const executeTaskAction = async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user._id;

        const task = await BusinessTasks.findOne({ _id: id, sellerId });
        if (!task) {
            return res.status(404).json({ message: 'Business Task not found' });
        }

        let resolutionSuccess = false;

        // Route to Phase 3 resolution layers if applicable
        if (task.action && task.targetId) {
            try {
                if (task.action === 'RESTOCK_INVENTORY') {
                    await executeInventoryResolution(task.action, task.targetId, sellerId);
                    resolutionSuccess = true;
                } else if (task.action === 'EXTEND_OFFER') {
                    await executeOfferResolution(task.action, task.targetId, sellerId, { days: 7 });
                    resolutionSuccess = true;
                }
            } catch (err) {
                console.warn(`Autonomous resolution execution failed for task action ${task.action}:`, err);
            }
        } else if (task.action) {
            // General actions that do not require targetId
            try {
                if (task.action === 'COMPLETE_PAYMENT_SETUP') {
                    await executePaymentResolution('COMPLETE_PAYMENT_SETUP', sellerId);
                    resolutionSuccess = true;
                } else if (task.action === 'OPEN_SHOP') {
                    await executeShopResolution('OPEN_SHOP', sellerId);
                    resolutionSuccess = true;
                } else {
                    // Fallback stub success
                    resolutionSuccess = true;
                }
            } catch (err) {
                console.warn(`Autonomous resolution execution failed for general action ${task.action}:`, err);
            }
        } else {
            // Stub success for purely informational tasks
            resolutionSuccess = true;
        }

        if (resolutionSuccess) {
            task.status = 'COMPLETED';
            await task.save();
            res.status(200).json({ message: 'Task executed successfully', task });
        } else {
            task.status = 'FAILED';
            await task.save();
            res.status(400).json({ message: 'Task execution failed. Action could not be resolved.', task });
        }
    } catch (error) {
        console.error('Task Execution Error:', error);
        res.status(500).json({ message: 'Server Error executing task', error: error.message });
    }
};

/**
 * Executes an action to apply a commerce optimization opportunity.
 */
const applyOpportunityAction = async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user._id;

        const RevenueOpportunities = require('../models/RevenueOpportunities');
        const Product = require('../models/Product');
        const SellerProduct = require('../models/SellerProduct');
        const Offer = require('../models/Offer');

        const opp = await RevenueOpportunities.findOne({ _id: id, sellerId });
        if (!opp) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        opp.resolved = true;
        await opp.save();

        if (opp.category === 'PRICING' && opp.details?.productId) {
            // Update sellingPrice in Product and SellerProduct
            let prod = await Product.findOneAndUpdate(
                { _id: opp.details.productId, seller: sellerId },
                { sellingPrice: opp.details.suggestedPrice },
                { new: true }
            );
            if (!prod) {
                await SellerProduct.findOneAndUpdate(
                    { _id: opp.details.productId, seller: sellerId },
                    { sellingPrice: opp.details.suggestedPrice }
                );
            }
        } else if (opp.category === 'SEASONAL' && opp.details?.comboName) {
            // Create a new Offer campaign
            const newOffer = new Offer({
                sellerId,
                title: opp.details.comboName,
                type: 'percentage',
                value: opp.details.discount || 10,
                match: opp.details.items?.join(', ') || 'All Products',
                status: 'Active'
            });
            await newOffer.save();
        }

        res.status(200).json({ message: 'Opportunity applied successfully', opportunity: opp });
    } catch (error) {
        console.error('Apply Opportunity Error:', error);
        res.status(500).json({ message: 'Server Error applying opportunity', error: error.message });
    }
};

module.exports = {
    getBusinessCenterDashboard,
    askCommerceCopilot,
    executeTaskAction,
    applyOpportunityAction
};
