const mongoose = require('mongoose');

const notificationCooldownSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notificationType: {
        type: String,
        required: true
    },
    entityId: {
        type: String, // e.g. productId, orderId (optional)
        default: 'GLOBAL'
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    }
});

// Composite index for fast lookup per seller, type, and specific entity (like a product)
notificationCooldownSchema.index({ sellerId: 1, notificationType: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationCooldown', notificationCooldownSchema);
