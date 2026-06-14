const mongoose = require('mongoose');

const SellerGrowthProfileSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    growthScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    weeklyGrowthPlan: {
        type: [String],
        default: []
    },
    metrics: {
        revenueGrowth: { type: Number, default: 70 },
        trendCoverage: { type: Number, default: 75 },
        inventoryHealth: { type: Number, default: 80 },
        expansionPotential: { type: Number, default: 65 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerGrowthProfile', SellerGrowthProfileSchema);
