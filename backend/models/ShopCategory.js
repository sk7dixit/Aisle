const mongoose = require('mongoose');

const shopCategorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const ShopCategory = mongoose.model('ShopCategory', shopCategorySchema);

module.exports = ShopCategory;
