const User = require('../models/User');
const Product = require('../models/Product');
const SellerProduct = require('../models/SellerProduct');
const StockMovement = require('../models/StockMovement');
const { handleStockStatusChange } = require('../services/notificationHooks');

/**
 * KIRANA DAILY STOCK RESET
 * Triggers at 11:59 PM nightly.
 */
const performDailyReset = async () => {
    try {
        console.log("=== STARTING DAILY STOCK RESET JOB ===");

        // 0. Reset Visit Counts for ALL Sellers
        await User.updateMany({ role: 'seller' }, {
            $set: { 'shopDetails.totalVisitsToday': 0 }
        });
        console.log("Reset daily visit counts for all sellers.");

        // 1. Find all Grocery/Kirana Sellers
        const sellers = await User.find({
            role: 'seller',
            'shopDetails.category': { $regex: /grocery|kirana/i }
        }).select('_id shopDetails.category');

        const sellerIds = sellers.map(s => s._id);
        console.log(`Found ${sellerIds.length} eligible Kirana sellers.`);

        if (sellerIds.length === 0) return;

        // 2. Process Loose Products
        const looseProducts = await Product.find({
            seller: { $in: sellerIds },
            productType: 'DAILY_ESSENTIAL',
            countInStock: { $gt: 0 }
        });

        console.log(`Resetting ${looseProducts.length} loose products...`);
        for (const p of looseProducts) {
            const prevQty = p.countInStock;
            p.countInStock = 0;
            await p.save();

            // Audit
            await StockMovement.create({
                seller: p.seller,
                product: p._id,
                change: -prevQty,
                reason: 'DAILY_RESET',
                notes: `System daily reset for ${p.name}`
            });

            // Trigger Alert
            handleStockStatusChange(p.seller, p.name, p._id, prevQty, 0, p.lowStockThreshold || 10).catch(() => { });
        }

        // 3. Process Linked Products
        const linkedProducts = await SellerProduct.find({
            seller: { $in: sellerIds },
            productType: 'DAILY_ESSENTIAL',
            countInStock: { $gt: 0 }
        });

        console.log(`Resetting ${linkedProducts.length} linked products...`);
        for (const sp of linkedProducts) {
            const prevQty = sp.countInStock;
            sp.countInStock = 0;
            await sp.save();

            // Audit
            await StockMovement.create({
                seller: sp.seller,
                sellerProduct: sp._id,
                change: -prevQty,
                reason: 'DAILY_RESET',
                notes: `System daily reset for linked product`
            });

            // Trigger Alert
            handleStockStatusChange(sp.seller, 'Linked Product', sp._id, prevQty, 0, sp.lowStockThreshold || 10).catch(() => { });
        }

        console.log("=== DAILY STOCK RESET JOB COMPLETED ===");
    } catch (error) {
        console.error("CRITICAL: Daily Stock Reset Job Failed", error);
    }
};

/**
 * START SCHEDULER
 * Calculates time until 23:59 and sets timeout/interval.
 */
const startStockScheduler = () => {
    const scheduleNext = () => {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(23, 59, 0, 0);

        // If it's already past 23:59, schedule for tomorrow
        if (now > nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        const msUntilNext = nextRun - now;
        console.log(`Stock Scheduler: Next reset in ${Math.round(msUntilNext / 60000)} minutes.`);

        setTimeout(async () => {
            await performDailyReset();
            scheduleNext(); // Re-schedule for next day
        }, msUntilNext);
    };

    scheduleNext();
};

module.exports = { startStockScheduler, performDailyReset };
