const mongoose = require('mongoose');

const visitSchema = mongoose.Schema({
    interestRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: false
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visitType: {
        type: String,
        enum: ['PAY_ON_VISIT', 'PAID_ONLINE_PICKUP', 'VISIT_LOG'],
        required: true
    },
    scheduledTime: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ['CREATED', 'SCHEDULED', 'ARRIVED', 'COMPLETED', 'NO_SHOW', 'EXPIRED', 'CANCELLED_BY_SELLER', 'CANCELLED_BY_CUSTOMER'],
        default: 'CREATED'
    },
    // Optional: Product details snapshot for easier fetching
    productName: String,
    customerName: String,
    visitToken: {
        type: String, // The secure token encoded in QR
        index: true
    },
    visitTokenExpiresAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Visit', visitSchema);
