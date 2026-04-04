const mongoose = require('mongoose');

const variantSchema = mongoose.Schema({
    variant_label: {
        type: String, // e.g. "Amul Toned Milk 1L"
        required: true,
        trim: true
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand', // Links to Brand, which links to Base
        required: true,
        index: true
    },
    pack_size: {
        type: String, // "1L", "500g"
        required: true
    },
    attributes: [{
        type: String // ["toned", "pouch"]
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Variant', variantSchema);
