const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Creates custom combo offers and promotion configurations.
 */
const generateCampaign = async (sellerId, campaignType, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    let comboName = "Weekend Breakfast Combo";
    let discount = 10;
    let expectedReach = 1200;
    let products = ["Milk", "Brown Bread", "Eggs"];

    if (campaignType === 'FOOD_LUNCH' || context.shop?.category === 'Food & Beverage') {
        comboName = "Healthy Lunch Combo";
        discount = 15;
        expectedReach = 850;
        products = ["Roti", "Sabzi", "Rice"];
    }

    return {
        success: true,
        campaign: {
            name: comboName,
            type: campaignType || 'COMBO_DISCOUNT',
            discount,
            products,
            reach: expectedReach,
            estimatedSalesBoost: 22,
            active: true
        }
    };
};

module.exports = {
    generateCampaign
};
