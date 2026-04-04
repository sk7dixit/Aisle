const mongoose = require('mongoose');

const productBaseSchema = mongoose.Schema({
    base_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    category: {
        type: String, // 'Grocery', 'Medical', 'Staples' etc.
        required: true,
        index: true
    },
    product_type: {
        type: String,
        enum: ['DAILY', 'REGULAR'],
        default: 'REGULAR',
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    allowed_states: [{
        type: String // e.g., "Gujarat"
    }],
    allowed_cities: [{
        type: String // e.g., "Vadodara"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('ProductBase', productBaseSchema);
