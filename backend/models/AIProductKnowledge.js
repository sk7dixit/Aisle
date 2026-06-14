const mongoose = require('mongoose');

const AIProductKnowledgeSchema = new mongoose.Schema({
    intent: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    category: {
        type: String,
        required: true
    },
    products: {
        type: [String],
        default: []
    },
    bundleName: {
        type: String,
        default: ''
    },
    bundleProducts: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('AIProductKnowledge', AIProductKnowledgeSchema);
