const mongoose = require("mongoose");
const Order = require("../models/Order");
const Request = require("../models/Request");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const User = require("../models/User");
const DemandForecast = require("../models/DemandForecast");
const InventoryForecast = require("../models/InventoryForecast");
const RevenueHistory = require("../models/RevenueHistory");
const RevenueForecast = require("../models/RevenueForecast");
const BusinessHealth = require("../models/BusinessHealth");
const SellerNotification = require("../models/SellerNotification");

/**
 * Helper to get dates for the last N days (excluding today, up to yesterday)
 */
function getLastNDates(n) {
    const dates = [];
    for (let i = n; i >= 1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
}

/**
 * Seeds 14 days of mock RevenueHistory for a seller if none exists.
 */
async function seedRevenueMockData(sellerId) {
    const count = await RevenueHistory.countDocuments({ sellerId });
    if (count > 0) {
        return; // Already has history
    }

    console.log(`[RevenueService] Seeding 14 days of mock revenue history for seller ${sellerId}...`);
    const dates = getLastNDates(14);
    
    // Check if seller has products
    const stats = await Product.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
        { 
            $group: { 
                _id: null, 
                count: { $sum: 1 }, 
                avgPrice: { $avg: "$sellingPrice" } 
            } 
        }
    ]);
    const productCount = stats[0]?.count || 0;
    const avgPrice = stats[0]?.avgPrice || 500;

    const historyDocs = [];
    // Seed with a minor upward trend
    for (let i = 0; i < 14; i++) {
        const factor = 1 + (i * 0.03); // ~40% growth over 2 weeks
        const orders = Math.round((5 + Math.random() * 8) * factor);
        const requests = Math.round(orders * (1.3 + Math.random() * 0.5));
        const conversions = Math.round((orders / (requests || 1)) * 100);
        const revenue = Math.round(orders * avgPrice * (0.9 + Math.random() * 0.2));

        historyDocs.push({
            sellerId,
            revenue,
            orders,
            requests,
            conversions,
            date: dates[i]
        });
    }

    await RevenueHistory.insertMany(historyDocs);
    console.log(`[RevenueService] Successfully seeded ${historyDocs.length} revenue history records for seller ${sellerId}.`);
}

/**
 * Aggregates metrics (revenue, orders, requests, conversions) for all active sellers for a specific day.
 * Default is yesterday.
 */
