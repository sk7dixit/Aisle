const mongoose = require('mongoose');

const stockMovementSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    sellerProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerProduct',
        index: true
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        index: true
    },
    change: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        enum: ['SALE_CONFIRMED', 'MANUAL_ADJUST', 'DAILY_RESET', 'INITIAL_STOCK'],
        required: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
