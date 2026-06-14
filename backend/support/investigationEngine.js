const InvestigationLog = require('../models/InvestigationLog');
const buildSellerContext = require('./context/contextBuilder');

/**
 * Runs a step-by-step diagnostic checklist and creates log entries.
 */
const runInvestigationSuite = async (sessionId, sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Clear any previous logs for this session to keep it clean
    await InvestigationLog.deleteMany({ sessionId });

    const logs = [];

    // Step 1: CHECKING_PRODUCTS
    const totalProducts = context.products?.totalProducts || 0;
    const inactiveProducts = context.products?.list?.filter(p => !p.active) || [];
    let productResult = 'SUCCESS';
    let productDetails = { totalProducts, inactiveProductsCount: inactiveProducts.length };
    if (totalProducts === 0 || inactiveProducts.length > 0) {
        productResult = totalProducts === 0 ? 'FAIL' : 'WARNING';
    }
    logs.push(await InvestigationLog.create({
        sessionId,
        step: 'CHECKING_PRODUCTS',
        result: productResult,
        details: productDetails
    }));

    // Step 2: CHECKING_INVENTORY
    const oosCount = context.products?.outOfStockCount || 0;
    let inventoryResult = 'SUCCESS';
    if (oosCount > 0) {
        inventoryResult = oosCount === totalProducts ? 'FAIL' : 'WARNING';
    }
    logs.push(await InvestigationLog.create({
        sessionId,
        step: 'CHECKING_INVENTORY',
        result: inventoryResult,
        details: { totalProducts, outOfStockCount: oosCount }
    }));

    // Step 3: CHECKING_VISIBILITY
    const isShopOffline = context.shop?.derivedStatus === 'OFFLINE';
    const hasLocation = context.shop?.hasLocation || false;
    let visibilityResult = 'SUCCESS';
    if (isShopOffline || !hasLocation) {
        visibilityResult = !hasLocation ? 'FAIL' : 'WARNING';
    }
    logs.push(await InvestigationLog.create({
        sessionId,
        step: 'CHECKING_VISIBILITY',
        result: visibilityResult,
        details: { derivedStatus: context.shop?.derivedStatus, hasLocation }
    }));

    // Step 4: CHECKING_OFFERS
    const offersList = context.offers?.list || [];
    const expiredOffers = offersList.filter(o => o.isExpired) || [];
    const disabledOffers = offersList.filter(o => o.status === 'Disabled') || [];
    let offersResult = 'SUCCESS';
    if (offersList.length === 0 || expiredOffers.length > 0 || disabledOffers.length > 0) {
        offersResult = expiredOffers.length > 0 ? 'FAIL' : 'WARNING';
    }
    logs.push(await InvestigationLog.create({
        sessionId,
        step: 'CHECKING_OFFERS',
        result: offersResult,
        details: { totalOffers: offersList.length, expiredOffersCount: expiredOffers.length, disabledOffersCount: disabledOffers.length }
    }));

    // Step 5: CHECKING_PAYMENTS
    const isSetupCompleted = context.payments?.paymentSetupCompleted || false;
    const bankVerified = context.payments?.bankStatus === 'VERIFIED';
    let paymentsResult = 'SUCCESS';
    if (!isSetupCompleted || !bankVerified) {
        paymentsResult = 'FAIL';
    }
    logs.push(await InvestigationLog.create({
        sessionId,
        step: 'CHECKING_PAYMENTS',
        result: paymentsResult,
        details: { setupCompleted: isSetupCompleted, bankStatus: context.payments?.bankStatus }
    }));

    return logs;
};

module.exports = {
    runInvestigationSuite
};
