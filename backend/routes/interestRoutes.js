const express = require('express');
const router = express.Router();
const { createInterest, getMyInterests } = require('../controllers/interestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createInterest);
router.get('/', protect, getMyInterests);

module.exports = router;
