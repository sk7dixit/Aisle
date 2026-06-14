const mongoose = require('mongoose');

const recurringIssueSchema = mongoose.Schema({
    issueType: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 1
    },
    lastOccurred: {
        type: Date,
        default: Date.now
    }
});

const sellerMemorySchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    recurringIssues: [recurringIssueSchema],
    preferredLanguage: {
        type: String,
        default: 'English'
    },
    history: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerMemory', sellerMemorySchema);
