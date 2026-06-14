const mongoose = require('mongoose');

const productImageCacheSchema = mongoose.Schema({
    rawQuery: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    extractedKeywords: {
        type: [String],
        default: []
    },
    source: {
        type: String,
        default: 'google-search'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProductImageCache', productImageCacheSchema);
