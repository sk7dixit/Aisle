const MarketTrends = require('../models/MarketTrends');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Returns location category growth rate indicators and logs them to DB.
 */
const checkMarketTrends = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Default area based on seller context (fallback to Indore)
    const area = context.shop?.address?.city || 'Indore';

    const aggregates = [
        { category: 'Organic Products', growth: 28 },
        { category: 'Healthy Snacks', growth: 19 },
        { category: 'Cold Drinks', growth: -11 }
    ];

    const trends = [];

    for (const agg of aggregates) {
        let trend = await MarketTrends.findOne({ area, category: agg.category });
        if (!trend) {
            trend = new MarketTrends({
                area,
                category: agg.category,
                growthRate: agg.growth
            });
        } else {
            trend.growthRate = agg.growth;
        }
        await trend.save();

        trends.push({
            area,
            category: agg.category,
            growthRate: agg.growth
        });
    }

    // Seasonal forecasts (monsoon/festivals)
    const month = new Date().getMonth();
    let seasonalName = 'Monsoon Season';
    let expectedDemandIncrease = 20; // +20%
    let recommendedProducts = ['Umbrellas', 'Raincoats', 'Snacks & Tea'];

    if (month >= 8 && month <= 10) {
        seasonalName = 'Festive Diwali / Dussehra';
        expectedDemandIncrease = 320; // +320%
        recommendedProducts = ['Diyas & Lanterns', 'Decorative LED Lights', 'Mithai Gift Boxes', 'Dry Fruit Hampers'];
    } else if (month === 7) {
        seasonalName = 'Raksha Bandhan';
        expectedDemandIncrease = 320;
        recommendedProducts = ['Designer Rakhis', 'Chocolate Gift Packs', 'Festive Sweet Trays'];
    }

    return {
        area,
        categoryTrends: trends,
        seasonal: {
            upcomingSeason: seasonalName,
            demandIncrease: expectedDemandIncrease,
            recommendations: recommendedProducts
        }
    };
};

module.exports = {
    checkMarketTrends
};
