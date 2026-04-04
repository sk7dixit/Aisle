const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.post('/create-order', protect, authorize('seller'), createOrder);
router.post('/verify', protect, authorize('seller'), verifyPayment);

module.exports = router;
