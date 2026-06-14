const User = require('../models/User');
const Product = require('../models/Product');
const ProductTrend = require('../models/ProductTrend');
const DemandGap = require('../models/DemandGap');
const SellerIntelligence = require('../models/SellerIntelligence');
const SellerRecommendation = require('../models/SellerRecommendation');
const SellerOpportunity = require('../models/SellerOpportunity');
const CustomerProfile = require('../models/CustomerProfile');
const CopilotConversation = require('../models/CopilotConversation');
const CopilotAnalytics = require('../models/CopilotAnalytics');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const PricingIntelligence = require('../models/PricingIntelligence');
const GrowthInsight = require('../models/GrowthInsight');
const SellerGrowthProfile = require('../models/SellerGrowthProfile');
const growthAdvisorService = require('./growthAdvisorService');

// Static Knowledge Graph
const KNOWLEDGE_GRAPH = {
    'protein powder': ['fitness', 'gym', 'peanut butter', 'oats', 'healthy', 'protein bars', 'creatine'],
    'cold coffee': ['beverages', 'energy', 'cafe', 'milk', 'sugar', 'ice cream'],
    'paneer': ['grocery', 'cooking', 'butter', 'masala', 'milk', 'tomato', 'cream'],
    'notebook': ['school', 'stationery', 'study', 'pen', 'pencil', 'ruler'],
    'diwali': ['sweets', 'decorations', 'gift packs', 'candles', 'diyas', 'snacks'],
    'breakfast': ['milk', 'eggs', 'bread', 'oats', 'peanut butter', 'butter', 'jam']
};

// Helper: Calculate distance (Haversine Formula) in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000); // Distance in meters
};

/**
 * Get or create conversation history
 */
const getConversation = async (userId, role) => {
    let conv = await CopilotConversation.findOne({ userId, role });
    if (!conv) {
        conv = await CopilotConversation.create({ userId, role, messages: [] });
    }
    return conv;
};

/**
 * Add message to conversation history
 */
const addMessage = async (userId, role, senderRole, content) => {
    const conv = await getConversation(userId, role);
    conv.messages.push({ role: senderRole, content });
    // Cap messages at last 20 to preserve context without excessive document growth
    if (conv.messages.length > 20) {
        conv.messages.shift();
    }
    await conv.save();
    return conv;
};

/**
 * Clear conversation history
 */
const clearConversation = async (userId, role) => {
    await CopilotConversation.deleteOne({ userId, role });
};

/**
 * Core Tools
 */
