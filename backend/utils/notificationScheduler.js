const cron = require('node-cron');
const User = require('../models/User');
const NotificationCooldown = require('../models/NotificationCooldown');
const { sendNotification, NOTIFICATION_TYPE } = require('../services/notificationService');
const { deriveShopStatus } = require('./shopStatusUtils');

const checkStockUpdateReminders = async () => {
    console.log('[Job] Running Stock Update Reminder (Kirana)...');
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
        console.error('[Job Error] Stock Reminder:', err);
        throw err;
    }
};

const checkProductAdditionReminders = async () => {
    console.log('[Job] Running Daily Product Addition Reminder...');
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
        console.error('[Job Error] Add Product Reminder:', err);
        throw err;
    }
};

const checkShopVisitSummaries = async () => {
    console.log('[Job] Running Daily Visit Summary...');
    try {
        const sellers = await User.find({ role: 'seller', 'shopDetails.totalVisitsToday': { $gte: 15 } });
        for (const seller of sellers) {
            await sendNotification(seller._id, NOTIFICATION_TYPE.CUSTOMER_DAILY_SHOP_VISIT_SUMMARY, {
                visitorCount: seller.shopDetails.totalVisitsToday
            });
        }
    } catch (err) {
        console.error('[Job Error] Visit Summary:', err);
        throw err;
    }
};

const checkGreetings = async () => {
    try {
        const sellers = await User.find({ role: 'seller' });
        const now = new Date();
        const hour = now.getHours();

        for (const seller of sellers) {
            const shop = seller.shopDetails || {};
            const currentStatus = deriveShopStatus(shop);

            // Open/Close greetings - notificationService handles cooldowns internally
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
        console.error('[Job Error] Greeting Scheduler:', err);
        throw err;
    }
};

const checkSafetyCleanup = async () => {
    console.log('[Job] Running Daily Safety Cleanup...');
    try {
        // 1. Clean expired cooldowns
        const result = await NotificationCooldown.deleteMany({ expiresAt: { $lt: new Date() } });
        console.log(`[Cleanup] Deleted ${result.deletedCount} expired cooldowns.`);

        // 2. Validate unread counts (Sync with Actual DB)
        const Notification = require('../models/Notification');
        const sellers = await User.find({ role: 'seller' });
        for (const seller of sellers) {
            await Notification.countDocuments({ user: seller._id, isRead: false });
        }
    } catch (err) {
        console.error('[Job Error] Safety Cleanup:', err);
        throw err;
    }
};

const processFailedEmails = async () => {
    console.log('[Job] Processing Failed Emails (DLQ Retry)...');
    try {
        const FailedNotification = require('../models/FailedNotification');
        const sendGridService = require('../services/sendGridService');
        
        // Find notifications that are pending or failed, and have been retried less than 5 times
        const failedNotifs = await FailedNotification.find({
            status: { $in: ['pending', 'failed'] },
            attempts: { $lt: 5 }
        }).limit(20);

        if (failedNotifs.length === 0) return;

        console.log(`[Job] Found ${failedNotifs.length} failed emails to retry.`);

        for (const notif of failedNotifs) {
            notif.status = 'retrying';
            notif.attempts += 1;
            await notif.save();

            try {
                // Using sendGridService.sendEmail with skipFallback = true so it throws if it fails
                const success = await sendGridService.sendEmail({
                    to: notif.to,
                    subject: notif.subject,
                    text: notif.text,
                    html: notif.html,
                    skipFallback: true
                });

                if (success) {
                    await FailedNotification.findByIdAndDelete(notif._id);
                    console.log(`[Job] Successfully re-sent failed email to ${notif.to}`);
                }
            } catch (err) {
                notif.status = 'failed';
                notif.lastError = err.message;
                await notif.save();
                console.error(`[Job] Retry failed for email to ${notif.to}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Job Error] processFailedEmails:', err.message);
    }
};

/**
 * START SCHEDULER (Fallback for non-production environments)
 */
const startNotificationScheduler = () => {
    if (process.env.DISABLE_SCHEDULERS === 'true' || process.env.NODE_ENV === 'production') {
        console.log('[Notification Scheduler] Running via background workers.');
        return;
    }

    console.log('[Notification Scheduler] Started. Initializing 6 core cron jobs...');

    cron.schedule('0 */6 * * *', checkStockUpdateReminders);
    cron.schedule('30 10 * * *', checkProductAdditionReminders);
    cron.schedule('0 21 * * *', checkShopVisitSummaries);
    cron.schedule('*/5 * * * *', checkGreetings);
    cron.schedule('0 3 * * *', checkSafetyCleanup);
    cron.schedule('*/5 * * * *', processFailedEmails);
};

module.exports = {
    startNotificationScheduler,
    checkStockUpdateReminders,
    checkProductAdditionReminders,
    checkShopVisitSummaries,
    checkGreetings,
    checkSafetyCleanup,
    processFailedEmails
};
