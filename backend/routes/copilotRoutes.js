const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    processChat,
    clearHistory,
    trackRecommendationClick,
    getAnalytics
} = require('../controllers/copilotController');

// All copilot routes are protected by authentication
router.use(protect);

router.post('/chat', processChat);
router.delete('/chat', clearHistory);
router.post('/click', trackRecommendationClick);
router.get('/analytics', admin, getAnalytics);

module.exports = router;
