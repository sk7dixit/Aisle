const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const ProductTrend = require("../models/ProductTrend");
const DemandGap = require("../models/DemandGap");
const SellerIntelligence = require("../models/SellerIntelligence");
const SellerRecommendation = require("../models/SellerRecommendation");
const MasterCatalogProduct = require("../models/MasterCatalogProduct");
const MasterCatalogSellerProduct = require("../models/MasterCatalogSellerProduct");
const SearchAnalytics = require("../models/SearchAnalytics");
const { createNotification } = require("../controllers/notificationController");
// Indore Areas list for Simulated Demand Heat Maps
const INDORE_AREAS = [
    { area: "Vijay Nagar", pincode: "452010", lat: 22.7533, lng: 75.8937 },
    { area: "Palasia", pincode: "452001", lat: 22.7244, lng: 75.8839 },
    { area: "Rajwada", pincode: "452002", lat: 22.7188, lng: 75.8770 },
    { area: "Bhawarkua", pincode: "452014", lat: 22.6983, lng: 75.8679 },
    { area: "LIG Colony", pincode: "452011", lat: 22.7420, lng: 75.8910 }
];

// Category keyword mappings for relevance checking (Category Mapping Engine)
const GROCERY_KEYWORDS = ['milk', 'bread', 'butter', 'eggs', 'cheese', 'grocery', 'oil', 'rice', 'wheat', 'atta', 'flour', 'sugar', 'salt', 'snacks', 'biscuits', 'cookies', 'chips', 'protein powder', 'cold coffee', 'ice cream', 'coffee', 'tea', 'beverage', 'drinks', 'energy drinks', 'soda', 'coke', 'pepsi', 'juice', 'sauce', 'jam', 'noodle', 'pasta', 'pulses', 'dal', 'spices', 'masala', 'vegetable', 'fruit', 'apple', 'banana', 'tomato', 'potato', 'onion', 'paneer', 'yogurt', 'curd', 'ghee'];
const ELECTRONICS_KEYWORDS = ['mobile', 'phone', 'laptop', 'bag', 'charger', 'cable', 'headphone', 'earphone', 'mouse', 'keyboard', 'usb', 'power bank', 'case', 'cover', 'screen', 'bulb', 'lighting', 'wire', 'switch', 'battery', 'plug', 'socket', 'tv', 'appliance', 'fan', 'ac', 'cooler', 'iron', 'trimmer'];
const PHARMACY_KEYWORDS = ['medicine', 'tablet', 'capsule', 'syrup', 'paracetamol', 'aspirin', 'vitamin', 'multivitamin', 'protein powder', 'bandage', 'antiseptic', 'sanitizer', 'mask', 'syringe', 'ointment', 'painkiller', 'cough', 'cold', 'supplement'];
const STATIONERY_KEYWORDS = ['pen', 'pencil', 'notebook', 'register', 'paper', 'folder', 'file', 'eraser', 'sharpener', 'scale', 'ruler', 'calculator', 'stapler', 'ink', 'marker', 'highlighter', 'diary', 'book', 'textbook', 'novel', 'colors', 'paint'];
const LIFESTYLE_KEYWORDS = ['pillow', 'bedsheet', 'towel', 'curtain', 'cushion', 'decor', 'clock', 'vase', 'plate', 'spoon', 'fork', 'cup', 'glass', 'mug', 'bowl', 'pan', 'cooker', 'beauty', 'makeup', 'cream', 'lotion', 'shampoo', 'soap', 'perfume', 'deodorant', 'lipstick', 'nail', 'eyeliner', 'toy', 'doll', 'ball', 'bat', 'gift', 'bag', 'purse', 'wallet', 'luggage', 'shoe', 'slipper', 'sandal', 'shirt', 'tshirt', 'jeans', 'pant', 'dress', 'top', 'socks', 'undergarments'];

