const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO, queueAndEmit } = require('../config/socket');

// @desc    Get all conversations for the authenticated user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find conversations where the user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name email phone role avatar shopDetails')
            .sort({ lastMessageAt: -1 });

        // Calculate unread count for each conversation
        const formatted = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversationId: conv._id,
                    receiver: userId,
                    read: false
                });

                // Find the other participant object
                const otherParticipant = conv.participants.find(
                    (p) => p._id.toString() !== userId.toString()
                );

                return {
                    _id: conv._id,
                    type: conv.type,
                    referenceId: conv.referenceId,
                    lastMessage: conv.lastMessage,
                    lastMessageSender: conv.lastMessageSender,
                    lastMessageAt: conv.lastMessageAt,
                    createdAt: conv.createdAt,
                    updatedAt: conv.updatedAt,
                    otherParticipant,
                    unreadCount
                };
            })
        );

        res.json(formatted);
    } catch (error) {
        console.error('Get Conversations Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get or create a conversation with a target participant
// @route   POST /api/chat/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { participantId, type, referenceId } = req.body;

        if (!participantId) {
            return res.status(400).json({ message: 'Participant ID is required' });
        }

        if (userId.toString() === participantId.toString()) {
            return res.status(400).json({ message: 'You cannot start a conversation with yourself' });
        }

        // Validate target participant exists
        const targetUser = await User.findById(participantId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Try to find an existing conversation containing both participants
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, participantId] }
        });

        if (!conversation) {
            // Create a new conversation
            conversation = await Conversation.create({
                participants: [userId, participantId],
                type: type || 'business',
                referenceId: referenceId || null
            });
        }

        // Populate and format
        const populated = await Conversation.findById(conversation._id).populate(
            'participants',
            'name email phone role avatar shopDetails'
        );

        const otherParticipant = populated.participants.find(
            (p) => p._id.toString() !== userId.toString()
        );

        const unreadCount = await Message.countDocuments({
            conversationId: populated._id,
            receiver: userId,
            read: false
        });

        res.status(200).json({
            _id: populated._id,
            type: populated.type,
            referenceId: populated.referenceId,
            lastMessage: populated.lastMessage,
            lastMessageSender: populated.lastMessageSender,
            lastMessageAt: populated.lastMessageAt,
            createdAt: populated.createdAt,
            updatedAt: populated.updatedAt,
            otherParticipant,
            unreadCount
        });
    } catch (error) {
        console.error('Get or Create Conversation Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all messages for a specific conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        // Verify conversation exists and the user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { conversationId, text, attachments = [] } = req.body;

        if (!conversationId) {
            return res.status(400).json({ message: 'Conversation ID is required' });
        }
        if (!text) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        // Verify conversation exists and sender is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === senderId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
        }

        // Determine receiver
        const receiverId = conversation.participants.find(
            (p) => p.toString() !== senderId.toString()
        );

        // Save Message
        const message = await Message.create({
            conversationId,
            sender: senderId,
            receiver: receiverId,
            text,
            attachments
        });

        // Update Conversation Last Message Metadata
        conversation.lastMessage = text;
        conversation.lastMessageSender = senderId;
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        // Emit Socket.io Real-time Event
        try {
            const io = getIO();
            // 1. Emit to active conversation screen (room broadcast)
            io.to(`conversation:${conversationId}`).emit('message:received', message);

            // 2. Emit to receiver's user notification channel via Redis queue (ACK confirmation / offline support)
            await queueAndEmit(receiverId.toString(), 'message:received_notify', {
                message,
                conversationId
            });
        } catch (socketError) {
            console.warn('[ChatController] Socket broadcast warning:', socketError.message);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all messages in a conversation as read by current user
// @route   PUT /api/chat/conversations/:conversationId/read
// @access  Private
exports.markRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        await Message.updateMany(
            { conversationId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        // Trigger Socket.io real-time status update to sender
        try {
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                const otherParticipantId = conversation.participants.find(
                    (p) => p.toString() !== userId.toString()
                );
                const io = getIO();
                io.to(`user:${otherParticipantId}`).emit('messages:read', { conversationId });
            }
        } catch (socketError) {
            console.warn('[ChatController] Socket read status warning:', socketError.message);
        }

        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get total unread message count for current user
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Message.countDocuments({
            receiver: userId,
            read: false
        });

        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
