const mongoose = require('mongoose');

const productRequestSchema = mongoose.Schema({
    requester_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Simple Flat Fields for Request
    product_name: { type: String, required: true, trim: true },
    brand_name: { type: String, trim: true }, // Optional, can be "Local"
    pack_size: { type: String, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Grocery', 'Dairy', 'Bakery', 'Vegetables', 'Fruits', 'Pharma', 'Other']
    },
    image_url: { type: String },

    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    admin_notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProductRequest', productRequestSchema);
