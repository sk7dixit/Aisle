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
    getTrendingSearchAnalytics,
    getAdminTrends,
    getAdminCityTrends,
    getMarketplaceIntelligenceDashboard,
    getSystemSettings, updateSystemSettings,
    getShopDetails,
    getUserActivity,
    getUserAccountDetails, // ADDED
    getProductActivity,
    getFaceRequests,
    getAllAssistedListingRequests,
    updateAssistedListingStatus,
    getAdminCatalog,
    updateCatalogStatus,
    updateCatalogImage,
    mergeCatalogProducts,
    getSecurityDashboardStats,
    getInfraMemoryStats,
    getFailedJobs,
    retryFailedJob,
    deleteFailedJob,
    getQueueMetrics,
    getClusterObservability,
    getQueryAudit,
    getSearchDashboardStats,
    getClusterNodes,
    getFeatureFlags,
    setFeatureFlags,
    purgeClusterCache,
    shutdownCluster
} = require('../controllers/adminController');

const {
    getTrustDashboardStats,
    recalculateTrustScores,
    getModerationCopilotReasoning,
    respondToFraudEvent
} = require('../controllers/trustController');
const User = require('../models/User');
const { getAllFeedback, replyToFeedback } = require('../controllers/feedbackController');
// const { getFaceRequests } = require('../controllers/authController'); // Removed
const { protect, authorize, adminOnly, requireElevatedPrivilege } = require('../middleware/authMiddleware');
const { dlpGuard } = require('../middleware/dlpMiddleware');
const { adminLimiter } = require('../middleware/rateLimiter');

router.use(adminLimiter);

const commonAdminAuth = [protect, authorize('super_admin', 'admin', 'moderator')];

// Sellers & Shops
router.get('/sellers', ...commonAdminAuth, dlpGuard(100), getAllSellers);
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
router.get('/analytics/trending', ...commonAdminAuth, getTrendingSearchAnalytics);
router.get('/trends', ...commonAdminAuth, getAdminTrends);
router.get('/trends/city/:city', ...commonAdminAuth, getAdminCityTrends);
router.get('/trends/dashboard', ...commonAdminAuth, getMarketplaceIntelligenceDashboard);

// Users
router.get('/users', ...commonAdminAuth, dlpGuard(100), getUsers);
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
router.get('/security-dashboard', protect, authorize('super_admin', 'admin'), getSecurityDashboardStats);
router.get('/infra/memory', protect, authorize('super_admin', 'admin'), getInfraMemoryStats);

// Marketplace Trust & Fraud Intelligence Routes
router.get('/trust/dashboard', ...commonAdminAuth, getTrustDashboardStats);
router.post('/trust/recalculate', ...commonAdminAuth, recalculateTrustScores);
router.get('/trust/copilot/:userId', ...commonAdminAuth, getModerationCopilotReasoning);
router.post('/trust/fraud-event/:id/respond', ...commonAdminAuth, respondToFraudEvent);

// Feedback Management
router.get('/feedback', ...commonAdminAuth, getAllFeedback);
router.put('/feedback/:id/reply', ...commonAdminAuth, replyToFeedback);

// Settings (Super Admin Only)
router.get('/settings', ...commonAdminAuth, getSystemSettings); // View allowed for all? Step 16 says No access for Mods/Admins? 
// Step 16: Admin No access to Settings. Mods No access. 
// Super Admin Only.
router.get('/settings', protect, authorize('super_admin'), getSystemSettings);
router.put('/settings', protect, authorize('super_admin'), requireElevatedPrivilege, updateSystemSettings);

// Announcements
router.get('/announcements', ...commonAdminAuth, getAnnouncements);
router.post('/announcements', ...commonAdminAuth, createAnnouncement);
router.put('/announcements/:id', ...commonAdminAuth, updateAnnouncement);
router.delete('/announcements/:id', ...commonAdminAuth, deleteAnnouncement);

// Assisted Listing Requests
router.get('/assisted-listings', ...commonAdminAuth, getAllAssistedListingRequests);
router.put('/assisted-listings/:id/status', ...commonAdminAuth, updateAssistedListingStatus);

// Catalog Moderation & Duplicate Merging
router.get('/catalog', ...commonAdminAuth, getAdminCatalog);
router.put('/catalog/:id/status', ...commonAdminAuth, updateCatalogStatus);
router.put('/catalog/:id/image', ...commonAdminAuth, updateCatalogImage);
router.post('/catalog/merge', ...commonAdminAuth, mergeCatalogProducts);

// DLQ & Background Queues
router.get('/dlq', ...commonAdminAuth, getFailedJobs);
router.post('/dlq/:id/retry', ...commonAdminAuth, retryFailedJob);
router.delete('/dlq/:id', ...commonAdminAuth, deleteFailedJob);
router.get('/queue-metrics', ...commonAdminAuth, getQueueMetrics);

// Search performance & analytics dashboard
router.get('/query-audit', ...commonAdminAuth, getQueryAudit);
router.get('/search-dashboard', ...commonAdminAuth, getSearchDashboardStats);

// Cluster Control Plane
router.get('/cluster/nodes', protect, authorize('super_admin'), getClusterNodes);
router.get('/cluster/observability', protect, authorize('super_admin'), getClusterObservability);
router.get('/cluster/feature-flags', protect, authorize('super_admin'), getFeatureFlags);
router.post('/cluster/feature-flags', protect, authorize('super_admin'), setFeatureFlags);
router.post('/cluster/purge-cache', protect, authorize('super_admin'), purgeClusterCache);
router.post('/cluster/shutdown', protect, authorize('super_admin'), shutdownCluster);

module.exports = router;
