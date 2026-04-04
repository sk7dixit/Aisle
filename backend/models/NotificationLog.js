const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    event: { type: String, required: true }, // e.g. 'seller_verification', 'system_alert'
    recipient: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: { type: String }
    },
    channel: { type: String, required: true }, // 'email', 'inApp', 'push'
    status: { type: String, enum: ['sent', 'failed', 'queued'], default: 'queued' },
    metadata: { type: Object }, // Any extra info like error message or subject
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
