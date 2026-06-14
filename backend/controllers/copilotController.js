const copilotService = require('../services/copilotService');
const CopilotAnalytics = require('../models/CopilotAnalytics');

// @desc    Process a chat message with the AI Copilot
// @route   POST /api/copilot/chat
// @access  Private
const processChat = async (req, res) => {
    try {
        const { message, lat, lng } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const userId = req.user._id;
        
        // Resolve user role to one of 'admin', 'seller', or 'customer'
        let role = 'customer';
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            role = 'admin';
        } else if (req.user.role === 'seller') {
            role = 'seller';
        }

        // Fallback Indore coordinates if none provided
        const userLat = lat ? parseFloat(lat) : 22.7196;
        const userLng = lng ? parseFloat(lng) : 75.8577;

        const result = await copilotService.processChat(userId, role, message, userLat, userLng);

        res.json({
            success: true,
            answer: result.answer,
            suggestions: result.suggestions
        });
    } catch (error) {
        console.error('[CopilotController] Chat processing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Clear conversation history for the current session
// @route   DELETE /api/copilot/chat
// @access  Private
const clearHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        let role = 'customer';
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            role = 'admin';
        } else if (req.user.role === 'seller') {
            role = 'seller';
        }

        await copilotService.clearConversation(userId, role);
        res.json({ success: true, message: 'Conversation memory cleared successfully.' });
    } catch (error) {
        console.error('[CopilotController] Clear history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Track click interactions on copilot recommendations
// @route   POST /api/copilot/click
// @access  Private
const trackRecommendationClick = async (req, res) => {
    try {
        const { analyticsId } = req.body;
        if (!analyticsId) {
            return res.status(400).json({ success: false, message: 'analyticsId is required' });
        }

        const analytics = await CopilotAnalytics.findByIdAndUpdate(
            analyticsId,
            { $inc: { clicks: 1 } },
            { new: true }
        );

        if (!analytics) {
            return res.status(404).json({ success: false, message: 'Analytics log not found' });
        }

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('[CopilotController] Click tracking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Fetch platform-wide copilot metrics and logs (Command Center)
// @route   GET /api/copilot/analytics
// @access  Private (Admin Only)
const getAnalytics = async (req, res) => {
    try {
        const logs = await CopilotAnalytics.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('userId', 'name email role');

        // Compile high-level stats
        const totalQuestions = await CopilotAnalytics.countDocuments();
        const roleDistribution = await CopilotAnalytics.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        const clickAggregation = await CopilotAnalytics.aggregate([
            { $group: { _id: null, totalClicks: { $sum: "$clicks" } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalQuestions,
                roleDistribution: roleDistribution.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                totalClicks: clickAggregation[0]?.totalClicks || 0
            },
            logs
        });
    } catch (error) {
        console.error('[CopilotController] Fetch analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    processChat,
    clearHistory,
    trackRecommendationClick,
    getAnalytics
};
