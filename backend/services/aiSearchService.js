const SearchIntent = require('../models/SearchIntent');
const AIProductKnowledge = require('../models/AIProductKnowledge');
const Product = require('../models/Product');
const User = require('../models/User');
const { getRedisClient, isRedisActive } = require('../config/redis');
const SellerTrust = require('../models/SellerTrust');
const { mongoCircuit } = require('../utils/circuitBreaker');

// Helper: Calculate distance (Haversine Formula) in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 1000); // Return in meters
};

// Default AI Product Knowledge Templates
const SEED_TEMPLATES = [
    {
        intent: 'party_snacks',
        category: 'Grocery',
        products: ['chips', 'cookies', 'cold drinks', 'paper plates', 'popcorn', 'nachos'],
        bundleName: 'Party Essentials Pack',
        bundleProducts: ['chips', 'cold drinks', 'paper plates']
    },
    {
        intent: 'breakfast',
        category: 'Grocery',
        products: ['milk', 'bread', 'eggs', 'butter', 'oats', 'honey'],
        bundleName: 'Healthy Morning Bundle',
        bundleProducts: ['milk', 'bread', 'eggs', 'butter']
    },
    {
        intent: 'paneer_butter_masala',
        category: 'Grocery',
        products: ['paneer', 'butter', 'cream', 'tomato', 'spices', 'onion', 'garlic'],
        bundleName: 'Paneer Butter Masala Ingredient Kit',
        bundleProducts: ['paneer', 'butter', 'cream', 'tomato', 'spices']
    },
    {
        intent: 'school_supplies',
        category: 'Stationery',
        products: ['notebook', 'pen', 'pencil', 'ruler', 'eraser', 'sharpener', 'sketchbook'],
        bundleName: 'Class 8 Back to School Kit',
        bundleProducts: ['notebook', 'pen', 'pencil', 'ruler']
    },
    {
        intent: 'healthy_protein',
        category: 'Grocery',
        products: ['protein powder', 'eggs', 'milk', 'oats', 'almonds', 'peanut butter'],
        bundleName: 'Fitness Protein Stack',
        bundleProducts: ['protein powder', 'oats', 'peanut butter']
    }
];

// Seed Knowledge if empty
const seedKnowledge = async () => {
    try {
        const count = await AIProductKnowledge.countDocuments();
        if (count === 0) {
            console.log('[AISearchService] Seeding default AI Product Knowledge templates...');
            await AIProductKnowledge.insertMany(SEED_TEMPLATES);
            console.log('[AISearchService] Templates seeded successfully.');
        }
    } catch (err) {
        console.error('[AISearchService] Error seeding templates:', err.message);
    }
};

// Rule-based Intent and Entity Classifier
const detectIntentAndEntities = async (query) => {
    const q = query.toLowerCase().trim();
    let matchedIntent = 'unknown';
    let confidence = 0;
    let category = 'Grocery';

    // Heuristic Intent Detection Rules
    if (q.includes('party') || q.includes('snacks') || q.includes('birthday') || q.includes('guests')) {
        matchedIntent = 'party_snacks';
        confidence = q.includes('party') && q.includes('snacks') ? 96 : 85;
        category = 'Grocery';
    } else if (q.includes('breakfast') || q.includes('morning') || q.includes('breakfast items')) {
        matchedIntent = 'breakfast';
        confidence = q.includes('breakfast') ? 95 : 80;
        category = 'Grocery';
    } else if (q.includes('paneer') || q.includes('butter masala') || q.includes('paneer butter masala')) {
        matchedIntent = 'paneer_butter_masala';
        confidence = q.includes('paneer') && q.includes('masala') ? 98 : 90;
        category = 'Grocery';
    } else if (q.includes('school') || q.includes('supplies') || q.includes('class') || q.includes('study') || q.includes('stationery') || q.includes('notebook')) {
        matchedIntent = 'school_supplies';
        confidence = q.includes('supplies') && q.includes('class') ? 94 : 85;
        category = 'Stationery';
    } else if (q.includes('protein') || q.includes('healthy') || q.includes('fitness') || q.includes('diet') || q.includes('gym')) {
        matchedIntent = 'healthy_protein';
        confidence = q.includes('protein') ? 94 : 80;
        category = 'Grocery';
    }

    if (matchedIntent === 'unknown') {
        return { intent: 'unknown', confidence: 0, extractedEntities: [], category: null };
    }

    // Entity Extraction from matching Intent details
    const knowledge = await AIProductKnowledge.findOne({ intent: matchedIntent });
    const extractedEntities = [];

    if (knowledge) {
        // Find which knowledge products are requested/implied in the query
        // or just pull default products for that intent as extracted items
        knowledge.products.forEach(p => {
            if (q.includes(p) || q.includes(p.split(' ')[0])) {
                extractedEntities.push(p);
            }
        });

        // Fallback: If no specific items are named in query, include top 3 bundle items as extracted entities
        if (extractedEntities.length === 0) {
            extractedEntities.push(...knowledge.bundleProducts.slice(0, 3));
        }
    }

    return {
        intent: matchedIntent,
        confidence,
        extractedEntities,
        category: knowledge ? knowledge.category : category
    };
};

