const buildSellerContext = require('./context/contextBuilder');

/**
 * Recommends new inventory items based on nearby customer search keywords.
 */
const analyzeLocalDemand = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const productsList = context.products?.list || [];

    const popularDemands = [
        { name: 'Brown Bread', category: 'Grocery', potential: 'High' },
        { name: 'Organic Honey', category: 'Grocery', potential: 'High' },
        { name: 'Fresh Paneer', category: 'Grocery', potential: 'High' }
    ];

    const missingDemands = popularDemands.filter(d => {
        // If the seller does not stock any product containing the name
        return !productsList.some(p => p.name.toLowerCase().includes(d.name.toLowerCase()));
    });

    return missingDemands;
};

module.exports = {
    analyzeLocalDemand
};
