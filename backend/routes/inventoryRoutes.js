const express = require('express');
const router = express.Router();
const {
    addProductToShop,
    getSellerProducts
} = require('../controllers/inventoryController');

// ADD PRODUCT
router.post('/add', addProductToShop);

// GET SELLER PRODUCTS
router.get('/:sellerId', getSellerProducts);

// GET LOW STOCK ALERTS (Phase 7 Part 4)
const { getLowStockAlerts } = require('../controllers/analyticsController');
router.get('/low-stock/:sellerId', getLowStockAlerts);

module.exports = router;
