const mongoose = require('mongoose');

const requestSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sellerShopName: {
        type: String
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    customerName: {
        type: String
    },
    status: {
        type: String,
        // STRICT ENUM MIGRATION
        enum: ['PENDING', 'AUTO_ACCEPTED', 'REJECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED',
            // Legacy fallbacks until migration complete
            'pending', 'PENDING_CONFIRMATION', 'SELLER_CONFIRMED', 'SYSTEM_CONFIRMED', 'expired', 'confirmed', 'completed', 'cancelled'],
        default: 'PENDING'
    },
    type: {
        type: String,
        enum: ['PAY_ON_VISIT', 'PAY_NOW'],
        default: 'PAY_ON_VISIT'
    },
    confirmationType: {
        type: String,
        enum: ['SELLER', 'SYSTEM', null],
        default: null
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 2 * 60 * 1000), // Default 2 minutes
        index: true
    },
    // Optional: Keep visitToken if we want to use it for the "Purchase Confirmed" flow later
    visitToken: {
        type: String
    },
    quantitySold: {
        type: Number,
        default: 0
    },
    confirmedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
