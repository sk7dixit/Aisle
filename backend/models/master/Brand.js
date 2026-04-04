const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({
    brand_name: {
        type: String,
        required: true,
        trim: true
    },
    product_base_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductBase',
        required: true,
        index: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Brand', brandSchema);
