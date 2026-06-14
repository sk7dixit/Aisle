/**
 * Notification Source Enum
 */
const NOTIFICATION_SOURCE = {
    ADMIN: 'ADMIN',
    SYSTEM: 'SYSTEM',
    CUSTOMER: 'CUSTOMER'
};

/**
 * Notification Priority Enum
 */
const NOTIFICATION_PRIORITY = {
    CRITICAL: 'CRITICAL',
    IMPORTANT: 'IMPORTANT',
    INFO: 'INFO'
};

/**
 * Notification Types (The "Locked" List)
 */
const NOTIFICATION_TYPE = {
    // ADMIN TYPES
    ADMIN_WELCOME_ONBOARDING: 'ADMIN_WELCOME_ONBOARDING',
    ADMIN_SYSTEM_NOTICE: 'ADMIN_SYSTEM_NOTICE',
    ADMIN_PROFILE_ACTION_REQUIRED: 'ADMIN_PROFILE_ACTION_REQUIRED',

    // SYSTEM TYPES
    SYSTEM_STOCK_UPDATE_REMINDER: 'SYSTEM_STOCK_UPDATE_REMINDER',
    SYSTEM_STOCK_LIMITED_ALERT: 'SYSTEM_STOCK_LIMITED_ALERT',
    SYSTEM_STOCK_OUT_ALERT: 'SYSTEM_STOCK_OUT_ALERT',
    SYSTEM_DAILY_ADD_PRODUCT_REMINDER: 'SYSTEM_DAILY_ADD_PRODUCT_REMINDER',
    SYSTEM_SHOP_OPEN_GREETING: 'SYSTEM_SHOP_OPEN_GREETING',
    SYSTEM_SHOP_CLOSE_GREETING: 'SYSTEM_SHOP_CLOSE_GREETING',
    SYSTEM_SHOP_DAY_GREETING: 'SYSTEM_SHOP_DAY_GREETING',

    // CUSTOMER TYPES
    CUSTOMER_PRODUCT_INTERESTED: 'CUSTOMER_PRODUCT_INTERESTED',
    CUSTOMER_DAILY_SHOP_VISIT_SUMMARY: 'CUSTOMER_DAILY_SHOP_VISIT_SUMMARY'
};

/**
 * mapping Types to Source & Priority (Auto-derivation)
 */
const TYPE_CONFIG = {
    [NOTIFICATION_TYPE.ADMIN_WELCOME_ONBOARDING]: { source: NOTIFICATION_SOURCE.ADMIN, priority: NOTIFICATION_PRIORITY.INFO }, // Changed to INFO per Step 2 request
    [NOTIFICATION_TYPE.ADMIN_SYSTEM_NOTICE]: { source: NOTIFICATION_SOURCE.ADMIN, priority: NOTIFICATION_PRIORITY.IMPORTANT },
    [NOTIFICATION_TYPE.ADMIN_PROFILE_ACTION_REQUIRED]: { source: NOTIFICATION_SOURCE.ADMIN, priority: NOTIFICATION_PRIORITY.CRITICAL },

    [NOTIFICATION_TYPE.SYSTEM_STOCK_UPDATE_REMINDER]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.IMPORTANT },
    [NOTIFICATION_TYPE.SYSTEM_STOCK_LIMITED_ALERT]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.CRITICAL },
    [NOTIFICATION_TYPE.SYSTEM_STOCK_OUT_ALERT]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.CRITICAL },
    [NOTIFICATION_TYPE.SYSTEM_DAILY_ADD_PRODUCT_REMINDER]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.INFO },
    [NOTIFICATION_TYPE.SYSTEM_SHOP_OPEN_GREETING]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.INFO },
    [NOTIFICATION_TYPE.SYSTEM_SHOP_CLOSE_GREETING]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.INFO },
    [NOTIFICATION_TYPE.SYSTEM_SHOP_DAY_GREETING]: { source: NOTIFICATION_SOURCE.SYSTEM, priority: NOTIFICATION_PRIORITY.INFO },

    [NOTIFICATION_TYPE.CUSTOMER_PRODUCT_INTERESTED]: { source: NOTIFICATION_SOURCE.CUSTOMER, priority: NOTIFICATION_PRIORITY.CRITICAL },
    [NOTIFICATION_TYPE.CUSTOMER_DAILY_SHOP_VISIT_SUMMARY]: { source: NOTIFICATION_SOURCE.CUSTOMER, priority: NOTIFICATION_PRIORITY.INFO }
};