const CATEGORY_MAP = {
    "grocery": GROCERY_KEYWORDS,
    "grocery_kirana": GROCERY_KEYWORDS,
    "grocery / kirana": GROCERY_KEYWORDS,
    "dairy & ice cream": GROCERY_KEYWORDS,
    "fruits & vegetables": GROCERY_KEYWORDS,
    "bakery & cake shop": GROCERY_KEYWORDS,
    "general provision / kirana": GROCERY_KEYWORDS,
    "electronics": ELECTRONICS_KEYWORDS,
    "tech & accessories": ELECTRONICS_KEYWORDS,
    "mobiles, audio & wearables": ELECTRONICS_KEYWORDS,
    "pharmacy": PHARMACY_KEYWORDS,
    "pharmacy & wellness": PHARMACY_KEYWORDS,
    "allopathic chemist": PHARMACY_KEYWORDS,
    "ayurvedic & herbal": PHARMACY_KEYWORDS,
    "stationery": STATIONERY_KEYWORDS,
    "student & office": STATIONERY_KEYWORDS,
    "school & writing supplies": STATIONERY_KEYWORDS,
    "lifestyle": LIFESTYLE_KEYWORDS,
    "home & lifestyle": LIFESTYLE_KEYWORDS,
    "furnishing & home decor": LIFESTYLE_KEYWORDS,
    "kitchenware & cookware": LIFESTYLE_KEYWORDS
};

/**
 * Check if a product keyword is relevant to a seller's shop type or primary category
 */
function isKeywordRelevant(keyword, primaryCategory, shopType) {
    if (!keyword) return false;
    const kw = keyword.toLowerCase().trim();
    const cat = (primaryCategory || "").toLowerCase().trim();
    const type = (shopType || "").toLowerCase().trim();

    // Find keyword lists corresponding to seller's profile
    let sellerKeywords = [];
    if (CATEGORY_MAP[cat]) {
        sellerKeywords = sellerKeywords.concat(CATEGORY_MAP[cat]);
    }
    if (CATEGORY_MAP[type]) {
        sellerKeywords = sellerKeywords.concat(CATEGORY_MAP[type]);
    }

    // Default to Grocery if no match found
    if (sellerKeywords.length === 0) {
        sellerKeywords = GROCERY_KEYWORDS;
    }

    // Check if the keyword contains any of our mapped keywords or vice-versa
    return sellerKeywords.some(sk => kw.includes(sk) || sk.includes(kw));
}

/**
 * Retrieve all inventory products listed by a seller (Master-linked + Loose/Local)
 */
async function getSellerAllProducts(sellerId) {
    // 1. Linked products
    const linked = await MasterCatalogSellerProduct.find({ seller: sellerId })
        .populate({
            path: 'product',
            model: 'MasterCatalogProduct'
        });

    // 2. Loose products
    const loose = await Product.find({ seller: sellerId, catalogProductId: null });

    return [
        ...linked.map(sp => ({
            _id: sp._id,
            name: sp.product?.name || "Master Product",
            category: sp.product?.category || "Grocery",
            quantity: sp.stock || 0,
            views: sp.views || 0,
            sellingPrice: sp.price || 0,
            isLinked: true,
            productId: sp.product?._id
        })),
        ...loose.map(p => ({
            _id: p._id,
            name: p.name,
            category: p.category,
            quantity: p.quantity || 0,
            views: p.views || 0,
            sellingPrice: p.sellingPrice || p.mrp || 0,
            isLinked: false,
            productId: p._id
        }))
    ];
}

/**
 * Calculate and update a seller's intelligence profile
 */
