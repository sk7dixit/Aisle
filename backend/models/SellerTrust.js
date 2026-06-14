const mongoose = require('mongoose');

const sellerTrustSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    trustScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 80
    },
    responseTimeScore: {
        type: Number,
        default: 100
    },
    stockAccuracyScore: {
        type: Number,
        default: 100
    },
    completionRateScore: {
        type: Number,
        default: 100
    },
    verificationStatusScore: {
        type: Number,
        default: 50
    },
    disputesScore: {
        type: Number,
        default: 100
    },
    customerFeedbackScore: {
        type: Number,
        default: 100
    },
    history: [{
        score: Number,
        date: { type: Date, default: Date.now }
    }],
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerTrust', sellerTrustSchema);
