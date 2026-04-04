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
        default: 'ShopLens Support'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    }
}, {
    timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
