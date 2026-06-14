const buildSellerContext = require('./context/contextBuilder');

/**
 * Returns competitor trending items and seasonal recommendations.
 */
const getMarketTrends = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Competitor Trending
    const trendingItems = [
        { name: 'Organic Milk', category: 'Grocery', potential: 'High' },
        { name: 'Fresh Paneer', category: 'Grocery', potential: 'High' },
        { name: 'Brown Bread', category: 'Grocery', potential: 'High' }
    ];

    // Determine seasonal demands based on date
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 4 is May, 5 is June, 9 is October, 10 is November

    let seasonName = 'Monsoon Season';
    let recommendations = ['Umbrellas', 'Raincoats', 'Snacks & Tea'];

    if (month >= 8 && month <= 10) {
        seasonName = 'Festive Diwali / Dussehra';
        recommendations = ['Diyas & Lanterns', 'Decorative LED Lights', 'Mithai Gift Boxes', 'Dry Fruit Hampers'];
    } else if (month === 7) {
        seasonName = 'Raksha Bandhan';
        recommendations = ['Designer Rakhis', 'Chocolate Gift Packs', 'Festive Sweet Trays'];
    }

    return {
        competitorTrends: trendingItems,
        seasonal: {
            upcomingSeason: seasonName,
            recommendations
        }
    };
};

module.exports = {
    getMarketTrends
};
