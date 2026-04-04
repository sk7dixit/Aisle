const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const sellerAccountDetailsSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    acceptsOnlinePayment: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', null],
        default: null
    },
    upiId: {
        type: String,
        default: null,
        // Custom setter to encrypt when saving
        set: (v) => v ? encrypt(v) : null
    },
    paymentDisplayName: {
        type: String,
        default: null
    },
    paymentSetupCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Utility to get decrypted UPI ID (not used for average fetch, only when strictly needed)
sellerAccountDetailsSchema.methods.getDecryptedUpiId = function () {
    return this.upiId ? decrypt(this.upiId) : null;
};

// Virtual for masked UPI ID (Safe to send to frontend/admin)
sellerAccountDetailsSchema.virtual('maskedUpiId').get(function () {
    if (!this.upiId) return null;
    const decrypted = decrypt(this.upiId);
    if (!decrypted || !decrypted.includes('@')) return decrypted; // Error fallback

    const [handle, domain] = decrypted.split('@');
    if (handle.length <= 2) return `**@${domain}`;
    return `${handle.substring(0, 2)}***@${domain}`;
});

const SellerAccountDetails = mongoose.model('SellerAccountDetails', sellerAccountDetailsSchema);

module.exports = SellerAccountDetails;
