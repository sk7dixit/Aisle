const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true, default: 1 },
                price: { type: Number, required: true }, // Snapshotted price
                image: { type: String }
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'FULFILLED', 'CANCELLED'],
            default: 'PENDING'
        },
        paymentMode: {
            type: String,
            enum: ['PAY_ON_VISIT', 'PREPAID'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING'
        },
        couponCode: {
            type: String
        },
        deviceId: {
            type: String
        },
        // QR Data Handling
        qrCode: {
            type: String, // Can store the generated string/token for easy query
            unique: true
        },
        fulfilledAt: {
            type: Date
        },
        dispute: {
            raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            items: [{
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                quantity: Number,
                reason: String
            }],
            status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
            refundAmount: Number,
            createdAt: Date
        }
    },
    {
        timestamps: true
    }
);

// Virtual for QR Data Payload (The raw data the frontend generates into a visual QR)
orderSchema.virtual('qrPayload').get(function () {
    return JSON.stringify({
        orderId: this._id,
        shopId: this.sellerId,
        customerId: this.customerId,
        totalAmount: this.totalAmount,
        timestamp: this.updatedAt
    });
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
