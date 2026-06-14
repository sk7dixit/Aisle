const RevenueOpportunities = require('../models/RevenueOpportunities');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Scans local search gaps and compiles missed revenue opportunities.
 */
const analyzeCustomerDemand = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const productsList = context.products?.list || [];

    const { getRulesByShopType } = require('../support/business-rules');
    const shopType = context.shop?.shopType || 'GROCERY_KIRANA';
    const rules = getRulesByShopType(shopType);
    const searchGaps = rules.getSearchGaps();

    const results = [];

    for (const gap of searchGaps) {
        // Only trigger if the seller does not stock this product
        const stocksProduct = productsList.some(p => p.name.toLowerCase().includes(gap.name.toLowerCase()));
        if (!stocksProduct) {
            let opp = await RevenueOpportunities.findOne({ sellerId, opportunity: `Missed Local Demand: ${gap.name}`, category: 'DEMAND_GAP' });
            if (!opp) {
                opp = new RevenueOpportunities({
                    sellerId,
                    opportunity: `Missed Local Demand: ${gap.name}`,
                    category: 'DEMAND_GAP',
                    estimatedRevenue: gap.estimatedRevenue,
                    details: {
                        productName: gap.name,
                        searchesCount: gap.searches,
                        impactScore: 'High',
                        category: gap.category
                    }
                });
                await opp.save();
            }

            results.push({
                productName: gap.name,
                searches: gap.searches,
                estimatedRevenue: gap.estimatedRevenue,
                impactScore: 'High',
                category: gap.category,
                opportunityId: opp._id
            });
        }
    }

    return results;
};

module.exports = {
    analyzeCustomerDemand
};
