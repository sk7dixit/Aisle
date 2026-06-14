const mongoose = require("mongoose");
const DemandHistory = require("../models/DemandHistory");
const DemandForecast = require("../models/DemandForecast");
const SearchAnalytics = require("../models/SearchAnalytics");
const Request = require("../models/Request");
const User = require("../models/User");
const Product = require("../models/Product");
const SellerNotification = require("../models/SellerNotification");
const { getRedisClient, isRedisActive } = require("../config/redis");

// Season helper
const getSeasonForMonth = (month) => {
    if (month >= 3 && month <= 6) return "summer";
    if (month >= 7 && month <= 9) return "monsoon";
    return "winter"; // October to February
};

/**
 * Automatically seeds 14 days of mock search statistics for Indore keywords on startup/initialization if no history is present.
 */
async function seedMockHistoricalData() {
    try {
        const count = await DemandHistory.countDocuments();
        if (count > 0) {
            console.log("[ForecastService] Demand history already populated. Skipping seeding.");
            return;
        }

        console.log("[ForecastService] Seeding 14 days of mock demand history for Indore...");

        // Generate the last 14 dates relative to today (excluding today, up to yesterday)
        const dates = [];
        for (let i = 14; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
            dates.push(dateStr);
        }

        // Indiana Mock Keywords
        const mockData = [
            {
                keyword: "protein powder",
                category: "Grocery",
                city: "indore",
                week1Searches: [500, 520, 480, 510, 530, 490, 500],
                week2Searches: [800, 950, 1000, 1100, 1150, 1200, 1250]
            },
            {
                keyword: "cold coffee",
                category: "Bakery",
                city: "indore",
                week1Searches: [200, 210, 190, 200, 220, 180, 200],
                week2Searches: [300, 320, 350, 380, 400, 420, 450]
            },
            {
                keyword: "energy drink",
                category: "Grocery",
                city: "indore",
                week1Searches: [300, 310, 290, 300, 320, 280, 300],
                week2Searches: [400, 420, 450, 500, 550, 600, 650]
            }
        ];

        const historyDocs = [];

        for (const item of mockData) {
            for (let i = 0; i < 14; i++) {
                const isWeek1 = i < 7;
                const searchCount = isWeek1 ? item.week1Searches[i] : item.week2Searches[i - 7];
                // Clicks ~ 15% of searches, requests ~ 8% of searches
                const clickCount = Math.round(searchCount * 0.15);
                const requestCount = Math.round(searchCount * 0.08);

                historyDocs.push({
                    keyword: item.keyword,
                    city: item.city,
                    date: dates[i],
                    searchCount,
                    clickCount,
                    requestCount
                });
            }
        }

        await DemandHistory.insertMany(historyDocs);
        console.log(`[ForecastService] Successfully seeded ${historyDocs.length} demand history records.`);
    } catch (error) {
        console.error("[ForecastService] Error seeding mock historical data:", error);
    }
}

/**
 * Aggregates daily demand metrics (searches, clicks, and requests) for a given target date.
 * @param {string} [targetDateStr] - Format YYYY-MM-DD. Defaults to yesterday.
 */
