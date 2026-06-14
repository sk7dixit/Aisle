const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    sender: {
        type: String,
        enum: ['seller', 'agent'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const supportSessionSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    issue: {
        type: String,
        required: true
    },
    findings: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['INVESTIGATING', 'COMPLETED', 'ESCALATED'],
        default: 'INVESTIGATING',
        index: true
    },
    conversation: [messageSchema],
    currentStep: {
        type: String,
        default: 'ASK_TIMEFRAME'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SupportSession', supportSessionSchema);