const SellerNotification = require('../models/SellerNotification');
const NotificationCooldown = require('../models/NotificationCooldown');
const User = require('../models/User');

/**
 * Cooldown Configuration (in milliseconds)
 */
const COOLDOWN_CONFIG = {
    [NOTIFICATION_TYPE.SYSTEM_STOCK_UPDATE_REMINDER]: 6 * 60 * 60 * 1000,   // 6 hours
    [NOTIFICATION_TYPE.SYSTEM_STOCK_LIMITED_ALERT]: 0,                    // Entity-specific handling (handled in logic or pass 0 for custom)
    [NOTIFICATION_TYPE.SYSTEM_STOCK_OUT_ALERT]: 0,                       // Entity-specific handling
    [NOTIFICATION_TYPE.SYSTEM_DAILY_ADD_PRODUCT_REMINDER]: 24 * 60 * 60 * 1000, // 24 hours
    [NOTIFICATION_TYPE.SYSTEM_SHOP_OPEN_GREETING]: 12 * 60 * 60 * 1000,    // 12 hours (once per shift)
    [NOTIFICATION_TYPE.SYSTEM_SHOP_CLOSE_GREETING]: 12 * 60 * 60 * 1000,   // 12 hours
    [NOTIFICATION_TYPE.CUSTOMER_DAILY_SHOP_VISIT_SUMMARY]: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Centralized Title & Message Engine
 */
const generateContent = (type, payload) => {
    switch (type) {
        case NOTIFICATION_TYPE.ADMIN_WELCOME_ONBOARDING:
            return {
                title: 'Welcome to Aisle!',
                message: `Hi ${payload.name || 'Seller'}, we're excited to have you. Let's start by adding your first product!`
            };
        case NOTIFICATION_TYPE.SYSTEM_STOCK_OUT_ALERT:
            return {
                title: 'Critical: Stock Out!',
                message: `Your product "${payload.productName}" is completely out of stock.`
            };
        case NOTIFICATION_TYPE.SYSTEM_STOCK_LIMITED_ALERT:
            return {
                title: 'Low Stock Warning',
                message: `Only ${payload.quantity} units left for "${payload.productName}". Restock soon!`
            };
        case NOTIFICATION_TYPE.SYSTEM_SHOP_OPEN_GREETING:
            return {
                title: 'Shop is Online',
                message: `Good day! Your shop is now visible to customers.`
            };
        case NOTIFICATION_TYPE.SYSTEM_SHOP_CLOSE_GREETING:
            return {
                title: 'Shop is Offline',
                message: `Your shop is now hidden. Have a great evening!`
            };
        case NOTIFICATION_TYPE.SYSTEM_SHOP_DAY_GREETING:
            return {
                title: 'Business is Booming',
                message: 'Good afternoon! Keep up the great work serving your community.'
            };
        case NOTIFICATION_TYPE.SYSTEM_STOCK_UPDATE_REMINDER:
            return {
                title: 'Update Your Stock',
                message: 'It has been 6 hours since your last update. Ensure your inventory is accurate for customers!'
            };
        case NOTIFICATION_TYPE.SYSTEM_DAILY_ADD_PRODUCT_REMINDER:
            return {
                title: 'Expand Your Catalog',
                message: "You haven't added a new product in a day. Adding fresh items keeps customers coming back!"
            };
        case NOTIFICATION_TYPE.CUSTOMER_DAILY_SHOP_VISIT_SUMMARY:
            return {
                title: 'Daily Traffic Summary',
                message: `Great News! Your shop had ${payload.visitorCount} visitors today.`
            };
        case NOTIFICATION_TYPE.CUSTOMER_PRODUCT_INTERESTED:
            return {
                title: 'New Product Interest',
                message: `${payload.customerName || 'A customer'} is interested in ${payload.productName}.`
            };
        default:
            return {
                title: payload.title || 'Notification',
                message: payload.message || 'You have a new update.'
            };
    }
};

/**
 * Single Entry Point for Notifications
 */
const sendNotification = async (sellerId, type, payload = {}, forceSync = false) => {
    // If not running in worker context and not forced synchronously, delegate to BullMQ
    if (process.env.IS_WORKER !== 'true' && !forceSync) {
        try {
            const { notificationQueue } = require('../config/queue');
            if (notificationQueue) {
                await notificationQueue.add('dispatchNotification', { sellerId, type, payload });
                console.log(`[Notification Service] Deferred notification of type ${type} to worker queue.`);
                return { status: 'DEFERRED' };
            }
        } catch (queueErr) {
            console.error('[Notification Service] Failed to queue notification job, falling back to sync:', queueErr.message);
        }
    }

    // 1. Enforcement & Config Check
    const config = TYPE_CONFIG[type];
    if (!config) {
        throw new Error(`Invalid notification type: ${type}. Must be added to NOTIFICATION_TYPE first.`);
    }

    // Acquire distributed lock to prevent duplicate sends across nodes
    const { acquireLock } = require('../utils/lockManager');
    let lock;
    try {
        lock = await acquireLock(`notification_lock:${sellerId}`, 5000);
    } catch (lockErr) {
        console.warn(`[Notification Service] Lock acquisition failed for user ${sellerId}. Skipping notification: ${type}`);
        return { status: 'SKIPPED', reason: 'LOCK_FAILED' };
    }

    try {
        const { source, priority } = config;
        const entityId = payload.entityId || 'GLOBAL';

        // 2. Preference Check
        const seller = await User.findById(sellerId);
        if (!seller) throw new Error('Seller not found');

        if (seller.notificationPreferences) {
            // Map priority/type to preferences
            // Critical is ALWAYS ON per design logic ("locked ON")
            if (priority === NOTIFICATION_PRIORITY.INFO && !seller.notificationPreferences.shopUpdates) {
                console.log(`[Notification Service] Skipping ${type} for ${sellerId} (Muted by User)`);
                return { status: 'SKIPPED', reason: 'USER_MUTED_INFO' };
            }
        }

        // 3. One-Time Welcome Logic
        if (type === NOTIFICATION_TYPE.ADMIN_WELCOME_ONBOARDING) {
            if (seller.shopDetails?.hasReceivedWelcomeNotification) {
                console.log(`[Notification Service] Skipping Welcome for ${sellerId} (Already sent)`);
                return { status: 'SKIPPED', reason: 'WELCOME_ALREADY_SENT' };
            }
        }

        // 3. Cooldown Logic
        const cooldownMs = COOLDOWN_CONFIG[type];
        if (cooldownMs !== undefined) {
            const lastSent = await NotificationCooldown.findOne({ sellerId, notificationType: type, entityId });

            if (lastSent) {
                const timePassed = Date.now() - lastSent.lastSentAt.getTime();

                if (cooldownMs === 0) {
                    console.log(`[Notification Service] Skipping ${type} for ${entityId} (Already alerted)`);
                    return { status: 'SKIPPED', reason: 'ENTITY_COOLDOWN_ACTIVE' };
                }

                if (timePassed < cooldownMs) {
                    console.log(`[Notification Service] Skipping ${type} for ${sellerId} (In cooldown)`);
                    return { status: 'SKIPPED', reason: 'COOLDOWN_ACTIVE' };
                }
            }
        }

        // 4. Content Generation
        const { title, message } = generateContent(type, payload);
        const actionUrl = payload.actionLink || null;
        const recipientRole = payload.recipientRole || 'seller';

        // 5. Create Notification (Consolidated Model)
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
            user: sellerId, // This is the recipient ID (seller or customer)
            recipientRole,
            type: type.startsWith('ADMIN') ? 'ANNOUNCEMENT' :
                type.startsWith('SYSTEM_STOCK') ? 'INVENTORY' : 'SYSTEM',
            priority: priority.toUpperCase(),
            title,
            message,
            actionUrl
        });

        // 6. Update Cooldown Tracker (Only for sellers currently, or global)
        if (payload.recipientRole !== 'customer') {
            await NotificationCooldown.findOneAndUpdate(
                { sellerId, notificationType: type, entityId },
                { lastSentAt: Date.now() },
                { upsert: true, new: true }
            );
        }

        // 7. Update User Flag for Welcome
        if (type === NOTIFICATION_TYPE.ADMIN_WELCOME_ONBOARDING) {
            await User.findByIdAndUpdate(sellerId, {
                'shopDetails.hasReceivedWelcomeNotification': true
            });
        }

        console.log(`[Notification Service] SENT ${type} to ${sellerId} (${payload.recipientRole || 'seller'})`);
        return { status: 'SENT', notification };
    } finally {
        if (lock) {
            await lock.release().catch(err => console.error('[Notification Lock] Release failed:', err.message));
        }
    }
};

module.exports = {
    NOTIFICATION_SOURCE,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_TYPE,
    sendNotification
};
