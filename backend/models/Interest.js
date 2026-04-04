const mongoose = require('mongoose');

const interestSchema = mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CONVERTED', 'ARCHIVED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Prevent duplicate interest for same product by same user? 
// Maybe allowed to re-express interest, but let's keep it simple.
interestSchema.index({ customerId: 1, productId: 1 });

module.exports = mongoose.model('Interest', interestSchema);
