const express = require('express');
const router = express.Router();
const { scanVisit, completeVisit, cancelVisitByCustomer, checkNoShows } = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/authMiddleware');

// LEGACY ROUTES DISABLED - STEP 2 REFACTOR
router.use((req, res, next) => {
    if (req.path === '/ping') return next();
    res.status(410).json({ message: "This API is deprecated. Use /api/seller/customer-visits instead." });
});

router.get('/ping', (req, res) => res.json({ message: 'Visit API Online (Deprecated Mode)' }));

module.exports = router;
