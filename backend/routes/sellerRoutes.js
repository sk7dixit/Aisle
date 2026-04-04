const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getSellerStats,
    getShopStatus,
    getLeads,
    updateShopVisibility,
    updateLeadStatus,
    addProduct,
    addProductsBulk,
    updateSellerProfile,
    getSellerProfile,
    getSellerProducts,
    updateProduct,
    getProductDetails,
    updateProductsStatusBulk,
    deleteProductsBulk,
    deleteProduct,
    getInsights,
    recordInsightFeedback,
    updateShopSchedule,
    resetManualStatus,
    getSubscriptionStatus,
    upgradePreview,
    getInventory,
    updateQuantity,
    getSubCategories,
    uploadCameraImage,
    createAssistedListingRequest,
    restockDaily,
    addStock,
    getCustomerVisits // NEW Step 2
} = require('../controllers/sellerController');
const { uploadBulkFile, saveBulkProducts } = require('../controllers/bulkListingController');
const { processVoiceInput } = require('../controllers/voiceController');
const { linkProduct } = require('../controllers/masterController'); // Import link controller
const {
    getInventoryContext,
    getInventoryMetrics,
    getInventoryProducts,
    getCategoryCounts
} = require('../controllers/inventoryController');
const upload = require('../middleware/upload');
// Existing Disk Storage Middleware
const bulkUpload = require('../middleware/bulkUpload');

// NEW: Step 1 Memory Middleware & Controller
const memoryBulkUpload = require('../middleware/bulkUploadMiddleware');
const { initBulkUpload } = require('../controllers/bulkUploadController');

// All routes require protection and 'seller' role
router.use(protect);
router.use(authorize('seller'));

router.get('/dashboard', getSellerStats);
router.get('/shop-status', getShopStatus);
router.get('/leads', getLeads);
router.put('/leads/:id', updateLeadStatus);
router.put('/visibility', updateShopVisibility);
router.put('/schedule', updateShopSchedule);
router.get('/subscription-status', getSubscriptionStatus);
router.post('/upgrade-preview', upgradePreview);
router.post('/reset-status', resetManualStatus);

// Payment Settings (Step 6 - Refactored)
const { getPaymentSettings, savePaymentSettings } = require('../controllers/paymentSettingsController');
router.get('/payment-settings', getPaymentSettings);
router.post('/payment-settings', savePaymentSettings);
router.put('/payment-settings', savePaymentSettings);

// NEW: Shop Operating Mode (Step 1)
router.put('/operating-mode', require('../controllers/sellerController').updateOperatingMode);

// NEW: Daily Opening Stock (Step 2)
router.post('/inventory/start-day', require('../controllers/sellerController').setOpeningStock);

// NEW: QR Pickup & Stock Reduction (Step 3)
router.post('/orders/scan', require('../controllers/sellerController').scanOrderQR);

// Unified Seller Visits
router.get('/customer-visits', protect, authorize('seller'), getCustomerVisits); // NEW Step 2

// Location Setting
const { setShopLocation } = require('../controllers/sellerController');
router.post('/set-location', setShopLocation);


// Inventory Management Routes
router.get('/inventory/context', getInventoryContext);
router.get('/inventory/metrics', getInventoryMetrics);
router.get('/inventory/products', getInventoryProducts);
router.get('/inventory/category-counts', getCategoryCounts);

// Bulk Listing Routes
router.post('/bulk-upload/init', memoryBulkUpload.single('file'), initBulkUpload); // Step 1: Init
router.post('/bulk-upload/suggest-mapping', require('../controllers/bulkUploadController').suggestMapping); // Step 2: AI Suggest
router.post('/bulk-upload/process-mapping', require('../controllers/bulkUploadController').processMapping); // Step 2 -> 3: Process
router.post('/bulk-upload/save', require('../controllers/bulkUploadController').saveFinalProducts); // Step 4: Final Save

