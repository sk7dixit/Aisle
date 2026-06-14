const DemandForecast = require("../models/DemandForecast");
const { getRedisClient, isRedisActive } = require("../config/redis");
const { aggregateDailyDemand, generateForecasts, evaluateAccuracy } = require("../services/forecastService");

/**
 * Get demand forecasts for a seller based on their city.
 * GET /api/seller/forecast or GET /api/forecast/seller
 */
const getSellerForecast = async (req, res) => {
    try {
        const city = req.user.shopDetails?.location?.city || req.user.shopDetails?.shopLocation?.city || "Indore";
        const normalizedCity = city.trim().toLowerCase();
        const cacheKey = `forecast:seller:${normalizedCity}`;

        // Try Cache
        if (isRedisActive()) {
            const redis = getRedisClient();
            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.status(200).json(JSON.parse(cached));
            }
        }

        // Fetch forecasts matching city (case-insensitive)
        const forecasts = await DemandForecast.find({
            city: new RegExp(`^${normalizedCity}$`, "i")
        }).sort({ predictedDemand7Day: -1 });

        // Map output format
        const results = forecasts.map(f => {
            const growthVal = Math.round(((f.predictedDemand7Day - f.currentDemand) / (f.currentDemand || 1)) * 100);
            const growthStr = (growthVal >= 0 ? "+" : "") + growthVal + "%";
            return {
                keyword: f.keyword,
                current: f.currentDemand,
                forecast7Days: f.predictedDemand7Day,
                growth: growthStr,
                confidence: f.confidenceScore,
                trend: f.trendDirection
            };
        });

        // Set Cache
        if (isRedisActive()) {
            const redis = getRedisClient();
            await redis.set(cacheKey, JSON.stringify(results), "EX", 900); // 15 mins TTL
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error("[ForecastController] Error getting seller forecast:", error);
        return res.status(500).json({ message: "Server error getting seller forecast" });
    }
};

/**
 * Get category growth projections for admin.
 * GET /api/forecast/categories
 */
const getCategoryForecasts = async (req, res) => {
    try {
        const categoryProjections = await DemandForecast.aggregate([
            {
                $group: {
                    _id: "$category",
                    current: { $sum: "$currentDemand" },
                    forecast7Days: { $sum: "$predictedDemand7Day" },
                    forecast30Days: { $sum: "$predictedDemand30Day" }
                }
            }
        ]);

        const results = categoryProjections.map(c => {
            const growthVal = Math.round(((c.forecast7Days - c.current) / (c.current || 1)) * 100);
            const growthStr = (growthVal >= 0 ? "+" : "") + growthVal + "%";
            return {
                category: c._id || "Grocery",
                current: c.current,
                forecast7Days: c.forecast7Days,
                forecast30Days: c.forecast30Days,
                growth: growthStr
            };
        });

        return res.status(200).json(results);
    } catch (error) {
        console.error("[ForecastController] Error getting category forecasts:", error);
        return res.status(500).json({ message: "Server error getting category forecasts" });
    }
};

/**
 * Trigger manual forecasting pipeline run (Admin Only).
 * POST /api/forecast/trigger
 */
const triggerForecastRun = async (req, res) => {
    try {
        console.log("[ForecastController] Manual forecast run triggered by admin...");
        
        // 1. Aggregate Yesterday's Data
        await aggregateDailyDemand();

        // 2. Generate Forecasts
        await generateForecasts();

        // 3. Evaluate Accuracy
        await evaluateAccuracy();

        return res.status(200).json({ message: "Forecast pipeline run completed successfully." });
    } catch (error) {
        console.error("[ForecastController] Error triggering manual forecast run:", error);
        return res.status(500).json({ message: "Server error running forecasting pipeline" });
    }
};

module.exports = {
    getSellerForecast,
    getCategoryForecasts,
    triggerForecastRun
};
