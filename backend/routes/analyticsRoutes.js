const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    trackProductView,
    getDashboardStats,
    getTrendingProducts,
    getLowStockAlerts,
    getCategoryPerformance,
    getInventoryHealthScore,
    getSmartPriceInsights,
    getSellerRecommendations,
    getSellerOpportunities,
    getSellerTrendsDashboard,
    getSellerIntelligenceInsights,
    respondToRecommendation,
    askSellerAssistant,
    getWeeklyIntelligenceReport,
    getDemandHeatmap
} = require('../controllers/analyticsController');

// Public route for product view increment (triggered by customer click)
router.post('/view/:id', trackProductView);

// Protected routes (Sellers only)
router.use(protect);
router.use(authorize('seller'));

router.get('/dashboard', getDashboardStats);
router.get('/trending', getTrendingProducts);
router.get('/low-stock/:sellerId', getLowStockAlerts);
router.get('/category-performance', getCategoryPerformance);
router.get('/inventory-health', getInventoryHealthScore);
router.get('/price-insights', getSmartPriceInsights);
router.get('/recommendations', getSellerRecommendations);
router.post('/recommendations/:id/respond', respondToRecommendation);
router.post('/assistant', askSellerAssistant);
router.get('/weekly-report', getWeeklyIntelligenceReport);
router.get('/heatmap', getDemandHeatmap);
router.get('/insights', getSellerIntelligenceInsights);
router.get('/opportunity', getSellerOpportunities);
router.get('/trends', getSellerTrendsDashboard);

module.exports = router;
