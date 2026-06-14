const CustomerProfile = require('../models/CustomerProfile');
const CustomerActivity = require('../models/CustomerActivity');
const RecommendationCache = require('../models/RecommendationCache');
const RecommendationAnalytics = require('../models/RecommendationAnalytics');
const Product = require('../models/Product');
const User = require('../models/User');
const ProductTrend = require('../models/ProductTrend');
const Notification = require('../models/Notification');
const { getRedisClient, isRedisActive } = require('../config/redis');

// Helper: Calculate distance (Haversine Formula) - meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 1000); // Return in meters
};

// Map keywords/queries to categories for interest mapping
const mapQueryToCategory = (query) => {
    const cleanQ = query.toLowerCase().trim();
    if (cleanQ.match(/protein|gym|workout|supplement|creatine|whey|mass gainer/i)) {
        return 'Fitness';
    }
    if (cleanQ.match(/milk|bread|egg|vegetable|fruit|tomato|grocery|butter|cream|rice|cheese/i)) {
        return 'Grocery';
    }
    if (cleanQ.match(/cake|bakery|pastry|croissant|muffin|cupcake|cookie|bread/i)) {
        return 'Bakery';
    }
    if (cleanQ.match(/headphone|phone|watch|earbuds|charger|cable|electronics|screen/i)) {
        return 'Electronics';
    }
    if (cleanQ.match(/shirt|pants|dress|saree|frock|cloth|fashion|linen|tote/i)) {
        return 'Fashion';
    }
    if (cleanQ.match(/plumber|repair|electrician|salon|beautician|tutor|lesson/i)) {
        return 'Services';
    }
    return 'Grocery'; // default
};

/**
 * Track Customer Activity & Update Interest Profile
 */
const trackActivity = async (userId, action, targetId, targetType, metadata = {}) => {
    try {
        // 1. Log Activity
        const activity = await CustomerActivity.create({
            userId,
            action,
            targetId,
            targetType,
            metadata,
            timestamp: new Date()
        });

        // 2. Determine associated category
        let category = metadata.category || '';
        
        if (!category && targetType === 'Product' && targetId) {
            const prod = await Product.findById(targetId);
            if (prod) {
                category = prod.category || prod.categorySlug || '';
            }
        }
        
        if (!category && targetType === 'User' && targetId) {
            const seller = await User.findById(targetId);
            if (seller && seller.shopDetails) {
                category = seller.shopDetails.shopCategory || seller.shopDetails.shopType || '';
            }
        }

        if (!category && action === 'search' && metadata.query) {
            category = mapQueryToCategory(metadata.query);
        }

        // Align category names to proper segments
        if (category) {
            const catLower = category.toLowerCase();
            if (catLower.includes('fit')) category = 'Fitness';
            else if (catLower.includes('groc') || catLower.includes('kirana')) category = 'Grocery';
            else if (catLower.includes('bake') || catLower.includes('sweet')) category = 'Bakery';
            else if (catLower.includes('elect') || catLower.includes('tech')) category = 'Electronics';
            else if (catLower.includes('fash') || catLower.includes('cloth')) category = 'Fashion';
            else if (catLower.includes('serv') || catLower.includes('repair')) category = 'Services';
            else category = 'Grocery'; // default mapping
        } else {
            category = 'Grocery';
        }

        // 3. Define action weights
        const weights = {
            order_purchase: 10,
            request: 7,
            wishlist: 5,
            search: 3,
            ai_search: 3,
            view_product: 1,
            view_shop: 1
        };
        const points = weights[action] || 1;

        // 4. Retrieve & Update Profile
        let profile = await CustomerProfile.findOne({ userId });
        if (!profile) {
            // Find user to get default city
            const user = await User.findById(userId);
            profile = new CustomerProfile({
                userId,
                city: user?.customerLocation?.city || 'Indore',
                categoryScores: {}
            });
        }

        // Update active hours
        const currentHour = new Date().getHours();
        if (!profile.activeHours.includes(currentHour)) {
            profile.activeHours.push(currentHour);
        }

        // Update categories maps
        const currentScore = profile.categoryScores.get(category) || 0;
        profile.categoryScores.set(category, currentScore + points);

        // Sort interests by score descending
        const sortedScores = [...profile.categoryScores.entries()].sort((a, b) => b[1] - a[1]);
        profile.interests = sortedScores.map(entry => entry[0]);

        // Segment classification: highest scoring category if score >= 5
        const topCategory = sortedScores[0]?.[0];
        const topScore = sortedScores[0]?.[1] || 0;
        if (topCategory && topScore >= 5) {
            profile.segment = topCategory;
        } else {
            profile.segment = 'Grocery'; // default
        }

        profile.profileScore = Math.min(100, Math.round(profile.profileScore + 2)); // incrementally build profile completeness score
        profile.lastActiveAt = new Date();
        
        // Update favorite products or shops arrays on specific actions
        if (action === 'order_purchase' || action === 'wishlist') {
            if (targetType === 'Product' && targetId && !profile.favoriteProducts.includes(targetId)) {
                profile.favoriteProducts.push(targetId);
            }
            if (targetType === 'User' && targetId && !profile.favoriteShops.includes(targetId)) {
                profile.favoriteShops.push(targetId);
            }
        }

        await profile.save();
        return profile;
    } catch (err) {
        console.error('[PersonalizationService] Failed to track activity:', err.message);
    }
};

