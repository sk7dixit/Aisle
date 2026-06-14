const mongoose = require('mongoose');

const PricingIntelligenceSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    recommendedPrice: {
        type: Number,
        required: true
    },
    minPrice: {
        type: Number,
        required: true
    },
    maxPrice: {
        type: Number,
        required: true
    },
    confidence: {
        type: Number,
        default: 85
    },
    reasoning: {
        type: String
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PricingIntelligence', PricingIntelligenceSchema);
