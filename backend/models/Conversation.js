const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        ],
        type: {
            type: String,
            enum: ['business', 'creator', 'service'],
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false // Optional: Product, Shop, or Booking
        },
        lastMessage: {
            type: String,
            default: ''
        },
        lastMessageSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Ensure query optimization for participants
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
