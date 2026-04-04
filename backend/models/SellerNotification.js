const mongoose = require('mongoose');

const sellerNotificationSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    source: {
        type: String,
        enum: ['ADMIN', 'SYSTEM', 'CUSTOMER'],
        required: true
    },
    type: {
        type: String,
        required: true,
        // Detailed enum enforcement will happen at service level, 
        // but we can list them here for DB integrity too
    },
    priority: {
        type: String,
        enum: ['CRITICAL', 'IMPORTANT', 'INFO'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    actionLink: {
        type: String
    },
    actionLabel: String,
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerNotification', sellerNotificationSchema);
