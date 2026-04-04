const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true,
        unique: true // One reservation per request typically
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'CONSUMED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    source: {
        type: String,
        default: 'SYSTEM'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);
