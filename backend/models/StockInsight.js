const mongoose = require('mongoose');

const stockInsightSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['RISK', 'TREND', 'EXPIRY', 'RESTOCK'],
        default: 'TREND'
    },
    confidence: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    context: {
        type: String,
        default: 'Based on recent activity'
    },
    feedback: {
        type: String,
        enum: ['Helpful', 'Not Useful'],
        default: null
    },
    isDismissed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockInsight', stockInsightSchema);