async function calculateSellerIntelligence(sellerId) {
    try {
        const user = await User.findById(sellerId);
        if (!user || user.role !== "seller") {
            throw new Error("User not found or is not a seller");
        }

        const city = (user.shopDetails?.location?.city || user.shopDetails?.shopLocation?.city || user.customerLocation?.city || "indore").toLowerCase().trim();
        const products = await getSellerAllProducts(sellerId);

        // 1. Categories stocked
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        
        // 2. Primary Category
        let primaryCategory = user.shopDetails?.category || "Grocery";
        if (products.length > 0) {
            const counts = {};
            products.forEach(p => {
                counts[p.category] = (counts[p.category] || 0) + 1;
            });
            let maxCount = 0;
            Object.keys(counts).forEach(cat => {
                if (counts[cat] > maxCount) {
                    maxCount = counts[cat];
                    primaryCategory = cat;
                }
            });
        }

        // 3. Response rate
        const responseRate = user.sellerStats?.responseRate || 85;

        // 4. Trend Affinity: compare stocked products with top local trends
        const topTrends = await ProductTrend.find({ city }).sort({ trendScore: -1 }).limit(10);
        let trendAffinity = 80; // default fallback
        if (topTrends.length > 0) {
            let matched = 0;
            topTrends.forEach(t => {
                const isStocked = products.some(p => p.name.toLowerCase().includes(t.keyword.toLowerCase()));
                if (isStocked) matched++;
            });
            trendAffinity = Math.round((matched / topTrends.length) * 100);
        }

        // 5. Inventory Strength: percentage of active products with quantity >= 5
        let inventoryStrength = 50; // default fallback
        if (products.length > 0) {
            const strong = products.filter(p => p.quantity >= 5).length;
            inventoryStrength = Math.round((strong / products.length) * 100);
        }

        // 6. Demand Coverage: percentage of top local DemandGap keywords stocked
        const topGaps = await DemandGap.find({ city }).sort({ gapScore: -1 }).limit(10);
        let demandCoverage = 75; // default fallback
        if (topGaps.length > 0) {
            let matched = 0;
            topGaps.forEach(g => {
                const isStocked = products.some(p => p.name.toLowerCase().includes(g.keyword.toLowerCase()));
                if (isStocked) matched++;
            });
            demandCoverage = Math.round((matched / topGaps.length) * 100);
        }

        // 7. Overall Opportunity Score
        const opportunityScore = Math.round(
            0.3 * trendAffinity +
            0.2 * inventoryStrength +
            0.2 * responseRate +
            0.3 * demandCoverage
        );

        // Upsert SellerIntelligence profile
        const intelligence = await SellerIntelligence.findOneAndUpdate(
            { sellerId },
            {
                categories,
                primaryCategory,
                city,
                trendAffinity,
                inventoryStrength,
                responseRate,
                demandCoverage,
                opportunityScore
            },
            { upsert: true, new: true }
        );

        console.log(`[SellerIntelligence] Profile updated for seller ${sellerId}: Score = ${opportunityScore}`);
        return intelligence;
    } catch (error) {
        console.error(`Error calculating seller intelligence for ${sellerId}:`, error);
        throw error;
    }
}

/**
 * Generate opportunity recommendations and restock predictions for a seller
 */
