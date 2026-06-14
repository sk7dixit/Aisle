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
        default: 0,
        alias: 'countInStock'
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
        enum: ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK', 'AVAILABLE', 'UNAVAILABLE'],
        default: 'IN_STOCK'
    },
    availability: {
        type: String,
        enum: ['AVAILABLE', 'UNAVAILABLE'],
        default: 'AVAILABLE'
    },
    lastConfirmedAt: {
        type: Date,
        default: Date.now
    },
    onlineSalesCount: {
        type: Number,
        default: 0
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
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Import shared stock logic
const { calculateStockStatus } = require('../utils/stockUtils');

// Auto calculate stock status before save
sellerProductSchema.pre('save', async function () {
    const isExcludedShop = this.shopType === 'HOME_BUSINESS' || this.shopType === 'SERVICES';
    if (!isExcludedShop) {
        if (this.quantity <= 0) {
            this.availability = 'UNAVAILABLE';
        }
        this.stockStatus = this.availability === 'AVAILABLE' ? 'IN_STOCK' : 'OUT_OF_STOCK';
    } else {
        if (this.isModified('quantity')) {
            this.stockStatus = calculateStockStatus(this.quantity);
        }
    }
});

// Composite index to prevent duplicate linking of same variant by same seller
sellerProductSchema.index({ seller: 1, variant: 1 }, { unique: true });
sellerProductSchema.index({ category: 1, subCategory: 1, availability: 1 }); // Compound index
sellerProductSchema.index({ seller: 1, stockStatus: 1 }); // Compound index

const excludeDeleted = function () {
    this.where({ deleted: { $ne: true } });
};

sellerProductSchema.pre('find', excludeDeleted);
sellerProductSchema.pre('findOne', excludeDeleted);
sellerProductSchema.pre('findOneAndUpdate', excludeDeleted);
sellerProductSchema.pre('countDocuments', excludeDeleted);

module.exports = mongoose.model('SellerProduct', sellerProductSchema);
