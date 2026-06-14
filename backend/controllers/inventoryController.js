const Product = require('../models/MasterCatalogProduct');
const SellerProduct = require('../models/MasterCatalogSellerProduct');
const OriginalProduct = require('../models/Product');
const User = require('../models/User');
const CATEGORIES = require('../config/categories');
const { SHOP_TYPE_CONFIG } = require('../utils/shopTypeConfig');

// @desc    Get Inventory Context (Shop Type + Allowed Categories)
// @route   GET /api/seller/inventory/context
// @access  Private (Seller)
const getInventoryContext = async (req, res) => {
    try {
        const seller = await User.findById(req.user._id);

        if (!seller || seller.role !== 'seller') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const shopType = seller.shopDetails?.shopType || 'GROCERY_KIRANA';
        const categories = SHOP_TYPE_CONFIG[shopType]?.categories || SHOP_TYPE_CONFIG['GROCERY_KIRANA'].categories;

        res.json({
            shopType,
            categories,
            shopName: seller.shopDetails?.shopName || 'My Shop'
        });

    } catch (error) {
        console.error('Get Inventory Context Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Inventory Metrics
// @route   GET /api/seller/inventory/metrics
// @access  Private (Seller)
const getInventoryMetrics = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const seller = await User.findById(sellerId);

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        const shopType = seller.shopDetails?.shopType || 'GROCERY_KIRANA';
        const isAvailabilityMode = shopType !== 'HOME_BUSINESS' && shopType !== 'SERVICES';

        // Get all products for this seller (optimized with projection and lean)
        const products = await OriginalProduct.find({ seller: sellerId })
            .select('availability quantity sellingPrice mrp')
            .lean();

        if (isAvailabilityMode) {
            const availableCount = products.filter(p => p.availability === 'AVAILABLE' && (p.quantity === undefined || p.quantity > 0)).length;
            const unavailableCount = products.filter(p => p.availability === 'UNAVAILABLE' || p.quantity <= 0).length;

            // Today's Online Orders (visits/orders completed today)
            const Order = require('../models/Order');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const onlineOrdersCountToday = await Order.countDocuments({
                sellerId,
                createdAt: { $gte: today }
            });

            // Last Confirmed Availability Time
            const lastConfirmed = seller.shopDetails?.lastOpeningStockSetAt || seller.shopDetails?.lastAvailabilityConfirmedAt || null;

            return res.json({
                isAvailabilityMode: true,
                availableCount,
                unavailableCount,
                onlineOrdersCountToday,
                lastConfirmed
            });
        }

        // Calculate legacy metrics
        const totalProducts = products.length;

        const stockValue = products.reduce((sum, product) => {
            const price = product.sellingPrice || product.mrp || 0;
            return sum + price * (product.quantity || 0);
        }, 0);

        const lowStockCount = products.filter(product => {
            const qty = product.quantity || 0;
            const threshold = 5;
            return qty > 0 && qty <= threshold;
        }).length;

        const outOfStockCount = products.filter(product => {
            return (product.quantity || 0) === 0;
        }).length;

        res.json({
            isAvailabilityMode: false,
            totalProducts,
            stockValue: Math.round(stockValue),
            lowStockCount,
            outOfStockCount
        });

    } catch (error) {
        console.error('Get Inventory Metrics Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Products by Category with Counts
// @route   GET /api/seller/inventory/products
// @access  Private (Seller)
const getInventoryProducts = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const { category } = req.query;

        let query = { seller: sellerId };

        if (category && category !== 'All') {
            query.subCategory = category;
        }

        const products = await OriginalProduct.find(query)
            .select('_id name category subCategory sellingPrice mrp unit onlineSalesCount availability lastConfirmedAt quantity restockType initialStock needsReview imageUrl isAvailable shopType createdAt updatedAt')
            .sort({ createdAt: -1 })
            .limit(1000)
            .lean();

        res.json(products);

    } catch (error) {
        console.error('Get Inventory Products Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Product Counts by Category
// @route   GET /api/seller/inventory/category-counts
// @access  Private (Seller)
const getCategoryCounts = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const counts = await OriginalProduct.aggregate([
            { $match: { seller: sellerId } },
            { $group: { _id: '$subCategory', count: { $sum: 1 } } }
        ]);

        const countsMap = {};
        counts.forEach(item => {
            countsMap[item._id] = item.count;
        });

        res.json(countsMap);

    } catch (error) {
        console.error('Get Category Counts Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add master catalog product to Seller Shop & Sync to active Aisle inventory
// @route   POST /api/inventory/add
// @access  Private (Seller)
const addProductToShop = async (req, res) => {
    try {
        const {
            sellerId,
            productId,
            price,
            stock
        } = req.body;

        if (!sellerId || !productId) {
            return res.status(400).json({ message: 'Seller ID and Product ID are required' });
        }

        // CHECK EXISTING MAPPING
        const exists = await SellerProduct.findOne({
            seller: sellerId,
            product: productId
        });

        if (exists) {
            return res.status(400).json({
                message: 'Product already added to your shop'
            });
        }

        // CREATE SELLER PRODUCT MAPPING
        const sellerProduct = await SellerProduct.create({
            seller: sellerId,
            product: productId,
            price: Number(price) || 50,
            stock: Number(stock) || 10,
            available: true
        });

        // --- INTEGRATE WITH AISLE FOR VISIBILITY ---
        // Retrieve master product details to sync into main Shoplens Product database
        const masterProduct = await Product.findById(productId);
        if (masterProduct) {
            // Fetch seller details to resolve shopType
            const sellerUser = await User.findById(sellerId);
            const shopType = sellerUser?.shopDetails?.shopType || sellerUser?.shopType || 'GROCERY_KIRANA';

            // Helper to map category strings safely
            const getCategorySlug = (category) => {
                if (!category) return 'general-provision';
                const normalized = category.toLowerCase();
                if (normalized.includes('dairy') || normalized.includes('milk') || normalized.includes('cheese') || normalized.includes('ice cream') || normalized.includes('yogurt')) return 'dairy-ice-cream';
                if (normalized.includes('bakery') || normalized.includes('cake') || normalized.includes('bread') || normalized.includes('pastry')) return 'bakery-cake-shop';
                if (normalized.includes('fruit') || normalized.includes('vegetable')) return 'fruits-vegetables';
                if (normalized.includes('sweet') || normalized.includes('mithai') || normalized.includes('candy') || normalized.includes('chocolate') || normalized.includes('confectionery')) return 'sweet-shop';
                if (normalized.includes('spice') || normalized.includes('dry fruit') || normalized.includes('nuts') || normalized.includes('herb')) return 'dry-fruits-spices';
                if (normalized.includes('grain') || normalized.includes('wholesale') || normalized.includes('rice') || normalized.includes('wheat') || normalized.includes('flour') || normalized.includes('cereal')) return 'wholesale-grain';
                if (normalized.includes('organic') || normalized.includes('gourmet')) return 'organic-gourmet';
                return 'general-provision';
            };

            const categorySlug = getCategorySlug(masterProduct.category);
            const matchingCategory = CATEGORIES.find(c => c.id === categorySlug);
            const categoryLabel = matchingCategory ? matchingCategory.label : 'General Provision / Kirana';

            // Sync into primary Product inventory model
            const primaryProductPayload = {
                seller: sellerId,
                name: masterProduct.name,
                brand: masterProduct.brand,
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
                catalogProductId: masterProduct._id.toString(),
                source: 'catalog',
                isExact: true,
                isAvailable: true,
                imageUrl: masterProduct.imageUrl || 'https://via.placeholder.com/150'
            };

            // Upsert standard Aisle inventory
            await OriginalProduct.findOneAndUpdate(
                { seller: sellerId, catalogProductId: masterProduct._id.toString() },
                primaryProductPayload,
                { upsert: true, new: true }
            );
        }

        res.json({
            success: true,
            sellerProduct
        });

    } catch (error) {
        console.error('[InventoryEngine] Add Product to Shop Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// @desc    Get all active Seller Catalog Products
// @route   GET /api/inventory/:sellerId
// @access  Private (Seller)
const getSellerProducts = async (req, res) => {
    try {
        const sellerId = req.params.sellerId;
        const products = await SellerProduct.find({
            seller: sellerId
        }).populate('product');

        res.json(products);

    } catch (error) {
        console.error('[InventoryEngine] Get Seller Products Error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getInventoryContext,
    getInventoryMetrics,
    getInventoryProducts,
    getCategoryCounts,
    addProductToShop,
    getSellerProducts
};
