const ProductBase = require('../models/master/ProductBase');
const Brand = require('../models/master/Brand');
const Variant = require('../models/master/Variant');
const SellerProduct = require('../models/SellerProduct');
const { processVoiceInput } = require('../utils/voiceProcessor');
const CATEGORIES = require('../config/categories');
const mongoose = require('mongoose');
const User = require('../models/User');

// @desc    Search Master Catalog
// @route   GET /api/master/search?q=amul milk
// @access  Private (Seller/Admin)
const searchMaster = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.status(400).json({ message: 'Search query too short' });
        }

        // 1. Process Voice/Text Input
        const entities = processVoiceInput(query);
        console.log("Voice Entities:", entities);

        const { base, brand, size, attributes, intent, statusPayload } = entities;

        // Intent Handling: UPDATE_AVAILABILITY
        if (intent === 'UPDATE_AVAILABILITY' && base) {
            // Find LINKED products for this seller matching the base (e.g., all "Milk" sold by this seller)
            // We need to look up SellerProduct -> Variant -> ProductBase
            // This requires aggregation or deep population + filtering

            // 1. Find Base ID
            const baseDoc = await ProductBase.findOne({ base_name: base });
            if (baseDoc) {
                // 2. Find all Variants for this Base
                const variants = await Variant.find({
                    brand_id: { $in: await Brand.find({ product_base_id: baseDoc._id }).distinct('_id') }
                }).distinct('_id');

                // 3. Find SellerProducts
                const sellerProducts = await SellerProduct.find({
                    seller: req.user._id,
                    variant: { $in: variants }
                }).populate({
                    path: 'variant',
                    populate: { path: 'brand_id' }
                });

                if (sellerProducts.length > 0) {
                    return res.json({
                        action: 'CONFIRM_UPDATE',
                        base: base,
                        new_status: statusPayload,
                        products: sellerProducts.map(sp => ({
                            _id: sp._id,
                            label: sp.variant.variant_label,
                            current_status: sp.status
                        }))
                    });
                }
            }
        }

        let mongoQuery = { is_active: true };

        // Smart Query Construction using extracted entities
        // If we have specific entities, prioritize them.
        // If query processing didn't find much, fall back to regex search.

        if (brand || base) {
            // 2. Ranked Search Strategy
            // We can't easily do "Ranked" in one simple find without aggregation or multiple queries in Mongo.
            // Given the small scale (~Thousands), we can fetch candidates and sort in JS or use weighted text search.
            // Let's use an aggregation pipeline for precise matching.

            // First, find the brand ID if brand detected
            let brandId = null;
            if (brand) {
                const brandDoc = await Brand.findOne({ brand_name: new RegExp(`^${brand}$`, 'i') });
                if (brandDoc) brandId = brandDoc._id;
            }

            // Construct match conditions
            const matchStage = { is_active: true };
            if (brandId) matchStage.brand_id = brandId;
            if (size) matchStage.pack_size = new RegExp(size, 'i'); // Partial match on size? '1L' vs '1 L' handled by normalizer?

            // If we found a Base, we should filter brands/products by that base.
            // But Base is on ProductBase, not Variant. Need lookups.

            // Let's use a simpler approach: 
            // 1. Regex search on Variant Label (High Recall)
            // 2. Filter/Sort JS side based on Entity Match (High Precision)

            const rawRegex = new RegExp(entities.original.split(' ').filter(w => w.length > 2).join('|'), 'i');

            // Fetch candidates
            const candidates = await Variant.find({
                $or: [
                    { variant_label: new RegExp(entities.original.replace(/ /g, '.*'), 'i') }, // Fuzzy sequence
                    { variant_label: rawRegex } // Any word match
                ]
            })
                .populate({
                    path: 'brand_id',
                    populate: { path: 'product_base_id' }
                })
                .limit(50); // Fetch a pool

            // Score and Sort
            const results = candidates.map(v => {
                let score = 0;
                const vLabel = v.variant_label.toLowerCase();
                const vBrand = v.brand_id.brand_name.toLowerCase();
                const vBase = v.brand_id.product_base_id.base_name.toLowerCase();

                // Brand Match (+3)
                if (brand && vBrand.includes(brand.toLowerCase())) score += 3;
                // Base Match (+2)
                if (base && vBase.includes(base.toLowerCase())) score += 2;
                // Size Match (+2)
                if (size && (v.pack_size.toLowerCase() === size.toLowerCase() || vLabel.includes(size.toLowerCase()))) score += 2;
                // Attribute Match (+1 each)
                attributes.forEach(attr => {
                    if (vLabel.includes(attr)) score += 1;
                });

                return { doc: v, score };
            })
                .filter(x => x.score > 0) // Remove irrelevant
                .sort((a, b) => b.score - a.score) // Descending
                .slice(0, 10); // Top 10

            // Format
            const response = results.map(r => {
                const v = r.doc;
                const baseObj = v.brand_id.product_base_id;
                return {
                    variant_id: v._id,
                    label: v.variant_label,
                    brand: v.brand_id.brand_name,
                    base: baseObj.base_name,
                    category: baseObj.category,
                    type: baseObj.product_type, // 'DAILY' or 'REGULAR'
                    pack_size: v.pack_size,
                    score: r.score
                };
            });

            return res.json(response);

        } else {
            // Fallback: If no specific entities found (e.g. "Something random"), use old regex on everything
            // Reuse previous logic or similar
            const regex = new RegExp(query, 'i');
            const variants = await Variant.find({ variant_label: regex })
                .limit(20)
                .populate({ path: 'brand_id', populate: { path: 'product_base_id' } });

            const response = variants.map(v => {
                const baseObj = v.brand_id.product_base_id;
                return {
                    variant_id: v._id,
                    label: v.variant_label,
                    brand: v.brand_id.brand_name,
                    base: baseObj.base_name,
                    category: baseObj.category,
                    type: baseObj.product_type,
                    pack_size: v.pack_size
                };
            });
            return res.json(response);
        }

    } catch (error) {
        console.error("Master Search Error:", error);
        res.status(500).json({ message: 'Search failed' });
    }
};

