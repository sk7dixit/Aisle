const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const Shop = require("../models/Shop");
const DemandForecast = require("../models/DemandForecast");
const InventoryHistory = require("../models/InventoryHistory");
const InventoryForecast = require("../models/InventoryForecast");
const SellerNotification = require("../models/SellerNotification");

// Season helper
const getSeasonForMonth = (month) => {
    if (month >= 3 && month <= 6) return "summer";
    if (month >= 7 && month <= 9) return "monsoon";
    return "winter";
};

/**
 * Seeds 14 days of historical stock level snapshots for all active products.
 * Simulates a steady consumption drop to ensure a calculable rate.
 */
async function seedMockInventoryHistory() {
    try {
        const count = await InventoryHistory.countDocuments();
        if (count > 0) {
            console.log("[InventoryForecastService] Inventory history already populated. Skipping seeding.");
            return;
        }

        console.log("[InventoryForecastService] Seeding 14 days of mock stock levels...");

        const shops = await Shop.find().select("owner");
        const sellerIds = shops.map(s => s.owner).filter(Boolean);

        const products = await Product.find({ 
            isAvailable: { $ne: false },
            seller: { $in: sellerIds }
        }).populate("seller");

        if (products.length === 0) {
            console.log("[InventoryForecastService] No active products found to seed history for.");
            return;
        }

        const dates = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d);
        }

        const historyDocs = [];

        for (const p of products) {
            if (!p.seller) continue;
            const nameLower = p.name.toLowerCase();
            
            // Set daily consumption rates based on keyword matching
            let rate = 2; // default
            if (nameLower.includes("protein powder")) rate = 8;
            else if (nameLower.includes("cold coffee")) rate = 5;
            else if (nameLower.includes("energy drink")) rate = 10;

            const currentStock = p.quantity;

            // Seed 14 days of stock history leading up to today
            for (let i = 0; i <= 14; i++) {
                const daysRemaining = 14 - i;
                const stockLevel = currentStock + (daysRemaining * rate);

                historyDocs.push({
                    sellerId: p.seller._id,
                    productId: p._id,
                    shopId: p.shop || null,
                    stockLevel,
                    timestamp: dates[i]
                });
            }
        }

        if (historyDocs.length > 0) {
            await InventoryHistory.insertMany(historyDocs);
            console.log(`[InventoryForecastService] Successfully seeded ${historyDocs.length} stock history records.`);
        }
    } catch (error) {
        console.error("[InventoryForecastService] Error seeding mock inventory history:", error);
    }
}

/**
 * Daily Stock Snapshot Aggregator
 * Captures current quantity of all active products and inserts into history.
 */
async function snapshotInventory() {
    try {
        console.log("[InventoryForecastService] Recording daily stock snapshots...");
        const shops = await Shop.find().select("owner");
        const sellerIds = shops.map(s => s.owner).filter(Boolean);

        const products = await Product.find({ 
            isAvailable: { $ne: false },
            seller: { $in: sellerIds }
        });
        
        const snapshots = products.map(p => ({
            sellerId: p.seller,
            productId: p._id,
            shopId: p.shop || null,
            stockLevel: p.quantity,
            timestamp: new Date()
        }));

        if (snapshots.length > 0) {
            await InventoryHistory.insertMany(snapshots);
            console.log(`[InventoryForecastService] Saved ${snapshots.length} stock snapshots.`);
        }
    } catch (error) {
        console.error("[InventoryForecastService] Error running inventory snapshot:", error);
        throw error;
    }
}

/**
 * Computes consumption rates, merges demand forecast, applies seasonal adjustments,
 * flags risk levels/overstock, runs multi-store transfers, and generates alerts.
 */
