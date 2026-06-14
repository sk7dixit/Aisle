const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },

    normalizedName: {
        type: String,
        index: true
    },

    brand: {
        type: String,
        index: true
    },

    category: {
        type: String,
        index: true
    },

    shopType: {
        type: String,
        index: true
    },

    imageUrl: String,

    size: {
        type: String,
        default: ''
    },

    barcode: {
        type: String,
        unique: true,
        sparse: true
    },

    source: String,

    externalId: String,

    verifiedImage: {
        type: Boolean,
        default: false
    },

    verified: {
        type: Boolean,
        default: false
    },

    confidenceScore: {
        type: Number,
        default: 0
    },

    imageVerified: {
        type: Boolean,
        default: false
    },

    catalogStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },

    masterProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterCatalogProduct',
        default: null
    }
},
{
    timestamps: true
});

productSchema.index({
    name: 'text',
    normalizedName: 'text',
    brand: 'text'
});

module.exports = mongoose.model('MasterCatalogProduct', productSchema);
