const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getEventDashboard } = require('../controllers/eventIntelligenceController');

router.get('/dashboard', protect, authorize('seller'), getEventDashboard);

module.exports = router;
