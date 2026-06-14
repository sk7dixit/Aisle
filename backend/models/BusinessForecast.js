const mongoose = require('mongoose');

const businessForecastSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
        index: true
    },
    predictedDemand: {
        type: Number,
        required: true
    },
    recommendedStock: {
        type: Number,
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    forecastDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BusinessForecast', businessForecastSchema);
