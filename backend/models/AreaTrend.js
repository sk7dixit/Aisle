const mongoose = require("mongoose");

const AreaTrendSchema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        area: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        product: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        growth: {
            type: String,
            default: "0%"
        },
        trendScore: {
            type: Number,
            default: 50
        },
        searches: {
            type: Number,
            default: 0
        },
        requests: {
            type: Number,
            default: 0
        },
        orders: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Ensure uniqueness per city, area, and product
AreaTrendSchema.index({ city: 1, area: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("AreaTrend", AreaTrendSchema);
