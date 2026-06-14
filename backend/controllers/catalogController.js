const Product = require('../models/MasterCatalogProduct');
const SellerProduct = require('../models/MasterCatalogSellerProduct');
const OriginalProduct = require('../models/Product');
const User = require('../models/User');
const CatalogFeedback = require('../models/CatalogFeedback');
const CATEGORIES = require('../config/categories');
const normalizeProduct = require('../utils/normalizeProduct');
const searchCache = require('../utils/searchCache');
const { publishEvent } = require('../utils/eventBus');
const Fuse = require('fuse.js');
const SearchLog = require('../models/MasterCatalogSearchLog');
const SearchAnalytics = require('../models/SearchAnalytics');
const detectCategory = require('../utils/detectCategory');
const isDuplicate = require('../utils/findDuplicate');
const getProvider = require('../services/providerResolver');
const { searchProductImage } = require('../services/googleImageService');

const healProducts = async (products) => {
    try {
        const promises = products.map(async (product) => {
            if (!product.imageUrl || product.imageUrl.includes('placeholder') || product.imageUrl.includes('photo-1542838132-92c53300491e') || product.imageUrl.includes('photo-1581092160607-ee22621dd758')) {
                const query = `${product.brand || ''} ${product.name || ''}`;
                console.log(`[CatalogEngine] Self-healing product image for "${product.name}" via Google Custom Search...`);
                const googleImg = await searchProductImage(query);
                if (googleImg) {
                    product.imageUrl = googleImg;
                    await product.save();
                    console.log(`[CatalogEngine] Successfully healed image for "${product.name}" to: ${googleImg}`);
                }
            }
        });
        await Promise.all(promises);
    } catch (err) {
        console.warn('[CatalogEngine] Background self-healing failed:', err.message);
    }
};

