const express = require('express');
const router = express.Router();
const {
    searchCatalog,
    addCatalogProduct,
    getProductsByCategory,
    getTrendingProducts,
    getAutocompleteSuggestions,
    getProductByBarcode,
    getSellerRecommendations,
    submitCatalogFeedback
} = require('../controllers/catalogController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchCatalog);
router.post('/add', protect, addCatalogProduct);
router.get('/trending', protect, getTrendingProducts);
router.get('/autocomplete', protect, getAutocompleteSuggestions);
router.get('/barcode/:code', protect, getProductByBarcode);
router.get('/recommendations/:productId', protect, getSellerRecommendations);
router.get('/category/:category', protect, getProductsByCategory);
router.post('/feedback', protect, submitCatalogFeedback);

// View Tracking API (Phase 7 Part 2)
const { trackProductView } = require('../controllers/analyticsController');
router.post('/view/:id', trackProductView);

module.exports = router;
