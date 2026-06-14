const mongoose = require('mongoose');

const riskAlertSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    riskType: {
        type: String,
        enum: ['INVENTORY', 'PAYMENT', 'VISIBILITY', 'SALES'],
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    message: {
        type: String,
        required: true
    },
    action: {
        type: String // action tag (e.g. RESTOCK_INVENTORY, OPEN_SHOP, COMPLETE_PAYMENT_SETUP)
    },
    targetId: {
        type: String
    },
    resolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RiskAlert', riskAlertSchema);
