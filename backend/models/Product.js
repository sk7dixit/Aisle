const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        brand: {
            type: String
        },
        category: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        imageUrl: {
            type: String,
            default: 'https://via.placeholder.com/150'
        },
        isAvailable: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

// Add text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