async function generateInventoryForecasts() {
    try {
        // Run history seeder if empty
        await seedMockInventoryHistory();

        console.log("[InventoryForecastService] Generating inventory forecasts...");

        const shops = await Shop.find().select("owner");
        const sellerIds = shops.map(s => s.owner).filter(Boolean);

        const products = await Product.find({ 
            isAvailable: { $ne: false },
            seller: { $in: sellerIds }
        }).populate("seller");

        const currentMonth = new Date().getMonth() + 1;
        const currentSeason = getSeasonForMonth(currentMonth);

        const forecastsGenerated = [];

        for (const p of products) {
            const seller = p.seller;
            if (!seller) continue;
            const sellerCity = (seller?.shopDetails?.location?.city || seller?.shopDetails?.shopLocation?.city || "Indore").trim().toLowerCase();

            // 1. Fetch past 14 days of inventory history for this product
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 15);

            const history = await InventoryHistory.find({
                productId: p._id,
                timestamp: { $gte: dateLimit }
            }).sort({ timestamp: 1 });

            // 2. Compute Daily Consumption Rate
            let dailyConsumptionRate = 0;
            if (history.length > 1) {
                let totalDrops = 0;
                for (let i = 1; i < history.length; i++) {
                    const diff = history[i - 1].stockLevel - history[i].stockLevel;
                    if (diff > 0) {
                        totalDrops += diff;
                    }
                }
                const firstTime = history[0].timestamp.getTime();
                const lastTime = history[history.length - 1].timestamp.getTime();
                const daysDiff = (lastTime - firstTime) / (1000 * 60 * 60 * 24);
                
                dailyConsumptionRate = totalDrops / (daysDiff || 1);
            }

            // Fallback: If no drops, but product has sold before
            if (dailyConsumptionRate === 0 && p.onlineSalesCount > 0) {
                dailyConsumptionRate = p.onlineSalesCount / 30; // estimate over 30 days
            }

            // 3. Apply Demand-Adjusted Multiplier
            let demandGrowthFactor = 1.0;
            const normalizedKeyword = p.name.trim().toLowerCase();

            const demandForecast = await DemandForecast.findOne({
                keyword: normalizedKeyword,
                city: new RegExp(`^${sellerCity}$`, "i")
            });

            if (demandForecast && demandForecast.momentumScore) {
                demandGrowthFactor = 1 + (demandForecast.momentumScore / 100);
            }

            let forecastedDailyConsumption = dailyConsumptionRate * demandGrowthFactor;

            // 4. Apply Seasonal Adjustments
            const nameLower = p.name.toLowerCase();
            const categoryLower = (p.category || "").toLowerCase();

            // Summer seasonal multiplier (1.5x)
            if (currentSeason === "summer") {
                if (nameLower.includes("coffee") || nameLower.includes("drink") || nameLower.includes("cold") || nameLower.includes("ice cream")) {
                    forecastedDailyConsumption *= 1.5;
                }
            }
            // Monsoon seasonal multiplier (1.5x)
            else if (currentSeason === "monsoon") {
                if (nameLower.includes("umbrella") || nameLower.includes("raincoat") || nameLower.includes("rainy") || categoryLower.includes("seasonal")) {
                    forecastedDailyConsumption *= 1.5;
                }
            }
            // Diwali seasonal multiplier (2.0x)
            else if (currentMonth === 10 || currentMonth === 11) {
                if (nameLower.includes("sweet") || nameLower.includes("decor") || nameLower.includes("diya") || nameLower.includes("cracker") || nameLower.includes("gift")) {
                    forecastedDailyConsumption *= 2.0;
                }
            }

            // Ensure consumption is non-negative
            forecastedDailyConsumption = Math.max(0, forecastedDailyConsumption);

            // 5. Calculate Forecast Parameters
            const currentStock = p.quantity;
            let daysRemaining = 999;
            if (forecastedDailyConsumption > 0) {
                daysRemaining = currentStock / forecastedDailyConsumption;
            }

            daysRemaining = Math.round(daysRemaining);

            const predictedStockoutDate = new Date();
            predictedStockoutDate.setDate(predictedStockoutDate.getDate() + daysRemaining);

            const recommendedRestockQuantity = Math.max(0, Math.round((forecastedDailyConsumption * 30) - currentStock));

            // Flag Overstock
            const isOverstocked = daysRemaining > 90 && dailyConsumptionRate > 0;

            // Determine Risk Level
            let riskLevel = "LOW";
            if (isOverstocked) riskLevel = "OVERSTOCK";
            else if (daysRemaining < 7) riskLevel = "CRITICAL";
            else if (daysRemaining <= 14) riskLevel = "HIGH";
            else if (daysRemaining <= 30) riskLevel = "MEDIUM";

            // Save/Update Forecast Record
            const forecast = await InventoryForecast.findOneAndUpdate(
                { productId: p._id, shopId: p.shop || null },
                {
                    $set: {
                        sellerId: seller._id,
                        currentStock,
                        dailyConsumptionRate,
                        forecastedDailyConsumption,
                        daysRemaining,
                        predictedStockoutDate,
                        riskLevel,
                        recommendedRestockQuantity,
                        isOverstocked,
                        forecastGeneratedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            // 6. Restock Alert Dispatch (Trigger when daysRemaining < 10)
            if (daysRemaining < 10 && riskLevel !== "OVERSTOCK") {
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);

                const existingAlert = await SellerNotification.findOne({
                    sellerId: seller._id,
                    type: "RESTOCK_ALERT",
                    createdAt: { $gte: todayStart },
                    message: new RegExp(p.name, "i")
                });

                if (!existingAlert) {
                    await SellerNotification.create({
                        sellerId: seller._id,
                        source: "SYSTEM",
                        type: "RESTOCK_ALERT",
                        priority: "CRITICAL",
                        title: "Critical Stockout Alert",
                        message: `${p.name} is predicted to run out of stock in ${daysRemaining} days. Recommended restock: ${recommendedRestockQuantity} units.`
                    }).catch(e => console.error(`[InventoryForecastService] Failed to create restock notification: ${e.message}`));
                }
            }

            forecastsGenerated.push(forecast);
        }

        // 7. Multi-Store Transfer Recommendations
        console.log("[InventoryForecastService] Running multi-store transfer optimization...");
        const sellers = await User.find({ role: "seller" });

        for (const s of sellers) {
            // Find all forecasts for this seller
            const sellerForecasts = await InventoryForecast.find({ sellerId: s._id }).populate("productId");
            
            // Group forecasts by product name/variant name
            const productGroups = {};
            sellerForecasts.forEach(f => {
                const name = f.productId?.name.trim().toLowerCase();
                if (!name) return;
                if (!productGroups[name]) {
                    productGroups[name] = [];
                }
                productGroups[name].push(f);
            });

            // Analyze each group for transfer opportunities
            for (const [name, list] of Object.entries(productGroups)) {
                if (list.length < 2) continue; // Multi-store transfers require at least 2 locations

                // Find overstocked locations and critical locations
                const overstockedLocs = list.filter(f => f.isOverstocked && f.currentStock > 0);
                const criticalLocs = list.filter(f => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH");

                if (overstockedLocs.length > 0 && criticalLocs.length > 0) {
                    const source = overstockedLocs[0];
                    const target = criticalLocs[0];

                    // Surplus stock in source = Current Stock - (30 days coverage)
                    const surplus = Math.max(0, Math.round(source.currentStock - (source.forecastedDailyConsumption * 30)));
                    // Deficit in target = Recommended Restock
                    const deficit = target.recommendedRestockQuantity;

                    const transferQty = Math.min(surplus, deficit);

                    if (transferQty > 0 && source.shopId && target.shopId) {
                        const fromShop = await Shop.findById(source.shopId).select("shopName");
                        const toShop = await Shop.findById(target.shopId).select("shopName");

                        const fromName = fromShop ? fromShop.shopName : "Shop A";
                        const toName = toShop ? toShop.shopName : "Shop B";

                        // Update target forecast with transfer opportunity recommendation
                        await InventoryForecast.updateOne(
                            { _id: target._id },
                            {
                                $set: {
                                    transferOpportunity: {
                                        fromShopId: source.shopId,
                                        fromShopName: fromName,
                                        toShopId: target.shopId,
                                        toShopName: toName,
                                        quantity: transferQty
                                    }
                                }
                            }
                        );
                        console.log(`[InventoryForecastService] Multi-store transfer opportunity: Move ${transferQty} units of "${name}" from ${fromName} to ${toName}.`);
                    }
                }
            }
        }

        console.log(`[InventoryForecastService] Successfully finished generation for ${forecastsGenerated.length} items.`);
    } catch (error) {
        console.error("[InventoryForecastService] Error generating forecasts:", error);
        throw error;
    }
}

/**
 * Tracks and evaluates prediction accuracy.
 * Compares predicted out of stock date vs actual out of stock date when quantity drops to 0.
 */
async function evaluateInventoryAccuracy(productId, shopId) {
    try {
        console.log(`[InventoryForecastService] Running accuracy assessment for product: ${productId}...`);
        
        const forecast = await InventoryForecast.findOne({ productId, shopId });
        if (!forecast || !forecast.predictedStockoutDate) return;

        const actualDate = new Date();
        const predictedDate = forecast.predictedStockoutDate;

        const genTime = forecast.forecastGeneratedAt.getTime();
        const predTime = predictedDate.getTime();
        const actTime = actualDate.getTime();

        const predictedDaysFromGen = Math.round((predTime - genTime) / (1000 * 60 * 60 * 24));
        const actualDaysFromGen = Math.round((actTime - genTime) / (1000 * 60 * 60 * 24));

        let accuracyScore = 100;
        if (actualDaysFromGen > 0) {
            const error = Math.abs(actualDaysFromGen - predictedDaysFromGen);
            accuracyScore = Math.max(0, Math.round(100 - (error / actualDaysFromGen) * 100));
        } else {
            accuracyScore = predictedDaysFromGen === 0 ? 100 : 0;
        }

        await InventoryForecast.updateOne(
            { _id: forecast._id },
            { $set: { accuracyScore } }
        );
        console.log(`[InventoryForecastService] Product ${productId} hit 0 stock. Forecast accuracy scored at ${accuracyScore}%`);
    } catch (error) {
        console.error("[InventoryForecastService] Error evaluating inventory accuracy:", error);
    }
}

module.exports = {
    seedMockInventoryHistory,
    snapshotInventory,
    generateInventoryForecasts,
    evaluateInventoryAccuracy
};
