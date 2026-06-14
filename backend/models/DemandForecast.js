const mongoose = require("mongoose");

const DemandForecastSchema = new mongoose.Schema(
    {
        keyword: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        city: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        category: {
            type: String,
            default: "Grocery",
            index: true
        },
        currentDemand: {
            type: Number,
            default: 0
        },
        predictedDemand1Day: {
            type: Number,
            default: 0
        },
        predictedDemand7Day: {
            type: Number,
            default: 0
        },
        predictedDemand30Day: {
            type: Number,
            default: 0
        },
        confidenceScore: {
            type: Number,
            default: 100
        },
        trendDirection: {
            type: String,
            enum: ["UP", "DOWN", "STABLE", "SPIKE", "DECLINE"],
            default: "STABLE"
        },
        momentumScore: {
            type: Number,
            default: 0
        },
        accuracyScore: {
            type: Number,
            default: 100
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound index to quickly fetch forecasts for a specific keyword and city
DemandForecastSchema.index({ keyword: 1, city: 1 }, { unique: true });
// Index on city for seller-specific searches
DemandForecastSchema.index({ city: 1 });

module.exports = mongoose.model("DemandForecast", DemandForecastSchema);
