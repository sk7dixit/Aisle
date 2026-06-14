const mongoose = require('mongoose');

const fraudEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['multi_account_abuse', 'promotion_abuse', 'spam_requests', 'duplicate_seller', 'fake_reviews', 'inventory_fraud'],
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending_moderation', 'approved', 'dismissed'],
        default: 'pending_moderation',
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FraudEvent', fraudEventSchema);