/**
 * Generate Personalized Recommendations & Cache Feed Output
 */
const generatePersonalizedFeed = async (userId, lat, lng, radiusKm = 5, forceRecompute = false) => {
    try {
        const userLat = parseFloat(lat) || 28.6139; // Delhi default
        const userLng = parseFloat(lng) || 77.2090;

        // 1. Try Cache First
        const cacheKey = `recs:user:${userId}:${userLat}:${userLng}:${radiusKm}`;
        if (!forceRecompute) {
            if (isRedisActive()) {
                const redis = getRedisClient();
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }

            const dbCached = await RecommendationCache.findOne({ userId });
            if (dbCached && (Date.now() - dbCached.updatedAt.getTime() < 60 * 60 * 1000)) { // 1 hr TTL
                // Save to Redis for faster subsequent requests
                if (isRedisActive()) {
                    const redis = getRedisClient();
                    await redis.set(cacheKey, JSON.stringify({
                        segment: 'Cached',
                        products: dbCached.products,
                        shops: dbCached.shops
                    }), 'EX', 3600);
                }
                return {
                    segment: 'Cached',
                    products: dbCached.products,
                    shops: dbCached.shops
                };
            }
        }

        // 2. Fetch User Profile
        let profile = await CustomerProfile.findOne({ userId });
        if (!profile) {
            const user = await User.findById(userId);
            profile = await CustomerProfile.create({
                userId,
                city: user?.customerLocation?.city || 'Delhi',
                segment: 'Grocery',
                categoryScores: { 'Grocery': 1 }
            });
        }

        const userSegment = profile.segment;
        const userInterests = profile.interests || ['Grocery'];

        // 3. Find Nearby Sellers
        const nearbySellers = await User.find({
            role: 'seller',
            verificationStatus: 'approved',
            "shopDetails.shopLocation": {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    $maxDistance: radiusKm * 1000
                }
            }
        }).select('_id shopDetails sellerStats rating');

        const sellerIds = nearbySellers.map(s => s._id);
        const sellersMap = new Map(nearbySellers.map(s => [s._id.toString(), s]));

        // 4. Fetch All Products for Nearby Sellers
        const products = await Product.find({
            seller: { $in: sellerIds },
            isAvailable: { $ne: false },
            isDraft: { $ne: true }
        }).limit(100);

        // 5. Fetch local product trends for Indore/Delhi mapping and merge with area-specific trends
        const { geocodeCoordsToArea } = require('./hyperlocalIntelligenceService');
        const AreaTrend = require('../models/AreaTrend');
        const areaObj = geocodeCoordsToArea(userLat, userLng, profile.area || '');
        const areaTrends = await AreaTrend.find({ area: areaObj.name });

        const localTrends = await ProductTrend.find({ city: profile.city || 'global' });
        const trendsMap = new Map();
        
        // Base city trends
        localTrends.forEach(t => trendsMap.set(t.keyword.toLowerCase().trim(), t.trendScore));
        // Boosted area-specific trends
        areaTrends.forEach(t => trendsMap.set(t.product.toLowerCase().trim(), t.trendScore * 1.5));

        // 6. Score & Rank Products using AI Feed Ranking Formula
        // FeedScore = Personal Interest (40%) + Distance (20%) + Availability (20%) + Trend Score (10%) + Trust Score (10%)
        const scoredProducts = products.map(p => {
            const seller = sellersMap.get(p.seller.toString());
            let distance = 999999;
            if (seller?.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    seller.shopDetails.shopLocation.coordinates[1],
                    seller.shopDetails.shopLocation.coordinates[0]
                );
            }

            // a. Personal Interest (40 points)
            let interestScore = 0;
            const prodCat = p.category || '';
            const isTopSegment = prodCat.toLowerCase().includes(userSegment.toLowerCase());
            const isInInterests = userInterests.some(interest => prodCat.toLowerCase().includes(interest.toLowerCase()));

            if (isTopSegment) {
                interestScore = 40;
            } else if (isInInterests) {
                interestScore = 20;
            }

            // b. Distance (20 points)
            const distanceScore = distance !== 999999
                ? Math.max(0, (1 - distance / (radiusKm * 1000)) * 20)
                : 10;

            // c. Availability (20 points)
            let availabilityScore = 0;
            if (p.stockStatus === 'AVAILABLE' || p.stockStatus === 'IN_STOCK') availabilityScore = 20;
            else if (p.stockStatus === 'LIMITED') availabilityScore = 10;

            // d. Trend Score (10 points)
            const trendVal = trendsMap.get(p.name.toLowerCase().trim()) || 0;
            const trendScore = (trendVal / 100) * 10;

            // e. Trust Score (10 points)
            const trustScore = ((seller?.shopDetails?.rating || 4.0) / 5) * 10;

            const finalFeedScore = interestScore + distanceScore + availabilityScore + trendScore + trustScore;

            return {
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: seller?.shopDetails?.shopName || 'Unknown Shop',
                shopId: seller?._id,
                distance: distance,
                isOpen: seller ? (seller.shopDetails?.isOpen || seller.shopDetails?.status === 'ONLINE') : false,
                stockStatus: p.stockStatus || 'AVAILABLE',
                category: p.category || '',
                _score: Math.round(finalFeedScore)
            };
        });

        // Filter and sort products
        const rankedProducts = scoredProducts
            .filter(p => p.distance <= radiusKm * 1000)
            .sort((a, b) => b._score - a._score)
            .slice(0, 10);

        // 7. Shop Recommendations (Prioritize matching segment/interests)
        const rankedShops = nearbySellers.map(s => {
            let distance = 999999;
            if (s.shopDetails?.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    s.shopDetails.shopLocation.coordinates[1],
                    s.shopDetails.shopLocation.coordinates[0]
                );
            }

            let categoryMatchScore = 0;
            const shopCat = s.shopDetails?.shopCategory || s.shopDetails?.shopType || '';
            if (shopCat.toLowerCase().includes(userSegment.toLowerCase())) {
                categoryMatchScore = 50;
            } else if (userInterests.some(i => shopCat.toLowerCase().includes(i.toLowerCase()))) {
                categoryMatchScore = 25;
            }

            const shopScore = categoryMatchScore + (s.shopDetails?.rating || 4.0) * 5;

            return {
                _id: s._id,
                name: s.shopDetails?.shopName || 'Unknown Shop',
                category: s.shopDetails?.shopCategory || s.shopDetails?.shopType || 'Grocery',
                distance: distance,
                rating: s.shopDetails?.rating || 4.0,
                shopImage: s.shopDetails?.photos?.[0] || null,
                isOpen: s.shopDetails?.isOpen || s.shopDetails?.status === 'ONLINE',
                _score: shopScore
            };
        }).sort((a, b) => b._score - a._score)
          .slice(0, 5);

        // 8. Bundle Recommendations compilation
        let bundles = [];
        if (userSegment === 'Fitness' || userInterests.includes('Fitness')) {
            bundles.push({
                name: 'Fitness Protein Stack',
                bundlePrice: 1260,
                originalPrice: 1400,
                estimatedSavings: 140,
                products: rankedProducts.filter(p => p.name.toLowerCase().match(/protein|oats|peanut/i)).slice(0, 4)
            });
        }
        if (bundles.length === 0 || userSegment === 'Grocery') {
            bundles.push({
                name: 'Morning Breakfast Bundle',
                bundlePrice: 180,
                originalPrice: 200,
                estimatedSavings: 20,
                products: rankedProducts.filter(p => p.name.toLowerCase().match(/milk|bread|egg|butter/i)).slice(0, 4)
            });
        }

        // 9. Predictive Discovery compiles items from segment that haven't been tracked
        const activityKeywords = await CustomerActivity.distinct('metadata.query', { userId });
        const activityProductIds = await CustomerActivity.distinct('targetId', { userId, targetType: 'Product' });

        const predictiveKeywordsMap = {
            Fitness: ['creatine', 'mass gainer', 'protein bar', 'peanut butter', 'oats'],
            Grocery: ['organic honey', 'sourdough bread', 'avocado', 'almond milk'],
            Bakery: ['chocolate cake', 'croissant', 'muffin', 'cupcake'],
            Electronics: ['earbuds', 'smart watch', 'charger', 'power bank'],
            Fashion: ['linen shirt', 'sunglasses', 'tote bag', 'sneakers'],
            Services: ['plumber', 'electrician', 'salon', 'tutor']
        };

        const targetKeywords = predictiveKeywordsMap[userSegment] || predictiveKeywordsMap['Grocery'];
        // Find products matching keywords not in customer activity
        const predictiveProducts = await Product.find({
            seller: { $in: sellerIds },
            isAvailable: { $ne: false },
            name: { $regex: targetKeywords.join('|'), $options: 'i' },
            _id: { $nin: activityProductIds }
        }).limit(6);

        const predictiveDiscoveries = predictiveProducts.map(p => {
            const seller = sellersMap.get(p.seller.toString());
            return {
                _id: p._id,
                name: p.name,
                price: p.sellingPrice || p.price || 0,
                imageUrl: p.imageUrl,
                shopName: seller?.shopDetails?.shopName || 'Unknown Shop',
                shopId: seller?._id,
                stockStatus: p.stockStatus || 'AVAILABLE',
                category: p.category || ''
            };
        }).slice(0, 3);

        const feedPayload = {
            segment: userSegment,
            interests: userInterests,
            recommendedProducts: rankedProducts,
            recommendedShops: rankedShops,
            bundles,
            predictiveDiscoveries
        };

        // 10. Update Cache
        await RecommendationCache.findOneAndUpdate(
            { userId },
            {
                products: rankedProducts,
                shops: rankedShops,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        if (isRedisActive()) {
            const redis = getRedisClient();
            await redis.set(cacheKey, JSON.stringify(feedPayload), 'EX', 3600);
        }

        // Track impressions
        for (const p of rankedProducts) {
            await RecommendationAnalytics.create({
                userId,
                recommendationType: 'product',
                targetId: p._id,
                action: 'shown'
            }).catch(e => console.warn(e));
        }

        return feedPayload;
    } catch (err) {
        console.error('[PersonalizationService] Feed calculation failed:', err);
        return {
            segment: 'Grocery',
            interests: ['Grocery'],
            recommendedProducts: [],
            recommendedShops: [],
            bundles: [],
            predictiveDiscoveries: []
        };
    }
};

