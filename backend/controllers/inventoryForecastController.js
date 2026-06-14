const InventoryForecast = require("../models/InventoryForecast");
const { snapshotInventory, generateInventoryForecasts } = require("../services/inventoryForecastService");

/**
 * Get inventory forecasts for a seller.
 * GET /api/seller/inventory-forecast or GET /api/inventory-forecast/seller
 */
const getInventoryForecast = async (req, res) => {
    try {
        const forecasts = await InventoryForecast.find({ sellerId: req.user._id })
            .populate("productId", "name category quantity")
            .sort({ daysRemaining: 1 });

        const results = forecasts.map(f => {
            const productName = f.productId ? f.productId.name : "Unknown Product";
            return {
                productId: f.productId ? f.productId._id : null,
                product: productName,
                currentStock: f.currentStock,
                dailyConsumptionRate: parseFloat(f.dailyConsumptionRate.toFixed(2)),
                forecastedDailyConsumption: parseFloat(f.forecastedDailyConsumption.toFixed(2)),
                daysRemaining: f.daysRemaining,
                predictedStockoutDate: f.predictedStockoutDate ? f.predictedStockoutDate.toISOString().split("T")[0] : null,
                risk: f.riskLevel.toLowerCase(),
                riskLevel: f.riskLevel,
                recommendedRestock: f.recommendedRestockQuantity,
                recommendedRestockQuantity: f.recommendedRestockQuantity,
                isOverstocked: f.isOverstocked,
                transferOpportunity: f.transferOpportunity || null,
                accuracyScore: f.accuracyScore
            };
        });

        return res.status(200).json(results);
    } catch (error) {
        console.error("[InventoryForecastController] Error getting inventory forecast:", error);
        return res.status(500).json({ message: "Server error getting inventory forecast" });
    }
};

/**
 * Trigger manual inventory forecasting pipeline (Admin Only).
 * POST /api/inventory-forecast/trigger
 */
const triggerInventoryForecastRun = async (req, res) => {
    try {
        console.log("[InventoryForecastController] Manual inventory forecast run triggered by admin...");
        
        // 1. Record snapshot
        await snapshotInventory();

        // 2. Compute forecasts
        await generateInventoryForecasts();

        return res.status(200).json({ message: "Inventory forecast pipeline run completed successfully." });
    } catch (error) {
        console.error("[InventoryForecastController] Error triggering manual inventory forecast:", error);
        return res.status(500).json({ message: "Server error running inventory forecasting pipeline" });
    }
};

module.exports = {
    getInventoryForecast,
    triggerInventoryForecastRun
};
