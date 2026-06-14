const mongoose = require('mongoose');
const CATEGORIES = require('../config/categories');

const productSchema = mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Legacy support?
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop'
        },
        name: {
            type: String,
            required: true,
            index: 'text' // Individual index
        },
        shopType: {
            type: String,
            required: true,
        },
        // NEW: Strict Category Slug
        categorySlug: {
            type: String,
            required: true,
            index: true,
            validate: {
                validator: function (v) {
                    return true;
                },
                message: props => `${props.value} is not a valid category slug!`
            }
        },
        // Visual Label (Can be derived, but stored for easy query)
        category: {
            type: String,
            required: true,
        },
        subCategory: {
            type: String,
            required: true,
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
        unit: {
            type: String,
            required: true,
            default: 'Piece'
        },
        // Step 6: Inventory Type for Grocery Realism
        inventoryType: {
            type: String,
            enum: ['COUNTABLE', 'LOOSE', 'DAILY'],
            default: 'COUNTABLE'
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            alias: 'countInStock'
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
        initialStock: {
            type: Number,
            default: 0
        },
        // NEW: Baseline Stock (The "Full" Level Reference)
        baselineStock: {
            type: Number,
            default: 0
        },
        lowStockThreshold: {
            type: Number
        },
        needsReview: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            index: 'text' // Individual index part
        },
        brand: {
            type: String
        },
        variant: {
            type: String
        },
        packSize: {
            type: String
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
        imageUrl: {
            type: String,
            default: 'https://via.placeholder.com/150'
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        homeBusinessType: {
            type: String,
            enum: ['READY_STOCK', 'MADE_TO_ORDER'],
            default: 'READY_STOCK'
        },
        preparationTime: {
            type: String,
            default: ''
        },
        productStory: {
            type: String,
            default: ''
        },
        images: {
            type: [String],
            default: []
        },
        isDraft: {
            type: Boolean,
            default: false
        },
        // Admin Governance
        adminStatus: {
            type: String,
            enum: ['Active', 'Flagged', 'Disabled'],
            default: 'Active'
        },
        flagReason: {
            type: String,
            default: null
        },
        parentProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null
        },
        isParent: {
            type: Boolean,
            default: false
        },
        identityHash: {
            type: String,
            index: true
        },
        // Catalog Reference
        catalogProductId: {
            type: String,
            default: null
        },
        source: {
            type: String,
            enum: ['manual', 'catalog', 'bulk', 'image', 'voice'],
            default: 'manual'
        },
        // NEW: Inventory Logic for Grocery/Kirana
        // NEW: Inventory Logic for Grocery/Kirana
        restockType: {
            type: String,
            enum: ['DAILY', 'PERIODIC', 'MANUAL'],
            default: 'MANUAL'
        },
        // NEW: Service Inventory Logic
        dailyCapacity: {
            type: Number,
            default: 0
        },
        bookedCount: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0,
            index: true
        },
        reservedCount: {
            type: Number,
            default: 0
        },
        isOpen: {
            type: Boolean,
            default: true,
            index: true
        },
        version: {
            type: Number,
            default: 1
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        optimisticConcurrency: true
    }
);

const { calculateStockStatus } = require('../utils/stockUtils');

// Auto calculate stock status before save
productSchema.pre('save', async function () {
    if (this.isModified('quantity') || this.isModified('sellingPrice') || this.isModified('price') || this.isModified('isOpen') || this.isModified('deleted') || this.isModified('stockStatus')) {
        this.version = (this.version || 0) + 1;
    }

    // Sync imageUrl to the first of images array if populated
    if (this.images && this.images.length > 0 && (!this.imageUrl || this.imageUrl === 'https://via.placeholder.com/150')) {
        this.imageUrl = this.images[0];
    }

    // 1. Initialize Baseline if missing (Migration/New)
    if (this.baselineStock === undefined || (this.isNew && !this.baselineStock)) {
        this.baselineStock = this.quantity || 0;
    }

    // 2. Initial Stock is History Only (Set once)
    if (this.isNew && !this.initialStock) {
        this.initialStock = this.quantity || 0;
    }

    // 3. Calculate Status and Availability
    const isExcludedShop = this.shopType === 'HOME_BUSINESS' || this.shopType === 'SERVICES';
    if (!isExcludedShop) {
        if (this.quantity <= 0) {
            this.availability = 'UNAVAILABLE';
        }
        // Sync stockStatus for legacy support
        this.stockStatus = this.availability === 'AVAILABLE' ? 'IN_STOCK' : 'OUT_OF_STOCK';
    } else {
        if (this.isModified('quantity') || this.isModified('baselineStock')) {
            this.stockStatus = calculateStockStatus(this.quantity, this.baselineStock);
        }
    }
});

// NEW: Explicit Available Stock
productSchema.virtual('availableStock').get(function () {
    return Math.max(0, (this.quantity || 0) - (this.reservedCount || 0));
});

// Add indices for performance
productSchema.index({ seller: 1 });
productSchema.index({ seller: 1, createdAt: -1 }); // Optimize sorting by createdAt
productSchema.index({ seller: 1, subCategory: 1, createdAt: -1 }); // Optimize category + sort
productSchema.index({ categorySlug: 1 }); // Optimize category lookup
productSchema.index({ category: 1, subCategory: 1, availability: 1 }); // Compound index
productSchema.index({ seller: 1, stockStatus: 1 }); // Compound index
productSchema.index({ categorySlug: 1, stockStatus: 1, isOpen: 1 }); // Optimized compound index
productSchema.index({ category: 1, stockStatus: 1, isOpen: 1 }); // Optimized compound index
productSchema.index({ seller: 1, stockStatus: 1, isOpen: 1 }); // Optimized compound index
// Composite text index
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ categorySlug: 1, isAvailable: 1, isDraft: 1, adminStatus: 1 });

const excludeDeleted = function () {
    this.where({ deleted: { $ne: true } });
};

productSchema.pre('find', excludeDeleted);
productSchema.pre('findOne', excludeDeleted);
productSchema.pre('findOneAndUpdate', excludeDeleted);
productSchema.pre('countDocuments', excludeDeleted);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
