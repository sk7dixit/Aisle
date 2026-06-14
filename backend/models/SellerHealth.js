const mongoose = require('mongoose');

const sellerHealthSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    score: {
        type: Number,
        required: true,
        default: 100
    },
    factors: {
        profile: { type: Number, default: 100 },
        products: { type: Number, default: 100 },
        inventory: { type: Number, default: 100 },
        sales: { type: Number, default: 100 },
        customer: { type: Number, default: 100 },
        compliance: { type: Number, default: 100 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerHealth', sellerHealthSchema);
