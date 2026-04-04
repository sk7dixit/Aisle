const cron = require('node-cron');
const User = require('../models/User');
const SubscriptionLog = require('../models/SubscriptionLog');
const { SUBSCRIPTION_PLANS } = require('../config/subscriptionConfig');

const startSubscriptionScheduler = () => {
    // Run every day at mightnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Subscription Scheduler] Running daily expiry check...');
        try {
            const { createNotification } = require('../controllers/notificationController');

            const today = new Date();
            const now = new Date(); // Using 'now' for consistency with new logic
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(now.getDate() + 3);

            const oneDayFromNow = new Date();
            oneDayFromNow.setDate(now.getDate() + 1);

            // 1. Find Expired Subscriptions (Active, End Date < Today, Not Free)
            const expiredSellers = await User.find({
                'subscription.isActive': true,
                'subscription.endDate': { $lt: today },
                'subscription.planId': { $ne: 'free' } // Free never expires technically unless forced
            });

            console.log(`[Subscription Scheduler] Found ${expiredSellers.length} expired subscriptions.`);

            for (const seller of expiredSellers) {
                const oldPlan = seller.subscription.planId;

                // Downgrade Logic
                seller.subscription.planId = 'free';
                seller.subscription.isActive = true; // Active on Free
                seller.subscription.endDate = null; // Indefinite for Free

                await seller.save();

                // Log it
                await SubscriptionLog.create({
                    sellerId: seller._id,
                    action: 'EXPIRY',
                    oldPlan: oldPlan,
                    newPlan: 'free',
                    reason: 'Subscription End Date Reached'
                });

                console.log(`[Subscription Scheduler] Downgraded Seller ${seller._id} from ${oldPlan} to FREE.`);

                // Optional: Send Notification (Integration point)
                // await createNotification(seller._id, 'SYSTEM', 'Plan Expired', 'Your subscription has expired. You are now on the Free Premium plan.', 'HIGH');
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
                    oldPlan: 'boost', // simplified tracking
                    newPlan: 'none',
                    reason: 'Boost End Date Reached'
                });
                console.log(`[Subscription Scheduler] Deactivated Boost for Seller ${seller._id}.`);
            }

        } catch (error) {
            console.error('[Subscription Scheduler] Error:', error);
        }
    });

    console.log('[Subscription Scheduler] Initialized.');
};

module.exports = { startSubscriptionScheduler };
