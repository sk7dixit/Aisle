const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getBusinessCenterDashboard,
    askCommerceCopilot,
    executeTaskAction,
    applyOpportunityAction
} = require('../controllers/commerceIntelligenceController');

// Mount under /api/commerce
router.get('/dashboard', protect, getBusinessCenterDashboard);
router.post('/copilot', protect, askCommerceCopilot);
router.post('/tasks/:id/execute', protect, executeTaskAction);
router.post('/opportunities/:id/apply', protect, applyOpportunityAction);

module.exports = router;
