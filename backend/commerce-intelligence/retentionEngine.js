const buildSellerContext = require('../support/context/contextBuilder');
const RevenueOpportunities = require('../models/RevenueOpportunities');

/**
 * Scans regular customer purchase cycles to detect churn risks and suggest loyalty campaigns.
 */
const checkCustomerRetention = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Core logic: mock regular buyers who haven't returned in 14 days
    const regularBuyersChurnList = [
        { name: 'Amit Sharma', items: ['Milk', 'Bread'], lastPurchaseDaysAgo: 14, loyaltyOffer: '5% Loyalty Discount' },
        { name: 'Pooja Patel', items: ['Organic Paneer'], lastPurchaseDaysAgo: 18, loyaltyOffer: '7% Return Voucher' }
    ];

    const results = [];

    for (const buyer of regularBuyersChurnList) {
        const title = `Potential Lost Customer: ${buyer.name}`;
        const estRevenue = 1500;
        
        let opp = await RevenueOpportunities.findOne({ sellerId, opportunity: title, category: 'RETENTION' });
        if (!opp) {
            opp = new RevenueOpportunities({
                sellerId,
                opportunity: title,
                category: 'RETENTION',
                estimatedRevenue: estRevenue,
                details: {
                    customerName: buyer.name,
                    preferredItems: buyer.items,
                    inactiveDays: buyer.lastPurchaseDaysAgo,
                    suggestedDiscount: buyer.loyaltyOffer
                }
            });
            await opp.save();
        }

        results.push({
            customerName: buyer.name,
            preferredItems: buyer.items,
            inactiveDays: buyer.lastPurchaseDaysAgo,
            suggestedDiscount: buyer.loyaltyOffer,
            estimatedRevenue: estRevenue,
            opportunityId: opp._id
        });
    }

    return results;
};

module.exports = {
    checkCustomerRetention
};