/**
 * Hourly Batch Recommendation Refresh Job
 */
const refreshAllCustomerCaches = async () => {
    try {
        const customers = await User.find({ role: 'customer' });
        console.log(`[PersonalizationService] Starting batch recommendation refresh for ${customers.length} customers...`);
        for (const customer of customers) {
            // Retrieve default coords or Indores'
            const lat = customer.customerLocation?.lat || 22.7196;
            const lng = customer.customerLocation?.lng || 75.8577;
            await generatePersonalizedFeed(customer._id, lat, lng, 5, true);
        }
        console.log(`[PersonalizationService] Batch refresh complete.`);
    } catch (err) {
        console.error('[PersonalizationService] Batch refresh failed:', err.message);
    }
};

/**
 * Re-Engagement Engine
 */
const runReEngagementCheck = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find inactive users
        const inactiveProfiles = await CustomerProfile.find({
            lastActiveAt: { $lte: sevenDaysAgo, $gte: thirtyDaysAgo }
        });

        console.log(`[ReEngagementEngine] Found ${inactiveProfiles.length} inactive customer profiles...`);

        for (const profile of inactiveProfiles) {
            const topInterest = profile.segment || 'Grocery';
            
            // Find current local trending items in their top interest
            const trending = await ProductTrend.findOne({
                city: profile.city || 'Indore',
                keyword: { $regex: topInterest, $options: 'i' }
            }).sort({ trendScore: -1 });

            const trendKeyword = trending?.keyword || (topInterest === 'Fitness' ? 'Protein Powder' : 'Fresh Bread');

            // Send notification
            await Notification.create({
                user: profile.userId,
                recipientRole: 'customer',
                type: 'SYSTEM',
                priority: 'IMPORTANT',
                title: 'We miss you!',
                message: `${trendKeyword} is trending in your neighborhood! Check out what's new.`,
                actionUrl: `/search?q=${encodeURIComponent(trendKeyword)}`
            });
            
            // Touch lastActiveAt so we don't notify them daily
            profile.lastActiveAt = new Date();
            await profile.save();
        }
    } catch (err) {
        console.error('[ReEngagementEngine] Inactivity check failed:', err.message);
    }
};

