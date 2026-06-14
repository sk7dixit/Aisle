const Otp = require('../models/Otp');
const ActivityLog = require('../models/ActivityLog');
const NotificationLog = require('../models/NotificationLog');
const SecurityLog = require('../models/SecurityLog');
const Product = require('../models/Product');
const SellerProduct = require('../models/SellerProduct');
const Offer = require('../models/Offer');

/**
 * Runs the database data retention purge routines.
 * Enforces:
 * - OTP: Purge OTP records older than 10 minutes
 * - Activity Logs: Purge system activity logs older than 90 days
 * - Notification Logs: Purge logs older than 90 days
 * - Security Audit Logs: Purge audit logs older than 365 days
 * - Soft Deleted Products/Offers: Purge soft-deleted documents older than 30 days
 */
const runDataRetentionPurge = async () => {
    console.log('[Data Retention Service] Starting database purge routines...');

    try {
        const now = Date.now();

        // 1. Purge OTPs older than 10 minutes
        const otpCutoff = new Date(now - 10 * 60 * 1000);
        const otpRes = await Otp.deleteMany({ createdAt: { $lt: otpCutoff } });
        console.log(`[Data Retention Service] Purged ${otpRes.deletedCount} expired OTP records.`);

        // 2. Purge Activity Logs older than 90 days
        const activityCutoff = new Date(now - 90 * 24 * 60 * 60 * 1000);
        const activityRes = await ActivityLog.deleteMany({ createdAt: { $lt: activityCutoff } });
        console.log(`[Data Retention Service] Purged ${activityRes.deletedCount} system activity logs older than 90 days.`);

        // 3. Purge Notification Logs older than 90 days
        const notificationCutoff = new Date(now - 90 * 24 * 60 * 60 * 1000);
        const notificationRes = await NotificationLog.deleteMany({ createdAt: { $lt: notificationCutoff } });
        console.log(`[Data Retention Service] Purged ${notificationRes.deletedCount} notification logs older than 90 days.`);

        // 4. Purge Security Logs older than 365 days (1 year)
        const securityCutoff = new Date(now - 365 * 24 * 60 * 60 * 1000);
        const securityRes = await SecurityLog.deleteMany({ createdAt: { $lt: securityCutoff } });
        console.log(`[Data Retention Service] Purged ${securityRes.deletedCount} security audit logs older than 1 year.`);

        // 5. Purge Soft-deleted records older than 30 days
        const softDeleteCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        // We query by using bypass of soft-delete pre-hooks by directly querying with `{ deleted: true }`
        // Mongoose pre-find query hooks match `find`, `findOne`, `findOneAndUpdate`, `countDocuments`. 
        // Mongoose `deleteMany` does not invoke find pre-hooks by default, but to be completely safe, 
        // we specify `{ deleted: true, deletedAt: { $lt: softDeleteCutoff } }`.
        const productRes = await Product.deleteMany({ deleted: true, deletedAt: { $lt: softDeleteCutoff } });
        const sellerProductRes = await SellerProduct.deleteMany({ deleted: true, deletedAt: { $lt: softDeleteCutoff } });
        const offerRes = await Offer.deleteMany({ deleted: true, deletedAt: { $lt: softDeleteCutoff } });

        console.log(`[Data Retention Service] Purged soft-deleted records older than 30 days: ` +
                    `${productRes.deletedCount} products, ${sellerProductRes.deletedCount} seller products, ${offerRes.deletedCount} offers.`);

        console.log('[Data Retention Service] Database purge routines completed successfully.');
    } catch (error) {
        console.error('[Data Retention Service] Error during database purge routines:', error.message);
    }
};

module.exports = { runDataRetentionPurge };
