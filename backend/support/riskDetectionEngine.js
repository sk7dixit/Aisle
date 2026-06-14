const RiskAlert = require('../models/RiskAlert');
const buildSellerContext = require('./context/contextBuilder');

/**
 * Scans the seller context for upcoming database risks.
 */
const detectRisks = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Clear previously unresolved alerts for this seller
    await RiskAlert.deleteMany({ sellerId, resolved: false });

    const alerts = [];

    // 1. Inventory Risk: Stock < 5
    const productsList = context.products?.list || [];
    for (const p of productsList) {
        if (p.quantity > 0 && p.quantity < 5) {
            alerts.push(await RiskAlert.create({
                sellerId,
                riskType: 'INVENTORY',
                severity: p.quantity <= 2 ? 'HIGH' : 'MEDIUM',
                message: `Inventory Risk: "${p.name}" is running low (${p.quantity} units left). Likely to exhaust soon.`,
                action: 'RESTOCK_INVENTORY',
                targetId: p.id,
                resolved: false
            }));
        }
    }

    // 2. Payment Risk: Setup Incomplete
    const isPaymentSetup = context.payments?.paymentSetupCompleted || false;
    const isBankVerified = context.payments?.bankStatus === 'VERIFIED';
    if (!isPaymentSetup || !isBankVerified) {
        alerts.push(await RiskAlert.create({
            sellerId,
            riskType: 'PAYMENT',
            severity: 'CRITICAL',
            message: 'Payment Risk: Bank account routing verification is pending. Future payouts will be held.',
            action: 'COMPLETE_PAYMENT_SETUP',
            resolved: false
        }));
    }

    // 3. Visibility Risk: Missing Images
    const missingImagesCount = productsList.filter(p => p.imagesCount === 0 && p.source === 'LOCAL').length;
    if (missingImagesCount > 0) {
        alerts.push(await RiskAlert.create({
            sellerId,
            riskType: 'VISIBILITY',
            severity: 'LOW',
            message: `Visibility Risk: ${missingImagesCount} product listings are missing cover photos, reducing discovery rate.`,
            action: 'MANAGE_PRODUCTS',
            resolved: false
        }));
    }

    return alerts;
};

module.exports = {
    detectRisks
};