/**
 * Personalized AI Chatbot Assistant suggestions handler
 */
const getPersonalizedAssistantResponse = async (userId, query) => {
    try {
        const profile = await CustomerProfile.findOne({ userId });
        if (!profile) {
            return "Hi there! Welcome to Aisle. Start searching for products or shops so I can personalize suggestions for you!";
        }

        const segment = profile.segment;
        const city = profile.city || 'Indore';

        // Retrieve recommendations
        const feed = await generatePersonalizedFeed(userId, 22.7196, 75.8577, 5); // Default coords
        
        let responseText = `🤖 **Aisle AI Shopping Assistant**\n\nBased on your interest in **${segment}** and recent local trends in **${city}**, here is your personalized shopping plan for the week:\n\n`;

        if (feed.recommendedProducts && feed.recommendedProducts.length > 0) {
            responseText += `### 🛒 Recommended Products Nearby\n`;
            feed.recommendedProducts.slice(0, 3).forEach((p, idx) => {
                responseText += `${idx + 1}. **${p.name}** (₹${p.price}) - available at *${p.shopName}*\n`;
            });
            responseText += `\n`;
        }

        if (feed.bundles && feed.bundles.length > 0) {
            const b = feed.bundles[0];
            responseText += `### 📦 Featured Bundle\n- **${b.name}** (Only **₹${b.bundlePrice}**, saving ₹${b.estimatedSavings})\n\n`;
        }

        responseText += `Feel free to add these items to your cart or explore more options in the storefront!`;
        return responseText;
    } catch (err) {
        return "I'm having trouble analyzing your profile right now. How can I help you find products locally?";
    }
};

module.exports = {
    trackActivity,
    generatePersonalizedFeed,
    refreshAllCustomerCaches,
    runReEngagementCheck,
    getPersonalizedAssistantResponse
};
