const express = require('express');
const router = express.Router();
const {
    getAllSellers, getPendingSellers, updateSellerStatus, updateFaceStatus,
    getDashboardStats,
    getUsers, blockUser, unblockUser,
    getAdminProducts, updateProductStatus,
    getReports, updateReportStatus, getActivityLogs,
    getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
    getAnalytics,
    getSystemSettings, updateSystemSettings,
    getShopDetails,
    getUserActivity,
    getUserAccountDetails, // ADDED
    getProductActivity,
    getFaceRequests,
    getAllAssistedListingRequests,
    updateAssistedListingStatus
} = require('../controllers/adminController');
const User = require('../models/User');
const { getAllFeedback, replyToFeedback } = require('../controllers/feedbackController');
// const { getFaceRequests } = require('../controllers/authController'); // Removed
const { protect, authorize, adminOnly } = require('../middleware/authMiddleware');

const commonAdminAuth = [protect, authorize('super_admin', 'admin', 'moderator')];

// Sellers & Shops
router.get('/sellers', ...commonAdminAuth, getAllSellers);
router.get('/shops/:id', ...commonAdminAuth, getShopDetails); // NEW Command Center
router.get('/verification-queue', ...commonAdminAuth, getPendingSellers);
router.put('/seller/:id/status', ...commonAdminAuth, updateSellerStatus);

// Seller Payment Visibility (Read-only)
const { adminGetSellerPaymentDetails } = require('../controllers/paymentSettingsController');
router.get('/seller/:sellerId/payment-details', ...commonAdminAuth, adminGetSellerPaymentDetails);

// Location Verification Routes Removed (Self-Declared)
// router.post("/verify-shop-location/:sellerId", ...);
// router.get("/unverified-shops", ...);
// router.get("/shops-with-location-issues", ...);
// router.post("/fix-shop-location/:sellerId", ...);

// Face Verification Requests
router.get('/face-requests', protect, authorize('super_admin', 'admin', 'moderator'), getFaceRequests); // List
router.put('/face-requests/:id/status', protect, authorize('super_admin', 'admin'), updateFaceStatus); // Actions

// Dashboard
router.get('/dashboard-stats', ...commonAdminAuth, getDashboardStats);
router.get('/analytics', ...commonAdminAuth, getAnalytics);

// Users
router.get('/users', ...commonAdminAuth, getUsers);
router.get('/users/:id/activity', ...commonAdminAuth, getUserActivity); // NEW Forensic Timeline
router.get('/users/:id/account-details', ...commonAdminAuth, getUserAccountDetails);
router.put('/users/:id/block', ...commonAdminAuth, blockUser);
router.put('/users/:id/unblock', ...commonAdminAuth, unblockUser);

// Products
router.get('/products', ...commonAdminAuth, getAdminProducts);
router.get('/products/:id/activity', ...commonAdminAuth, getProductActivity); // NEW Forensic Timeline
router.put('/products/:id/status', ...commonAdminAuth, updateProductStatus);

// Reports
router.get('/reports', ...commonAdminAuth, getReports);
router.put('/reports/:id/status', ...commonAdminAuth, updateReportStatus);

// Logs
router.get('/logs', ...commonAdminAuth, getActivityLogs);

// Feedback Management
router.get('/feedback', ...commonAdminAuth, getAllFeedback);
router.put('/feedback/:id/reply', ...commonAdminAuth, replyToFeedback);

// Settings (Super Admin Only)
router.get('/settings', ...commonAdminAuth, getSystemSettings); // View allowed for all? Step 16 says No access for Mods/Admins? 
// Step 16: Admin No access to Settings. Mods No access. 
// Super Admin Only.
router.get('/settings', protect, authorize('super_admin'), getSystemSettings);
router.put('/settings', protect, authorize('super_admin'), updateSystemSettings);

// Announcements
router.get('/announcements', ...commonAdminAuth, getAnnouncements);
router.post('/announcements', ...commonAdminAuth, createAnnouncement);
router.put('/announcements/:id', ...commonAdminAuth, updateAnnouncement);
router.delete('/announcements/:id', ...commonAdminAuth, deleteAnnouncement);

// Assisted Listing Requests
router.get('/assisted-listings', ...commonAdminAuth, getAllAssistedListingRequests);
router.put('/assisted-listings/:id/status', ...commonAdminAuth, updateAssistedListingStatus);

module.exports = router;