async function generateSellerRecommendations(sellerId) {
    try {
        const user = await User.findById(sellerId);
        if (!user) throw new Error("Seller not found");

        const city = (user.shopDetails?.location?.city || user.shopDetails?.shopLocation?.city || user.customerLocation?.city || "indore").toLowerCase().trim();
        const shopType = user.shopDetails?.shopType || "GROCERY_KIRANA";
        const primaryCategory = user.shopDetails?.category || "Grocery";

        const products = await getSellerAllProducts(sellerId);

        // --- SECTION A: OPPORTUNITY RECOMMENDATIONS (MISSING PRODUCTS) ---
        // Fetch top Demand Gaps in the city
        const gaps = await DemandGap.find({ city, gapScore: { $gt: 50 } }).sort({ gapScore: -1 }).limit(10);
        
        for (const gap of gaps) {
            // 1. Category Filter: Is this gap relevant to the seller?
            if (!isKeywordRelevant(gap.keyword, primaryCategory, shopType)) {
                continue;
            }

            // 2. Already Stocked Filter: Does the seller already have this product?
            const isStocked = products.some(p => p.name.toLowerCase().includes(gap.keyword.toLowerCase()));
            if (isStocked) {
                continue;
            }

            // Calculate estimated monthly revenue: Searches * 20% conversion * Average price
            // Default average price is ₹150 unless we find a matching catalog product price
            let averagePrice = 150;
            const matchingCatalogProduct = await MasterCatalogProduct.findOne({ name: { $regex: new RegExp(gap.keyword, 'i') } });
            if (matchingCatalogProduct && matchingCatalogProduct.price) {
                averagePrice = matchingCatalogProduct.price;
            }
            const searches = gap.demandScore || 100;
            const estimatedRevenue = Math.round(searches * 0.20 * averagePrice);

            // Compute ethical competitor intelligence: % of nearby stores stocking it
            // We find all other sellers in the same city of same shopType
            const totalSellers = await User.countDocuments({
                role: "seller",
                _id: { $ne: sellerId },
                "shopDetails.shopLocation.city": city,
                "shopDetails.shopType": shopType
            });

            let competitorPercentage = 65; // realistic fallback
            if (totalSellers > 0) {
                // Find how many of these other sellers stock it
                // We'll search Product and MasterCatalogSellerProduct
                const sellersWithIt = await Product.distinct("seller", {
                    seller: { $ne: sellerId },
                    name: { $regex: new RegExp(gap.keyword, 'i') }
                });
                competitorPercentage = Math.round((sellersWithIt.length / totalSellers) * 100);
                if (competitorPercentage === 0) competitorPercentage = 35; // default benchmark baseline
            }

            // Priority based on gapScore
            let priority = "medium";
            if (gap.gapScore > 75) priority = "high";
            else if (gap.gapScore < 60) priority = "low";

            // Upsert Opportunity recommendation
            await SellerRecommendation.findOneAndUpdate(
                { sellerId, product: gap.keyword, type: "inventory_opportunity" },
                {
                    title: `High Demand Product Missing: ${gap.keyword}`,
                    confidence: Math.round(gap.gapScore),
                    priority,
                    estimatedRevenue,
                    competitorInsights: `${competitorPercentage}% of top performing stores nearby stock this item.`,
                    status: "pending"
                },
                { upsert: true }
            );

            // Trigger Automated Notification if GapScore > 70
            if (gap.gapScore > 70) {
                await createNotification(
                    sellerId,
                    "SYSTEM",
                    "New Opportunity Detected",
                    `High demand detected in your area for ${gap.keyword}. Add it now to capture up to ₹${estimatedRevenue.toLocaleString()}/month in missed revenue.`,
                    "high"
                );
            }
        }

        // --- SECTION B: RESTOCK PREDICTIONS ---
        for (const product of products) {
            if (product.quantity <= 0) continue; // already out of stock

            // Look up product trend to find growth percentage and search requests (views)
            const trend = await ProductTrend.findOne({ city, keyword: { $regex: new RegExp(product.name, 'i') } });
            const growthPercentage = trend ? trend.growthPercentage : 10;
            const views = product.views || 5;

            // Restock Prediction Formula
            const daysToStockout = Math.round(product.quantity / (1 + (views * (1 + growthPercentage / 100) * 0.1)));

            if (daysToStockout <= 7) {
                await SellerRecommendation.findOneAndUpdate(
                    { sellerId, product: product.name, type: "restock_prediction" },
                    {
                        title: `${product.name} likely out of stock in ${daysToStockout} days`,
                        confidence: 90,
                        priority: daysToStockout <= 3 ? "high" : "medium",
                        estimatedRevenue: Math.round(product.sellingPrice * product.quantity),
                        competitorInsights: `Current stock level: ${product.quantity} items. Est. demand spike: +${growthPercentage}%.`,
                        status: "pending"
                    },
                    { upsert: true }
                );

                // Create alert notification
                if (daysToStockout <= 3) {
                    await createNotification(
                        sellerId,
                        "SYSTEM",
                        "Stockout Warning",
                        `${product.name} is running critically low (${product.quantity} left) and will likely sell out in ${daysToStockout} days due to rising local trends.`,
                        "high"
                    );
                }
            }
        }

        // --- SECTION C: TRENDING SPIKE RECOMMENDATIONS ---
        const topTrendsNearby = await ProductTrend.find({ city }).sort({ growthPercentage: -1 }).limit(5);
        for (const trend of topTrendsNearby) {
            if (!isKeywordRelevant(trend.keyword, primaryCategory, shopType)) continue;

            const isStocked = products.some(p => p.name.toLowerCase().includes(trend.keyword.toLowerCase()));
            if (isStocked) continue;

            await SellerRecommendation.findOneAndUpdate(
                { sellerId, product: trend.keyword, type: "trending_spike" },
                {
                    title: `Local Demand Spike: ${trend.keyword}`,
                    confidence: 85,
                    priority: "medium",
                    estimatedRevenue: Math.round(trend.searchCount * 0.15 * 120),
                    competitorInsights: `Searches spiked by +${trend.growthPercentage}% in your area over the last 24h.`,
                    status: "pending"
                },
                { upsert: true }
            );
        }

        console.log(`[SellerRecommendation] Completed recommendation run for seller ${sellerId}`);
    } catch (error) {
        console.error(`Error generating seller recommendations for ${sellerId}:`, error);
        throw error;
    }
}

