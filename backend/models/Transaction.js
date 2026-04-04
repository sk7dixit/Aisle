const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['SUBSCRIPTION', 'BOOST'],
        required: true
    },
    planId: {
        type: String,
        // required only if type is SUBSCRIPTION
    },
    duration: {
        type: String, // monthly, 6months, 12months
        // required only if type is SUBSCRIPTION
    },
    boostDuration: {
        type: Number, // duration in days for boost
    },
    amount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    totalPaid: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    paymentMethod: {
        type: String, // UPI, CARD, NETBANKING
        default: 'UPI'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
