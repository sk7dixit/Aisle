const cron = require('node-cron');
const User = require('../models/User');
const NotificationCooldown = require('../models/NotificationCooldown');
const { sendNotification, NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../services/notificationService');
const { deriveShopStatus } = require('./shopStatusUtils');

/**
 * BACKGROUND SCHEDULER FOR RECURRING NOTIFICATIONS
 * Uses node-cron for precise, failure-safe execution.
 */
const startNotificationScheduler = () => {
    console.log('[Notification Scheduler] Started. Initializing 5 core cron jobs...');

    // ⏱️ CRON 1 — Stock Update Reminder (Kirana)
    // Frequency: Every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('[Cron] Running Stock Update Reminder (Kirana)...');
        try {
            const sellers = await User.find({
                role: 'seller',
                'shopDetails.category': { $regex: /grocery|kirana/i }
            });

            for (const seller of sellers) {
                const status = deriveShopStatus(seller.shopDetails);
                if (status === 'ONLINE') {
                    const lastUpdate = seller.shopDetails.lastStockUpdateAt || seller.updatedAt;
                    const hoursSince = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);

                    if (hoursSince >= 6) {
                        await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_STOCK_UPDATE_REMINDER);
                    }
                }
            }
        } catch (err) {
            console.error('[Cron Error] Stock Reminder:', err);
        }
    });

    // ⏱️ CRON 2 — Daily “Add New Product” Reminder
    // Frequency: Daily at 10:30 AM
    cron.schedule('30 10 * * *', async () => {
        console.log('[Cron] Running Daily Product Addition Reminder...');
        try {
            const sellers = await User.find({ role: 'seller' });
            for (const seller of sellers) {
                const lastAdded = seller.shopDetails?.lastProductAddedAt || seller.createdAt;
                const hoursSince = (Date.now() - new Date(lastAdded).getTime()) / (1000 * 60 * 60);

                if (hoursSince >= 24) {
                    await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_DAILY_ADD_PRODUCT_REMINDER);
                }
            }
        } catch (err) {
            console.error('[Cron Error] Add Product Reminder:', err);
        }
    });

    // ⏱️ CRON 3 — Daily Shop Visit Summary
    // Frequency: Daily at 9:00 PM
    cron.schedule('0 21 * * *', async () => {
        console.log('[Cron] Running Daily Visit Summary...');
        try {
            const sellers = await User.find({ role: 'seller', 'shopDetails.totalVisitsToday': { $gte: 15 } });
            for (const seller of sellers) {
                await sendNotification(seller._id, NOTIFICATION_TYPE.CUSTOMER_DAILY_SHOP_VISIT_SUMMARY, {
                    visitorCount: seller.shopDetails.totalVisitsToday
                });
            }
        } catch (err) {
            console.error('[Cron Error] Visit Summary:', err);
        }
    });

    // ⏱️ CRON 4 — Greeting Scheduler (Time-Based)
    // Frequency: Every 5 minutes (Light check)
    cron.schedule('*/5 * * * *', async () => {
        try {
            const sellers = await User.find({ role: 'seller' });
            const now = new Date();
            const hour = now.getHours();

            for (const seller of sellers) {
                const shop = seller.shopDetails || {};
                const currentStatus = deriveShopStatus(shop);

                // Open/Close greetings - notificationService handles 12h-24h cooldowns internally
                if (currentStatus === 'ONLINE' && !shop.isManuallyOnline) {
                    await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_SHOP_OPEN_GREETING);
                } else if (currentStatus === 'OFFLINE' && !shop.isManuallyOffline) {
                    await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_SHOP_CLOSE_GREETING);
                }

                // Midday Greeting (once/day around 2 PM)
                if (hour === 14 && currentStatus === 'ONLINE') {
                    await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_SHOP_DAY_GREETING);
                }
            }
        } catch (err) {
            console.error('[Cron Error] Greeting Scheduler:', err);
        }
    });

    // ⏱️ CRON 5 — Daily Safety Cleanup
    // Frequency: Daily at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] Running Daily Safety Cleanup...');
        try {
            // 1. Clean expired cooldowns
            const result = await NotificationCooldown.deleteMany({ expiresAt: { $lt: new Date() } });
            console.log(`[Cleanup] Deleted ${result.deletedCount} expired cooldowns.`);

            // 2. Validate unread counts (Sync with Actual DB)
            const Notification = require('../models/Notification');
            const sellers = await User.find({ role: 'seller' });
            for (const seller of sellers) {
                const actualUnread = await Notification.countDocuments({ user: seller._id, isRead: false });
                // If we were caching count on user model, we'd update it here.
                // Currently context fetches it directly, so this is just a health check.
            }
        } catch (err) {
            console.error('[Cron Error] Safety Cleanup:', err);
        }
    });
};

module.exports = { startNotificationScheduler };
