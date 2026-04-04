const mongoose = require('mongoose');

const subscriptionLogSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['UPGRADE', 'DOWNGRADE', 'RENEWAL', 'EXPIRY', 'BOOST_ACTIVATED', 'BOOST_EXPIRED'],
        required: true
    },
    oldPlan: {
        type: String,
        required: true
    },
    newPlan: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: 'Manual Update' // or "Payment Success", "Auto Expiry"
    },
    meta: {
        type: Object, // Store any extra payment IDs or details
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SubscriptionLog', subscriptionLogSchema);
