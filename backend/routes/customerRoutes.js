const express = require('express');
const router = express.Router();
const {
    searchProducts,
    getPopularProducts,
    getProductDetail,
    getShopDetail,
    getNearbyShops,
    getShopsNearby,
    getShopsByCity
} = require('../controllers/customerController');
const { createReview, logVisit, checkHasVisited } = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware'); // Assuming authMiddleware exists
const {
    getNotifications,
    markAsRead,
    markAllAsRead
} = require('../controllers/customerNotificationController');
const {
    getProfile,
    updateLocation,
    addAddress,
    getAddresses,
    updatePreferences,
    toggleInterest
} = require('../controllers/customerProfileController');

// Public routes (No auth required for viewing)
router.get('/search', searchProducts);
router.get('/popular', getPopularProducts);
router.get('/nearby-shops', getNearbyShops);
router.get('/product/:id', getProductDetail);
router.get('/shop/:id', getShopDetail);
router.get('/shops-nearby', getShopsNearby);
router.get('/shops', getShopsByCity);
router.post('/shop/:id/review', protect, createReview);
router.post('/shop/:id/visit', protect, logVisit);
router.post('/shop/:id/visit', protect, logVisit);
router.get('/shop/:id/has-visited', protect, checkHasVisited);

// NEW: Order Creation (Step 3)
const { createOrder } = require('../controllers/customerController');
const { raiseDispute } = require('../controllers/disputeController'); // NEW Step 8
router.post('/orders', protect, createOrder);
router.post('/orders/:id/dispute', protect, raiseDispute); // NEW Step 8

// Protected Notification Routes
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markAsRead);
router.put('/notifications/read-all', protect, markAllAsRead);

// Protected Profile Routes
router.get('/profile', protect, getProfile);
router.put('/profile/location', protect, updateLocation);
router.post('/profile/address', protect, addAddress);
router.get('/profile/address', protect, getAddresses);
router.put('/profile/preferences', protect, updatePreferences);
router.put('/interest', protect, toggleInterest);

module.exports = router;
