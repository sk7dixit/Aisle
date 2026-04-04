const Product = require('../models/Product');
const User = require('../models/User');
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

        // Get all products for this seller
        const products = await Product.find({ seller: sellerId });

        // Calculate metrics
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

        const products = await Product.find(query).sort({ createdAt: -1 });

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

        const counts = await Product.aggregate([
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

module.exports = {
    getInventoryContext,
    getInventoryMetrics,
    getInventoryProducts,
    getCategoryCounts
};