const escapeRegex = (string) => {
    if (!string) return '';
    return string.toString().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Helper to map OpenFoodFacts category string to valid Shoplens category slug
const getDefaultCategoryLabel = (shopType) => {
    if (!shopType) return 'General Provision / Kirana';
    const type = shopType.toLowerCase().trim();
    if (type === 'pharmacy' || type === 'pharmacy_medical' || type === 'pharmacy_medical_store') {
        return 'Surgical & Equipment';
    }
    if (type === 'electrical_hardware_auto' || type === 'electrical_hardware_auto_store') {
        return 'Electrical Shop';
    }
    if (type === 'electronics' || type === 'tech_accessories' || type === 'tech_accessories_repair') {
        return 'Mobiles, Audio & Wearables';
    }
    if (type === 'stationery' || type === 'student_office' || type === 'student_office_supplies') {
        return 'School & Writing Supplies';
    }
    if (type === 'lifestyle' || type === 'home_lifestyle' || type === 'home_lifestyle_goods') {
        return 'Beauty, Cosmetics & Personal Care';
    }
    if (type === 'seasonal_festive' || type === 'seasonal' || type === 'festive') {
        return 'Festival Specific';
    }
    return 'General Provision / Kirana';
};

const getCategorySlug = (category, productName, shopTypeSlug) => {
    const standardShopType = shopTypeSlug ? shopTypeSlug.toLowerCase().trim() : '';

    if (standardShopType === 'seasonal_festive' || standardShopType === 'seasonal' || standardShopType === 'festive') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('cracker') || normalized.includes('firework') || normalized.includes('sparkler') || normalized.includes('bomb') || normalized.includes('rocket') || normalized.includes('spark') || normalized.includes('diyas') || normalized.includes('diya') || normalized.includes('crackers') || normalized.includes('fireworks')) {
            return 'crackers-fireworks';
        }
        if (normalized.includes('winter') || normalized.includes('rain') || normalized.includes('umbrella') || normalized.includes('raincoat') || normalized.includes('sweater') || normalized.includes('jacket') || normalized.includes('woolen') || normalized.includes('shawl') || normalized.includes('hoodie')) {
            return 'winter-rain-gear';
        }
        return 'festival-specific';
    }

    if (standardShopType === 'electrical_hardware_auto' || standardShopType === 'electrical_hardware_auto_store') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('switch') || normalized.includes('wire') || normalized.includes('bulb') || normalized.includes('fan') || normalized.includes('led') || normalized.includes('lighting') || normalized.includes('heater') || normalized.includes('iron') || normalized.includes('bell') || normalized.includes('push') || normalized.includes('socket')) {
            return 'electrical-shop';
        }
        if (normalized.includes('paint') || normalized.includes('brush') || normalized.includes('putty') || normalized.includes('decor')) {
            return 'paints-decor';
        }
        if (normalized.includes('bike') || normalized.includes('car') || normalized.includes('part') || normalized.includes('engine') || normalized.includes('oil') || normalized.includes('helmet') || normalized.includes('spare') || normalized.includes('automobile')) {
            return 'automobile-spares';
        }
        if (normalized.includes('drill') || normalized.includes('cutting') || normalized.includes('heavy') || normalized.includes('equipment') || normalized.includes('machine') || normalized.includes('clamp') || normalized.includes('vice') || normalized.includes('rope') || normalized.includes('pulley') || normalized.includes('sling') || normalized.includes('meter') || normalized.includes('tester') || normalized.includes('tool')) {
            return 'tools-industrial';
        }
        if (normalized.includes('pipe') || normalized.includes('tap') || normalized.includes('screw') || normalized.includes('sanitary') || normalized.includes('bathroom') || normalized.includes('fitting')) {
            return 'hardware-sanitary';
        }
        return 'electrical-shop';
    }

    if (standardShopType === 'pharmacy' || standardShopType === 'pharmacy_medical' || standardShopType === 'pharmacy_medical_store') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('medicine') || normalized.includes('tablet') || normalized.includes('capsule') || normalized.includes('paracetamol') || normalized.includes('calpol') || normalized.includes('limcee') || normalized.includes('allopathic') || normalized.includes('syrup')) {
            return 'allopathic-chemist';
        }
        if (normalized.includes('ayurvedic') || normalized.includes('wellness') || normalized.includes('herb') || normalized.includes('dettol') || normalized.includes('antiseptic') || normalized.includes('tulsi') || normalized.includes('ashwagandha') || normalized.includes('organic')) {
            return 'ayurvedic-herbal';
        }
        return 'surgical-equipment';
    }

    if (standardShopType === 'electronics' || standardShopType === 'tech_accessories' || standardShopType === 'tech_accessories_repair') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('tv') || normalized.includes('appliance') || normalized.includes('fridge') || normalized.includes('washing') || normalized.includes('ac')) {
            return 'tv-appliances';
        }
        if (normalized.includes('computer') || normalized.includes('laptop') || normalized.includes('keyboard') || normalized.includes('mouse') || normalized.includes('gaming') || normalized.includes('monitor')) {
            return 'computers-gaming';
        }
        if (normalized.includes('spare') || normalized.includes('repair') || normalized.includes('component') || normalized.includes('battery') || normalized.includes('diode') || normalized.includes('resistor')) {
            return 'spares-components';
        }
        return 'mobiles-wearables';
    }

    if (standardShopType === 'stationery' || standardShopType === 'student_office' || standardShopType === 'student_office_supplies') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('book') || normalized.includes('paper') || normalized.includes('notebook') || normalized.includes('diary')) {
            return 'books-paper';
        }
        if (normalized.includes('art') || normalized.includes('craft') || normalized.includes('paint') || normalized.includes('color') || normalized.includes('brush') || normalized.includes('canvas')) {
            return 'art-craft';
        }
        if (normalized.includes('desk') || normalized.includes('stapler') || normalized.includes('clip') || normalized.includes('folder') || normalized.includes('office')) {
            return 'office-desk';
        }
        return 'school-writing';
    }

    if (standardShopType === 'lifestyle' || standardShopType === 'home_lifestyle' || standardShopType === 'home_lifestyle_goods') {
        const normalized = (category || '').toLowerCase() + ' ' + (productName || '').toLowerCase();
        if (normalized.includes('kitchen') || normalized.includes('cookware') || normalized.includes('pan') || normalized.includes('pot') || normalized.includes('spoon') || normalized.includes('plate')) {
            return 'kitchenware-cookware';
        }
        if (normalized.includes('plastics-cleaning') || normalized.includes('plastic') || normalized.includes('clean') || normalized.includes('dustbin') || normalized.includes('mop') || normalized.includes('broom')) {
            return 'plastics-cleaning';
        }
        if (normalized.includes('beauty') || normalized.includes('cosmetic') || normalized.includes('shampoo') || normalized.includes('lotion') || normalized.includes('soap') || normalized.includes('cream')) {
            return 'beauty-personal';
        }
        if (normalized.includes('toy') || normalized.includes('sport') || normalized.includes('gift') || normalized.includes('game') || normalized.includes('ball')) {
            return 'toys-sports';
        }
        if (normalized.includes('decor') || normalized.includes('curtain') || normalized.includes('bed') || normalized.includes('pillow') || normalized.includes('vase')) {
            return 'furnishing-decor';
        }
        if (normalized.includes('bag') || normalized.includes('luggage') || normalized.includes('backpack') || normalized.includes('suitcase')) {
            return 'bags-luggage';
        }
        if (normalized.includes('shoe') || normalized.includes('sandal') || normalized.includes('slipper') || normalized.includes('footwear')) {
            return 'footwear';
        }
        return 'clothing-garments';
    }

    if (!category) {
        return detectCategory(productName);
    }
    const normalized = category.toLowerCase();
    
    // Grocery Matches
    if (normalized.includes('dairy') || normalized.includes('milk') || normalized.includes('cheese') || normalized.includes('ice cream') || normalized.includes('yogurt')) {
        return 'dairy-ice-cream';
    }
    if (normalized.includes('bakery') || normalized.includes('cake') || normalized.includes('bread') || normalized.includes('pastry')) {
        return 'bakery-cake-shop';
    }
    if (normalized.includes('fruit') || normalized.includes('vegetable')) {
        return 'fruits-vegetables';
    }
    if (normalized.includes('sweet') || normalized.includes('mithai') || normalized.includes('candy') || normalized.includes('chocolate') || normalized.includes('confectionery')) {
        return 'sweet-shop';
    }
    if (normalized.includes('spice') || normalized.includes('dry fruit') || normalized.includes('nuts') || normalized.includes('herb')) {
        return 'dry-fruits-spices';
    }
    if (normalized.includes('grain') || normalized.includes('wholesale') || normalized.includes('rice') || normalized.includes('wheat') || normalized.includes('flour') || normalized.includes('cereal')) {
        return 'wholesale-grain';
    }
    if (normalized.includes('organic') || normalized.includes('gourmet')) {
        return 'organic-gourmet';
    }
    return detectCategory(productName);
};

