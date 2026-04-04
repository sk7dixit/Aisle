const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const StockInsight = require('../models/StockInsight');

/**
 * AI Stock Assistant Logic
 * Analyze historical movements to provide non-actionable suggestions.
 */
const generateStockInsights = async (sellerId) => {
    try {
        const insights = [];
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 1. Fetch data
        const movements = await StockMovement.find({
            seller: sellerId,
            createdAt: { $gte: thirtyDaysAgo },
            reason: { $in: ['SALE_CONFIRMED', 'DAILY_RESET'] }
        }).populate('product');

        const products = await Product.find({ seller: sellerId, isParent: false });

        // --- LOGIC A: DAILY RESET TRENDS (GROCERY/KIRANA) ---
        const dailyResetProds = products.filter(p => p.productType === 'DAILY_ESSENTIAL');
        for (const p of dailyResetProds) {
            const resets = movements.filter(m => m.product?._id.equals(p._id) && m.reason === 'DAILY_RESET');
            if (resets.length > 5) {
                insights.push({
                    seller: sellerId,
                    product: p._id,
                    message: `You regularly restock ${p.name} every morning.`,
                    type: 'TREND',
                    confidence: 'High',
                    context: 'Based on your daily reset history'
                });
            }
        }

        // --- LOGIC B: SALES VOLUME & STOCKOUT RISK ---
        for (const p of products) {
            const sales = movements.filter(m => m.product?._id.equals(p._id) && m.reason === 'SALE_CONFIRMED');
            const totalSold = Math.abs(sales.reduce((acc, m) => acc + m.change, 0));

            if (totalSold > 0) {
                const avgDailySales = totalSold / 30;

                // Risk: Stockout soon?
                if (p.countInStock > 0 && p.countInStock < (avgDailySales * 2)) {
                    insights.push({
                        seller: sellerId,
                        product: p._id,
                        message: `${p.name} might sell out in the next 48 hours.`,
                        type: 'RISK',
                        confidence: 'Medium',
                        context: `Based on your average sales of ${avgDailySales.toFixed(1)}/day`
                    });
                }

                // Trend: High Demand
                if (totalSold > 20) {
                    insights.push({
                        seller: sellerId,
                        product: p._id,
                        message: `${p.name} was a top-seller this month (${totalSold} units).`,
                        type: 'TREND',
                        confidence: 'High',
                        context: 'Based on last 30 days'
                    });
                }
            } else if (p.createdAt < thirtyDaysAgo) {
                // Trend: Slow Mover
                insights.push({
                    seller: sellerId,
                    product: p._id,
                    message: `${p.name} hasn't sold in over 30 days.`,
                    type: 'TREND',
                    confidence: 'Medium',
                    context: 'Review pricing or placement'
                });
            }
        }

        // --- LOGIC C: PHARMACY EXPIRY SAFETY ---
        const pharmacyProds = products.filter(p => p.productType === 'EXPIRY_BASED' && p.expiryDate);
        for (const p of pharmacyProds) {
            const exp = new Date(p.expiryDate);
            const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

            if (diffDays <= 30 && diffDays > 0) {
                insights.push({
                    seller: sellerId,
                    product: p._id,
                    message: `${p.name} expires in ${diffDays} days. Consider clearing stock.`,
                    type: 'EXPIRY',
                    confidence: 'High',
                    context: 'Safety Alert'
                });
            }
        }

        // 2. Clear old insights (keep only non-feedback ones or just fresh start)
        await StockInsight.deleteMany({ seller: sellerId, feedback: null });

        // 3. Save new insights (limit to top 5)
        const topInsights = insights.slice(0, 5);
        if (topInsights.length > 0) {
            await StockInsight.insertMany(topInsights);
        }

        return topInsights;

    } catch (error) {
        console.error("Insight Generation Error:", error);
        return [];
    }
};

module.exports = { generateStockInsights };