// @desc    Link Variant to Seller Shop
// @route   POST /api/seller/products/link
// @access  Private (Seller)
const linkProduct = async (req, res) => {
    try {
        const { variantId } = req.body;
        const sellerId = req.user._id;

        if (!variantId) {
            return res.status(400).json({ message: 'Variant ID required' });
        }

        // Check if already linked
        const existing = await SellerProduct.findOne({ seller: sellerId, variant: variantId });
        if (existing) {
            return res.status(400).json({ message: 'Product already added to your shop' });
        }

        // Get Master details to determine default status
        const variant = await Variant.findById(variantId).populate({
            path: 'brand_id',
            populate: { path: 'product_base_id' }
        });

        if (!variant) return res.status(404).json({ message: 'Product not found in master' });

        const type = variant.brand_id.product_base_id.product_type;

        // Default Status Logic
        // DAILY -> UNKNOWN (Triggers "Is this available?" nudge)
        // REGULAR -> AVAILABLE
        const initialStatus = (type === 'DAILY') ? 'UNKNOWN' : 'AVAILABLE';

        const newLink = await SellerProduct.create({
            seller: sellerId,
            variant: variantId,
            status: initialStatus,
            price: 0 // Default
        });

        res.status(201).json(newLink);

    } catch (error) {
        console.error("Link Product Error:", error);
        res.status(500).json({ message: 'Linking failed' });
    }
};

