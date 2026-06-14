const { getEventIntelligenceDashboard } = require('../services/eventIntelligenceService');

/**
 * Get localized Event Intelligence dashboard metrics for a seller.
 * GET /api/seller/event-intelligence/dashboard
 */
const getEventDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const dashboard = await getEventIntelligenceDashboard(sellerId);
        return res.status(200).json(dashboard);
    } catch (error) {
        console.error('[EventIntelligenceController] Error fetching dashboard:', error);
        return res.status(500).json({ message: error.message || 'Server error compiling Event Intelligence Dashboard' });
    }
};

module.exports = {
    getEventDashboard
};
