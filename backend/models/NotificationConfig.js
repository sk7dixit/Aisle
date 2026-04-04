const mongoose = require('mongoose');

const notificationConfigSchema = new mongoose.Schema({
    configId: { type: String, required: true, unique: true, default: 'GLOBAL_CONFIG' },
    channels: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        push: { type: Boolean, default: false }
    },
    events: {
        seller_verification: {
            enabled: { type: Boolean, default: true },
            channels: [{ type: String }], // 'email', 'inApp', etc.
            priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'normal' },
            delay: { type: String, enum: ['instant', 'batched'], default: 'instant' }
        },
        product_disabled: {
            enabled: { type: Boolean, default: true },
            channels: [{ type: String }],
            priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'important' },
            delay: { type: String, enum: ['instant', 'batched'], default: 'instant' }
        },
        report_resolved: {
            enabled: { type: Boolean, default: true },
            channels: [{ type: String }],
            priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'normal' },
            delay: { type: String, enum: ['instant', 'batched'], default: 'batched' }
        },
        shop_suspended: {
            enabled: { type: Boolean, default: true },
            channels: [{ type: String }],
            priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'critical' },
            delay: { type: String, enum: ['instant', 'batched'], default: 'instant' }
        },
        system_alert: {
            enabled: { type: Boolean, default: true },
            channels: [{ type: String }],
            priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'critical' },
            delay: { type: String, enum: ['instant', 'batched'], default: 'instant' }
        }
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('NotificationConfig', notificationConfigSchema);