// @desc    Seed Master Data
// @route   POST /api/master/seed
// @access  Public (for dev) or Admin
const seedData = async (req, res) => {
    try {
        await ProductBase.deleteMany({});
        await Brand.deleteMany({});
        await Variant.deleteMany({});

        const data = [
            {
                base: 'Milk', category: 'Dairy', type: 'DAILY',
                brands: [
                    {
                        name: 'Amul',
                        variants: [
                            { label: 'Amul Gold Milk 500ml', size: '500ml', attrs: ['full cream'] },
                            { label: 'Amul Gold Milk 1L', size: '1L', attrs: ['full cream'] },
                            { label: 'Amul Taaza Milk 500ml', size: '500ml', attrs: ['toned'] },
                            { label: 'Amul Taaza Milk 1L', size: '1L', attrs: ['toned'] }
                        ]
                    },
                    {
                        name: 'Mother Dairy',
                        variants: [
                            { label: 'Mother Dairy Full Cream 500ml', size: '500ml', attrs: ['full cream'] },
                            { label: 'Mother Dairy Toned 1L', size: '1L', attrs: ['toned'] }
                        ]
                    }
                ]
            },
            {
                base: 'Curd', category: 'Dairy', type: 'DAILY',
                brands: [{ name: 'Amul', variants: [{ label: 'Amul Masti Dahi 200g', size: '200g', attrs: ['cup'] }] }]
            },
            {
                base: 'Bread', category: 'Bakery', type: 'DAILY',
                brands: [{ name: 'Britannia', variants: [{ label: 'Britannia White Bread', size: '400g', attrs: ['white'] }] }]
            },
            {
                base: 'Rice', category: 'Staples', type: 'REGULAR',
                brands: [{ name: 'India Gate', variants: [{ label: 'India Gate Basmati 1kg', size: '1kg', attrs: ['basmati'] }] }]
            },
            {
                base: 'Paracetamol', category: 'Pharma', type: 'REGULAR',
                brands: [{ name: 'Dolo', variants: [{ label: 'Dolo 650', size: '15 tabs', attrs: ['fever'] }] }]
            }
        ];

        let count = 0;
        for (const cat of data) {
            const baseDoc = await ProductBase.create({
                base_name: cat.base, category: cat.category, product_type: cat.type, allowed_states: ['Gujarat', 'Maharashtra']
            });
            for (const b of cat.brands) {
                const brandDoc = await Brand.create({ brand_name: b.name, product_base_id: baseDoc._id });
                for (const v of b.variants) {
                    await Variant.create({ variant_label: v.label, brand_id: brandDoc._id, pack_size: v.size, attributes: v.attributes });
                    count++;
                }
            }
        }
        res.json({ message: `Seeded ${count} variants` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


const ProductRequest = require('../models/master/ProductRequest');

// @desc    Submit New Product Request
// @route   POST /api/master/request
// @access  Private (Seller)
const submitRequest = async (req, res) => {
    try {
        const { product_name, brand_name, pack_size, category, image_url } = req.body;

        if (!product_name || !category) {
            return res.status(400).json({ message: 'Name and Category are required' });
        }

        const request = await ProductRequest.create({
            requester_id: req.user._id,
            product_name,
            brand_name: brand_name || 'Generic',
            pack_size: pack_size || '1 Unit',
            category,
            image_url
        });

        res.status(201).json({ message: 'Request submitted successfully', requestId: request._id });

    } catch (error) {
        console.error("Submit Request Error:", error);
        res.status(500).json({ message: 'Submission failed' });
    }
};

// @desc    Approve Request (Admin)
// @route   POST /api/master/request/:id/approve
// @access  Private (Admin)
const approveRequest = async (req, res) => {
    // Only Admin (TODO: Middleware check, assuming caller validates role)
    try {
        const { id } = req.params;
        const {
            approved_base_name,
            approved_brand,
            approved_variant,
            approved_size,
            approved_type, // DAILY/REGULAR
            allowed_states
        } = req.body;

        const request = await ProductRequest.findById(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

        // 1. Ensure ProductBase
        let base = await ProductBase.findOne({ base_name: approved_base_name });
        if (!base) {
            base = await ProductBase.create({
                base_name: approved_base_name,
                category: request.category, // Use requested category or override?
                product_type: approved_type || 'REGULAR',
                allowed_states: allowed_states || ['Gujarat'] // Default or from body
            });
        }

        // 2. Ensure Brand
        let brand = await Brand.findOne({ brand_name: approved_brand, product_base_id: base._id });
        if (!brand) {
            brand = await Brand.create({
                brand_name: approved_brand,
                product_base_id: base._id
            });
        }

        // 3. Ensure Variant
        let variant = await Variant.findOne({
            variant_label: approved_variant,
            brand_id: brand._id,
            pack_size: approved_size
        });

        if (!variant) {
            variant = await Variant.create({
                variant_label: approved_variant,
                brand_id: brand._id,
                pack_size: approved_size
            });
        }

        // 4. Update Request
        request.status = 'APPROVED';
        request.admin_notes = `Created Variant: ${variant._id}`;
        await request.save();

        res.json({ message: 'Product approved and added to Master', variant });

    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ message: 'Approval failed' });
    }
};

const { loadExcelCatalog } = require('../utils/catalogLoader');

// @desc    Get Grouped Catalog for Shop Type
// @route   GET /api/seller/catalog
// @access  Private (Seller)
const getCatalog = async (req, res) => {
    try {
        // Use shopType from user account
        const shopType = req.user?.shopDetails?.shopType || req.user?.shopType || 'GROCERY_KIRANA';
        console.log(`[CATALOG] Request by ${req.user?._id} for ShopType: ${shopType}`);

        const catalog = loadExcelCatalog(shopType);

        res.json({
            success: true,
            shopType,
            categories: catalog
        });
    } catch (error) {
        console.error("Get Catalog Error:", error);
        res.status(500).json({ message: 'Failed to fetch catalog' });
    }
};

const Product = require('../models/Product');

// @desc    Sync Catalog Products to Inventory
// @route   POST /api/seller/catalog/sync
// @access  Private (Seller)
const syncCatalogProducts = async (req, res) => {
    try {
        const { selectedItems } = req.body;
        const sellerId = req.user._id;

        if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
            return res.status(400).json({ message: 'No items selected' });
        }

        // Fetch full user to ensure shopDetails is up to date
        const user = req.user;
        const shopType = user.shopDetails?.shopType || user.shopType || 'GROCERY_KIRANA';

        for (const item of selectedItems) {
            // Check if it's a DB variant (ObjectId) or Excel variant (string like sheet1_...)
            const isObjectId = mongoose.Types.ObjectId.isValid(item.variantId);
            let payload = {};

            if (isObjectId) {
                const variant = await Variant.findById(item.variantId).populate({
                    path: 'brand_id',
                    populate: { path: 'product_base_id' }
                });

                if (variant) {
                    const baseObj = variant.brand_id.product_base_id;
                    payload = {
                        name: baseObj.base_name,
                        brand: variant.brand_id.brand_name,
                        productType: baseObj.product_type === 'DAILY' ? 'DAILY_ESSENTIAL' : 'STANDARD',
                        imageUrl: 'https://via.placeholder.com/150'
                    };
                }
            }

            // Map the display category to the strict category slug from config
            const categoryObj = CATEGORIES.find(c =>
                c.label.toLowerCase() === item.category?.toLowerCase() ||
                c.id === item.category?.toLowerCase()
            );
            const categorySlug = categoryObj ? categoryObj.id : 'general-provision'; // Fallback to safe slug

            // Overlay/Fallback with provided data
            payload = {
                seller: sellerId,
                name: payload.name || item.variantLabel,
                brand: payload.brand || item.brandName,
                shopType,
                categorySlug,
                category: categoryObj ? categoryObj.label : item.category,
                subCategory: categoryObj ? categoryObj.label : item.category,
                mrp: Number(item.price) || 0,
                sellingPrice: Number(item.price) || 0,
                unit: item.unit || 'pcs',
                quantity: item.stockStatus === 'OUT_OF_STOCK' ? 0 : 100,
                stockStatus: item.stockStatus || 'IN_STOCK',
                productType: payload.productType || 'STANDARD',
                catalogProductId: item.variantId,
                source: 'catalog',
                imageUrl: payload.imageUrl || item.imageUrl || 'https://via.placeholder.com/150'
            };

            // Safety check: Don't create product without a name
            if (!payload.name) {
                console.warn(`[SYNC] Skipping item without name: ${item.variantId}`);
                continue;
            }

            // Check if already exists for this seller
            const existing = await Product.findOne({ seller: sellerId, catalogProductId: item.variantId });

            if (existing) {
                Object.assign(existing, payload);
                await existing.save();
            } else {
                await Product.create(payload);
            }
        }

        res.json({ success: true, message: `Synced ${selectedItems.length} products to inventory` });
    } catch (error) {
        console.error("Sync Catalog Error:", error);
        res.status(500).json({ message: error.message || 'Sync failed' });
    }
};

module.exports = { searchMaster, linkProduct, seedData, submitRequest, approveRequest, getCatalog, syncCatalogProducts };

