const buildSellerContext = require('./context/contextBuilder');
const SellerHealth = require('../models/SellerHealth');

/**
 * Computes health score weights using real-time context database details.
 */
const calculateSellerHealth = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Weights: Profile (15), Products (20), Inventory (20), Sales (20), Customer (15), Compliance (10)
    let profileScore = 0;
    let productsScore = 0;
    let inventoryScore = 0;
    let salesScore = 0;
    let customerScore = 0;
    let complianceScore = 0;

    // 1. Profile Health (15% Max)
    const hasDesc = !!context.shop?.description;
    const hasLogo = !!context.shop?.logo;
    const hasBanner = !!context.shop?.banner;
    profileScore += hasDesc ? 5 : 0;
    profileScore += hasLogo ? 5 : 0;
    profileScore += hasBanner ? 5 : 0;
    // Normalize to 100 base for factors storage
    const profileFactor = Math.round((profileScore / 15) * 100);

    // 2. Product Health (20% Max)
    const totalProducts = context.products?.totalProducts || 0;
    if (totalProducts > 0) {
        productsScore += 10; // Listing active items
        // check image attached ratio
        const list = context.products?.list || [];
        const withImages = list.filter(p => p.imagesCount > 0).length;
        const imageRatio = withImages / totalProducts;
        productsScore += imageRatio >= 0.8 ? 10 : Math.round(imageRatio * 10);
    }
    const productsFactor = Math.round((productsScore / 20) * 100);

    // 3. Inventory Health (20% Max)
    const oosCount = context.products?.outOfStockCount || 0;
    if (totalProducts > 0) {
        const oosRatio = oosCount / totalProducts;
        inventoryScore += Math.round((1 - oosRatio) * 20);
    } else {
        inventoryScore = 20; // Default perfect if no products yet to prevent double penalty
    }
    const inventoryFactor = Math.round((inventoryScore / 20) * 100);

    // 4. Sales Health (20% Max)
    const totalOrders = context.orders?.totalOrders || 0;
    const completedOrders = context.orders?.completedOrders || 0;
    if (totalOrders > 0) {
        salesScore += 10;
        const completionRatio = completedOrders / totalOrders;
        salesScore += Math.round(completionRatio * 10);
    } else {
        salesScore = 20; // Default perfect
    }
    const salesFactor = Math.round((salesScore / 20) * 100);

    // 5. Customer Health (15% Max)
    // Based on visits count
    const visits = context.orders?.totalOrders || 0; // fallback visit count indicator
    customerScore += visits > 0 ? 15 : 10;
    const customerFactor = Math.round((customerScore / 15) * 100);

    // 6. Platform Compliance (10% Max)
    const isKYCApproved = context.account?.verificationStatus === 'approved';
    const isPaymentSetup = context.payments?.paymentSetupCompleted || false;
    complianceScore += isKYCApproved ? 5 : 0;
    complianceScore += isPaymentSetup ? 5 : 0;
    const complianceFactor = Math.round((complianceScore / 10) * 100);

    const totalScore = profileScore + productsScore + inventoryScore + salesScore + customerScore + complianceScore;

    // Update or save
    let health = await SellerHealth.findOne({ sellerId });
    if (!health) {
        health = new SellerHealth({ sellerId });
    }
    health.score = totalScore;
    health.factors = {
        profile: profileFactor,
        products: productsFactor,
        inventory: inventoryFactor,
        sales: salesFactor,
        customer: customerFactor,
        compliance: complianceFactor
    };
    await health.save();

    return health;
};

module.exports = {
    calculateSellerHealth
};