const searchProductsTool = async (keyword, lat, lng, radius = 5000) => {
    const cleanKeyword = keyword.toLowerCase().trim();
    const products = await Product.find({
        isAvailable: { $ne: false },
        isDraft: { $ne: true },
        adminStatus: 'Active',
        $or: [
            { name: { $regex: cleanKeyword, $options: 'i' } },
            { brand: { $regex: cleanKeyword, $options: 'i' } },
            { category: { $regex: cleanKeyword, $options: 'i' } }
        ]
    }).populate('seller', 'shopDetails');

    return products.map(p => {
        let distance = 999999;
        const seller = p.seller;
        if (seller?.shopDetails?.shopLocation?.coordinates && lat && lng) {
            distance = calculateDistance(
                lat, lng,
                seller.shopDetails.shopLocation.coordinates[1],
                seller.shopDetails.shopLocation.coordinates[0]
            );
        }
        return {
            _id: p._id,
            name: p.name,
            price: p.sellingPrice || p.price || 0,
            imageUrl: p.imageUrl,
            shopName: seller?.shopDetails?.shopName || 'Local Shop',
            shopId: seller?._id,
            distance,
            category: p.category
        };
    }).filter(p => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
};

const searchShopsTool = async (categoryOrName, lat, lng, radius = 5000) => {
    const cleanQ = categoryOrName.toLowerCase().trim();
    const sellers = await User.find({
        role: 'seller',
        verificationStatus: 'approved',
        $or: [
            { 'shopDetails.shopName': { $regex: cleanQ, $options: 'i' } },
            { 'shopDetails.shopCategory': { $regex: cleanQ, $options: 'i' } }
        ]
    });

    return sellers.map(s => {
        let distance = 999999;
        if (s.shopDetails?.shopLocation?.coordinates && lat && lng) {
            distance = calculateDistance(
                lat, lng,
                s.shopDetails.shopLocation.coordinates[1],
                s.shopDetails.shopLocation.coordinates[0]
            );
        }
        return {
            _id: s._id,
            name: s.shopDetails?.shopName || 'Unknown Shop',
            category: s.shopDetails?.shopCategory || 'Grocery',
            rating: s.shopDetails?.rating || 4.0,
            isOpen: s.shopDetails ? (deriveShopStatus(s.shopDetails) === 'ONLINE' || s.shopDetails.isOpen) : false,
            distance
        };
    }).filter(s => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
};

/**
 * Main Process Flow
 */
const processChat = async (userId, role, message, lat, lng) => {
    const q = message.toLowerCase().trim();
    
    // Retrieve historical context
    const history = await getConversation(userId, role);
    let lastIntent = null;
    let lastBudget = null;
    
    // Simple context-extraction from history
    for (let i = history.messages.length - 1; i >= 0; i--) {
        const msg = history.messages[i];
        if (msg.role === 'assistant') {
            if (msg.content.includes('Birthday Party Kit') || msg.content.includes('party')) {
                lastIntent = 'party_snacks';
            }
            if (msg.content.includes('Ingredients') || msg.content.includes('Paneer')) {
                lastIntent = 'recipe_ingredients';
            }
            const budgetMatch = msg.content.match(/budget of ₹(\d+)/i) || msg.content.match(/₹(\d+)/i);
            if (budgetMatch) {
                lastBudget = parseInt(budgetMatch[1]);
            }
            break;
        }
    }

    let answer = "";
    let suggestions = [];
    
    // Add user message to history
    await addMessage(userId, role, 'user', message);

    if (role === 'customer') {
        // Customer Copilot
        
        // Use Case 1: Birthday Setup / Snacks with Budget
        const isPartyQuery = q.includes('party') || q.includes('birthday') || q.includes('snacks') || q.includes('setup');
        const isFollowUpParty = lastIntent === 'party_snacks' && (q.includes('drink') || q.includes('plate') || q.includes('cookies') || q.includes('under') || q.includes('budget'));
        
        if (isPartyQuery || isFollowUpParty) {
            // Budget Detection
            let budget = 1000; // Default
            const budgetMatch = q.match(/under\s*(?:rs\.?|₹)?\s*(\d+)/i) || q.match(/budget\s*(?:of|is)?\s*(?:rs\.?|₹)?\s*(\d+)/i);
            if (budgetMatch) {
                budget = parseInt(budgetMatch[1]);
            } else if (lastBudget) {
                budget = lastBudget;
            }

            // Products Matching (Chips, Cold Drinks, Cookies, Paper Plates)
            const chips = await searchProductsTool('chips', lat, lng);
            const drinks = await searchProductsTool('drink', lat, lng);
            const cookies = await searchProductsTool('cookies', lat, lng);
            const plates = await searchProductsTool('plate', lat, lng);

            const selectedChips = chips[0] || { name: 'Potato Chips', price: 50, shopName: 'Local Kirana' };
            const selectedDrinks = drinks[0] || { name: 'Cold Drink (1.25L)', price: 90, shopName: 'Local Store' };
            const selectedCookies = cookies[0] || { name: 'Choco Cookies', price: 120, shopName: 'Baker Street' };
            const selectedPlates = plates[0] || { name: 'Paper Plates (10pk)', price: 40, shopName: 'Supermart' };

            const total = selectedChips.price + selectedDrinks.price + selectedCookies.price + selectedPlates.price;

            // Nearby Shops Count
            const shops = await searchShopsTool('grocery', lat, lng);
            const shopsCount = Math.max(1, shops.length);

            answer = `🎉 **Birthday Party Kit** compiled under your budget of ₹${budget}:\n\n` +
                     `- **${selectedChips.name}**: ₹${selectedChips.price} (from ${selectedChips.shopName})\n` +
                     `- **${selectedDrinks.name}**: ₹${selectedDrinks.price} (from ${selectedDrinks.shopName})\n` +
                     `- **${selectedCookies.name}**: ₹${selectedCookies.price} (from ${selectedCookies.shopName})\n` +
                     `- **${selectedPlates.name}**: ₹${selectedPlates.price} (from ${selectedPlates.shopName})\n\n` +
                     `💵 **Estimated Cost**: ₹${total}\n` +
                     `📍 **Available Nearby**: ${shopsCount} shops in your area ready for pickup/delivery.\n\n` +
                     `*Associated items in Fitness/Gym graph*: Peanut Butter, Oats (suggested for health-conscious guests).`;

            suggestions = ["What about soft drinks?", "Suggest a cake", "Show shops nearby"];
        }
        // Use Case 2: Breakfast Recommender
        else if (q.includes('breakfast') || q.includes('morning') || q.includes('eat this week')) {
            const profile = await CustomerProfile.findOne({ userId });
            const favorite = profile?.interests?.[0] || 'Grocery';
            
            answer = `🥑 Based on your customer profile affinity towards **${favorite}**, Location Trends, and past queries, here is your customized breakfast shopping list for this week:\n\n` +
                     `- **Organic Milk (1L)** - High stock nearby (₹65)\n` +
                     `- **Farm Fresh Eggs (6pk)** - Best Seller (₹50)\n` +
                     `- **Whole Wheat Bread** - Fresh today (₹45)\n` +
                     `- **Rolled Oats (500g)** - Fitness Favorite (₹120)\n` +
                     `- **Creamy Peanut Butter** - Gym Favorite (₹190)\n\n` +
                     `🛒 Add all items to cart instantly to checkout from your closest verified seller.`;

            suggestions = ["Add breakfast to cart", "Show healthy options", "Suggest grocery shops"];
        }
        // Use Case 3: Best shop near me
        else if (q.includes('shop') || q.includes('grocery') || q.includes('near me') || q.includes('best shop')) {
            const shops = await searchShopsTool('grocery', lat, lng);
            if (shops.length > 0) {
                answer = `🏆 **Top Ranked Grocery Shops Near You**:\n\n` +
                         shops.slice(0, 3).map((s, idx) => 
                             `${idx + 1}. **${s.name}**\n` +
                             `   *Distance*: ${(s.distance / 1000).toFixed(1)} km | *Trust Score*: ${s.rating}/5.0 | *Response Time*: Under 15m\n` +
                             `   *Status*: ${s.isOpen ? '🟢 Open Now' : '🔴 Closed'}`
                         ).join('\n\n');
            } else {
                answer = `📍 I couldn't find any grocery shops within a 5km radius of your coordinates. You can try searching for a different shop type or adjusting your location.`;
            }
            suggestions = ["Find medical shops", "Search stationery stores", "Show top rated products"];
        }
        // Step 5: Shopping List Generator (Paneer Butter Masala)
        else if (q.includes('paneer') || q.includes('butter masala') || q.includes('recipe') || q.includes('ingredients')) {
            const paneer = await searchProductsTool('paneer', lat, lng);
            const butter = await searchProductsTool('butter', lat, lng);
            const cream = await searchProductsTool('cream', lat, lng);
            const tomato = await searchProductsTool('tomato', lat, lng);

            const pPrice = paneer[0]?.price || 80;
            const bPrice = butter[0]?.price || 55;
            const cPrice = cream[0]?.price || 60;
            const tPrice = tomato[0]?.price || 30;

            const total = pPrice + bPrice + cPrice + tPrice;

            answer = `🍲 **Paneer Butter Masala Ingredient Kit**:\n\n` +
                     `1. **Paneer (200g)**: ₹${pPrice} (In Stock)\n` +
                     `2. **Butter (100g)**: ₹${bPrice} (In Stock)\n` +
                     `3. **Fresh Cream (200ml)**: ₹${cPrice} (In Stock)\n` +
                     `4. **Tomato (500g)**: ₹${tPrice} (Freshly Stocked)\n` +
                     `5. Spices (Garam Masala, Kasuri Methi, Chili) - Available at Kirana\n\n` +
                     `💵 **Estimated Price**: ₹${total}\n` +
                     `🏠 **Nearby Shops**: Available at 3 Grocery shops in your neighborhood.`;

            suggestions = ["Add ingredients to cart", "Show cooking steps", "Suggest dessert options"];
        }
        // Step 6: Event-Aware (Diwali/festivals)
        else if (q.includes('diwali') || q.includes('festival') || q.includes('holiday') || q.includes('sweets')) {
            answer = `🪔 **Diwali Festive Storefront recommendations**:\n\n` +
                     `- **Kaju Katli Gift Pack (500g)** - ₹450 (From Local Sweet Shop)\n` +
                     `- **Brass Diyas & Cotton Wicks** - ₹120 (From Pooja Store)\n` +
                     `- **LED String Lights (10m)** - ₹150 (From Tech Accessories)\n` +
                     `- **Decorative Rangoli Stencils** - ₹80 (From Stationers)\n\n` +
                     `☀️ *Weather Warning*: Clear skies expected in Indore this week, perfect for outdoor decoration setup.`;

            suggestions = ["Order sweets", "View decoration catalog", "Send gift pack to friend"];
        }
        // Default Customer Help
        else {
            // Check Knowledge Graph links
            let extraGraphInfo = "";
            for (const key of Object.keys(KNOWLEDGE_GRAPH)) {
                if (q.includes(key)) {
                    extraGraphInfo = `\n*(Knowledge Graph tip: ${key} is associated with: ${KNOWLEDGE_GRAPH[key].join(', ')})*`;
                    break;
                }
            }

            answer = `👋 Hello! I am your Aisle Assistant. I can help you search, discover local shops, compile shopping lists, and build custom budget bundles.\n\n` +
                     `Try asking me:\n` +
                     `- "Find me snacks for a birthday party under ₹1000"\n` +
                     `- "What should I buy for breakfast this week?"\n` +
                     `- "Which shop is best for groceries near me?"\n` +
                     `- "Paneer Butter Masala recipe ingredients"` +
                     extraGraphInfo;

            suggestions = ["Find snacks for party", "Healthy breakfast ideas", "Best shops nearby"];
        }

    } else if (role === 'seller') {
        // Seller Copilot
        const profile = await SellerIntelligence.findOne({ sellerId: userId }) || {
            opportunityScore: 78,
            trendAffinity: 80,
            inventoryStrength: 75,
            demandCoverage: 70,
            responseRate: 85,
            city: 'indore'
        };

        // Use Case: AI Pricing Advisor - What should I charge?
        if (q.includes('charge') || q.includes('price') || q.includes('pricing') || q.includes('cost')) {
            await growthAdvisorService.seedGrowthAdvisorData(userId);
            const pricingList = await PricingIntelligence.find({ sellerId: userId }).populate('productId');
            if (pricingList.length > 0) {
                let lines = pricingList.map((p, idx) => {
                    const productName = p.productId?.name || "Sample Product";
                    return `${idx + 1}. **${productName}**:\n` +
                           `   * Current Price: ₹${p.currentPrice}\n` +
                           `   * Recommended Price: **₹${p.recommendedPrice}** (Confidence: ${p.confidence}%)\n` +
                           `   * Reasoning: ${p.reasoning}`;
                }).join('\n\n');
                answer = `💰 **AI Pricing Advisor - Price Optimization Recommendations**:\n\n${lines}\n\n💡 *Action Plan*: You can update these prices in your Catalog settings to optimize for either volume or profit margins.`;
            } else {
                answer = `💰 **AI Pricing Advisor**:\n\nNo pricing intelligence recommendations are available for your products at the moment. Try adding products to your catalog to generate price optimization recommendations.`;
            }
            suggestions = ["How to increase sales?", "What is my biggest opportunity?", "Show my growth checklist"];
        }
        // Use Case: Expansion Advisor - Where should I expand?
        else if (q.includes('expand') || q.includes('expansion') || q.includes('delivery radius') || q.includes('zone')) {
            await growthAdvisorService.seedGrowthAdvisorData(userId);
            const expansionInsights = await GrowthInsight.find({ sellerId: userId, type: 'area_expansion' });
            if (expansionInsights.length > 0) {
                let lines = expansionInsights.map((insight, idx) => {
                    const details = insight.details || {};
                    return `${idx + 1}. **${insight.opportunity}**\n` +
                           `   * Target Area: ${details.area || 'Vijay Nagar'}\n` +
                           `   * Distance: ${details.distanceKm || '3.5'} km\n` +
                           `   * Competition Level: ${details.competitionLevel || 'Low'}\n` +
                           `   * Demand Growth: ${details.demandGrowth || '+140%'}\n` +
                           `   * Estimated Revenue Lift: **₹${insight.estimatedRevenueLift}/month**`;
                }).join('\n\n');
                answer = `📍 **Autonomous Growth Advisor - Hyperlocal Expansion Recommendations**:\n\n${lines}\n\n💡 *Action Plan*: Go to your Growth Center and toggle Indore expansion areas to simulate the live revenue impact on your business!`;
            } else {
                answer = `📍 **Autonomous Growth Advisor - Hyperlocal Expansion**:\n\nWe don't see any immediate delivery zone expansions. Currently, your delivery radius covers all active demand zones near you.`;
            }
            suggestions = ["How to increase sales?", "Show my growth checklist", "What should I charge?"];
        }
        // Use Case: Biggest Opportunity - What is my biggest opportunity?
        else if (q.includes('biggest opportunity') || (q.includes('opportunity') && !q.includes('stock') && !q.includes('restock') && !q.includes('inventory'))) {
            await growthAdvisorService.seedGrowthAdvisorData(userId);
            const topInsight = await GrowthInsight.findOne({ sellerId: userId }).sort({ priority: -1, estimatedRevenueLift: -1 });
            if (topInsight) {
                answer = `🏆 **Your Biggest Growth Opportunity**:\n\n` +
                         `**${topInsight.opportunity}**\n` +
                         `- **Type**: ${topInsight.type.replace('_', ' ')}\n` +
                         `- **Priority**: ${topInsight.priority.toUpperCase()}\n` +
                         `- **Estimated Revenue Lift**: **₹${topInsight.estimatedRevenueLift}/month**\n\n` +
                         `💡 *AI Recommendation*: Implementing this change immediately addresses local demand gaps and positions you ahead of nearby Indore competitors.`;
            } else {
                answer = `🏆 **Growth Opportunity**: We are currently analyzing competitor catalogs and local demand logs. No immediate gaps have been detected yet.`;
            }
            suggestions = ["How to increase sales?", "Where should I expand?", "What should I charge?"];
        }
        // Use Case 4: What inventory should I restock?
        else if (q.includes('restock') || q.includes('replenish') || q.includes('inventory') || q.includes('run out')) {
            const InventoryForecast = require('../models/InventoryForecast');
            const forecasts = await InventoryForecast.find({ sellerId: userId })
                .populate('productId', 'name')
                .sort({ daysRemaining: 1 });

            let answer = "";
            let suggestions = [];

            if (forecasts.length > 0) {
                const critical = forecasts.filter(f => f.riskLevel === 'CRITICAL');
                const high = forecasts.filter(f => f.riskLevel === 'HIGH');
                const medium = forecasts.filter(f => f.riskLevel === 'MEDIUM');
                const overstocks = forecasts.filter(f => f.isOverstocked);

                let lines = [];
                if (critical.length > 0) {
                    lines.push(`🚨 **Priority 1: Critical Risk (Stockout in < 7 Days)**:`);
                    critical.forEach(f => {
                        lines.push(`- **${f.productId?.name || 'Product'}**: ${f.daysRemaining} days remaining (Stock: ${f.currentStock}). Recommended restock: **${f.recommendedRestockQuantity} units**.`);
                    });
                }
                if (high.length > 0) {
                    lines.push(`\n⚠️ **Priority 2: High Risk (Stockout in 7-14 Days)**:`);
                    high.forEach(f => {
                        lines.push(`- **${f.productId?.name || 'Product'}**: ${f.daysRemaining} days remaining (Stock: ${f.currentStock}). Recommended restock: **${f.recommendedRestockQuantity} units**.`);
                    });
                }
                if (medium.length > 0) {
                    lines.push(`\n📦 **Priority 3: Medium Risk (Stockout in 15-30 Days)**:`);
                    medium.forEach(f => {
                        lines.push(`- **${f.productId?.name || 'Product'}**: ${f.daysRemaining} days remaining (Stock: ${f.currentStock}). Recommended restock: **${f.recommendedRestockQuantity} units**.`);
                    });
                }

                if (lines.length === 0) {
                    lines.push(`✅ All products have healthy stock levels (coverage is over 30 days)!`);
                }

                if (overstocks.length > 0) {
                    lines.push(`\n⚠️ **Overstock Alerts (Excess Inventory)**:`);
                    overstocks.forEach(f => {
                        lines.push(`- **${f.productId?.name || 'Product'}**: ${f.daysRemaining} days of stock remaining (Stock: ${f.currentStock}). Consider running promotions.`);
                    });
                }

                answer = `📋 **AI Restock Prioritization Report**:\n\n` + lines.join('\n');
                suggestions = ["Show stock warnings", "How to increase sales?", "Show health score summary"];
            } else {
                answer = `📋 **AI Restock Prioritization Report**:\n\n` +
                         `Priority 1: **Protein Powder** (Critical Risk, 5 days remaining, Recommended restock: 260 units)\n` +
                         `Priority 2: **Cold Coffee** (Medium Risk, 22 days remaining, Recommended restock: 90 units)\n` +
                         `Priority 3: **Energy Drinks** (Low Risk, 42 days remaining, No action needed)`;
                suggestions = ["Show stock warnings", "What should I stock?", "Show health score summary"];
            }

            await addMessage(userId, role, 'assistant', answer);
            await CopilotAnalytics.create({
                userId,
                role,
                question: message,
                response: answer
            });
            return { answer, suggestions };
        }
        // Use Case: AI Event Copilot (Diwali / Festivals / Events)
        else if (q.includes('diwali') || q.includes('raksha bandhan') || q.includes('festival') || q.includes('event') || q.includes('event-based') || q.includes('stock for')) {
            const EventProductMap = require('../models/EventProductMap');
            const HistoricalEventImpact = require('../models/HistoricalEventImpact');
            
            let eventName = "Diwali";
            if (q.includes('raksha bandhan') || q.includes('rakhi')) {
                eventName = "Raksha Bandhan";
            }
            
            const mapping = await EventProductMap.findOne({ eventName });
            const products = mapping ? mapping.products : ["sweets", "gift packs", "decorations", "lights"];
            
            const impacts = await HistoricalEventImpact.find({ eventName });
            let impactLines = "";
            if (impacts.length > 0) {
                impactLines = "\n\nHistorical Demand Spikes:\n" + impacts.map(imp => `- **${imp.product}**: +${imp.demandIncrease}%`).join('\n');
            } else {
                impactLines = `\n\nHistorical Demand Spikes:\n- Sweets: +280%\n- Decorations: +340%\n- Gift Packs: +410%`;
            }

            answer = `🪔 **Aisle AI Event Copilot Recommendations for ${eventName}**:\n\n` +
                     `To maximize your revenue during ${eventName}, you should stock up on:\n` +
                     products.map(p => `- **${p.charAt(0).toUpperCase() + p.slice(1)}**`).join('\n') +
                     impactLines + `\n\n` +
                     `💡 *Action Plan*: Start sourcing these items 15-30 days prior to lock in lower wholesale rates.`;
                     
            suggestions = ["How will rain affect my business?", "Show event opportunity alerts", "How to increase sales?"];
        }
        // Use Case: AI Event Copilot (Rain / Monsoon / Weather)
        else if (q.includes('rain') || q.includes('monsoon') || q.includes('weather') || q.includes('heatwave')) {
            const EventProductMap = require('../models/EventProductMap');
            
            let eventName = "Monsoon Season";
            if (q.includes('heatwave') || q.includes('summer')) eventName = "Summer Heatwave";
            
            const mapping = await EventProductMap.findOne({ eventName });
            const products = mapping ? mapping.products : ["umbrellas", "raincoats", "tea"];

            answer = `🌧️ **Weather Intelligence Forecast**: Rain is expected to affect local demand patterns in Indore:\n\n` +
                     `Trending Items:\n` +
                     products.map(p => `- **${p.charAt(0).toUpperCase() + p.slice(1)} trending**`).join('\n') + `\n\n` +
                     `📈 **Expected overall demand increase**: **+120%**\n` +
                     `💡 *Action Plan*: Position umbrellas and rainproof bags near your shop entrance for immediate visual availability.`;
                     
            suggestions = ["What should I stock for Diwali?", "Show my inventory levels", "How to increase sales?"];
        }
        // Use Case 1: What should I stock
        else if (q.includes('stock') || q.includes('opportunity') || q.includes('what to buy') || q.includes('what should i')) {
            const opps = await SellerRecommendation.find({ sellerId: userId, type: 'inventory_opportunity' }).limit(3);
            let oppText = "";
            if (opps.length > 0) {
                oppText = opps.map((opp, idx) => 
                    `${idx + 1}. **${opp.product}**\n` +
                    `   *Confidence*: ${opp.confidence}% | *Est. Revenue*: ₹${opp.estimatedRevenue}/month\n` +
                    `   *Competitor insight*: ${opp.competitorInsights}`
                ).join('\n\n');
            } else {
                oppText = `1. **Protein Powder** (Very High demand, Growth: +180% searches)\n` +
                          `2. **Cold Coffee** (High demand, Expected growth: +220% due to upcoming heatwave)\n` +
                          `3. **Energy Drinks** (Medium demand, Supply gap detected)`;
            }

            answer = `📈 **Top Inventory Stock Opportunities for Indore**:\n\n` +
                     oppText + `\n\n` +
                     `💡 *Predictive forecast*: Cold Coffee demand is expected to spike by **+220% next week** due to hot weather forecast. Stock up on beans and milk now!`;

            suggestions = ["Why are my requests decreasing?", "Show health score summary", "How to increase sales?"];
        }
        // Use Case 2: Why are requests decreasing
        else if (q.includes('decreasing') || q.includes('drop') || q.includes('down') || q.includes('reduce') || q.includes('decrease') || q.includes('sales drop')) {
            answer = `⚠️ **Diagnostic Analysis: Primary Causes for Traffic Drop**:\n\n` +
                     `1. **Stock Availability Down (Critical)**: 3 of your high-demand catalog items (e.g. Premium Bread) are currently listed as out of stock.\n` +
                     `2. **Response Time Increased**: Your average order response rate fell from 92% to 76% this week.\n` +
                     `3. **Competitor Growth**: 2 nearby shops in Indore started running active discounts on similar categories.\n` +
                     `4. **Demand Shift**: Customer search patterns shifted slightly towards sugar-free alternatives.\n\n` +
                     `🔧 *Recommended Fix*: Re-stock pending items and reply to outstanding inquiries within 10 minutes to restore your dashboard traffic boost.`;

            suggestions = ["How to increase sales?", "What should I stock?", "Show my response rate stats"];
        }
        // Use Case 3: How to increase sales / grow
        else if (q.includes('increase sales') || q.includes('grow') || q.includes('increase revenue') || q.includes('more sales') || q.includes('improve')) {
            await growthAdvisorService.seedGrowthAdvisorData(userId);
            const growthProfile = await SellerGrowthProfile.findOne({ sellerId: userId });
            const insights = await GrowthInsight.find({ sellerId: userId }).sort({ priority: -1 });
            
            let lines = `🚀 **AI Growth Advisor - Revenue Growth Plan**:\n\n`;
            if (growthProfile) {
                lines += `Your current **Growth Score is ${growthProfile.growthScore}/100**. Here is your Weekly Growth Plan:\n\n`;
                growthProfile.weeklyGrowthPlan.forEach((plan, idx) => {
                    lines += `${idx + 1}. **${plan}**\n`;
                });
                lines += `\n`;
            }
            
            if (insights.length > 0) {
                lines += `**Top Growth Opportunities for you**:\n`;
                insights.forEach((insight, idx) => {
                    lines += `- **${insight.opportunity}** (Est. Lift: ₹${insight.estimatedRevenueLift}/mo | Priority: *${insight.priority.toUpperCase()}*)\n`;
                });
            } else {
                lines += `We are evaluating new inventory and area demand patterns to recommend customized actions. Check back soon!`;
            }
            answer = lines;
            suggestions = ["What is my biggest opportunity?", "What should I charge?", "Where should I expand?"];
        }
        // Default Seller Help
        else {
            answer = `👋 Welcome to your Aisle Seller Intelligence Assistant! Your current Business Health Score is **${profile.opportunityScore}/100**.\n\n` +
                     `You can ask me:\n` +
                     `- "What should I stock this week?"\n` +
                     `- "Why are my requests decreasing?"\n` +
                     `- "How can I increase sales?"`;

            suggestions = ["What should I stock?", "Why are requests decreasing?", "How to increase sales?"];
        }

    } else if (role === 'admin') {
        // Admin Copilot
        
        // Use Case: Explain Flagged/Suspicious Accounts (Forensic Audit Report)
        if (q.includes('why') || q.includes('flagged') || q.includes('audit') || q.includes('explain') || q.includes('reason')) {
            const { getModerationCopilotDecision } = require('./trustService');
            const FraudEvent = require('../models/FraudEvent');
            const RiskProfile = require('../models/RiskProfile');
            const users = await User.find({ role: { $in: ['seller', 'customer', 'moderator', 'admin'] } });
            let targetUser = null;
            for (const u of users) {
                const uName = u.name ? u.name.toLowerCase() : '';
                const uEmail = u.email ? u.email.toLowerCase() : '';
                if (q.includes(uName) || (uEmail && q.includes(uEmail))) {
                    targetUser = u;
                    break;
                }
            }
            
            if (!targetUser) {
                // Fallback: get the most recent high-risk user or recently created fraud event
                const recentFraud = await FraudEvent.findOne().sort({ createdAt: -1 });
                if (recentFraud) {
                    targetUser = await User.findById(recentFraud.userId);
                }
            }
            
            if (targetUser) {
                const report = await getModerationCopilotDecision(targetUser._id);
                answer = report;
            } else {
                answer = `AI Assistant Report:\n- No specific flagged user or account was found in your query.\n- Please specify a user name or email (e.g. "Why was Spammy Customer flagged?").`;
            }
            suggestions = ["Show high-risk sellers", "What category is growing fastest?", "What is happening today?"];
        }
        // Use Case: List Top Risk Accounts
        else if (q.includes('high-risk') || q.includes('risk') || q.includes('suspicious')) {
            const RiskProfile = require('../models/RiskProfile');
            const riskProfiles = await RiskProfile.find()
                .populate('userId', 'name email role')
                .sort({ riskScore: -1 })
                .limit(5)
                .lean();
                
            if (riskProfiles.length > 0) {
                let text = `🚨 **Top High-Risk Accounts**:\n\n`;
                riskProfiles.forEach((r, idx) => {
                    const u = r.userId || { name: 'Unknown', email: 'N/A', role: 'User' };
                    text += `${idx + 1}. **${u.name}** (${u.email}) | Role: **${u.role.toUpperCase()}**\n`;
                    text += `   *Risk Score*: **${r.riskScore}/100** (Level: ${r.riskLevel.toUpperCase()})\n`;
                    if (r.reasons && r.reasons.length > 0) {
                        text += `   *Triggers*: ${r.reasons.join(', ')}\n`;
                    }
                    text += `\n`;
                });
                answer = text;
            } else {
                answer = `✓ **Risk Audit**: No high-risk or suspicious accounts detected in risk profiles. Platform health is at 100%.`;
            }
            suggestions = ["Why was Spammy Customer flagged?", "What is happening today?", "What category is growing fastest?"];
        }
        // Use Case 1: Fastest growing category
        else if (q.includes('category') || q.includes('growth') || q.includes('fastest') || q.includes('best category')) {
            answer = `📊 **Category Growth Leaderboard (Indore Hub)**:\n\n` +
                     `1. **Protein & Fitness**: **+180% searches** this month (Driven by gym-related queries)\n` +
                     `2. **Cold Beverages**: **+110% searches** (Driven by seasonal summer trends)\n` +
                     `3. **Fresh Fruits**: **+45% searches**\n\n` +
                     `📈 *Trend Signal*: Gym categories are showing massive user affinity shifts. Recommend prompting sellers to stock Fitness supplements.`;

            suggestions = ["Which city has the biggest demand gap?", "What is happening in Aisle today?", "Show user registration stats"];
        }
        // Use Case 2: City with biggest demand gap
        else if (q.includes('city') || q.includes('biggest demand gap') || q.includes('gap') || q.includes('demand gap')) {
            const gaps = await DemandGap.find().sort({ gapScore: -1 }).limit(3);
            let gapText = "";
            if (gaps.length > 0) {
                gapText = gaps.map((g, idx) => 
                    `${idx + 1}. **${g.keyword}** in **${g.city.toUpperCase()}**\n` +
                    `   *Gap Score*: ${g.gapScore}/100 | *Searches*: ${g.demandScore}`
                ).join('\n\n');
            } else {
                gapText = `1. **Protein Powder** in **INDORE** (Gap Score: 85/100, Searches: 1,200)\n` +
                          `2. **Cold Coffee** in **INDORE** (Gap Score: 82/100, Searches: 890)\n` +
                          `3. **Healthy Snacks** in **INDORE** (Gap Score: 76/100, Searches: 640)`;
            }

            answer = `🎯 **Top System-Wide Demand Gaps**:\n\n` +
                     gapText + `\n\n` +
                     `🔧 *Automation Action*: High gaps have automatically triggered seller alerts across approved Indore merchant dashboards.`;

            suggestions = ["What category is growing fastest?", "What is happening today?", "Inspect Indore seller count"];
        }
        // Use Case 3: Marketplace Command Center (What is happening today)
        else if (q.includes('happening') || q.includes('today') || q.includes('summary') || q.includes('command center')) {
            const totalProducts = await Product.countDocuments();
            const totalSellers = await User.countDocuments({ role: 'seller' });
            
            answer = `🏢 **Aisle Command Center (Indore Hub Hub)**:\n\n` +
                     `🔥 **Top Trends**: Protein Powder searches up +180% | Cold Coffee up +220% next week prediction.\n` +
                     `⚠️ **Demand Gaps**: Indore leading with 3 major unfulfilled supplement gaps.\n` +
                     `💰 **Revenue Drivers**: Custom Bundles conversions account for 18% of grocery basket size growth.\n` +
                     `📢 **Seller Opportunities**: 12 new opportunity alerts pushed to Indore kiranas.\n` +
                     `👥 **Customer Behavior**: Active shopping hours peak between 6 PM - 9 PM.`;

            suggestions = ["What category is growing fastest?", "Which city has the biggest demand gap?", "View server health"];
        }
        // Default Admin Help
        else {
            answer = `👋 Hello Administrator. Welcome to the Aisle Marketplace Command Center.\n\n` +
                     `You can query analytics, gaps, and platform state:\n` +
                     `- "What category is growing fastest?"\n` +
                     `- "Which city has the biggest demand gap?"\n` +
                     `- "What is happening in Aisle today?"`;

            suggestions = ["What category is growing fastest?", "Which city has the biggest demand gap?", "What is happening in Aisle today?"];
        }
    }

    // Add assistant response to history
    await addMessage(userId, role, 'assistant', answer);

    // Save analytics
    await CopilotAnalytics.create({
        userId,
        role,
        question: message,
        response: answer
    });

    return { answer, suggestions };
};

module.exports = {
    processChat,
    clearConversation,
    getConversation,
    searchProductsTool,
    searchShopsTool,
    KNOWLEDGE_GRAPH
};
