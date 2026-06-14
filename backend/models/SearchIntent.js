const mongoose = require('mongoose');

const SearchIntentSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
        index: true
    },
    normalizedQuery: {
        type: String,
        required: true,
        index: true
    },
    intent: {
        type: String,
        required: true,
        index: true
    },
    confidence: {
        type: Number,
        default: 100
    },
    extractedEntities: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        default: null
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
        default: Date.now
    }
});

module.exports = mongoose.model('SearchIntent', SearchIntentSchema);
