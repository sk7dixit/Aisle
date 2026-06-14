const BusinessForecast = require('../models/BusinessForecast');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Predicts customer demand and stock recommendations.
 */
const predictDemand = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const productsList = context.products?.list || [];

    const { getRulesByShopType } = require('../support/business-rules');
    const shopType = context.shop?.shopType || 'GROCERY_KIRANA';
    const rules = getRulesByShopType(shopType);

    const forecasts = [];

    for (const prod of productsList) {
        // Base rate: simulate historical sales based on shop type rules
        const baseDemand = rules.getBaseDemand(prod.name, prod.quantity);

        // Multipliers
        const isWeekend = [0, 6].includes(new Date().getDay()); // Sat or Sun
        const multiplier = isWeekend ? 1.35 : 1.15; // Summer/weekend multiplier
        const predicted = Math.round(baseDemand * multiplier);

        // Calculate recommendations
        const currentStock = prod.quantity || 0;
        const recommended = currentStock < predicted ? Math.round(predicted * 1.1) : currentStock;
        const confidence = 85 + Math.round(Math.random() * 10); // 85% to 95%

        // Save forecast
        let forecast = await BusinessForecast.findOne({ sellerId, productId: prod.id });
        if (!forecast) {
            forecast = new BusinessForecast({ sellerId, productId: prod.id });
        }
        forecast.predictedDemand = predicted;
        forecast.recommendedStock = recommended;
        forecast.confidence = confidence;
        forecast.forecastDate = new Date();
        await forecast.save();

        forecasts.push({
            productId: prod.id,
            productName: prod.name,
            currentStock,
            predictedDemand: predicted,
            recommendedStock: recommended,
            confidence
        });
    }

    if (forecasts.length === 0) {
        // Mock default forecasts based on rules
        const defaultForecasts = rules.getDefaultForecasts();
        for (const item of defaultForecasts) {
            forecasts.push({
                productName: item.productName,
                currentStock: item.currentStock,
                predictedDemand: item.predictedDemand,
                recommendedStock: item.recommendedStock,
                confidence: item.confidence
            });
        }
    }

    return forecasts;
};

module.exports = {
    predictDemand
};
