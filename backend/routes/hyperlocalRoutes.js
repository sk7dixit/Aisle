const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    getSellerHyperlocalDashboard,
    getAdminHyperlocalHeatmap,
    triggerHyperlocalPipelineRun
} = require("../controllers/hyperlocalIntelligenceController");

router.get("/dashboard", protect, authorize("seller"), getSellerHyperlocalDashboard);
router.get("/heatmap", protect, authorize("admin", "super_admin"), getAdminHyperlocalHeatmap);
router.post("/trigger", protect, authorize("seller", "admin"), triggerHyperlocalPipelineRun);

module.exports = router;
