const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        attachments: [
            {
                type: String // URLs or relative file paths
            }
        ],
        read: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

// Optimize query for fetching messages by conversation
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, read: 1 }); // Optimize unread counts

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
