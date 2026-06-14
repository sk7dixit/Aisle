const cron = require('node-cron');
const User = require('../models/User');
const SubscriptionLog = require('../models/SubscriptionLog');

const checkSubscriptionExpiries = async () => {
    console.log('[Job] Running daily expiry check...');
    try {
        const today = new Date();
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const oneDayFromNow = new Date();
        oneDayFromNow.setDate(now.getDate() + 1);

        // 1. Find Expired Subscriptions
        const expiredSellers = await User.find({
            'subscription.isActive': true,
            'subscription.endDate': { $lt: today },
            'subscription.planId': { $ne: 'free' }
        });

        console.log(`[Subscription Job] Found ${expiredSellers.length} expired subscriptions.`);

        for (const seller of expiredSellers) {
            const oldPlan = seller.subscription.planId;

            // Downgrade Logic
            seller.subscription.planId = 'free';
            seller.subscription.isActive = true;
            seller.subscription.endDate = null;

            await seller.save();

            // Log it
            await SubscriptionLog.create({
                sellerId: seller._id,
                action: 'EXPIRY',
                oldPlan: oldPlan,
                newPlan: 'free',
                reason: 'Subscription End Date Reached'
            });

            console.log(`[Subscription Job] Downgraded Seller ${seller._id} from ${oldPlan} to FREE.`);
        }

        // 2. Find Expired Boosts
        const expiredBoosts = await User.find({
            'visibilityBoost.isActive': true,
            'visibilityBoost.endDate': { $lt: today }
        });

        for (const seller of expiredBoosts) {
            seller.visibilityBoost.isActive = false;
            seller.visibilityBoost.boostType = null;
            seller.visibilityBoost.startDate = null;
            seller.visibilityBoost.endDate = null;

            await seller.save();

            await SubscriptionLog.create({
                sellerId: seller._id,
                action: 'BOOST_EXPIRED',
                oldPlan: 'boost',
                newPlan: 'none',
                reason: 'Boost End Date Reached'
            });
            console.log(`[Subscription Job] Deactivated Boost for Seller ${seller._id}.`);
        }

    } catch (error) {
        console.error('[Subscription Job Error] Error:', error);
        throw error;
    }
};

const startSubscriptionScheduler = () => {
    if (process.env.DISABLE_SCHEDULERS === 'true' || process.env.NODE_ENV === 'production') {
        console.log('[Subscription Scheduler] Running via background workers.');
        return;
    }

    cron.schedule('0 0 * * *', checkSubscriptionExpiries);
    console.log('[Subscription Scheduler] Initialized.');
};

module.exports = { startSubscriptionScheduler, checkSubscriptionExpiries };
