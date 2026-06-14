const mongoose = require('mongoose');

const revenueOpportunitiesSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    opportunity: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['DEMAND_GAP', 'PRICING', 'MERCHANDISING', 'RETENTION', 'SEASONAL'],
        required: true
    },
    estimatedRevenue: {
        type: Number,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    resolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RevenueOpportunities', revenueOpportunitiesSchema);
