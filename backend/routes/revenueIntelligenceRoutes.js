const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    getRevenueDashboard,
    getMultiStoreIntelligence,
    triggerRevenuePipeline
} = require("../controllers/revenueIntelligenceController");

router.get("/dashboard", protect, authorize("seller"), getRevenueDashboard);
router.get("/multi-store", protect, authorize("seller"), getMultiStoreIntelligence);
router.post("/trigger", protect, authorize("seller"), triggerRevenuePipeline);

module.exports = router;
