const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getCreators,
    getCreatorById,
    getCreations,
    getCreationById,
    createCreationRequest,
    getSellerCreationRequests,
    updateCreationRequestStatus
} = require('../controllers/creationController');

// Public endpoints
router.get('/creators', getCreators);
router.get('/creators/:id', getCreatorById);
router.get('/creations', getCreations);
router.get('/creations/:id', getCreationById);

// Protected customer endpoints
router.post('/creation-requests', protect, createCreationRequest);

// Protected creator (seller) endpoints
router.get('/seller/creation-requests', protect, authorize('seller'), getSellerCreationRequests);
router.patch('/seller/creation-requests/:id', protect, authorize('seller'), updateCreationRequestStatus);

module.exports = router;
