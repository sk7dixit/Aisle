const FraudEvent = require('../models/FraudEvent');
const SellerTrust = require('../models/SellerTrust');
const CustomerTrust = require('../models/CustomerTrust');
const RiskProfile = require('../models/RiskProfile');
const User = require('../models/User');
const {
    calculateSellerTrust,
    calculateCustomerTrust,
    getModerationCopilotDecision,
    calculateMarketplaceQualityScore,
    seedTrustMockData
} = require('../services/trustService');

/**
 * GET /api/admin/trust/dashboard
 */
const getTrustDashboardStats = async (req, res) => {
    try {
        // Dynamic seed if empty
        await seedTrustMockData();

        // 1. Quality Scores
        const qualityVijayNagar = await calculateMarketplaceQualityScore(null, 'Vijay Nagar');
        const qualityIndore = await calculateMarketplaceQualityScore('Indore', null);
        const qualityVadodara = await calculateMarketplaceQualityScore('Vadodara Rural', null);
        
        // 2. Suppressed spam count
        const spamSuppressed = await FraudEvent.countDocuments({ eventType: 'spam_requests' });
        
        // 3. Active alerts
        const activeAlerts = await FraudEvent.countDocuments({ status: 'pending_moderation' });

        // 4. Fraud Events
        const fraudEvents = await FraudEvent.find()
            .populate('userId', 'name email role accountStatus')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // 5. Sellers list
        const sellersList = await SellerTrust.find()
            .populate('sellerId', 'name email shopDetails accountStatus')
            .sort({ trustScore: -1 })
            .lean();

        // 6. Customers list
        const customersList = await CustomerTrust.find()
            .populate('customerId', 'name email accountStatus')
            .sort({ trustScore: -1 })
            .lean();

        // 7. Risk profiles
        const riskProfiles = await RiskProfile.find()
            .populate('userId', 'name email role')
            .sort({ riskScore: -1 })
            .limit(10)
            .lean();

        // Platform Average Quality Score
        const platformSellers = await SellerTrust.find().select('trustScore').lean();
        const platformAverage = platformSellers.length > 0
            ? Math.round(platformSellers.reduce((acc, curr) => acc + curr.trustScore, 0) / platformSellers.length)
            : 85;

        res.json({
            success: true,
            platformAverage,
            activeAlerts,
            spamSuppressed,
            qualityVijayNagar,
            qualityIndore,
            qualityVadodara,
            fraudEvents,
            sellers: sellersList.map(s => ({
                _id: s._id,
                sellerId: s.sellerId?._id,
                name: s.sellerId?.name || 'Local Seller',
                email: s.sellerId?.email || 'N/A',
                shopName: s.sellerId?.shopDetails?.shopName || 'Unknown Shop',
                trustScore: s.trustScore,
                responseTime: s.responseTimeScore,
                stockAccuracy: s.stockAccuracyScore,
                completionRate: s.completionRateScore,
                accountStatus: s.sellerId?.accountStatus || 'active'
            })),
            customers: customersList.map(c => ({
                _id: c._id,
                customerId: c.customerId?._id,
                name: c.customerId?.name || 'Local Customer',
                email: c.customerId?.email || 'N/A',
                trustScore: c.trustScore,
                spamRequests: c.spamRequestsCount,
                cancellations: c.cancellationsCount,
                accountStatus: c.customerId?.accountStatus || 'active'
            })),
            riskProfiles
        });
    } catch (error) {
        console.error('[TrustController] Get Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/trust/recalculate
 */
const recalculateTrustScores = async (req, res) => {
    try {
        console.log('[TrustController] Triggering system-wide trust scoring recalculation...');
        const sellers = await User.find({ role: 'seller' });
        const customers = await User.find({ role: 'customer' });

        for (const seller of sellers) {
            await calculateSellerTrust(seller._id);
        }

        for (const customer of customers) {
            await calculateCustomerTrust(customer._id);
        }

        res.json({ success: true, message: `Recalculated trust parameters for ${sellers.length} sellers and ${customers.length} customers.` });
    } catch (error) {
        console.error('[TrustController] Score Recalculation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/trust/copilot/:userId
 */
const getModerationCopilotReasoning = async (req, res) => {
    try {
        const { userId } = req.params;
        const explanation = await getModerationCopilotDecision(userId);
        res.json({ success: true, explanation });
    } catch (error) {
        console.error('[TrustController] AI Copilot Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/trust/fraud-event/:id/respond
 */
const respondToFraudEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve', 'dismiss'

        if (!['approve', 'dismiss'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid moderation action. Must be approve or dismiss.' });
        }

        const fraudEvent = await FraudEvent.findById(id);
        if (!fraudEvent) {
            return res.status(404).json({ success: false, message: 'Fraud event alert not found.' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'dismissed';
        fraudEvent.status = newStatus;
        await fraudEvent.save();

        // If approved and severity is high or eventType duplicate_seller, auto-suspend user
        if (action === 'approve') {
            const userId = fraudEvent.userId;
            
            // Suspend customer/seller for security safety
            await User.findByIdAndUpdate(userId, {
                accountStatus: 'suspended'
            });

            // Adjust trust scores down immediately
            await calculateSellerTrust(userId);
            await calculateCustomerTrust(userId);
        }

        res.json({ success: true, message: `Fraud event alert successfully ${newStatus}ed.` });
    } catch (error) {
        console.error('[TrustController] Respond Fraud Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTrustDashboardStats,
    recalculateTrustScores,
    getModerationCopilotReasoning,
    respondToFraudEvent
};