async function aggregateDailyDemand(targetDateStr) {
    try {
        let targetDate;
        if (targetDateStr) {
            targetDate = new Date(targetDateStr);
        } else {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - 1); // Yesterday
        }

        const dateString = targetDate.toISOString().split("T")[0];
        console.log(`[ForecastService] Running daily demand history aggregation for ${dateString}...`);

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Search & Click data from SearchAnalytics
        const searchAgg = await SearchAnalytics.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: {
                        keyword: "$normalizedKeyword",
                        city: "$city"
                    },
                    searchCount: { $sum: 1 },
                    clickCount: {
                        $sum: {
                            $cond: [
                                { $ne: [ { $ifNull: [ "$clickedProductId", null ] }, null ] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // 2. Fetch Request data
        const requests = await Request.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Map sellerId to city for requests
        const uniqueSellerIds = [...new Set(requests.map(r => r.sellerId.toString()))];
        const sellers = await User.find({ _id: { $in: uniqueSellerIds } }).select("shopDetails");
        const sellerCityMap = {};
        sellers.forEach(s => {
            const city = s.shopDetails?.location?.city || s.shopDetails?.shopLocation?.city || "Unknown";
            sellerCityMap[s._id.toString()] = city.toLowerCase();
        });

        // Group requests by product name (keyword) and city
        const requestGroups = {};
        requests.forEach(req => {
            const keyword = req.productName.trim().toLowerCase();
            const city = sellerCityMap[req.sellerId.toString()] || "unknown";
            const key = `${keyword}_${city}`;

            if (!requestGroups[key]) {
                requestGroups[key] = { keyword, city, count: 0 };
            }
            requestGroups[key].count += 1;
        });

        // Combine searches, clicks, and requests
        const combinedMetrics = {};

        // Add searches and clicks
        searchAgg.forEach(item => {
            const keyword = (item._id.keyword || "unknown").trim().toLowerCase();
            const city = (item._id.city || "unknown").trim().toLowerCase();
            const key = `${keyword}_${city}`;

            combinedMetrics[key] = {
                keyword,
                city,
                searchCount: item.searchCount,
                clickCount: item.clickCount,
                requestCount: 0
            };
        });

        // Add requests
        Object.values(requestGroups).forEach(item => {
            const key = `${item.keyword}_${item.city}`;
            if (!combinedMetrics[key]) {
                combinedMetrics[key] = {
                    keyword: item.keyword,
                    city: item.city,
                    searchCount: 0,
                    clickCount: 0,
                    requestCount: 0
                };
            }
            combinedMetrics[key].requestCount += item.count;
        });

        // Save aggregates to DemandHistory
        let upsertCount = 0;
        for (const metric of Object.values(combinedMetrics)) {
            await DemandHistory.findOneAndUpdate(
                { keyword: metric.keyword, city: metric.city, date: dateString },
                {
                    $set: {
                        searchCount: metric.searchCount,
                        clickCount: metric.clickCount,
                        requestCount: metric.requestCount
                    }
                },
                { upsert: true, new: true }
            );
            upsertCount++;
        }

        console.log(`[ForecastService] Aggregated ${upsertCount} records into DemandHistory for ${dateString}.`);
    } catch (error) {
        console.error("[ForecastService] Error in daily demand history aggregation:", error);
        throw error;
    }
}

/**
 * Computes moving averages, momentum, confidence, trend direction, and seasonal adjustments
 * to generate and update DemandForecast collections.
 */
async function generateForecasts() {
    try {
        // Run seeder if history is empty
        await seedMockHistoricalData();

        console.log("[ForecastService] Starting demand forecast generation...");

        // Resolve unique keyword-city combinations in the last 14 days of history
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 15);
        const dateLimitStr = dateLimit.toISOString().split("T")[0];

        const uniqueCombos = await DemandHistory.aggregate([
            {
                $match: {
                    date: { $gte: dateLimitStr }
                }
            },
            {
                $group: {
                    _id: {
                        keyword: "$keyword",
                        city: "$city"
                    }
                }
            }
        ]);

        if (uniqueCombos.length === 0) {
            console.log("[ForecastService] No historical demand records found to generate forecasts.");
            return;
        }

        // Get past 14 dates to build full aligned time series
        const dates = [];
        for (let i = 14; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split("T")[0]);
        }

        const week1Dates = dates.slice(0, 7); // Days 8-14 ago
        const week2Dates = dates.slice(7, 14); // Days 1-7 ago (yesterday is dates[13])

        const now = new Date();
        const currentMonth = now.getMonth() + 1;

        let forecastsCreated = 0;

        for (const combo of uniqueCombos) {
            const { keyword, city } = combo._id;

            // Fetch history for this combo
            const history = await DemandHistory.find({
                keyword,
                city,
                date: { $gte: dates[0] }
            });

            // Map date to searchCount for fast retrieval
            const historyMap = {};
            history.forEach(h => {
                historyMap[h.date] = h.searchCount;
            });

            // ReconstructWeek 1 & 2 series to handle missing days gracefully with 0s
            const week1Series = week1Dates.map(d => historyMap[d] || 0);
            const week2Series = week2Dates.map(d => historyMap[d] || 0);

            // Compute averages
            const week1Sum = week1Series.reduce((a, b) => a + b, 0);
            const week2Sum = week2Series.reduce((a, b) => a + b, 0);

            const week1Avg = week1Sum / 7;
            const week2Avg = week2Sum / 7;

            // 7-Day Moving Average (Base Demand)
            const ma7Day = week2Avg;

            // Momentum Score (Growth Rate)
            let growth = 0;
            if (week1Avg > 0) {
                growth = (week2Avg - week1Avg) / week1Avg;
            } else if (week2Avg > 0) {
                growth = 1.0; // 100% growth if prev was 0
            }

            const momentumScore = Math.round(growth * 100);

            // Confidence Score (using standard deviation / Coefficient of Variation)
            let variance = 0;
            week2Series.forEach(val => {
                variance += Math.pow(val - ma7Day, 2);
            });
            const stdDev = Math.sqrt(variance / 7);
            
            // Coefficient of Variation = stdDev / ma7Day
            let confidenceScore = 100;
            if (ma7Day > 0) {
                const cv = stdDev / ma7Day;
                confidenceScore = Math.max(30, Math.min(98, Math.round((1 - cv) * 100)));
            }

            // Trend Direction
            let trendDirection = "STABLE";
            if (growth > 0.50) trendDirection = "SPIKE";
            else if (growth > 0.10) trendDirection = "UP";
            else if (growth < -0.30) trendDirection = "DECLINE";
            else if (growth < -0.10) trendDirection = "DOWN";

            // Determine product category by checking SearchAnalytics or Product catalog (or default to Grocery)
            let category = "Grocery";
            const sampleSearch = await SearchAnalytics.findOne({ normalizedKeyword: keyword }).select("category");
            if (sampleSearch && sampleSearch.category) {
                category = sampleSearch.category;
            } else {
                // Check Product model
                const sampleProduct = await Product.findOne({
                    $or: [
                        { name: { $regex: new RegExp(keyword, "i") } },
                        { category: { $regex: new RegExp(keyword, "i") } }
                    ]
                }).select("category");
                if (sampleProduct && sampleProduct.category) {
                    category = sampleProduct.category;
                }
            }

            // Normal Projections
            let p1Day = ma7Day;
            let p7Day = ma7Day * 7 * (1 + growth);
            let p30Day = ma7Day * 30 * (1 + growth * 2);

            // Event-Based adjustments (Diwali/Monsoon)
            const lowerKeyword = keyword.toLowerCase();
            const lowerCategory = category.toLowerCase();

            // Monsoon: Umbrellas, raincoats, rainy items in Jul/Aug/Sep (7, 8, 9)
            const isMonsoonProduct = 
                lowerKeyword.includes("umbrella") || 
                lowerKeyword.includes("raincoat") || 
                lowerKeyword.includes("rainy") || 
                lowerCategory.includes("seasonal");
            const isMonsoonActive = currentMonth >= 7 && currentMonth <= 9;

            if (isMonsoonProduct && isMonsoonActive) {
                p1Day *= 1.5;
                p7Day *= 1.5;
                p30Day *= 1.5;
                console.log(`[ForecastService] Applied Monsoon 1.5x Multiplier to keyword: ${keyword}`);
            }

            // Diwali sweets and gifts in Oct/Nov (10, 11)
            const isDiwaliProduct = 
                lowerKeyword.includes("sweet") || 
                lowerKeyword.includes("decor") || 
                lowerKeyword.includes("diya") || 
                lowerKeyword.includes("cracker") || 
                lowerKeyword.includes("gift") || 
                lowerCategory.includes("bakery") || 
                lowerCategory.includes("home & lifestyle") || 
                lowerCategory.includes("seasonal_festive");
            const isDiwaliActive = currentMonth === 10 || currentMonth === 11;

            if (isDiwaliProduct && isDiwaliActive) {
                p1Day *= 2.0;
                p7Day *= 2.0;
                p30Day *= 2.0;
                console.log(`[ForecastService] Applied Diwali 2.0x Multiplier to keyword: ${keyword}`);
            }

            // Clamp predictions to 0
            const predictedDemand1Day = Math.round(Math.max(0, p1Day));
            const predictedDemand7Day = Math.round(Math.max(0, p7Day));
            const predictedDemand30Day = Math.round(Math.max(0, p30Day));

            // Current demand = average demand yesterday or last day
            const currentDemand = historyMap[dates[13]] || 0;

            // Save/Update Forecast
            const forecast = await DemandForecast.findOneAndUpdate(
                { keyword, city },
                {
                    $set: {
                        category,
                        currentDemand,
                        predictedDemand1Day,
                        predictedDemand7Day,
                        predictedDemand30Day,
                        confidenceScore,
                        trendDirection,
                        momentumScore,
                        generatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            // Proactive Alert system for forecast growth > 50%
            if (growth > 0.50 || (predictedDemand7Day > currentDemand * 1.5 && currentDemand > 0)) {
                // Find sellers in this city
                const localSellers = await User.find({
                    role: "seller",
                    $or: [
                        { "shopDetails.location.city": new RegExp(city, "i") },
                        { "shopDetails.shopLocation.city": new RegExp(city, "i") }
                    ]
                }).select("_id");

                for (const seller of localSellers) {
                    // Avoid sending duplicate notifications on the same day for same keyword
                    const todayStart = new Date();
                    todayStart.setHours(0,0,0,0);
                    
                    const existingNotif = await SellerNotification.findOne({
                        sellerId: seller._id,
                        type: "FORECAST_ALERT",
                        createdAt: { $gte: todayStart },
                        message: new RegExp(keyword, "i")
                    });

                    if (!existingNotif) {
                        await SellerNotification.create({
                            sellerId: seller._id,
                            source: "SYSTEM",
                            type: "FORECAST_ALERT",
                            priority: "IMPORTANT",
                            title: "High Demand Forecast Alert",
                            message: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} demand is expected to grow significantly (+${momentumScore}%) next week in ${city}. Consider increasing your stock level.`
                        }).catch(e => console.error(`[ForecastService] Failed to create SellerNotification: ${e.message}`));
                    }
                }
            }

            forecastsCreated++;
        }

        console.log(`[ForecastService] Successfully generated/updated ${forecastsCreated} demand forecasts.`);

        // Clear Redis cache for the cities
        if (isRedisActive()) {
            const redis = getRedisClient();
            const cities = await DemandForecast.distinct("city");
            for (const c of cities) {
                const cacheKey = `forecast:seller:${c.toLowerCase()}`;
                await redis.del(cacheKey);
            }
            console.log("[ForecastService] Cleared Redis seller forecast caches.");
        }
    } catch (error) {
        console.error("[ForecastService] Error generating demand forecasts:", error);
        throw error;
    }
}

/**
 * Measures the accuracy of yesterday's 1-Day demand forecast compared to actual search results.
 */
async function evaluateAccuracy() {
    try {
        console.log("[ForecastService] Starting forecast accuracy evaluation...");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Fetch all forecasts
        const forecasts = await DemandForecast.find();
        let evaluatedCount = 0;

        for (const f of forecasts) {
            // Find actual search count from yesterday
            const history = await DemandHistory.findOne({
                keyword: f.keyword,
                city: f.city,
                date: yesterdayStr
            });

            const actualDemand = history ? history.searchCount : 0;
            const predictedDemand = f.predictedDemand1Day;

            // Calculate percentage accuracy
            let accuracyScore = 100;
            if (actualDemand > 0) {
                const diff = Math.abs(actualDemand - predictedDemand);
                accuracyScore = Math.max(0, Math.round(100 - (diff / actualDemand) * 100));
            } else {
                // If actual demand is 0, then prediction accuracy is 100 if we predicted 0, else 0
                accuracyScore = predictedDemand === 0 ? 100 : 0;
            }

            await DemandForecast.updateOne(
                { _id: f._id },
                { $set: { accuracyScore } }
            );
            evaluatedCount++;
        }

        console.log(`[ForecastService] Completed accuracy evaluation for ${evaluatedCount} forecasts.`);
    } catch (error) {
        console.error("[ForecastService] Error in forecast accuracy evaluation:", error);
        throw error;
    }
}

module.exports = {
    seedMockHistoricalData,
    aggregateDailyDemand,
    generateForecasts,
    evaluateAccuracy
};
