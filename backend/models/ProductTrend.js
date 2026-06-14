const mongoose = require("mongoose");

const ProductTrendSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        index: true
    },

    city: {
        type: String,
        default: "global",
        index: true
    },

    searchCount: {
        type: Number,
        default: 0
    },

    clickCount: {
        type: Number,
        default: 0
    },

    uniqueUsers: {
        type: Number,
        default: 0
    },

    trendScore: {
        type: Number,
        default: 0
    },

    growthPercentage: {
        type: Number,
        default: 0
    },

    demandLevel: {
        type: String,
        enum: [
            "low",
            "medium",
            "high",
            "very_high"
        ],
        default: "low"
    }
}, {
    timestamps: true
});

ProductTrendSchema.index({ keyword: 1, city: 1, createdAt: -1 });

module.exports = mongoose.model("ProductTrend", ProductTrendSchema);
