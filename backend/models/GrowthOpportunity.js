const mongoose = require('mongoose');

const growthOpportunitySchema = mongoose.Schema({
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
        enum: ['DEMAND', 'MISSED_REVENUE', 'SEASONAL', 'TRENDS'],
        required: true
    },
    estimatedImpact: {
        type: Number, // Percentage value (e.g. 18 for +18%)
        required: true,
        default: 0
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

module.exports = mongoose.model('GrowthOpportunity', growthOpportunitySchema);
