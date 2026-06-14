const mongoose = require('mongoose');

const GrowthInsightSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['product_expansion', 'category_expansion', 'area_expansion', 'growth_opportunity', 'other'],
        default: 'growth_opportunity',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        index: true
    },
    opportunity: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    estimatedRevenueLift: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GrowthInsight', GrowthInsightSchema);
