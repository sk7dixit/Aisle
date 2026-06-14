const mongoose = require('mongoose');

const supportHistorySchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    issue: {
        type: String, // e.g. "Product not visible to customers"
        required: true
    },
    category: {
        type: String, // e.g. "PRODUCT", "PAYMENTS", "ORDERS"
        required: true,
        index: true
    },
    resolution: {
        type: String, // e.g. "Self-resolved via Smart Guide", "Callback requested"
        default: 'Self-resolved via Smart Guide'
    },
    status: {
        type: String, // e.g. "Resolved", "Open"
        enum: ['Resolved', 'Open'],
        default: 'Resolved',
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SupportHistory', supportHistorySchema);
