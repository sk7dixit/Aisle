const mongoose = require("mongoose");

const SellerRecommendationSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["inventory_opportunity", "restock_prediction", "trending_spike"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        default: 0
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    estimatedRevenue: {
        type: Number,
        default: 0
    },
    competitorInsights: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "ignored"],
        default: "pending",
        index: true
    }
}, {
    timestamps: true
});

SellerRecommendationSchema.index({ sellerId: 1, status: 1 });
SellerRecommendationSchema.index({ sellerId: 1, product: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("SellerRecommendation", SellerRecommendationSchema);