router.post('/bulk/upload', bulkUpload.single('file'), uploadBulkFile);
router.post('/bulk/save', saveBulkProducts);

// Product Management
// Note: `protect` and `authorize('seller')` are already applied globally.
router.post('/products/link', linkProduct);
router.route('/products').get(getSellerProducts).post(upload.single('image'), addProduct);
router.route('/products/bulk').post(addProductsBulk);
router.route('/products/bulk-delete').delete(deleteProductsBulk);
router.route('/products/bulk-status').put(updateProductsStatusBulk);
router.route('/products/:id').put(updateProduct).get(getProductDetails).delete(deleteProduct);

router.route('/profile').get(getSellerProfile).put(updateSellerProfile);
router.post('/voice-process', processVoiceInput);

// AI Insights
router.get('/insights', getInsights);
router.post('/insights/:id/feedback', recordInsightFeedback);

// Visit Management
const { getSellerVisits, updateVisitStatus, getVisitByToken, confirmVisit, completeVisit } = require('../controllers/visitController');
router.get('/visits', getSellerVisits);
router.get('/visits/scan/:token', getVisitByToken);
router.post('/visits/confirm', confirmVisit);
router.post('/visits/:id/complete', completeVisit);
router.post('/visits/finalize-visit/:id', completeVisit); // DEBUG PATH
router.put('/visits/:id', updateVisitStatus);

// Sales History
const { getSalesHistory } = require('../controllers/salesHistoryController');
router.get('/history', getSalesHistory);

// Seller Context & Top Products (Recommendations)
const { getSellerContext, getTopProducts } = require('../controllers/sellerContextController');
const { extractAndSaveCity } = require('../controllers/cityExtractionController');
router.get('/context', getSellerContext);
router.get('/top-products', getTopProducts);
router.post('/extract-city', extractAndSaveCity);

// Feedback
const { createFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { getSellerReviews } = require('../controllers/reviewController');
router.post('/feedback', createFeedback);
router.get('/feedback', getMyFeedback);
router.get('/reviews', getSellerReviews);

const { createTicket } = require('../controllers/supportController');
router.post('/support/ticket', createTicket);

const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notificationController');
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread-count', protect, getUnreadCount);
router.put('/notifications/:id/read', protect, markAsRead);
router.put('/notifications/read-all', protect, markAllAsRead);

// Settings & Security
const { requestFaceUpdate, getFaceUpdateStatus } = require('../controllers/sellerController');
router.post('/face-update-request', requestFaceUpdate);
router.get('/face-update-status', getFaceUpdateStatus);

// AI Visual Assets
const { uploadVisualAsset, removeVisualAsset } = require('../controllers/sellerController');
router.post('/visual-assets', upload.single('image'), uploadVisualAsset);
router.delete('/visual-assets/:id', removeVisualAsset);

// Camera Upload
router.post('/camera/upload', upload.single('image'), uploadCameraImage);

// Assisted Listing
router.post('/assisted-listing/request', upload.array('files', 10), createAssistedListingRequest);

// Inventory Control (Deterministic)
router.get('/inventory', getInventory);
router.post('/inventory/add', addProductsBulk);
router.post('/inventory/add', addProductsBulk);
router.patch('/inventory/:id/quantity', updateQuantity);
router.post('/inventory/:id/restock-daily', restockDaily);
router.post('/inventory/:id/add-stock', addStock);
router.get('/subcategories', getSubCategories);

// Image Listing Session (Layer 2-4)
// Image Listing Session (Layer 2-4)
const { startSession, getSession, addImageToSession, saveSession } = require('../controllers/imageSessionController');
router.post('/image-session/start', startSession);
router.get('/image-session/:id', getSession);
router.post('/image-session/add', addImageToSession);
router.post('/image-session/save', saveSession);

// Match Catalog
const { getCatalog, syncCatalogProducts } = require('../controllers/masterController');
router.get('/catalog', getCatalog);
router.post('/catalog/sync', syncCatalogProducts);

module.exports = router;
