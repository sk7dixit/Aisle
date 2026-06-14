const buildSellerContext = require('../support/context/contextBuilder');
const RevenueOpportunities = require('../models/RevenueOpportunities');

/**
 * Computes promotional revenue optimization lifts.
 */
const optimizeRevenue = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Check if the shop type is Food & Beverage/Tiffin or Grocery to adjust mocks
    const isFoodService = context.shop?.category === 'Food & Beverage' || context.shop?.description?.toLowerCase().includes('tiffin');

    const recommendedOffers = [];

    if (isFoodService) {
        recommendedOffers.push({
            name: 'Lunch Combo Campaign',
            items: ['Roti', 'Sabzi', 'Rice'],
            price: 99,
            discount: 15,
            expectedReach: 850,
            estimatedRevenue: 3800
        });
    } else {
        recommendedOffers.push({
            name: 'Weekend Breakfast Combo',
            items: ['Milk', 'Brown Bread', 'Eggs'],
            price: 180,
            discount: 10,
            expectedReach: 1200,
            estimatedRevenue: 4500
        });
    }

    // Persist as opportunity
    const list = [];
    for (const offer of recommendedOffers) {
        let opp = await RevenueOpportunities.findOne({ sellerId, opportunity: `Combo offer campaign: ${offer.name}`, category: 'SEASONAL' });
        if (!opp) {
            opp = new RevenueOpportunities({
                sellerId,
                opportunity: `Combo offer campaign: ${offer.name}`,
                category: 'SEASONAL',
                estimatedRevenue: offer.estimatedRevenue,
                details: {
                    comboName: offer.name,
                    items: offer.items,
                    price: offer.price,
                    discount: offer.discount,
                    reach: offer.expectedReach
                }
            });
            await opp.save();
        }
        list.push({
            name: offer.name,
            items: offer.items,
            bundleName: offer.name,
            products: offer.items,
            price: offer.price,
            discount: offer.discount,
            salesIncrease: offer.discount,
            reach: offer.expectedReach,
            estimatedRevenue: offer.estimatedRevenue,
            opportunityId: opp._id
        });
    }

    return list;
};

module.exports = {
    optimizeRevenue
};
