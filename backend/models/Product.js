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
                    return CATEGORIES.some(c => c.id === v);
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
            default: 0
        },
        stockStatus: {
            type: String,
            enum: ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK'],
            default: 'IN_STOCK'
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
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const { calculateStockStatus } = require('../utils/stockUtils');

// Auto calculate stock status before save
productSchema.pre('save', async function () {
    // 1. Initialize Baseline if missing (Migration/New)
    if (this.baselineStock === undefined || (this.isNew && !this.baselineStock)) {
        this.baselineStock = this.quantity || 0;
    }

    // 2. Initial Stock is History Only (Set once)
    if (this.isNew && !this.initialStock) {
        this.initialStock = this.quantity || 0;
    }

    // 3. Calculate Status using Baseline
    if (this.isModified('quantity') || this.isModified('baselineStock')) {
        this.stockStatus = calculateStockStatus(this.quantity, this.baselineStock);
    }
});

// NEW: Explicit Available Stock
productSchema.virtual('availableStock').get(function () {
    return Math.max(0, (this.quantity || 0) - (this.reservedCount || 0));
});

// Add indices for performance
productSchema.index({ seller: 1 });
productSchema.index({ categorySlug: 1 }); // Optimize category lookup
// Composite text index
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
