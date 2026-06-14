const express = require("express");
const router = express.Router();
const { protect, authorize, admin } = require("../middleware/authMiddleware");
const { getInventoryForecast, triggerInventoryForecastRun } = require("../controllers/inventoryForecastController");

router.get("/seller", protect, authorize("seller"), getInventoryForecast);
router.post("/trigger", protect, admin, triggerInventoryForecastRun);

module.exports = router;
