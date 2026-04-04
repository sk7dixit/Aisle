const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Optional: If they are interested in a specific product
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Assuming you have a Product model, or will have one
    },
    productName: {
        type: String,
    },
    customerQuery: {
        type: String, // What the customer searched for (e.g. "10mm drill bit")
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'closed'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
