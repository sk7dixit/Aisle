const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    searchMaster, 
    linkProduct, 
    seedData, 
    submitRequest, 
    approveRequest, 
    rejectRequest,
    getMyRequests,
    getAllRequests
} = require('../controllers/masterController.js');

// Prefix: /api/master
router.get('/search', protect, searchMaster);
router.post('/seed', seedData); // Public for now/Internal

// Request Flow
router.get('/requests/my', protect, getMyRequests);
router.get('/requests', protect, getAllRequests);
router.post('/request', protect, submitRequest);
router.post('/request/:id/approve', protect, approveRequest); // Should be admin only
router.post('/request/:id/reject', protect, rejectRequest); // Should be admin only

module.exports = router;
