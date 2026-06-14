const mongoose = require("mongoose");

const RevenueForecastSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        currentRevenue: {
            type: Number,
            default: 0
        },
        predictedRevenue7Days: {
            type: Number,
            default: 0
        },
        predictedRevenue30Days: {
            type: Number,
            default: 0
        },
        predictedRevenue90Days: {
            type: Number,
            default: 0
        },
        growthRate: {
            type: Number,
            default: 0
        },
        confidenceScore: {
            type: Number,
            default: 100
        },
        growthPrediction: {
            type: String,
            enum: ["high_growth", "stable", "declining"],
            default: "stable"
        },
        forecastDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RevenueForecast", RevenueForecastSchema);
