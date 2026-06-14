const mongoose = require("mongoose");

const InventoryForecastSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            index: true
        },
        currentStock: {
            type: Number,
            default: 0
        },
        dailyConsumptionRate: {
            type: Number,
            default: 0
        },
        forecastedDailyConsumption: {
            type: Number,
            default: 0
        },
        daysRemaining: {
            type: Number,
            default: 999
        },
        predictedStockoutDate: {
            type: Date
        },
        riskLevel: {
            type: String,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "OVERSTOCK"],
            default: "LOW"
        },
        recommendedRestockQuantity: {
            type: Number,
            default: 0
        },
        isOverstocked: {
            type: Boolean,
            default: false
        },
        transferOpportunity: {
            fromShopId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Shop"
            },
            fromShopName: String,
            toShopId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Shop"
            },
            toShopName: String,
            quantity: Number
        },
        accuracyScore: {
            type: Number,
            default: 100
        },
        forecastGeneratedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index to support distinct forecasts per product per shop
InventoryForecastSchema.index({ productId: 1, shopId: 1 }, { unique: true });
InventoryForecastSchema.index({ sellerId: 1 });

module.exports = mongoose.model("InventoryForecast", InventoryForecastSchema);
