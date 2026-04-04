const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { scanVisitQR, completeVisit, getMyVisits } = require('../controllers/customerVisitController');

// Unified Router
// 1. Customer Routes
router.get('/my-visits', protect, getMyVisits);

// 2. Seller Routes (Scan & Complete)
router.use(protect, authorize('seller')); // Apply seller check to below routes
router.post('/scan', scanVisitQR);
router.post('/:id/complete', completeVisit);

module.exports = router;
