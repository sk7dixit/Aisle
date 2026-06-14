const mongoose = require('mongoose');

const marketTrendsSchema = new mongoose.Schema({
    area: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    growthRate: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketTrends', marketTrendsSchema);
