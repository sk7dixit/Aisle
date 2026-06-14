const express = require("express");
const router = express.Router();
const { protect, authorize, admin } = require("../middleware/authMiddleware");
const { getSellerForecast, getCategoryForecasts, triggerForecastRun } = require("../controllers/forecastController");

// Direct endpoints mapped within /api/forecast path
router.get("/seller", protect, authorize("seller"), getSellerForecast);
router.get("/categories", protect, admin, getCategoryForecasts);
router.post("/trigger", protect, admin, triggerForecastRun);

module.exports = router;
