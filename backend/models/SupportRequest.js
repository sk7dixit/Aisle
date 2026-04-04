const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be guest/unverified if just phone
    },
    identifier: {
        type: String, // Phone or Email
        required: true
    },
    category: {
        type: String,
        enum: ['Shopping', 'Services', 'Seller', 'App', 'Other'],
        default: 'Other'
    },
    summary: {
        type: String,
        required: true
    },
    status: {
        type: String, // 'open', 'in-progress', 'resolved'
        default: 'open'
    },
    logs: [
        {
            sender: String,
            text: String,
            timestamp: Date
        }
    ],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    images: {
        type: [String],
        default: []
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
