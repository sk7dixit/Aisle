const mongoose = require('mongoose');

const feedbackSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sellerName: { type: String, required: true },
    shopName: { type: String }, // NEW
    shopType: { type: String },
    city: { type: String },
    feedbackType: {
        type: String,
        required: true,
        enum: ['bug', 'suggestion', 'general']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: true,
        minlength: 10
    },
    // AI Internal Helper
    aiSummary: { type: String }, // NEW: Auto-generated summary
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
    adminReply: {
        message: { type: String },
        repliedAt: { type: Date },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
}, {
    timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
