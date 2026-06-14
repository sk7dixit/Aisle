const mongoose = require('mongoose');

const catalogFeedbackSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterCatalogProduct',
        required: true
    },
    feedbackType: {
        type: String,
        enum: ['wrong_image', 'duplicate', 'incorrect_details', 'other'],
        required: true
    },
    comments: {
        type: String,
        required: true
    },
    suggestedValue: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'ignored'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CatalogFeedback', catalogFeedbackSchema);
