const mongoose = require('mongoose');

const RecommendationAnalyticsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        recommendationType: {
            type: String,
            required: true,
            enum: ['product', 'shop', 'bundle', 'predictive']
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        action: {
            type: String,
            required: true,
            enum: ['shown', 'clicked', 'requested', 'converted'],
            index: true
        },
        revenueImpact: {
            type: Number,
            default: 0
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    }
);

module.exports = mongoose.model('RecommendationAnalytics', RecommendationAnalyticsSchema);
