const { getGrowthAdvisorDashboard, simulateRevenueLift } = require('../services/growthAdvisorService');

/**
 * Get unified Growth Advisor & Pricing Dashboard metrics for a seller.
 * GET /api/seller/growth-advisor/dashboard
 */
const getGrowthDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const dashboard = await getGrowthAdvisorDashboard(sellerId);
        return res.status(200).json(dashboard);
    } catch (error) {
        console.error('[GrowthAdvisorController] Error fetching growth dashboard:', error);
        return res.status(500).json({ message: error.message || 'Server error compiling Growth Dashboard' });
    }
};

/**
 * Run Revenue Growth Simulation
 * POST /api/seller/growth-advisor/simulate
 */
const simulateRevenue = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const { inventoryIncreasePercent, areaExpansionEnabled } = req.body;
        
        const simulationResult = await simulateRevenueLift(
            sellerId, 
            inventoryIncreasePercent || 0, 
            areaExpansionEnabled || false
        );
        
        return res.status(200).json(simulationResult);
    } catch (error) {
        console.error('[GrowthAdvisorController] Simulation error:', error);
        return res.status(500).json({ message: error.message || 'Server error during revenue simulation' });
    }
};

module.exports = {
    getGrowthDashboard,
    simulateRevenue
};
