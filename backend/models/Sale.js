const mongoose = require('mongoose');

const saleSchema = mongoose.Schema({
    visitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'ONLINE'],
        required: true
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'REFUNDED'],
        default: 'COMPLETED'
    },
    confirmedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
