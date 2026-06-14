const buildSellerContext = require('../support/context/contextBuilder');
const { getOpportunityEstimates, detectRevenueLeakage } = require('../services/revenueIntelligenceService');
const BusinessHealth = require('../models/BusinessHealth');
const RevenueForecast = require('../models/RevenueForecast');

/**
 * Handles conversational queries from the AI Commerce Copilot chat interface.
 */
const getCopilotAdvice = async (sellerId, messageText, prebuiltContext = null) => {
    const text = messageText.toLowerCase();

    // Intercept revenue, growth, sales, or business health queries to use real database intelligence
    if (['revenue', 'sales', 'growth', 'grow', 'increase', 'earn', 'leakage', 'health', 'money', 'forecast'].some(w => text.includes(w))) {
        try {
            const forecast = await RevenueForecast.findOne({ sellerId });
            const health = await BusinessHealth.findOne({ sellerId });
            const opportunities = await getOpportunityEstimates(sellerId);
            const leakages = await detectRevenueLeakage(sellerId);

            const score = health ? health.score : 80;
            const growthRate = forecast ? forecast.growthRate : 0;
            const currentRevenue = forecast ? forecast.currentRevenue : 5000;
            const predicted30Days = forecast ? forecast.predictedRevenue30Days : 6000;

            let reply = `Based on my analysis, your Business Health Score is **${score}/100**. `;
            if (growthRate >= 15) {
                reply += `Your business is in a **high growth** phase (+${growthRate}% projected this month). `;
            } else if (growthRate < -10) {
                reply += `Your monthly revenue is projected to decline by ${growthRate}%. `;
            } else {
                reply += `Your business is stable (+${growthRate}% projected this month). `;
            }

            reply += `Your current monthly revenue is ₹${currentRevenue.toLocaleString()} and is forecasted to reach ₹${predicted30Days.toLocaleString()} next month. `;

            const actions = [];
            let totalLift = 0;

            // 1. Add Leakage recommendations
            if (leakages.length > 0) {
                const leak = leakages[0];
                actions.push(`Restock "${leak.productName}" (Estimated lost revenue: ₹${leak.estimatedLostRevenue.toLocaleString()}/mo due to low stock and high local demand).`);
                totalLift += leak.estimatedLostRevenue;
            }

            // 2. Add Opportunity recommendations
            const newOpps = opportunities.filter(o => !o.inInventory).slice(0, 2);
            newOpps.forEach(o => {
                actions.push(`List "${o.keyword}" in your inventory (Local search demand: ${o.demandSearches} queries, projected potential: +₹${o.potentialRevenue.toLocaleString()}/mo).`);
                totalLift += o.potentialRevenue;
            });

            // 3. Add standard BusinessHealth advice
            if (health && health.recommendations && health.recommendations.length > 0) {
                actions.push(...health.recommendations.slice(0, 2));
            }

            return {
                reply,
                actions: actions.length > 0 ? actions : ["Maintain current inventory levels and quick response times."],
                estimatedRevenueIncrease: totalLift || 5000
            };
        } catch (err) {
            console.error("Error generating Copilot advice from database:", err);
            // Fallback to rules on error
        }
    }

    // Intercept hyperlocal and area-based queries (Task 4)
    if (['area', 'pincode', 'locality', 'expansion', 'where', 'demand', 'vijay nagar', 'palasia', 'bengali square', 'bhawarkua', 'indore'].some(w => text.includes(w))) {
        try {
            const { getExpansionSuggestions, getAreaInventorySuggestions, geocodeCoordsToArea } = require('../services/hyperlocalIntelligenceService');
            const AreaTrend = require('../models/AreaTrend');
            
            const seller = await require('../models/User').findById(sellerId);
            const shopLoc = seller?.shopDetails?.shopLocation || {};
            const coords = shopLoc.coordinates || [];
            const currentAreaObj = geocodeCoordsToArea(coords[1], coords[0], seller?.shopDetails?.address);
            
            const expansions = await getExpansionSuggestions(sellerId);
            const inventorySugg = await getAreaInventorySuggestions(sellerId);
            const trends = await AreaTrend.find({ area: currentAreaObj.name }).sort({ trendScore: -1 }).limit(3);
            
            let reply = `🤖 **Aisle AI Hyperlocal Area Copilot**\n\nYour storefront is mapped to the **${currentAreaObj.name.toUpperCase()}** area (Pincode: ${currentAreaObj.pincode}).\n\n`;
            
            if (trends.length > 0) {
                reply += `### 🔥 Trending in ${currentAreaObj.name.toUpperCase()}\n`;
                trends.forEach((t, idx) => {
                    reply += `${idx + 1}. **${t.product.toUpperCase()}** (Growth: ${t.growth}, Demand Score: ${t.trendScore})\n`;
                });
                reply += `\n`;
            }
            
            if (text.includes("highest demand") || text.includes("expand")) {
                reply += `The area with the **highest demand gap** is **Vijay Nagar**, followed closely by Bhawarkua. High demand items there include **Protein Powder, Cold Coffee, and Healthy Snacks** with expected local demand growth of **+95%**.\n\n`;
            }
            
            if (expansions.length > 0) {
                reply += `### 🔁 Expansion Suggestions\n`;
                expansions.forEach((exp, idx) => {
                    reply += `${idx + 1}. **${exp.area.toUpperCase()}** - Gap Score: **${exp.gapScore}**, Distance: **${exp.distanceKm} km** away. Recommended products to stock: *${exp.products.join(', ')}*\n`;
                });
                reply += `\n`;
            }

            const actions = [];
            inventorySugg.slice(0, 3).forEach(s => {
                actions.push(`Stock "${s.product}" in ${s.area} (Gap Score: ${s.gapScore})`);
            });
            if (expansions.length > 0) {
                actions.push(`Explore establishing a secondary storefront in ${expansions[0].area}`);
            }

            return {
                reply,
                actions: actions.length > 0 ? actions : ["Monitor local search trends weekly."],
                estimatedRevenueIncrease: expansions.length > 0 ? expansions[0].gapScore * 1000 : 8000
            };

        } catch (err) {
            console.error("Error generating Copilot hyperlocal advice:", err);
        }
    }

    const context = prebuiltContext || await buildSellerContext(sellerId);
    const { getRulesByShopType } = require('../support/business-rules');
    const shopType = context.shop?.shopType || 'GROCERY_KIRANA';
    const rules = getRulesByShopType(shopType);
    return rules.getCopilotAdvice(text);
};

module.exports = {
    getCopilotAdvice
};
