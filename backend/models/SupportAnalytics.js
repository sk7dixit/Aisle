const mongoose = require('mongoose');

const supportAnalyticsSchema = mongoose.Schema({
    issueId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    ticketsCreatedCount: {
        type: Number,
        default: 0
    },
    resolvedWithoutTicketCount: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    notHelpfulCount: {
        type: Number,
        default: 0
    },
    searchCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SupportAnalytics', supportAnalyticsSchema);
