const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    markRead,
    getUnreadCount
} = require('../controllers/chatController');

// All chat routes are protected
router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.put('/conversations/:conversationId/read', markRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;
