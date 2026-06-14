const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getGrowthDashboard, simulateRevenue } = require('../controllers/growthAdvisorController');

router.get('/dashboard', protect, authorize('seller'), getGrowthDashboard);
router.post('/simulate', protect, authorize('seller'), simulateRevenue);

module.exports = router;
