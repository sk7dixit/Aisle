const express = require('express');
const router = express.Router();
const { trackProductClick } = require('../controllers/generalAnalyticsController');

router.post('/product-click', trackProductClick);

module.exports = router;
