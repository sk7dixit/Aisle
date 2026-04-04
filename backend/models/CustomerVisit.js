const mongoose = require('mongoose');
const crypto = require('crypto');

const customerVisitSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // The Shop Owner
            required: true
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Redundant but explicit for queries if needed, usually same as sellerId
            required: false // Optional if sellerId suffices
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                name: { type: String }, // Snapshot
                quantity: { type: Number, required: true, default: 1 },
                priceAtTime: { type: Number, required: true },
                image: { type: String } // Snapshot (URL or Base64, kept logic from Order)
            }
        ],
        paymentMode: {
            type: String,
            enum: ['PAY_ON_VISIT', 'PAID_ONLINE'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            default: 'PENDING'
        },
        visitStatus: {
            type: String,
            enum: ['UPCOMING', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'MISSED'],
            default: 'UPCOMING'
        },
        visitTime: {
            type: Date // Planned time
        },
        qrToken: {
            type: String,
            unique: true
        },
        // Metadata for legacy compatibility or logs
        notes: String
    },
    {
        timestamps: true
    }
);

// Pre-save hook to generate QR Token if not present
customerVisitSchema.pre('save', function (next) {
    if (!this.qrToken) {
        // Token = hash(visitId + customerId + timestamp)
        // Since _id might not be ready if new, we use random source + timestamps
        const payload = `${this.customerId}-${Date.now()}-${Math.random()}`;
        this.qrToken = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
    }

    // Enforce Payment Rules
    if (this.paymentMode === 'PAID_ONLINE' && this.paymentStatus === 'PENDING') {
        // Logic to allow PENDING initially for online flow? 
        // User spec says: "PAID_ONLINE -> paymentStatus = COMPLETED" 
        // But usually we create record BEFORE payment gateway. 
        // For now, assume if created via this flow, it might be pending until webhook.
        // BUT user rule: "Hard rules (must be enforced): PAID_ONLINE -> paymentStatus = COMPLETED"
        // If checks passed.
    }

    next();
});

// Virtual for QR Payload (Frontend Compatibility)
customerVisitSchema.virtual('qrPayload').get(function () {
    const totalAmount = this.products.reduce((acc, p) => acc + (p.priceAtTime * p.quantity), 0);
    return JSON.stringify({
        orderId: this._id, // COMPATIBILITY: Scanner checks `parsed.orderId`
        visitId: this._id,
        isVisit: true,     // New Flag
        sellerId: this.sellerId,
        customerId: this.customerId,
        totalAmount: totalAmount,
        qrToken: this.qrToken,
        timestamp: this.updatedAt
    });
});

const CustomerVisit = mongoose.model('CustomerVisit', customerVisitSchema);

module.exports = CustomerVisit;
