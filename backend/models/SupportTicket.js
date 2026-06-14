const mongoose = require('mongoose');

const supportTicketSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sellerName: { type: String, required: true },
    shopName: { type: String },
    city: { type: String },
    issueText: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    source: {
        type: String,
        default: 'Aisle Support'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    category: {
        type: String,
        default: 'GENERAL'
    },
    confidence: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        default: 'English'
    },
    shopType: {
        type: String
    }
}, {
    timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
