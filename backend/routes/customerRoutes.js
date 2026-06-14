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
    getProfile: getProfileBasic,
    updateLocation,
    addAddress,
    getAddresses,
    updatePreferences,
    toggleInterest
} = require('../controllers/customerProfileController');

const {
    searchProducts: searchProductsIntel,
    searchShops: searchShopsIntel,
    getRecommendations,
    getHomeBusinesses,
    getAlternatives
} = require('../controllers/customerIntelligenceController');

const {
    getCustomerAlerts,
    getCustomerInsights,
    getTrendingNearby,
    getPriceDrops,
    getActionCenter,
    requestQuote,
    getCustomerHealth
} = require('../controllers/customerSuccessController');

// Public routes (No auth required for viewing)
router.get('/search-products', protect, searchProductsIntel);
router.get('/search-shops', protect, searchShopsIntel);
router.get('/recommendations', protect, getRecommendations);
router.get('/home-businesses', protect, getHomeBusinesses);
router.get('/alternatives', protect, getAlternatives);

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
const {
    getProfile: getPersonalizedProfile,
    getFavorites,
    getRecentActivity,
    createReminder,
    updatePreferences: updatePersonalizedPreferences,
    getHomeFeed,
    logActivity,
    logRecommendationAction,
    getPersonalizedAssistant
} = require('../controllers/customerPersonalizationController');

const {
    getOrders,
    getOrderStatus,
    processRefundRequest,
    raiseDisputeUnified,
    cancelOrder,
    getTickets,
    getTicketDetail,
    escalateTicket
} = require('../controllers/customerResolutionController');

const {
    processSupportChat,
    updateChatFeedback
} = require('../controllers/customerPersonalityController');

router.get('/profile-basic', protect, getProfileBasic);
router.get('/profile', protect, getPersonalizedProfile);
router.get('/favorites', protect, getFavorites);
router.get('/recent-activity', protect, getRecentActivity);
router.post('/reminder', protect, createReminder);
router.post('/preferences', protect, updatePersonalizedPreferences);

// Personalization & Recommendation Routes
router.get('/home/feed', protect, getHomeFeed);
router.post('/activity', protect, logActivity);
router.post('/recommendations/action', protect, logRecommendationAction);
router.post('/assistant', protect, getPersonalizedAssistant);

// NEW Resolution & Support Operations Routes (Phase 4)
router.get('/orders', protect, getOrders);
router.get('/order-status/:id', protect, getOrderStatus);
router.post('/refund-request', protect, processRefundRequest);
router.post('/dispute', protect, raiseDisputeUnified);
router.post('/cancel-order', protect, cancelOrder);
router.get('/tickets', protect, getTickets);
router.get('/ticket/:id', protect, getTicketDetail);
router.post('/escalate', protect, escalateTicket);

// NEW: Personality & Small Talk AI Routes (Phase 5)
router.post('/support-chat', protect, processSupportChat);
router.post('/support-chat/feedback', protect, updateChatFeedback);

// NEW: Proactive Success & Action Center AI Routes (Phase 6)
router.get('/alerts', protect, getCustomerAlerts);
router.get('/insights', protect, getCustomerInsights);
router.get('/trending', protect, getTrendingNearby);
router.get('/price-drops', protect, getPriceDrops);
router.get('/action-center', protect, getActionCenter);
router.post('/request-quote', protect, requestQuote);
router.get('/customer-health', protect, getCustomerHealth);

router.put('/profile/location', protect, updateLocation);
router.post('/profile/address', protect, addAddress);
router.get('/profile/address', protect, getAddresses);
router.put('/profile/preferences', protect, updatePreferences);
router.put('/interest', protect, toggleInterest);

module.exports = router;