/**
 * Handle feedback learning loop (Accept/Ignore)
 */
async function learnFromFeedback(recommendationId, sellerId, action) {
    try {
        const recommendation = await SellerRecommendation.findOne({ _id: recommendationId, sellerId });
        if (!recommendation) throw new Error("Recommendation not found");

        if (action === "accept") {
            recommendation.status = "accepted";
            await recommendation.save();

            // 1. Check if it already exists in seller's primary Product list
            const existing = await Product.findOne({ seller: sellerId, name: { $regex: new RegExp(recommendation.product, 'i') } });
            if (!existing) {
                // Find matching catalog product
                const catalogProduct = await MasterCatalogProduct.findOne({ name: { $regex: new RegExp(recommendation.product, 'i') } });
                
                if (catalogProduct) {
                    // Replicate addProductToShop catalog sync
                    await MasterCatalogSellerProduct.create({
                        seller: sellerId,
                        product: catalogProduct._id,
                        price: catalogProduct.price || 150,
                        stock: 20, // default initial stock for accepted opportunities
                        available: true
                    });

                    // Add to primary Aisle Product catalog
                    const user = await User.findById(sellerId);
                    const shopType = user?.shopDetails?.shopType || "GROCERY_KIRANA";

                    const getCategorySlug = (category) => {
                        if (!category) return 'general-provision';
                        const normalized = category.toLowerCase();
                        if (normalized.includes('dairy') || normalized.includes('milk')) return 'dairy-ice-cream';
                        if (normalized.includes('bakery') || normalized.includes('bread')) return 'bakery-cake-shop';
                        if (normalized.includes('fruit') || normalized.includes('vegetable')) return 'fruits-vegetables';
                        return 'general-provision';
                    };

                    const categorySlug = getCategorySlug(catalogProduct.category);

                    await Product.create({
                        seller: sellerId,
                        name: catalogProduct.name,
                        brand: catalogProduct.brand || "Generics",
                        shopType,
                        categorySlug,
                        category: catalogProduct.category || "Grocery",
                        subCategory: catalogProduct.category || "Grocery",
                        mrp: catalogProduct.price || 150,
                        sellingPrice: catalogProduct.price || 150,
                        unit: 'pcs',
                        quantity: 20,
                        stockStatus: 'IN_STOCK',
                        productType: 'STANDARD',
                        catalogProductId: catalogProduct._id.toString(),
                        source: 'catalog',
                        isExact: true,
                        isAvailable: true,
                        imageUrl: catalogProduct.imageUrl || 'https://via.placeholder.com/150'
                    });
                } else {
                    // Create as standard loose product
                    const user = await User.findById(sellerId);
                    const shopType = user?.shopDetails?.shopType || "GROCERY_KIRANA";
                    const primaryCategory = user?.shopDetails?.category || "Grocery";

                    await Product.create({
                        seller: sellerId,
                        name: recommendation.product,
                        brand: "Generic",
                        shopType,
                        categorySlug: 'general-provision',
                        category: primaryCategory,
                        subCategory: primaryCategory,
                        mrp: 150,
                        sellingPrice: 150,
                        unit: 'Piece',
                        quantity: 20,
                        stockStatus: 'IN_STOCK',
                        productType: 'STANDARD',
                        catalogProductId: null,
                        source: 'manual',
                        isExact: false,
                        isAvailable: true,
                        imageUrl: 'https://via.placeholder.com/150'
                    });
                }
            }
        } else if (action === "ignore") {
            recommendation.status = "ignored";
            await recommendation.save();
        }

        // Re-calculate intelligence metrics now that inventory / alignment changed
        await calculateSellerIntelligence(sellerId);

        return recommendation;
    } catch (error) {
        console.error("Error processing feedback learning loop:", error);
        throw error;
    }
}

module.exports = {
    calculateSellerIntelligence,
    generateSellerRecommendations,
    learnFromFeedback,
    getSellerAllProducts,
    INDORE_AREAS
};
