const mongoose = require('mongoose');

const HistoricalEventImpactSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        index: true
    },
    product: {
        type: String,
        required: true,
        index: true
    },
    demandIncrease: {
        type: Number, // Percentage increase, e.g. 280 for +280%
        required: true
    },
    year: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HistoricalEventImpact', HistoricalEventImpactSchema);
