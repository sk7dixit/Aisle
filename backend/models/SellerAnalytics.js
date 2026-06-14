const mongoose = require('mongoose');

const sellerAnalyticsSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    totalProducts: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    topCategory: {
        type: String,
        default: 'General'
    },
    topProduct: {
        type: String,
        default: 'None'
    },
    lowStockCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerAnalytics', sellerAnalyticsSchema);
