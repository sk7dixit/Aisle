const mongoose = require("mongoose");

const SellerIntelligenceSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true
    },
    categories: {
        type: [String],
        default: []
    },
    primaryCategory: {
        type: String,
        default: "General"
    },
    city: {
        type: String,
        default: "indore",
        index: true
    },
    trendAffinity: {
        type: Number,
        default: 0
    },
    inventoryStrength: {
        type: Number,
        default: 0
    },
    responseRate: {
        type: Number,
        default: 0
    },
    demandCoverage: {
        type: Number,
        default: 0
    },
    opportunityScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

SellerIntelligenceSchema.index({ sellerId: 1, city: 1 });

module.exports = mongoose.model("SellerIntelligence", SellerIntelligenceSchema);
