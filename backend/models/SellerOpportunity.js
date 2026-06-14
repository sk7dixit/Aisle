const mongoose = require("mongoose");

const SellerOpportunitySchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true
    },

    product: {
        type: String,
        required: true,
        index: true
    },

    city: {
        type: String,
        required: true,
        index: true
    },

    gapScore: {
        type: Number,
        default: 0
    },

    opportunityLevel: {
        type: String,
        enum: [
            "low",
            "medium",
            "high",
            "very_high"
        ],
        default: "low"
    },

    estimatedDemand: {
        type: String
    }
}, {
    timestamps: true
});

SellerOpportunitySchema.index({ sellerId: 1, opportunityLevel: -1 });

module.exports = mongoose.model("SellerOpportunity", SellerOpportunitySchema);