async function aggregateDailyRevenue(targetDateStr) {
    try {
        let targetDate;
        if (targetDateStr) {
            targetDate = new Date(targetDateStr);
        } else {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - 1); // Yesterday
        }

        const dateString = targetDate.toISOString().split("T")[0];
        console.log(`[RevenueService] Running daily revenue aggregation for date: ${dateString}...`);

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all active sellers
        const sellers = await User.find({ role: "seller" });

        for (const seller of sellers) {
            const sellerId = seller._id;

            // 1. Calculate orders count & total revenue
            const ordersList = await Order.find({
                sellerId,
                status: { $in: ["CONFIRMED", "READY_FOR_PICKUP", "FULFILLED"] },
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            const orders = ordersList.length;
            const revenue = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            // 2. Calculate customer requests count
            const requests = await Request.countDocuments({
                sellerId,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            // 3. Calculate conversion percentage (successful orders vs requests or overall clicks)
            // Let's use orders vs requests as conversion rate
            const conversions = requests > 0 ? Math.round((orders / requests) * 100) : (orders > 0 ? 100 : 0);

            // 4. Update or Insert RevenueHistory record
            await RevenueHistory.findOneAndUpdate(
                { sellerId, date: dateString },
                {
                    $set: {
                        revenue,
                        orders,
                        requests,
                        conversions
                    }
                },
                { upsert: true, new: true }
            );
        }

        console.log(`[RevenueService] Completed daily revenue aggregation for ${sellers.length} sellers.`);
    } catch (error) {
        console.error("[RevenueService] Error in daily revenue aggregation:", error);
        throw error;
    }
}

/**
 * Generates/updates the RevenueForecast collection for a specific seller.
 */
async function generateRevenueForecasts(sellerId) {
    try {
        await seedRevenueMockData(sellerId);

        // Fetch seller details to check city
        const seller = await User.findById(sellerId);
        if (!seller) return;
        const city = (seller.shopDetails?.location?.city || seller.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();

        // 1. Historical Revenue (last 14 days)
        const history = await RevenueHistory.find({ sellerId }).sort({ date: -1 }).limit(14);
        if (history.length === 0) return;

        const totalRevenue14Days = history.reduce((sum, h) => sum + (h.revenue || 0), 0);
        const avgDailyRevenue = totalRevenue14Days / history.length;
        const currentRevenue = totalRevenue14Days; // 14 days total as current baseline

        // 2. Local Demand Forecast Factor
        // Fetch demand forecasts in seller's city and category
        const demandForecasts = await DemandForecast.find({ city: new RegExp(`^${city}$`, "i") });
        let demandGrowthFactor = 0; // average momentum score of local category searches
        if (demandForecasts.length > 0) {
            const sumMomentum = demandForecasts.reduce((sum, f) => sum + (f.momentumScore || 0), 0);
            demandGrowthFactor = (sumMomentum / demandForecasts.length) / 100; // convert to decimal multiplier
        }

        // Clamp demandGrowthFactor to sensible ranges (-30% to +50%)
        demandGrowthFactor = Math.max(-0.3, Math.min(0.5, demandGrowthFactor));

        // 3. Conversion Forecast Factor
        // Compare average conversions of last 7 days vs previous 7 days
        const last7Days = history.slice(0, 7);
        const prev7Days = history.slice(7, 14);

        const last7AvgConv = last7Days.length > 0 ? (last7Days.reduce((s, h) => s + (h.conversions || 0), 0) / last7Days.length) : 0;
        const prev7AvgConv = prev7Days.length > 0 ? (prev7Days.reduce((s, h) => s + (h.conversions || 0), 0) / prev7Days.length) : 0;

        let conversionGrowthFactor = 0;
        if (prev7AvgConv > 0) {
            conversionGrowthFactor = (last7AvgConv - prev7AvgConv) / prev7AvgConv;
        }

        // Clamp conversion growth
        conversionGrowthFactor = Math.max(-0.2, Math.min(0.3, conversionGrowthFactor));

        // 4. Weighted Forecasting Algorithm
        // 50% Historical Revenue, 30% Demand Forecast, 20% Conversion Forecast
        const weightedMultiplier = 
            (0.5 * 1.0) + // baseline history
            (0.3 * (1 + demandGrowthFactor)) + // demand-led adjustment
            (0.2 * (1 + conversionGrowthFactor)); // conversion-led adjustment

        const predictedDailyRevenue = avgDailyRevenue * weightedMultiplier;

        // Projections
        const predictedRevenue7Days = Math.round(predictedDailyRevenue * 7);
        const predictedRevenue30Days = Math.round(predictedDailyRevenue * 30);
        const predictedRevenue90Days = Math.round(predictedDailyRevenue * 90);

        // Growth rate: percent change of 30D forecast vs current 30D historical equivalent
        const historicalDailyRevenue = avgDailyRevenue;
        const projectedDailyRevenue = predictedDailyRevenue;
        const growthRate = Math.round(((projectedDailyRevenue - historicalDailyRevenue) / (historicalDailyRevenue || 1)) * 100);

        // Confidence score: based on variance of daily revenue & demand forecast confidence
        let varianceSum = 0;
        history.forEach(h => {
            varianceSum += Math.pow(h.revenue - avgDailyRevenue, 2);
        });
        const stdDev = Math.sqrt(varianceSum / history.length);
        const cv = avgDailyRevenue > 0 ? (stdDev / avgDailyRevenue) : 0;
        
        // Lower CV = higher confidence. Let's blend CV with standard confidence
        const baseConfidence = cv > 0 ? Math.max(40, Math.min(95, Math.round((1 - cv) * 100))) : 85;
        const confidenceScore = Math.round(baseConfidence * 0.8 + 15); // scaled 50-98%

        // Growth prediction category
        let growthPrediction = "stable";
        if (growthRate > 15) growthPrediction = "high_growth";
        else if (growthRate < -10) growthPrediction = "declining";

        // Save or update forecast
        await RevenueForecast.findOneAndUpdate(
            { sellerId },
            {
                $set: {
                    currentRevenue: Math.round(avgDailyRevenue * 30), // 30-day equivalent
                    predictedRevenue7Days,
                    predictedRevenue30Days,
                    predictedRevenue90Days,
                    growthRate,
                    confidenceScore,
                    growthPrediction,
                    forecastDate: new Date()
                }
            },
            { upsert: true, new: true }
        );

        console.log(`[RevenueService] Generated forecasts for seller ${sellerId}. 30D Forecast: ₹${predictedRevenue30Days}, Growth: ${growthRate}%`);
    } catch (error) {
        console.error(`[RevenueService] Error generating revenue forecasts for seller ${sellerId}:`, error);
        throw error;
    }
}

/**
 * Calculates the Business Health Score (0-100) and recommendations.
 */
async function calculateBusinessHealth(sellerId) {
    try {
        await seedRevenueMockData(sellerId);

        // Get forecast
        const forecast = await RevenueForecast.findOne({ sellerId });
        const growthRate = forecast ? forecast.growthRate : 0;

        // 1. Revenue Growth Score (Max 25 pts)
        // Baseline 15 points. Growth > 10% adds up to 10 points. Growth < 0% subtracts up to 10 points.
        let revenueGrowthScore = 15;
        if (growthRate > 0) {
            revenueGrowthScore += Math.min(10, Math.round(growthRate * 0.5));
        } else if (growthRate < 0) {
            revenueGrowthScore = Math.max(5, revenueGrowthScore + Math.max(-10, Math.round(growthRate * 0.5)));
        }

        // 2. Inventory Health Score (Max 25 pts)
        // Percentage of active products with quantity >= 5
        const totalProducts = await Product.countDocuments({ seller: sellerId });
        const inStockCount = await Product.countDocuments({ seller: sellerId, quantity: { $gte: 5 } });

        const inventoryHealthRatio = totalProducts > 0 ? (inStockCount / totalProducts) : 1.0;
        const inventoryHealthScore = Math.round(inventoryHealthRatio * 25);

        // 3. Response Time Score (Max 15 pts)
        // Mock or check request logs (let's assume a healthy response rate of 88-95%)
        const responseRateVal = totalProducts > 0 ? 92 : 100;
        const responseTimeScore = Math.round((responseRateVal / 100) * 15);

        // 4. Conversion Rate Score (Max 20 pts)
        // Calculate average conversion rate from RevenueHistory
        const history = await RevenueHistory.find({ sellerId }).sort({ date: -1 }).limit(7);
        const avgConvRate = history.length > 0 ? (history.reduce((s, h) => s + (h.conversions || 0), 0) / history.length) : 5; // default 5%
        
        // Score: conversion rate * 2, capped at 20 points
        const conversionRateScore = Math.min(20, Math.round(avgConvRate * 2));

        // 5. Demand Coverage Score (Max 15 pts)
        // Check how many of the city's top 5 search terms are in the seller's catalog
        const seller = await User.findById(sellerId);
        const city = (seller?.shopDetails?.location?.city || seller?.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();
        
        const topDemand = await DemandForecast.find({ city: new RegExp(`^${city}$`, "i") }).sort({ predictedDemand7Day: -1 }).limit(5);
        let matchingCatalogCount = 0;
        for (const term of topDemand) {
            const hasMatch = await Product.exists({
                seller: sellerId,
                name: { $regex: term.keyword, $options: "i" }
            });
            if (hasMatch) matchingCatalogCount++;
        }

        const demandCoverageRatio = topDemand.length > 0 ? (matchingCatalogCount / topDemand.length) : 0.8;
        const demandCoverageScore = Math.round(demandCoverageRatio * 15);

        // Total Score
        const score = Math.max(0, Math.min(100, 
            revenueGrowthScore + inventoryHealthScore + responseTimeScore + conversionRateScore + demandCoverageScore
        ));

        // Generate recommendations
        const recommendations = [];
        
        // Inventory triggers
        const lowStockProducts = await Product.find({ seller: sellerId, quantity: { $lt: 5 } })
            .select("name quantity")
            .limit(2)
            .lean();
        if (lowStockProducts.length > 0) {
            recommendations.push(`Restock ${lowStockProducts.map(p => p.name).join(" & ")} soon to prevent revenue loss.`);
        } else {
            recommendations.push("Maintain current excellent stock replenishment rates.");
        }

        // Response time triggers
        if (responseRateVal < 90) {
            recommendations.push("Improve response times to customer inquiries to secure bookings.");
        } else {
            recommendations.push("Keep responding fast: Quick responses drive a 15% increase in conversion.");
        }

        // Demand gap triggers
        const gapKeywords = [];
        for (const td of topDemand) {
            const hasMatch = await Product.exists({
                seller: sellerId,
                name: { $regex: td.keyword, $options: "i" }
            });
            if (!hasMatch) {
                gapKeywords.push(td);
            }
        }
        const sliceGapKeywords = gapKeywords.slice(0, 2);
        if (sliceGapKeywords.length > 0) {
            recommendations.push(`Expand category coverage by listing high-demand local items: ${sliceGapKeywords.map(gk => gk.keyword.charAt(0).toUpperCase() + gk.keyword.slice(1)).join(", ")}.`);
        }

        // Save/Update BusinessHealth
        await BusinessHealth.findOneAndUpdate(
            { sellerId },
            {
                $set: {
                    score,
                    recommendations,
                    healthBreakdown: {
                        revenueGrowth: revenueGrowthScore,
                        inventoryHealth: inventoryHealthScore,
                        responseTime: responseTimeScore,
                        conversionRate: conversionRateScore,
                        demandCoverage: demandCoverageScore
                    },
                    date: new Date()
                }
            },
            { upsert: true, new: true }
        );

        console.log(`[RevenueService] Business health calculated for ${sellerId}: ${score}/100.`);
    } catch (error) {
        console.error(`[RevenueService] Error calculating business health for ${sellerId}:`, error);
        throw error;
    }
}

/**
 * Dispatches early warnings and opportunity alerts to sellers.
 */
async function dispatchRevenueAlerts(sellerId) {
    try {
        const forecast = await RevenueForecast.findOne({ sellerId });
        if (!forecast) return;

        const { growthRate, predictedRevenue30Days, currentRevenue } = forecast;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Trigger 1: Positive growth opportunity alert (> 30% expected growth)
        if (growthRate >= 30) {
            const existingAlert = await SellerNotification.findOne({
                sellerId,
                type: "REVENUE_OPPORTUNITY_ALERT",
                createdAt: { $gte: todayStart }
            });

            if (!existingAlert) {
                const potentialLift = Math.round(predictedRevenue30Days - currentRevenue);
                await SellerNotification.create({
                    sellerId,
                    source: "SYSTEM",
                    type: "REVENUE_OPPORTUNITY_ALERT",
                    priority: "IMPORTANT",
                    title: "Revenue Growth Opportunity Detected",
                    message: `Your monthly revenue is projected to grow by +${growthRate}% (potential increase of ₹${potentialLift.toLocaleString()}). Check the Revenue Dashboard for optimization recommendations.`
                });
            }
        }

        // Trigger 2: Risk early warning alert (declining expected demand/revenue > 20% drop)
        if (growthRate <= -20) {
            const existingAlert = await SellerNotification.findOne({
                sellerId,
                type: "REVENUE_RISK_ALERT",
                createdAt: { $gte: todayStart }
            });

            if (!existingAlert) {
                await SellerNotification.create({
                    sellerId,
                    source: "SYSTEM",
                    type: "REVENUE_RISK_ALERT",
                    priority: "CRITICAL",
                    title: "Critical Revenue Risk Warning",
                    message: `Early indicators project a -${Math.abs(growthRate)}% decline in your revenue next month. Expand catalog coverage or adjust pricing to mitigate this risk.`
                });
            }
        }
    } catch (error) {
        console.error(`[RevenueService] Error dispatching alerts for ${sellerId}:`, error);
    }
}

/**
 * Calculates Opportunity Revenue estimates for seller's city.
 */
async function getOpportunityEstimates(sellerId) {
    const seller = await User.findById(sellerId);
    if (!seller) return [];

    const city = (seller.shopDetails?.location?.city || seller.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();
    
    // Top demand search forecasts in this city
    const forecasts = await DemandForecast.find({ city: new RegExp(`^${city}$`, "i") }).sort({ predictedDemand30Day: -1 }).limit(5);
    
    const opportunityResults = [];
    for (const f of forecasts) {
        const matchingProd = await Product.findOne({
            seller: sellerId,
            name: { $regex: f.keyword, $options: "i" }
        }).select("sellingPrice").lean();

        const inInventory = !!matchingProd;
        const conversionRate = 0.05;
        let avgProductValue = f.category === "Electronics" ? 2500 : (f.category === "Bakery" ? 250 : 180);
        if (f.keyword.toLowerCase().includes("protein powder")) {
            avgProductValue = 800;
        }
        if (matchingProd && matchingProd.sellingPrice) {
            avgProductValue = matchingProd.sellingPrice;
        }
        const potentialRevenue = Math.round(f.predictedDemand30Day * conversionRate * avgProductValue);

        opportunityResults.push({
            keyword: f.keyword,
            category: f.category,
            demandSearches: f.predictedDemand30Day,
            inInventory,
            estimatedConversion: conversionRate,
            avgOrderValue: avgProductValue,
            potentialRevenue
        });
    }
    return opportunityResults;
}

/**
 * Detects revenue leakage from out-of-stock or low-stock items.
 */
async function detectRevenueLeakage(sellerId) {
    const products = await Product.find({ seller: sellerId, quantity: { $lt: 5 } })
        .select("name quantity sellingPrice")
        .limit(10)
        .lean();
    if (products.length === 0) return [];

    const seller = await User.findById(sellerId);
    const city = (seller?.shopDetails?.location?.city || seller?.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();

    const leakages = [];
    for (const p of products) {
        // Look up demand for this product's name in the city
        const demand = await DemandForecast.findOne({
            keyword: p.name.toLowerCase().trim(),
            city: new RegExp(`^${city}$`, "i")
        });

        if (demand && demand.predictedDemand30Day > 50) {
            const conversionRate = 0.05; // 5%
            const estimatedLostRevenue = Math.round(demand.predictedDemand30Day * conversionRate * p.sellingPrice);
            
            if (estimatedLostRevenue > 0) {
                leakages.push({
                    productId: p._id,
                    productName: p.name,
                    currentStock: p.quantity,
                    searches30Days: demand.predictedDemand30Day,
                    sellingPrice: p.sellingPrice,
                    estimatedLostRevenue
                });
            }
        }
    }

    return leakages.sort((a, b) => b.estimatedLostRevenue - a.estimatedLostRevenue);
}

/**
 * Compiles search to request to sale conversions.
 */
async function getConversionStats(sellerId) {
    const history = await RevenueHistory.find({ sellerId }).sort({ date: -1 }).limit(14);
    if (history.length === 0) {
        return { searches: 1000, requests: 200, sales: 80, conversionRate: 8 };
    }

    // Sum history
    const totalRequests = history.reduce((s, h) => s + (h.requests || 0), 0);
    const totalSales = history.reduce((s, h) => s + (h.orders || 0), 0);
    
    // Estimate searches based on requests (e.g. 5x requests)
    const estimatedSearches = Math.round(totalRequests * 5.2) || 100;

    const conversionRate = estimatedSearches > 0 ? Math.round((totalSales / estimatedSearches) * 100) : 0;

    return {
        searches: estimatedSearches,
        requests: totalRequests,
        sales: totalSales,
        conversionRate: conversionRate || 5
    };
}

/**
 * Returns Category growth projections for Groceries, Bakery, Electronics, Home Business, Services.
 */
async function getCategoryGrowthAnalysis(sellerId) {
    const seller = await User.findById(sellerId);
    if (!seller) return [];

    const city = (seller.shopDetails?.location?.city || seller.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();

    const categoryStats = await DemandForecast.aggregate([
        { $match: { city: new RegExp(`^${city}$`, "i") } },
        {
            $group: {
                _id: "$category",
                current: { $sum: "$currentDemand" },
                forecast30Days: { $sum: "$predictedDemand30Day" }
            }
        }
    ]);

    const staticMock = [
        { category: "Groceries", current: 850, forecast: 1100, growth: 29 },
        { category: "Bakery", current: 420, forecast: 650, growth: 54 },
        { category: "Electronics", current: 150, forecast: 135, growth: -10 },
        { category: "Home Business", current: 200, forecast: 490, growth: 145 },
        { category: "Services", current: 350, forecast: 480, growth: 37 }
    ];

    if (categoryStats.length === 0) return staticMock;

    return staticMock.map(m => {
        const dbCat = categoryStats.find(c => c._id && c._id.toLowerCase().includes(m.category.toLowerCase().split(' ')[0]));
        if (dbCat) {
            const growth = Math.round(((dbCat.forecast30Days - dbCat.current) / (dbCat.current || 1)) * 100);
            return {
                category: m.category,
                current: dbCat.current,
                forecast: dbCat.forecast30Days,
                growth
            };
        }
        return m;
    });
}

/**
 * Multi-store comparative engine for chain sellers.
 */
async function getMultiStoreIntelligence(sellerId) {
    const shops = await Shop.find({ owner: sellerId });
    if (shops.length === 0) return [];

    // Fetch products stats grouped by shop
    const shopStats = await Product.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
        {
            $group: {
                _id: "$shop",
                totalProducts: { $sum: 1 },
                lowStockCount: {
                    $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] }
                }
            }
        }
    ]);

    // Find orders for this seller
    const orders = await Order.find({
        sellerId,
        status: { $in: ["CONFIRMED", "READY_FOR_PICKUP", "FULFILLED"] }
    }).lean();

    // Map ordered products to shops without fetching the whole catalog
    const orderedProductIds = [];
    orders.forEach(o => {
        o.items.forEach(item => {
            if (item.product) {
                orderedProductIds.push(item.product);
            }
        });
    });

    const orderedProducts = await Product.find({
        _id: { $in: orderedProductIds }
    }).select("_id shop").lean();

    const productShopMap = {};
    orderedProducts.forEach(p => {
        productShopMap[p._id.toString()] = p.shop ? p.shop.toString() : null;
    });

    const storeAnalysis = [];

    for (const shop of shops) {
        const stats = shopStats.find(s => s._id && s._id.toString() === shop._id.toString());
        const totalProducts = stats ? stats.totalProducts : 0;
        const lowStockCount = stats ? stats.lowStockCount : 0;

        // Calculate revenue for items that match shop's products
        let shopRevenue = 0;
        let shopOrders = 0;

        orders.forEach(o => {
            let matchesShop = false;
            o.items.forEach(item => {
                const itemProdId = item.product ? item.product.toString() : "";
                if (productShopMap[itemProdId] === shop._id.toString()) {
                    shopRevenue += (item.price * item.quantity);
                    matchesShop = true;
                }
            });
            if (matchesShop) shopOrders++;
        });

        // Calculate low stock items
        const inventoryHealth = totalProducts > 0 ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100) : 100;

        // Estimate potential opportunity
        const opportunityScore = inventoryHealth < 80 ? Math.round((100 - inventoryHealth) * 250) : 0;

        storeAnalysis.push({
            shopId: shop._id,
            shopName: shop.shopName,
            address: shop.address,
            revenue: shopRevenue || (5000 + Math.round(Math.random() * 15000)), // fallback realistic mock
            ordersCount: shopOrders || (5 + Math.round(Math.random() * 20)),
            inventoryHealth,
            opportunityRevenue: opportunityScore || 3500,
            status: shop.isOpen ? "Active" : "Closed"
        });
    }

    return storeAnalysis.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Generates textual weekly business summaries.
 */
async function generateWeeklySummary(sellerId) {
    const history = await RevenueHistory.find({ sellerId }).sort({ date: -1 }).limit(7);
    if (history.length === 0) {
        return "Weekly summary pending: Additional transaction and order logs are required to compile weekly metrics.";
    }

    const totalWeeklyRevenue = history.reduce((sum, h) => sum + (h.revenue || 0), 0);
    const totalWeeklyOrders = history.reduce((sum, h) => sum + (h.orders || 0), 0);

    const prevHistory = await RevenueHistory.find({ sellerId }).sort({ date: -1 }).skip(7).limit(7);
    const prevWeeklyRevenue = prevHistory.reduce((sum, h) => sum + (h.revenue || 0), 0);

    let growthStr = "stable";
    if (prevWeeklyRevenue > 0) {
        const pct = Math.round(((totalWeeklyRevenue - prevWeeklyRevenue) / prevWeeklyRevenue) * 100);
        growthStr = (pct >= 0 ? "Up " : "Down ") + Math.abs(pct) + "%";
    } else if (totalWeeklyRevenue > 0) {
        growthStr = "Up 100%";
    }

    const leakages = await detectRevenueLeakage(sellerId);
    const topLeakage = leakages.length > 0 ? leakages[0] : null;

    let summaryText = `Your store revenue is ${growthStr} this week, compiling ₹${totalWeeklyRevenue.toLocaleString()} across ${totalWeeklyOrders} processed orders. `;
    if (topLeakage) {
        summaryText += `Estimated revenue leakage of ₹${topLeakage.estimatedLostRevenue.toLocaleString()} was detected due to low stock levels of "${topLeakage.productName}". `;
    }
    summaryText += "Local demand for Protein Powder and Organic snacks continues to grow in Vadodara Rural. Consider expanding your catalog inventory to capture these opportunities.";

    return summaryText;
}

/**
 * Runs the complete revenue intelligence pipeline for a specific seller.
 */
async function runRevenuePipelineForSeller(sellerId) {
    // 1. Seed History if empty
    await seedRevenueMockData(sellerId);
    // 2. Generate Forecasts
    await generateRevenueForecasts(sellerId);
    // 3. Compute Business Health Score
    await calculateBusinessHealth(sellerId);
    // 4. Dispatch Alerts
    await dispatchRevenueAlerts(sellerId);
}

module.exports = {
    aggregateDailyRevenue,
    seedRevenueMockData,
    generateRevenueForecasts,
    calculateBusinessHealth,
    dispatchRevenueAlerts,
    getOpportunityEstimates,
    detectRevenueLeakage,
    getConversionStats,
    getCategoryGrowthAnalysis,
    getMultiStoreIntelligence,
    generateWeeklySummary,
    runRevenuePipelineForSeller
};
