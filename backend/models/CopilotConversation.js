const mongoose = require('mongoose');

const CopilotConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        required: true
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'assistant'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

// Ensure unique conversation per user and role
CopilotConversationSchema.index({ userId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('CopilotConversation', CopilotConversationSchema);
