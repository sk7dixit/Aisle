const mongoose = require('mongoose');

const CustomerActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true,
            index: true // e.g. 'view_product', 'view_shop', 'search', 'ai_search', 'wishlist', 'interested', 'request', 'order_purchase'
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
        targetType: {
            type: String // 'Product', 'User', 'Request', etc.
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    }
);

module.exports = mongoose.model('CustomerActivity', CustomerActivitySchema);
