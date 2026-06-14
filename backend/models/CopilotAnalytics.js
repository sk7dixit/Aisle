const mongoose = require('mongoose');

const CopilotAnalyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin']
    },
    question: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    conversions: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('CopilotAnalytics', CopilotAnalyticsSchema);
