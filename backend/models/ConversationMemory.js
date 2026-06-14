const mongoose = require('mongoose');

const ConversationMemorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One active session per user
    },
    memoryContext: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            sellerName: null,
            orderId: null,
            productName: null,
            budget: null,
            lastTopic: null,
            lastProductId: null,
            lastProductName: null,
            guestCount: null,
            laptopStep: null,
            laptopUsage: null,
            laptopBudget: null,
            phoneStep: null,
            phoneBudget: null
        }
    },
    lastSentiment: {
        type: String,
        default: 'neutral'
    },
    logs: [
        {
            sender: {
                type: String,
                enum: ['user', 'bot']
            },
            text: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    feedback: {
        type: String,
        enum: ['thumbsUp', 'thumbsDown', 'none'],
        default: 'none'
    }
}, { timestamps: true });

module.exports = mongoose.model('ConversationMemory', ConversationMemorySchema);