const calculateBaseConfidence = (item) => {
    let score = 0;
    if (item.imageUrl) score += 25;
    if (item.brand && item.brand.trim().length > 0 && !item.brand.toLowerCase().includes('unknown')) score += 20;
    if (item.barcode) score += 15;
    return score;
};

// @desc    Search Unified Master Catalog (Local first, then external API fallback)
// @route   GET /api/catalog/search?q=maggi
// @access  Private (Seller)
const searchCatalog = async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({
                message: 'Search query required'
            });
        }

        const normalized = normalizeProduct(query);
        if (!normalized || normalized.length < 2) {
            return res.status(400).json({
                message: 'Search query too short or contains no alphanumeric characters'
            });
        }

        // Resolve seller details
        const sellerId = req.user?._id || req.query.sellerId || req.body?.sellerId;
        let shopType = 'GROCERY_KIRANA';
        if (sellerId) {
            const seller = await User.findById(sellerId);
            if (seller) {
                shopType = seller.shopDetails?.shopType || seller.shopType || 'GROCERY_KIRANA';
            }
        }

        const standardShopType = shopType.toLowerCase();

        // 1. QUERY CACHE SYSTEM FIRST
        const cacheKey = `search_${query.toLowerCase()}_shop_${standardShopType}_page_${page}_limit_${limit}`;
        const cachedResults = await searchCache.get(cacheKey);
        if (cachedResults) {
            console.log(`[CatalogEngine] Cache hit for query: "${query}" in shopType "${shopType}" (page ${page})`);

            // Log search analytics asynchronously
            SearchLog.create({
                query: query,
                resultsCount: cachedResults.length,
                seller: req.user?._id || null
            }).catch(err => console.error('[AnalyticsEngine] Failed to save search log:', err));

            SearchAnalytics.create({
                query: query,
                results: cachedResults.length,
                shopType: standardShopType
            }).catch(err => console.error('[AnalyticsEngine] Failed to save search analytics:', err));

            return res.json(cachedResults);
        }

        console.log(`[CatalogEngine] Local DB search for: "${normalized}" in shopType "${shopType}"`);
        // 2. SEARCH LOCAL DB FIRST (Enforce shopType catalog boundaries)
        let products = [];
        try {
            products = await Product.find({
                shopType: standardShopType,
                catalogStatus: { $ne: 'rejected' },
                $text: { $search: query }
            });
        } catch (textSearchErr) {
            console.warn('[CatalogEngine] Text search failed. Falling back to regex search.', textSearchErr.message);
            products = await Product.find({
                shopType: standardShopType,
                catalogStatus: { $ne: 'rejected' },
                $or: [
                    { normalizedName: { $regex: normalized, $options: 'i' } },
                    { brand: { $regex: normalized, $options: 'i' } },
                    { name: { $regex: escapeRegex(query), $options: 'i' } }
                ]
            });
        }

        // 3. IF NOT FOUND LOCALLY, OR IF LOCAL PRODUCTS CONTAIN PLACEHOLDER IMAGES (Skip for seasonal_festive)
        const hasPlaceholder = products.some(p => !p.imageUrl || p.imageUrl.includes('placeholder') || p.imageUrl.includes('photo-1542838132-92c53300491e') || p.imageUrl.includes('photo-1581092160607-ee22621dd758'));
        const isFestive = standardShopType === 'seasonal_festive' || standardShopType === 'seasonal' || standardShopType === 'festive';
        if ((products.length === 0 || hasPlaceholder) && !isFestive) {
            console.log(`[CatalogEngine] Local cache contains placeholder images or is empty. Ingesting/healing from provider resolver for "${shopType}" query: "${query}"`);
            const provider = getProvider(shopType);
            try {
                const apiProducts = await provider.searchProducts(query);

                // SAVE/HEAL PRODUCTS
                for (const item of apiProducts) {
                    let exists = null;
                    if (item.barcode) {
                        exists = await Product.findOne({ barcode: item.barcode, shopType: standardShopType });
                    }
                    if (!exists) {
                        exists = await Product.findOne({ normalizedName: normalizeProduct(item.name), shopType: standardShopType });
                    }

                    if (exists) {
                        // HEAL: If existing product has a placeholder image, update it with the real one!
                        if (!exists.imageUrl || exists.imageUrl.includes('placeholder') || exists.imageUrl.includes('photo-1542838132-92c53300491e') || exists.imageUrl.includes('photo-1581092160607-ee22621dd758')) {
                            exists.imageUrl = item.imageUrl || exists.imageUrl;
                            exists.source = 'openfoodfacts';
                            if (item.size) exists.size = item.size;
                            if (item.barcode) exists.barcode = item.barcode;
                            await exists.save();
                            console.log(`[CatalogEngine] Healed product image for: "${exists.name}"`);
                        }
                    } else {
                        // CREATE NEW
                        const guessedCategorySlug = getCategorySlug(item.category, item.name, standardShopType);
                        const matchingCat = CATEGORIES.find(c => c.id === guessedCategorySlug);
                        const finalCategoryLabel = matchingCat ? matchingCat.label : getDefaultCategoryLabel(standardShopType);

                        const newProductPayload = {
                            name: item.name,
                            brand: item.brand,
                            category: finalCategoryLabel,
                            imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
                            size: item.size || '',
                            source: item.source || 'provider',
                            externalId: item.externalId,
                            normalizedName: normalizeProduct(item.name),
                            shopType: standardShopType,
                            confidenceScore: calculateBaseConfidence(item)
                        };

                        if (item.barcode) {
                            newProductPayload.barcode = item.barcode;
                        }

                        await Product.create(newProductPayload);
                    }
                }
            } catch (err) {
                console.warn('[CatalogEngine] Provider search/healing query failed:', err.message);
            }

            // FETCH AGAIN FROM DB TO RETURN MAPPED/DEDUPLICATED INSTANCES
            try {
                products = await Product.find({
                    shopType: standardShopType,
                    catalogStatus: { $ne: 'rejected' },
                    $text: { $search: query }
                });
            } catch (textSearchErr) {
                products = await Product.find({
                    shopType: standardShopType,
                    catalogStatus: { $ne: 'rejected' },
                    $or: [
                        { normalizedName: { $regex: normalized, $options: 'i' } },
                        { brand: { $regex: normalized, $options: 'i' } },
                        { name: { $regex: escapeRegex(query), $options: 'i' } }
                    ]
                });
            }
        } else {
            console.log(`[CatalogEngine] Local cache hit! Serving candidates count ${products.length} for scoring.`);
        }

        // 4. FUZZY SEARCH & PRIORITY SEARCH ENGINE
        let rankedProducts = [];
        if (products.length > 0) {
            const fuse = new Fuse(products, {
                keys: ['name', 'brand'],
                threshold: 0.5,
                includeScore: true
            });

            const fuseResults = fuse.search(query);
            const lowerQuery = query.toLowerCase();
            const normalizedQuery = normalizeProduct(query);

            rankedProducts = products.map(product => {
                let score = 0;
                const name = product.name.toLowerCase();
                const brand = (product.brand || '').toLowerCase();
                const normName = product.normalizedName || '';

                if (name === lowerQuery) {
                    score += 1000;
                } else if (brand === lowerQuery) {
                    score += 500;
                } else if (name.startsWith(lowerQuery)) {
                    score += 250;
                } else if (brand.startsWith(lowerQuery)) {
                    score += 100;
                } else if (name.includes(lowerQuery)) {
                    score += 50;
                } else if (normName.includes(normalizedQuery)) {
                    score += 25;
                }

                const fuzzyMatch = fuseResults.find(r => r.item._id.toString() === product._id.toString());
                if (fuzzyMatch) {
                    score += (1 - fuzzyMatch.score) * 150;
                }

                // Add verified priority & static confidence score
                if (product.verified || product.catalogStatus === 'verified') {
                    score += 10000; // Priority 1: Verified
                }

                score += (product.confidenceScore || 0);

                return { product, score };
            })
            .filter(item => item.product.catalogStatus !== 'rejected')
            .sort((a, b) => b.score - a.score)
            .map(item => item.product);
        }

        // 5. PAGINATE THE SORTED RESULT
        const paginatedProducts = rankedProducts.slice(skip, skip + limit);
        await healProducts(paginatedProducts);

        // Log search analytics asynchronously
        SearchLog.create({
            query: query,
            resultsCount: paginatedProducts.length,
            seller: req.user?._id || null
        }).catch(err => console.error('[AnalyticsEngine] Failed to save search log:', err));

        SearchAnalytics.create({
            query: query,
            results: paginatedProducts.length,
            shopType: standardShopType
        }).catch(err => console.error('[AnalyticsEngine] Failed to save search analytics:', err));

        // 6. CACHE & RETURN
        await searchCache.set(cacheKey, paginatedProducts);
        res.json(paginatedProducts);

    } catch (error) {
        console.error('[CatalogEngine] Search Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Add product to Seller Shop and Sync to Aisle active inventory
// @route   POST /api/catalog/add
// @access  Private (Seller)
const addCatalogProduct = async (req, res) => {
    try {
        const {
            sellerId,
            productData,
            price,
            stock
        } = req.body;

        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is required' });
        }

        // Resolve seller details to resolve shopType
        const sellerUser = await User.findById(sellerId);
        const shopType = sellerUser?.shopDetails?.shopType || sellerUser?.shopType || 'GROCERY_KIRANA';
        const standardShopType = shopType.toLowerCase();

        // CHECK EXISTING MASTER PRODUCT BY BARCODE, EXTERNAL ID OR NORMALIZED DUPLICATE CHECK WITHIN ACTIVE SHOPTYPE
        let product = null;
        if (productData.barcode) {
            product = await Product.findOne({ barcode: productData.barcode, shopType: standardShopType });
        }
        
        if (!product && productData.externalId) {
            product = await Product.findOne({ externalId: productData.externalId, shopType: standardShopType });
        }

        if (!product) {
            const nameNorm = normalizeProduct(productData.name);
            product = await Product.findOne({ normalizedName: nameNorm, shopType: standardShopType });
        }

        // CREATE IF NOT EXISTS
        if (!product) {
            const guessedCategorySlug = getCategorySlug(productData.category, productData.name, standardShopType);
            const matchingCat = CATEGORIES.find(c => c.id === guessedCategorySlug);
            const finalCategoryLabel = matchingCat ? matchingCat.label : getDefaultCategoryLabel(standardShopType);

            const createPayload = {
                name: productData.name,
                brand: productData.brand,
                category: finalCategoryLabel,
                imageUrl: productData.imageUrl,
                source: productData.source || 'provider',
                externalId: productData.externalId,
                normalizedName: normalizeProduct(productData.name),
                shopType: standardShopType
            };

            if (productData.barcode) {
                createPayload.barcode = productData.barcode;
            }

            product = await Product.create(createPayload);
        }

        // CHECK SELLER MAPPING
        let sellerProduct = await SellerProduct.findOne({
            seller: sellerId,
            product: product._id
        });

        if (sellerProduct) {
            return res.status(400).json({
                message: 'Already added to your shop'
            });
        }

        // CREATE SELLER PRODUCT MAPPING
        sellerProduct = await SellerProduct.create({
            seller: sellerId,
            product: product._id,
            price: Number(price) || 50,
            stock: Number(stock) || 10,
            available: true
        });

        // Resolve a valid category slug and label
        const categorySlug = getCategorySlug(product.category, product.name, standardShopType);
        const matchingCategory = CATEGORIES.find(c => c.id === categorySlug);
        const categoryLabel = matchingCategory ? matchingCategory.label : getDefaultCategoryLabel(standardShopType);

        // Sync into primary Product inventory model
        const primaryProductPayload = {
            seller: sellerId,
            name: product.name,
            brand: product.brand,
            shopType,
            categorySlug,
            category: categoryLabel,
            subCategory: categoryLabel,
            mrp: Number(price) || 50,
            sellingPrice: Number(price) || 50,
            unit: 'pcs',
            quantity: Number(stock) || 10,
            stockStatus: (Number(stock) > 0) ? 'IN_STOCK' : 'OUT_OF_STOCK',
            productType: 'STANDARD',
            catalogProductId: product._id.toString(),
            source: 'catalog',
            isExact: true,
            isAvailable: true,
            imageUrl: product.imageUrl || 'https://via.placeholder.com/150'
        };

        // Upsert standard Aisle inventory
        await OriginalProduct.findOneAndUpdate(
            { seller: sellerId, catalogProductId: product._id.toString() },
            primaryProductPayload,
            { upsert: true, new: true }
        );

        // Clear catalog caches cross-node via Event Bus
        await publishEvent('CACHE_INVALIDATE').catch(err => {});

        res.json({
            success: true,
            sellerProduct
        });

    } catch (error) {
        console.error('[CatalogEngine] Add Product Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get Master Catalog Products by Category Filter
// @route   GET /api/catalog/category/:category
// @access  Private (Seller)
const getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Resolve seller details
        const sellerId = req.user?._id || req.query.sellerId;
        let shopType = 'GROCERY_KIRANA';
        if (sellerId) {
            const seller = await User.findById(sellerId);
            if (seller) {
                shopType = seller.shopDetails?.shopType || seller.shopType || 'GROCERY_KIRANA';
            }
        }
        
        const standardShopType = shopType.toLowerCase();

        let query = { shopType: standardShopType, catalogStatus: { $ne: 'rejected' } }; // boundary filtering
        if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'all categories') {
            let cleanedCategory = category.replace(/ & /g, '.*').replace(/ \/ /g, '.*');
            query.category = {
                $regex: cleanedCategory,
                $options: 'i'
            };
        }

        console.log(`[CatalogEngine] Fetching products by category: "${category}" (page ${page}) for shopType "${shopType}"`);

        // Check Cache
        const cacheKey = `category_${category.toLowerCase()}_shop_${standardShopType}_page_${page}_limit_${limit}`;
        const cachedResults = await searchCache.get(cacheKey);
        if (cachedResults) {
            console.log(`[CatalogEngine] Cache hit for category "${category}" (page ${page})`);
            return res.json(cachedResults);
        }

        let products = await Product.find(query).sort({ verified: -1, confidenceScore: -1 }).skip(skip).limit(limit);

        // Dynamic Self-Healing Seed: If 0 products exist in DB for this query, seed it from our resolved provider! (Skip for seasonal_festive)
        const isFestive = standardShopType === 'seasonal_festive' || standardShopType === 'seasonal' || standardShopType === 'festive';
        if (products.length === 0 && page === 1 && !isFestive) {
            console.log(`[CatalogEngine] No products locally for category "${category}". Seeding from provider...`);
            const provider = getProvider(shopType);
            const apiProducts = await provider.searchProducts(category);
            for (const item of apiProducts) {
                let exists = false;
                if (item.barcode) {
                    exists = await Product.findOne({ barcode: item.barcode, shopType: standardShopType });
                } else {
                    const nameNorm = normalizeProduct(item.name);
                    exists = await Product.findOne({ normalizedName: nameNorm, shopType: standardShopType });
                }

                if (!exists) {
                    const guessedCategorySlug = getCategorySlug(item.category, item.name, standardShopType);
                    const matchingCat = CATEGORIES.find(c => c.id === guessedCategorySlug);
                    const finalCategoryLabel = matchingCat ? matchingCat.label : getDefaultCategoryLabel(standardShopType);

                    const seedPayload = {
                        name: item.name,
                        brand: item.brand,
                        category: finalCategoryLabel,
                        imageUrl: item.imageUrl,
                        source: item.source || 'provider',
                        externalId: item.externalId,
                        normalizedName: normalizeProduct(item.name),
                        shopType: standardShopType,
                        confidenceScore: calculateBaseConfidence(item)
                    };
                    if (item.barcode) seedPayload.barcode = item.barcode;
                    await Product.create(seedPayload);
                }
            }
            products = await Product.find(query).sort({ verified: -1, confidenceScore: -1 }).skip(skip).limit(limit);
        }

        await healProducts(products);

        await searchCache.set(cacheKey, products);
        res.json(products);

    } catch (error) {
        console.error('[CatalogEngine] Get Products By Category Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get Trending/Popular Catalog Products
// @route   GET /api/catalog/trending
// @access  Private (Seller)
const getTrendingProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Resolve seller details
        const sellerId = req.user?._id || req.query.sellerId;
        let shopType = 'GROCERY_KIRANA';
        if (sellerId) {
            const seller = await User.findById(sellerId);
            if (seller) {
                shopType = seller.shopDetails?.shopType || seller.shopType || 'GROCERY_KIRANA';
            }
        }
        
        const standardShopType = shopType.toLowerCase();

        const cacheKey = `trending_shop_${standardShopType}_page_${page}_limit_${limit}`;
        const cachedResults = await searchCache.get(cacheKey);
        if (cachedResults) {
            console.log(`[CatalogEngine] Cache hit for trending (page ${page})`);
            return res.json(cachedResults);
        }

        let products = await Product.find({ shopType: standardShopType, catalogStatus: { $ne: 'rejected' } }).sort({ verified: -1, confidenceScore: -1 }).skip(skip).limit(limit);

        // Self-Healing Auto Seed if master catalog is empty for this shopType (Skip for seasonal_festive)
        const isFestive = standardShopType === 'seasonal_festive' || standardShopType === 'seasonal' || standardShopType === 'festive';
        if (products.length === 0 && page === 1 && !isFestive) {
            console.log(`[CatalogEngine] Master catalog empty for "${shopType}". Pre-seeding general items...`);
            const provider = getProvider(shopType);
            const apiProducts = await provider.searchProducts(standardShopType === 'grocery_kirana' ? 'grocery' : 'general');
            for (const item of apiProducts) {
                let exists = false;
                if (item.barcode) {
                    exists = await Product.findOne({ barcode: item.barcode, shopType: standardShopType });
                } else {
                    exists = await Product.findOne({ normalizedName: normalizeProduct(item.name), shopType: standardShopType });
                }

                if (!exists) {
                    const guessedCategorySlug = getCategorySlug(item.category, item.name, standardShopType);
                    const matchingCat = CATEGORIES.find(c => c.id === guessedCategorySlug);
                    const finalCategoryLabel = matchingCat ? matchingCat.label : getDefaultCategoryLabel(standardShopType);

                    const seedPayload = {
                        name: item.name,
                        brand: item.brand,
                        category: finalCategoryLabel,
                        imageUrl: item.imageUrl,
                        source: item.source || 'provider',
                        externalId: item.externalId,
                        normalizedName: normalizeProduct(item.name),
                        shopType: standardShopType,
                        confidenceScore: calculateBaseConfidence(item)
                    };
                    if (item.barcode) seedPayload.barcode = item.barcode;
                    await Product.create(seedPayload);
                }
            }
            products = await Product.find({ shopType: standardShopType, catalogStatus: { $ne: 'rejected' } }).sort({ verified: -1, confidenceScore: -1 }).skip(skip).limit(limit);
        }

        await healProducts(products);

        await searchCache.set(cacheKey, products);
        res.json(products);

    } catch (error) {
        console.error('[CatalogEngine] Get Trending Products Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get Autocomplete Suggestions as Seller Types
// @route   GET /api/catalog/autocomplete?q=am
// @access  Private (Seller)
const getAutocompleteSuggestions = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length < 1) {
            return res.json([]);
        }

        const sellerId = req.user?._id || req.query.sellerId;
        let shopType = 'GROCERY_KIRANA';
        if (sellerId) {
            const seller = await User.findById(sellerId);
            if (seller) {
                shopType = seller.shopDetails?.shopType || seller.shopType || 'GROCERY_KIRANA';
            }
        }
        
        const standardShopType = shopType.toLowerCase();
        const normalized = normalizeProduct(query);

        // Find suggestions matching name or normalized name or brand within active shopType catalog boundaries!
        const suggestions = await Product.find({
            shopType: standardShopType,
            $or: [
                { name: { $regex: `^${escapeRegex(query)}`, $options: 'i' } },
                { normalizedName: { $regex: `^${normalized}`, $options: 'i' } },
                { brand: { $regex: `^${escapeRegex(query)}`, $options: 'i' } }
            ]
        }).limit(10);

        res.json(suggestions);

    } catch (error) {
        console.error('[CatalogEngine] Autocomplete Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get Catalog Product by Barcode Lookup
// @route   GET /api/catalog/barcode/:code
// @access  Private (Seller)
const getProductByBarcode = async (req, res) => {
    try {
        const code = req.params.code;
        if (!code) {
            return res.status(400).json({ message: 'Barcode code is required' });
        }

        const sellerId = req.user?._id || req.query.sellerId;
        let shopType = 'GROCERY_KIRANA';
        if (sellerId) {
            const seller = await User.findById(sellerId);
            if (seller) {
                shopType = seller.shopDetails?.shopType || seller.shopType || 'GROCERY_KIRANA';
            }
        }
        
        const standardShopType = shopType.toLowerCase();

        console.log(`[CatalogEngine] Searching barcode: "${code}" for shopType "${shopType}"`);
        const product = await Product.findOne({ barcode: code, shopType: standardShopType });

        if (!product) {
            return res.status(404).json({ message: 'Product not found in active catalog' });
        }

        res.json(product);

    } catch (error) {
        console.error('[CatalogEngine] Barcode Lookup Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get Product Recommendations in the Same Category
// @route   GET /api/catalog/recommendations/:productId
// @access  Private (Seller)
const getSellerRecommendations = async (req, res) => {
    try {
        const productId = req.params.productId;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Recommend up to 5 items in the same category and shopType, excluding current
        const recommendations = await Product.find({
            category: currentProduct.category,
            shopType: currentProduct.shopType,
            _id: { $ne: currentProduct._id }
        }).limit(5);

        res.json(recommendations);

    } catch (error) {
        console.error('[CatalogEngine] Get Recommendations Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Submit Seller Catalog Feedback/Report
// @route   POST /api/catalog/feedback
// @access  Private (Seller)
const submitCatalogFeedback = async (req, res) => {
    try {
        const { productId, feedbackType, comments, suggestedValue } = req.body;
        const sellerId = req.user?._id;

        if (!productId || !feedbackType || !comments) {
            return res.status(400).json({ message: 'Product ID, feedback type, and comments are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Catalog product not found' });
        }

        const feedback = await CatalogFeedback.create({
            seller: sellerId,
            product: productId,
            feedbackType,
            comments,
            suggestedValue: suggestedValue || ''
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully. Aisle team will review this soon.',
            feedback
        });
    } catch (error) {
        console.error('[CatalogEngine] Feedback Submission Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchCatalog,
    addCatalogProduct,
    getProductsByCategory,
    getTrendingProducts,
    getAutocompleteSuggestions,
    getProductByBarcode,
    getSellerRecommendations,
    submitCatalogFeedback
};
