const express = require('express');
const router = express.Router();
const {
    search,
    trackClick,
    trackConversion,
    getSuggestions
} = require('../controllers/aiSearchController');

router.post('/search', search);
router.post('/search/click', trackClick);
router.post('/search/conversion', trackConversion);
router.get('/search/suggestions', getSuggestions);
router.get('/suggestions', getSuggestions);

module.exports = router;
