const RevenueForecast = require("../models/RevenueForecast");
const BusinessHealth = require("../models/BusinessHealth");
const RevenueHistory = require("../models/RevenueHistory");
const {
    runRevenuePipelineForSeller,
    getOpportunityEstimates,
    detectRevenueLeakage,
    getConversionStats,
    getCategoryGrowthAnalysis,
    getMultiStoreIntelligence: getStoreIntel,
    generateWeeklySummary
} = require("../services/revenueIntelligenceService");

/**
 * Get unified revenue dashboard metrics for a seller.
 * GET /api/seller/revenue-intelligence/dashboard
 */
const getRevenueDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // 1. Ensure pipeline has run to seed/populate data
        await runRevenuePipelineForSeller(sellerId);

        // 2. Fetch computed collections
        const forecast = await RevenueForecast.findOne({ sellerId });
        const health = await BusinessHealth.findOne({ sellerId });
        const history = await RevenueHistory.find({ sellerId }).sort({ date: 1 });

        // 3. Compile dynamically calculated metrics
        const opportunities = await getOpportunityEstimates(sellerId);
        const leakages = await detectRevenueLeakage(sellerId);
        const conversions = await getConversionStats(sellerId);
        const categoryProjections = await getCategoryGrowthAnalysis(sellerId);
        const weeklySummary = await generateWeeklySummary(sellerId);

        return res.status(200).json({
            currentRevenue: forecast ? forecast.currentRevenue : 0,
            predictedRevenue7Days: forecast ? forecast.predictedRevenue7Days : 0,
            predictedRevenue30Days: forecast ? forecast.predictedRevenue30Days : 0,
            predictedRevenue90Days: forecast ? forecast.predictedRevenue90Days : 0,
            growthRate: forecast ? forecast.growthRate : 0,
            growthPrediction: forecast ? forecast.growthPrediction : "stable",
            confidenceScore: forecast ? forecast.confidenceScore : 80,
            businessHealthScore: health ? health.score : 70,
            healthBreakdown: health ? health.healthBreakdown : {
                revenueGrowth: 15,
                inventoryHealth: 20,
                responseTime: 14,
                conversionRate: 12,
                demandCoverage: 9
            },
            recommendations: health ? health.recommendations : [],
            opportunities,
            leakages,
            conversions,
            categoryProjections,
            weeklySummary,
            historyTrend: history.map(h => ({
                date: h.date,
                revenue: h.revenue,
                orders: h.orders,
                requests: h.requests,
                conversions: h.conversions
            }))
        });
    } catch (error) {
        console.error("[RevenueController] Error fetching revenue dashboard:", error);
        return res.status(500).json({ message: "Server error compiling Revenue Dashboard" });
    }
};

/**
 * Get comparative multi-store performance list.
 * GET /api/seller/revenue-intelligence/multi-store
 */
const getMultiStoreIntelligence = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const stores = await getStoreIntel(sellerId);
        return res.status(200).json(stores);
    } catch (error) {
        console.error("[RevenueController] Error fetching multi-store intelligence:", error);
        return res.status(500).json({ message: "Server error getting store performance metrics" });
    }
};

/**
 * Manually trigger pipeline calculation.
 * POST /api/seller/revenue-intelligence/trigger
 */
const triggerRevenuePipeline = async (req, res) => {
    try {
        const sellerId = req.user._id;
        console.log(`[RevenueController] Manual pipeline trigger request for seller: ${sellerId}`);
        await runRevenuePipelineForSeller(sellerId);
        return res.status(200).json({ message: "Revenue intelligence pipeline completed successfully." });
    } catch (error) {
        console.error("[RevenueController] Error running manual revenue pipeline:", error);
        return res.status(500).json({ message: "Server error executing pipeline run" });
    }
};

module.exports = {
    getRevenueDashboard,
    getMultiStoreIntelligence,
    triggerRevenuePipeline
};