// Main AI Search Service function
const searchAI = async (query, lat, lng, radius = 5, userId = null, limit = 15, cursor = null) => {
    await seedKnowledge();

    const normalizedQuery = query.toLowerCase().trim();
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const userHasCoords = !isNaN(userLat) && !isNaN(userLng);
    const searchRadiusMeters = radius * 1000;

    // 1. Check Redis Cache
    const cacheKey = `ai:search:query:${normalizedQuery}:${lat || 'null'}:${lng || 'null'}:${radius}:${limit}:${cursor || 'null'}`;
    if (isRedisActive()) {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[AISearchService] Redis Cache Hit for query: "${query}"`);
            return JSON.parse(cached);
        }
    }

    // 2. Intent Detection
    const { intent, confidence, extractedEntities, category } = await detectIntentAndEntities(normalizedQuery);

    // Fallback trigger: if unknown intent
    if (intent === 'unknown' || confidence < 50) {
        return {
            intent: 'unknown',
            confidence: 0,
            extractedEntities: [],
            category: null,
            products: [],
            shops: [],
            bundleRecommendations: [],
            fallback: true
        };
    }

    // 3. Mapped Intent Details
    const knowledge = await AIProductKnowledge.findOne({ intent });
    if (!knowledge) {
        return { intent: 'unknown', confidence: 0, extractedEntities: [], category: null, products: [], shops: [], bundleRecommendations: [], fallback: true };
    }

    // 4. Fetch Sellers within Radius
    let sellerIds = [];
    let sellersMap = new Map();
    if (userHasCoords) {
        const sellers = await User.find({
            role: 'seller',
            verificationStatus: 'approved',
            "shopDetails.shopLocation": {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    $maxDistance: searchRadiusMeters
                }
            }
        }).select('_id shopDetails subscription visibilityBoost sellerStats');
        sellerIds = sellers.map(s => s._id);
        sellers.forEach(s => sellersMap.set(s._id.toString(), s));
    } else {
        const sellers = await User.find({ role: 'seller', verificationStatus: 'approved' })
            .select('_id shopDetails subscription visibilityBoost sellerStats');
        sellerIds = sellers.map(s => s._id);
        sellers.forEach(s => sellersMap.set(s._id.toString(), s));
    }

    // 5. Search Products for Mapped Entities
    // Fetch products belonging to these sellers matching any extracted product term
    const productKeywords = knowledge.products;
    const regexQueries = productKeywords.map(k => ({
        $or: [
            { name: { $regex: k, $options: 'i' } },
            { brand: { $regex: k, $options: 'i' } },
            { category: { $regex: k, $options: 'i' } }
        ]
    }));

    const productQuery = {
        seller: { $in: sellerIds },
        isAvailable: { $ne: false },
        isDraft: { $ne: true },
        adminStatus: 'Active',
        $or: regexQueries
    };

    if (cursor) {
        productQuery._id = { $gt: cursor };
    }

    const startMongo = Date.now();
    let dbProducts;
    try {
        dbProducts = await mongoCircuit.execute(async () => {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('MongoDB query timeout (Slow Database)'));
                }, 100); // 100ms timeout budget
            });

            const queryPromise = Product.find(productQuery)
                .populate('seller', 'shopDetails subscription visibilityBoost sellerStats')
                .limit(parseInt(limit, 10) + 1);

            try {
                const result = await Promise.race([queryPromise, timeoutPromise]);
                clearTimeout(timeoutId);
                return result;
            } catch (err) {
                clearTimeout(timeoutId);
                throw err;
            }
        });
    } catch (mongoErr) {
        console.error('[AISearchService] MongoDB Query Failure, trying cached fallback...', mongoErr.message);
        dbProducts = [];
    }
    const mongoDuration = Date.now() - startMongo;

    // Latency degradation or failure check
    const MONGO_LATENCY_THRESHOLD = 300;
    let isMongoHealthy = dbProducts && dbProducts.length > 0;
    if (mongoDuration > MONGO_LATENCY_THRESHOLD) {
        console.warn(`[Search Resilience] MongoDB search query latency of ${mongoDuration}ms exceeded threshold. Checking fallback cache.`);
        isMongoHealthy = false;
    }

    if (!isMongoHealthy && isRedisActive()) {
        try {
            const redis = getRedisClient();
            const fallbackKey = `ai:search:fallback:${normalizedQuery}`;
            const cachedFallback = await redis.get(fallbackKey);
            if (cachedFallback) {
                console.log(`[Search Resilience] Serving fallback cached results for query: "${query}"`);
                const payload = JSON.parse(cachedFallback);
                payload.fallbackServed = true;
                return payload;
            }
        } catch (fallbackErr) {
            console.error('[Search Resilience] Failed to fetch fallback cache:', fallbackErr.message);
        }
    }

    let hasNextPage = false;
    if (dbProducts.length > limit) {
        hasNextPage = true;
        dbProducts.pop();
    }

    // Fetch trust scores for ranking
    const trusts = await SellerTrust.find({ sellerId: { $in: sellerIds } }).lean();
    const trustMap = {};
    trusts.forEach(t => {
        trustMap[t.sellerId.toString()] = t.trustScore;
    });

    // 6. Score & Rank Products using multi-factor ranking
    // Formula: Score = IntentMatch(40) + Availability(25) + Distance(20) + TrustScore(15)
    const scoredProducts = dbProducts.map(p => {
        const seller = p.seller || sellersMap.get(p.sellerId?.toString());
        let distance = 999999;

        if (seller?.shopDetails?.shopLocation?.coordinates && userHasCoords) {
            distance = calculateDistance(
                userLat, userLng,
                seller.shopDetails.shopLocation.coordinates[1],
                seller.shopDetails.shopLocation.coordinates[0]
            );
        }

        // A. Intent Match Score (40%)
        // Exact name match or matches extracted entities
        const matchesName = extractedEntities.some(e => p.name.toLowerCase().includes(e));
        const intentScore = matchesName ? 40 : 20;

        // B. Availability Score (25%)
        let availabilityScore = 0;
        if (p.stockStatus === 'AVAILABLE' || p.stockStatus === 'IN_STOCK' || p.quantity >= 5) {
            availabilityScore = 25;
        } else if (p.stockStatus === 'LIMITED' || p.quantity > 0) {
            availabilityScore = 15;
        }

        // C. Distance Score (20%)
        const distanceScore = userHasCoords && distance !== 999999
            ? Math.max(0, (1 - distance / searchRadiusMeters) * 20)
            : 10;

        // D. Trust Score (15%)
        const sellerTrustVal = trustMap[p.seller?._id?.toString() || p.sellerId?.toString()] !== undefined
            ? trustMap[p.seller?._id?.toString() || p.sellerId?.toString()]
            : 80;
        const trustScore = (sellerTrustVal / 100) * 15;

        const totalScore = intentScore + availabilityScore + distanceScore + trustScore;

        return {
            _id: p._id,
            name: p.name,
            brand: p.brand || 'Local Brand',
            price: p.sellingPrice || p.price || 0,
            imageUrl: p.imageUrl,
            stockStatus: p.stockStatus || (p.quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
            shopName: seller?.shopDetails?.shopName || 'Local Shop',
            shopId: seller?._id,
            distance,
            isOpen: seller ? (seller.shopDetails?.isOpen || seller.shopDetails?.operatingMode === 'ALWAYS_OPEN') : false,
            score: Math.round(totalScore),
            category: p.category
        };
    }).filter(p => !userHasCoords || p.distance <= searchRadiusMeters)
      .sort((a, b) => b.score - a.score);

    // 7. Group and Match Nearby Shops
    const shopMatches = [];
    const uniqueShops = new Set();
    scoredProducts.forEach(p => {
        if (!uniqueShops.has(p.shopId.toString())) {
            uniqueShops.add(p.shopId.toString());
            const seller = sellersMap.get(p.shopId.toString());
            if (seller) {
                shopMatches.push({
                    _id: seller._id,
                    name: seller.shopDetails?.shopName || 'Unknown Shop',
                    category: seller.shopDetails?.shopCategory || 'Grocery',
                    distance: p.distance,
                    rating: seller.shopDetails?.rating || 4.0,
                    shopImage: seller.shopDetails?.photos?.[0] || null,
                    isOpen: p.isOpen
                });
            }
        }
    });

    // 8. Bundle Recommendations
    let bundleRecommendations = [];
    if (knowledge.bundleName && knowledge.bundleProducts.length > 0) {
        // Compile the bundle by picking matching products from the search results
        const bundleItems = [];
        let totalOriginalPrice = 0;

        knowledge.bundleProducts.forEach(itemTerm => {
            // Pick the highest ranking product matching this term
            const matchedProd = scoredProducts.find(sp => sp.name.toLowerCase().includes(itemTerm) || sp.category?.toLowerCase().includes(itemTerm));
            if (matchedProd) {
                bundleItems.push({
                    productId: matchedProd._id,
                    name: matchedProd.name,
                    price: matchedProd.price,
                    imageUrl: matchedProd.imageUrl,
                    shopName: matchedProd.shopName
                });
                totalOriginalPrice += matchedProd.price;
            }
        });

        // Only recommend the bundle if we found at least 2 items matching the bundle products list
        if (bundleItems.length >= 2) {
            const discountPercent = 10; // 10% bundle savings
            const bundlePrice = Math.round(totalOriginalPrice * (1 - discountPercent / 100));
            const estimatedSavings = totalOriginalPrice - bundlePrice;

            bundleRecommendations.push({
                name: knowledge.bundleName,
                products: bundleItems,
                originalPrice: totalOriginalPrice,
                bundlePrice,
                estimatedSavings,
                discountPercent
            });
        }
    }

    // 9. Save SearchIntent log for learning and analytics dashboard
    const intentDoc = await SearchIntent.create({
        query,
        normalizedQuery,
        intent,
        confidence,
        extractedEntities,
        category: knowledge.category
    });

    const nextCursor = hasNextPage && scoredProducts.length > 0
        ? scoredProducts[scoredProducts.length - 1]._id.toString()
        : null;

    const responsePayload = {
        searchIntentId: intentDoc._id,
        intent,
        confidence,
        extractedEntities,
        category: knowledge.category,
        products: scoredProducts,
        nextCursor,
        shops: shopMatches.slice(0, 5),
        bundleRecommendations,
        fallback: false
    };

    // 10. Cache in Redis
    if (isRedisActive()) {
        try {
            const redis = getRedisClient();
            await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 900); // 15 mins
            
            // Set persistent fallback cache with longer expiration
            const fallbackKey = `ai:search:fallback:${normalizedQuery}`;
            await redis.set(fallbackKey, JSON.stringify(responsePayload), 'EX', 86400); // 24 hours
        } catch (cacheErr) {
            console.error('[AISearchService] Redis cache set failed:', cacheErr.message);
        }
    }

    return responsePayload;
};

// Track clicks for learning loop
const recordSearchClick = async (searchIntentId) => {
    try {
        const doc = await SearchIntent.findByIdAndUpdate(
            searchIntentId,
            { $inc: { clicks: 1 } },
            { new: true }
        );
        return doc;
    } catch (err) {
        console.error('[AISearchService] Click tracking error:', err.message);
        return null;
    }
};

// Track purchases/conversions for learning loop
const recordSearchConversion = async (searchIntentId) => {
    try {
        const doc = await SearchIntent.findByIdAndUpdate(
            searchIntentId,
            { $inc: { conversions: 1 } },
            { new: true }
        );
        return doc;
    } catch (err) {
        console.error('[AISearchService] Conversion tracking error:', err.message);
        return null;
    }
};

// Generate suggestions as the user types
const getSearchSuggestions = async (q) => {
    const cleanQ = q.toLowerCase().trim();
    if (!cleanQ) return [];

    const suggestions = [];

    // Check predefined templates first to suggest natural phrases
    SEED_TEMPLATES.forEach(t => {
        if (t.intent.replace('_', ' ').includes(cleanQ) || t.bundleName.toLowerCase().includes(cleanQ)) {
            suggestions.push({
                text: `Need ingredients for ${t.intent.split('_').join(' ')}`,
                type: 'ai_intent',
                intent: t.intent
            });
            suggestions.push({
                text: `Buy ${t.bundleName}`,
                type: 'ai_bundle',
                intent: t.intent
            });
        }
    });

    // Query SearchIntent logs for popular queries starting with this keyword
    const popularIntents = await SearchIntent.aggregate([
        { $match: { query: { $regex: `^${cleanQ}`, $options: 'i' } } },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
    ]);

    popularIntents.forEach(p => {
        if (!suggestions.some(s => s.text.toLowerCase() === p._id.toLowerCase())) {
            suggestions.push({
                text: p._id,
                type: 'popular_query'
            });
        }
    });

    // Generic fallbacks matching standard categories/keywords
    const categories = ['Grocery', 'Stationery', 'Electronics', 'Bakery', 'Pharmacy'];
    categories.forEach(cat => {
        if (cat.toLowerCase().startsWith(cleanQ)) {
            suggestions.push({
                text: `Need products in ${cat}`,
                type: 'category'
            });
        }
    });

    return suggestions.slice(0, 5);
};

module.exports = {
    searchAI,
    recordSearchClick,
    recordSearchConversion,
    getSearchSuggestions,
    seedKnowledge
};
