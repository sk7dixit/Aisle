const BusinessTasks = require('../models/BusinessTasks');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Compiles and persists today's task checklist.
 */
const generateTasks = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Clear pending tasks to regenerate fresh daily tasks
    await BusinessTasks.deleteMany({ sellerId, status: 'PENDING' });

    const tasksList = [];

    const { getRulesByShopType } = require('../support/business-rules');
    const shopType = context.shop?.shopType || 'GROCERY_KIRANA';
    const rules = getRulesByShopType(shopType);

    // 1. Check stock / operating mode tasks (only if NOT a service business)
    const operatingMode = context.shop?.operatingMode || 'GUARANTEED';
    if (shopType !== 'SERVICES') {
        if (operatingMode === 'GUARANTEED') {
            const products = context.products?.list || [];
            const lowStock = products.filter(p => p.quantity < 5);
            for (const prod of lowStock) {
                tasksList.push({
                    sellerId,
                    task: `Restock "${prod.name}" (Current stock: ${prod.quantity || 0} units)`,
                    priority: (prod.quantity === 0) ? 'HIGH' : 'MEDIUM',
                    action: 'RESTOCK_INVENTORY',
                    targetId: prod.id
                });
            }
        } else if (operatingMode === 'BEST_EFFORT') {
            tasksList.push({
                sellerId,
                task: 'Verify and update catalog stock levels',
                priority: 'MEDIUM',
                action: 'UPDATE_STOCK_REMINDER'
            });
        } else if (operatingMode === 'RUSH') {
            tasksList.push({
                sellerId,
                task: 'Review customer inquiries & call requests',
                priority: 'MEDIUM',
                action: 'REVIEW_INQUIRIES'
            });
        }
    }

    // 1.5. Add custom tasks from rules
    const customTasks = rules.getCustomTasks(context);
    for (const ct of customTasks) {
        tasksList.push({
            sellerId,
            task: ct.task,
            priority: ct.priority,
            action: ct.action,
            targetId: ct.targetId
        });
    }

    // 2. Check expired offers
    const offers = context.offers?.list || [];
    const expired = offers.find(o => o.isExpired);
    if (expired) {
        tasksList.push({
            sellerId,
            task: `Renew offer campaign: "${expired.title}"`,
            priority: 'HIGH',
            action: 'EXTEND_OFFER',
            targetId: expired.id
        });
    }

    // 3. Check bank kyc
    if (!context.payments?.paymentSetupCompleted) {
        tasksList.push({
            sellerId,
            task: 'Complete bank account KYC validation to unlock payouts',
            priority: 'HIGH',
            action: 'COMPLETE_PAYMENT_SETUP'
        });
    }

    // 4. Check profile description banner
    if (!context.shop?.banner) {
        tasksList.push({
            sellerId,
            task: 'Upload shop brand banner cover photo',
            priority: 'LOW',
            action: 'UPLOAD_BANNER'
        });
    }

    // 5. Add default fallback task
    if (tasksList.length === 0) {
        tasksList.push({
            sellerId,
            task: 'Refresh shop operating hours status',
            priority: 'LOW',
            action: 'TOGGLE_SHOP_HOURS'
        });
    }

    // Save tasks to DB
    const saved = [];
    for (const item of tasksList) {
        const doc = await BusinessTasks.create(item);
        saved.push(doc);
    }

    // Load both completed and pending
    return await BusinessTasks.find({ sellerId }).sort({ status: 1, createdAt: -1 });
};

module.exports = {
    generateTasks
};
