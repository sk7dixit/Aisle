const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createRequest,
    getSellerRequests,
    getCustomerRequests,
    confirmRequest,
    acceptRequest, // Added acceptRequest
    rejectRequest,  // Added rejectRequest
    checkExpiredReservations,
    createAssistedListingRequest
} = require('../controllers/requestController');

const upload = require('../middleware/upload'); // Ensure upload middleware is available

// LEGACY ROUTES DISABLED - STEP 2 REFACTOR
router.use((req, res) => {
    res.status(410).json({ message: "This API is deprecated. Use /api/seller/customer-visits instead." });
});

module.exports = router;

module.exports = router;

