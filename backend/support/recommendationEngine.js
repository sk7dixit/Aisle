const buildSellerContext = require('./context/contextBuilder');

/**
 * Returns automated priority success tasks for the seller's dashboard.
 */
const getPrioritizedRecommendations = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const tasks = [];

    const { getRulesByShopType } = require('./business-rules');
    const shopType = context.shop?.shopType || 'GROCERY_KIRANA';
    const rules = getRulesByShopType(shopType);

    // Check inventory (only if NOT a service business)
    if (shopType !== 'SERVICES') {
        const productsList = context.products?.list || [];
        const outOfStock = productsList.filter(p => p.quantity === 0);
        const lowStock = productsList.filter(p => p.quantity > 0 && p.quantity < 5);

        outOfStock.forEach(p => {
            tasks.push({
                title: `Restock "${p.name}" (Out of stock)`,
                priority: 'HIGH',
                action: 'RESTOCK_INVENTORY',
                targetId: p.id
            });
        });

        lowStock.forEach(p => {
            tasks.push({
                title: `Restock "${p.name}" (Running low: ${p.quantity} units)`,
                priority: 'MEDIUM',
                action: 'RESTOCK_INVENTORY',
                targetId: p.id
            });
        });
    }

    // Add custom tasks from rules
    const customTasks = rules.getCustomTasks(context);
    customTasks.forEach(ct => {
        tasks.push({
            title: ct.task,
            priority: ct.priority,
            action: ct.action,
            targetId: ct.targetId
        });
    });

    // Check offers
    const offersList = context.offers?.list || [];
    const expiredOffer = offersList.find(o => o.isExpired);
    if (expiredOffer) {
        tasks.push({
            title: `Renew offer "${expiredOffer.title}" (Expired)`,
            priority: 'HIGH',
            action: 'EXTEND_OFFER',
            targetId: expiredOffer.id
        });
    }

    // Check payments
    if (!context.payments?.paymentSetupCompleted) {
        tasks.push({
            title: 'Complete bank route KYC details setup',
            priority: 'HIGH',
            action: 'COMPLETE_PAYMENT_SETUP'
        });
    }

    // Add generic fallback if empty
    if (tasks.length === 0) {
        tasks.push({
            title: 'Add a new discount offer to boost local traffic',
            priority: 'LOW',
            action: 'CREATE_OFFER'
        });
        tasks.push({
            title: 'Verify shop working schedules are up to date',
            priority: 'LOW',
            action: 'TOGGLE_SHOP_HOURS'
        });
    }

    return tasks;
};

module.exports = {
    getPrioritizedRecommendations
};
