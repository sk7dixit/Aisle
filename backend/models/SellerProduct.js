const mongoose = require('mongoose');

const sellerProductSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant',
        required: true,
        index: true
    },
    // We can denormalize some fields for faster read if needed, 
    // but for now let's keep it normalized to rely on Master.

    // Unified Stock Fields (Matching Product.js)
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    shopType: {
        type: String,
        required: true,
        default: 'Grocery / Kirana' // Fallback
    },
    category: {
        type: String,
        required: true,
        default: 'Grocery'
    },
    subCategory: {
        type: String,
        required: true,
        default: 'General'
    },
    mrp: {
        type: Number,
        required: true,
        default: 0
    },
    sellingPrice: {
        type: Number,
        required: true,
        default: 0
    },
    stockStatus: {
        type: String,
        enum: ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK'],
        default: 'IN_STOCK'
    },
    productType: {
        type: String,
        enum: ['STANDARD', 'DAILY_ESSENTIAL', 'EXPIRY_BASED'],
        default: 'STANDARD',
        required: true
    },
    expiryDate: {
        type: Date
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Import shared stock logic
const { calculateStockStatus } = require('../utils/stockUtils');

// Auto calculate stock status before save
sellerProductSchema.pre('save', function (next) {
    if (this.isModified('quantity')) {
        this.stockStatus = calculateStockStatus(this.quantity);
    }
    next();
});

// Composite index to prevent duplicate linking of same variant by same seller
sellerProductSchema.index({ seller: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model('SellerProduct', sellerProductSchema);
