const mongoose = require('mongoose');

const customerTrustSchema = new mongoose.Schema({
    customerId: {
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
        default: 100
    },
    spamRequestsCount: {
        type: Number,
        default: 0
    },
    fakeInquiriesCount: {
        type: Number,
        default: 0
    },
    abusiveBehaviorCount: {
        type: Number,
        default: 0
    },
    cancellationsCount: {
        type: Number,
        default: 0
    },
    reportHistoryCount: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('CustomerTrust', customerTrustSchema);
