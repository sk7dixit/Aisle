const User = require('../models/User');
const Lead = require('../models/Lead');
const Product = require('../models/Product');
const Order = require('../models/Order'); // NEW Step 3
const SellerProduct = require('../models/SellerProduct'); // Fix: Missing import
const StockMovement = require('../models/StockMovement');
const AILearning = require('../models/AILearning');
const AssistedListingRequest = require('../models/AssistedListingRequest');
const { resolveSubCategories } = require('../utils/categoryUtils');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const { handleStockStatusChange } = require('../services/notificationHooks');
const { createNotification } = require('./notificationController');
const { SUBSCRIPTION_PLANS, VISIBILITY_BOOST } = require('../config/subscriptionConfig');
const { SHOP_CATEGORIES } = require('../config/shopCategories');
const { assignCategoryAI } = require('../utils/categoryAI');
const { calculateStockStatus, getExpiryWarning } = require('../utils/stockUtils');
const { getProductIdentity } = require('../utils/normalizationUtils');
const { getIO } = require('../config/socket');

// @desc    Get Seller Dashboard Stats (Awareness + Control + Next Action)
// @route   GET /api/seller/dashboard
// @access  Private (Seller confirmed)
const Visit = require('../models/Visit');
const FaceUpdateRequest = require('../models/FaceUpdateRequest');
const { analyzeShopImage } = require('../services/aiVisualService');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');

// Helper to check and apply Daily Restock
const applyDailyRestock = async (user) => {
    try {
        // 1. Safe Access Checks (Fix for 500 Error Crash)
        if (!user || !user.shopDetails || user.shopDetails.shopType !== 'GROCERY_KIRANA') return;

        // 2. Check Time: Is it a new day?
        const now = new Date();
        const lastRun = user.shopDetails.lastDailyRestock ? new Date(user.shopDetails.lastDailyRestock) : null;

        // Logic: If lastRun is not today (different date string), we run.
        const todayStr = now.toDateString();
        const lastRunStr = lastRun ? lastRun.toDateString() : null;

        if (lastRunStr !== todayStr) {
            console.log(`[Daily Restock] Running for user ${user._id}`);

            // 3. GROCERY: Restock DAILY items (Using Step 6 InventoryType)
            const dailyItems = await Product.find({
                seller: user._id,
                inventoryType: 'DAILY',
                quantity: 0
            });

            if (dailyItems.length > 0) {
                console.log(`[Daily Restock] Found ${dailyItems.length} items to restock`);
                const bulkUpdates = dailyItems.map(item => ({
                    updateOne: {
                        filter: { _id: item._id },
                        update: {
                            $set: {
                                quantity: item.baselineStock || 10, // Fallback safety
                                stockStatus: 'IN_STOCK' // Force status update
                            }
                        }
                    }
                }));

                if (bulkUpdates.length > 0) {
                    await Product.bulkWrite(bulkUpdates);

                    // Audit Logs for Auto-Restock
                    const movements = dailyItems.map(item => ({
                        seller: user._id,
                        product: item._id,
                        change: item.baselineStock,
                        reason: 'AUTO_RESTOCK', // New Reason
                        notes: 'Daily Essential Auto-Reset'
                    }));
                    await StockMovement.insertMany(movements);
                }
            }

            // 4. SERVICES: Reset Capacity (bookedCount = 0)
            // Service items are identified by shopType (or implicit context if mixed)
            // We safely reset ALL items with dailyCapacity > 0
            const serviceItems = await Product.find({
                seller: user._id,
                dailyCapacity: { $gt: 0 }
            });

            if (serviceItems.length > 0) {
                console.log(`[Daily Restock] Resetting ${serviceItems.length} services`);
                await Product.updateMany(
                    { seller: user._id, dailyCapacity: { $gt: 0 } },
                    { $set: { bookedCount: 0 } }
                );
            }

            // 5. Update User Stamp
            user.shopDetails.lastDailyRestock = now;
            await user.save();

            // 6. SENT DAILY NOTIFICATION (FIX)
            await createNotification(
                user._id,
                'SYSTEM',
                '🔄 Daily Shop Reset',
                `Good Morning! Your shop is ready. ${dailyItems.length > 0 ? dailyItems.length + ' daily items restocked.' : 'Inventory checks complete.'}`,
                'LOW'
            );
        }
    } catch (error) {
        console.error("Daily Restock Failed:", error);
    }
};

const getSellerStats = async (req, res) => {
    // initialize result object with defaults
    const stats = {
        leadsToday: 0,
        ordersToday: 0,
        salesToday: 0,
        upcomingVisitsCount: 0,
        nextVisitTime: null,
        activeDisputes: 0,
        totalProducts: 0,
        daysSinceLastUpdate: -1,
        pendingLeadsCount: 0,
        isVisible: false,
        derivedStatus: 'OFFLINE',
        controlledBy: 'AUTO',
        isManualOverride: false,
        openingTime: '09:00',
        closingTime: '20:00',
        operatingMode: 'GUARANTEED',
        verificationStatus: 'pending',
        subscription: { isActive: false, planId: 'free' }
    };

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- DAILY RESTOCK ---
        try {
            await applyDailyRestock(req.user);
        } catch (e) { console.error("[Dashboard] Restock Error:", e.message); }

        // --- SUBSCRIPTION ---
        try {
            if (req.user.subscription?.isActive && req.user.subscription?.planId !== 'free') {
                const expiryDate = new Date(req.user.subscription.endDate);
                if (expiryDate < new Date()) {
                    req.user.subscription.isActive = false;
                    req.user.subscription.planId = 'free';
                    await req.user.save();
                    try {
                        await createNotification(req.user._id, 'SYSTEM', '⚠️ Subscription Expired', 'You’re now on Free Premium.', 'HIGH');
                    } catch (e) { }
                }
            }
            stats.subscription = req.user.subscription || stats.subscription;
        } catch (e) { console.error("[Dashboard] Subscription Error:", e.message); }

        // --- LEADS ---
        try {
            stats.leadsToday = await Lead.countDocuments({ sellerId: req.user._id, createdAt: { $gte: today } });
            stats.pendingLeadsCount = await Lead.countDocuments({ sellerId: req.user._id, status: 'new' });
        } catch (e) { console.error("[Dashboard] Lead Stats Failed:", e.message); }

        // --- PRODUCTS ---
        try {
            stats.totalProducts = await Product.countDocuments({ seller: req.user._id });
            const lastProduct = await Product.findOne({ seller: req.user._id }, {}, { sort: { 'updatedAt': -1 } });
            if (lastProduct) {
                const diffTime = Math.abs(new Date() - new Date(lastProduct.updatedAt));
                stats.daysSinceLastUpdate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                stats.lastProductUpdate = lastProduct.updatedAt;
            }

            // Home Business metrics
            stats.activeCreations = await Product.countDocuments({ seller: req.user._id, isDraft: { $ne: true } });
            stats.readyStockItems = await Product.countDocuments({ seller: req.user._id, isDraft: { $ne: true }, homeBusinessType: 'READY_STOCK' });
            stats.madeToOrderItems = await Product.countDocuments({ seller: req.user._id, isDraft: { $ne: true }, homeBusinessType: 'MADE_TO_ORDER' });
            stats.draftCreations = await Product.countDocuments({ seller: req.user._id, isDraft: true });
        } catch (e) { console.error("[Dashboard] Product Stats Failed:", e.message); }

        // --- ORDERS & SALES ---
        try {
            const todayOrders = await Order.find({
                sellerId: req.user._id,
                createdAt: { $gte: today }
            });
            stats.ordersToday = todayOrders.length;
            stats.salesToday = todayOrders
                .filter(o => o.status !== 'CANCELLED')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        } catch (e) { console.error("[Dashboard] Order/Sales Stats Failed:", e.message); }

        // --- VISITS ---
        try {
            const upcomingVisits = await Visit.find({
                shopId: req.user._id,
                status: { $in: ['SCHEDULED', 'ARRIVED'] },
                scheduledTime: { $gte: today }
            }).sort({ scheduledTime: 1 });

            stats.upcomingVisitsCount = upcomingVisits.length;
            stats.nextVisitTime = upcomingVisits.length > 0 ? upcomingVisits[0].scheduledTime : null;
        } catch (e) { console.error("[Dashboard] Visit Stats Failed:", e.message); }

        // --- DISPUTES ---
        try {
            stats.activeDisputes = await Order.countDocuments({ sellerId: req.user._id, 'dispute.status': 'OPEN' });
        } catch (e) { console.error("[Dashboard] Dispute Stats Failed:", e.message); }

        // --- STATUS & METADATA (Safe Sync Logic) ---
        try {
            if (req.user.shopDetails) {
                stats.derivedStatus = deriveShopStatus(req.user.shopDetails);
                stats.isVisible = stats.derivedStatus === 'ONLINE';
                stats.isManualOverride = req.user.shopDetails.manualOverride || false;
                stats.controlledBy = stats.isManualOverride ? 'MANUAL' : 'AUTO';
                stats.openingTime = req.user.shopDetails.openingTime || '09:00';
                stats.closingTime = req.user.shopDetails.closingTime || '20:00';
                stats.operatingMode = req.user.shopDetails.operatingMode || 'GUARANTEED';
                stats.shopName = req.user.shopDetails.shopName;
                stats.categoriesCovered = 0; // Legacy
                stats.allowedSubCategories = resolveSubCategories(req.user.shopDetails.category, req.user.shopDetails.customCategoryInput);
            }
            stats.verificationStatus = req.user.verificationStatus || 'pending';
        } catch (e) { console.error("[Dashboard] Status Algo Failed:", e.message); }

        res.json(stats);

    } catch (criticalError) {
        console.error("CRITICAL DASHBOARD FAILURE:", criticalError);
        res.status(500).json({ message: criticalError.message });
    }
};

// Preview Upgrade (Mock)

// @desc    Preview Upgrade (Mock)
// @route   POST /api/seller/upgrade-preview
// @access  Private (Seller)
const upgradePreview = async (req, res) => {
    try {
        const { targetPlan, duration } = req.body;

        const planKey = targetPlan.toUpperCase();
        const plan = SUBSCRIPTION_PLANS[planKey];

        if (!plan) return res.status(400).json({ message: "Invalid Plan" });

        let basePrice = plan.priceMonthly;
        let finalPrice = basePrice;
        let discount = 0;
        let originalPrice = basePrice;

        if (duration === '6months') {
            originalPrice = basePrice * 6;
            finalPrice = Math.round(originalPrice * 0.85); // 15% off
            discount = 15;
        } else if (duration === '12months') {
            originalPrice = basePrice * 12;
            finalPrice = Math.round(originalPrice * 0.70); // 30% off
            discount = 30;
        } else {
            // Monthly
            finalPrice = basePrice;
            originalPrice = basePrice;
        }

        res.json({
            targetPlan,
            duration,
            originalPrice,
            finalPrice,
            discountPercentage: discount,
            tax: Math.round(finalPrice * 0.18), // 18% GST mock
            total: Math.round(finalPrice * 1.18)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @route   GET /api/seller/subscription-status
// @access  Private (Seller)
const getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // --- LAZY BOOST EXPIRY CHECK ---
        if (user.visibilityBoost?.isActive && user.visibilityBoost.endDate) {
            if (new Date(user.visibilityBoost.endDate) < new Date()) {
                console.log(`[Boost] Expired for user ${user._id}`);
                user.visibilityBoost.isActive = false;
                user.visibilityBoost.boostType = null;
                await user.save();
            }
        }
        // --------------------------------

        const planId = user.subscription?.planId?.toUpperCase() || 'FREE';
        const planConfig = SUBSCRIPTION_PLANS[planId];

        // Product Usage
        const currentProductCount = await Product.countDocuments({ seller: req.user._id });

        res.json({
            planId: planConfig.planId,
            planName: planConfig.name,
            productLimit: planConfig.productLimit,
            currentProductCount,
            accessTopProductsInsight: planConfig.accessTopProductsInsight,
            visibilityPriority: planConfig.visibilityPriority,
            isActive: user.subscription.isActive,
            startDate: user.subscription.startDate,
            endDate: user.subscription.endDate,
            // Boost
            boost: {
                active: user.visibilityBoost?.isActive || false,
                type: user.visibilityBoost?.boostType,
                endDate: user.visibilityBoost?.endDate
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const StockInsight = require('../models/StockInsight');
const { generateStockInsights } = require('../utils/insightUtils');

// @desc    Get AI Stock Insights
// @route   GET /api/seller/insights
// @access  Private (Seller)
const getInsights = async (req, res) => {
    try {
        let insights = await StockInsight.find({ seller: req.user._id, isDismissed: false, feedback: null })
            .sort({ createdAt: -1 })
            .limit(5);

        // If no insights, generate fresh ones
        if (insights.length === 0) {
            insights = await generateStockInsights(req.user._id);
        }

        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record Insight Feedback
// @route   POST /api/seller/insights/:id/feedback
// @access  Private (Seller)
const recordInsightFeedback = async (req, res) => {
    try {
        const { feedback } = req.body;
        const insight = await StockInsight.findOne({ _id: req.params.id, seller: req.user._id });
        if (!insight) return res.status(404).json({ message: 'Insight not found' });

        insight.feedback = feedback;
        // If "Not Useful", we also mark it as dismissed
        if (feedback === 'Not Useful') insight.isDismissed = true;

        await insight.save();
        res.json({ message: 'Feedback recorded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const Variant = require('../models/master/Variant');
require('../models/master/Brand'); // Ensure registered
require('../models/master/ProductBase'); // Ensure registered

// Product is already imported at top of file
// stockUtils imported at top

// @desc    Get All Products for Seller (Refactored for Global Master)
// @route   GET /api/seller/products
// @access  Private (Seller)
const getSellerProducts = async (req, res) => {
    try {
        console.log(`DEBUG: Fetching products for user ${req.user._id}`);

        // 1. Fetch Linked Products (Global Master)
        const linkedProducts = await SellerProduct.find({ seller: req.user._id })
            .select('_id variant category subCategory shopType mrp sellingPrice quantity stockStatus productType expiryDate needsReview initialStock createdAt updatedAt')
            .populate({
                path: 'variant',
                select: 'brand_id pack_size',
                populate: {
                    path: 'brand_id',
                    select: 'brand_name product_base_id',
                    populate: {
                        path: 'product_base_id',
                        select: 'base_name category'
                    }
                }
            })
            .limit(1000)
            .lean();

        // 2. Fetch Legacy/Loose Products (Quick Catalog, Custom Adds)
        const looseProducts = await Product.find({
            seller: req.user._id,
            isLegacy: { $ne: true }
        })
        .select('_id name category subCategory shopType mrp sellingPrice quantity stockStatus imageUrl productType expiryDate needsReview initialStock createdAt updatedAt')
        .limit(1000)
        .lean();

        const finalProducts = [
            ...linkedProducts.map(sp => mapLinkedProduct(sp)).filter(p => p !== null),
            ...looseProducts.map(p => mapLooseProduct(p))
        ];

        console.log(`DEBUG: Returning ${finalProducts.length} products`);
        res.json(finalProducts);
    } catch (error) {
        console.error("Get Seller Products Error:", error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};

// Helper to map Master/Linked Product to UI Format (Inventory Aware)
const mapLinkedProduct = (sp) => {
    const variant = sp.variant;
    const brand = variant?.brand_id;
    const base = brand?.product_base_id;

    if (!variant || !brand || !base) return null;

    return {
        _id: sp._id,
        name: `${brand.brand_name} ${base.base_name} ${variant.pack_size}`,
        category: sp.category || base.category,
        subCategory: sp.subCategory || 'General',
        shopType: sp.shopType,
        mrp: sp.mrp || sp.sellingPrice,
        sellingPrice: sp.sellingPrice,
        quantity: sp.quantity,
        stockStatus: sp.stockStatus,
        imageUrl: null,
        source: 'MASTER',
        productType: sp.productType || 'STANDARD',
        expiryDate: sp.expiryDate,
        needsReview: sp.needsReview || false,
        initialStock: sp.initialStock || sp.quantity,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt
    };
};

// Helper to map Local/Loose Product to UI Format (Inventory Aware)
const mapLooseProduct = (p) => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    subCategory: p.subCategory || 'General',
    shopType: p.shopType,
    mrp: p.mrp || p.sellingPrice,
    sellingPrice: p.sellingPrice,
    quantity: p.quantity,
    stockStatus: p.stockStatus,
    imageUrl: p.imageUrl,
    source: 'LOCAL',
    productType: p.productType || 'STANDARD',
    expiryDate: p.expiryDate,
    needsReview: p.needsReview || false,
    initialStock: p.initialStock || p.quantity,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
});

// @desc    Get Inventory (Shop-Type Aware + Filters)
// @route   GET /api/seller/inventory
// @access  Private (Seller)
const getInventory = async (req, res) => {
    try {
        const { subCategory, stockStatus, search } = req.query;
        const shopType = req.user.shopDetails?.shopType;

        if (!shopType) {
            return res.status(400).json({ message: 'Shop Type not set. Please complete onboarding.' });
        }

        const query = { seller: req.user._id, shopType };

        if (subCategory) query.subCategory = subCategory;
        if (stockStatus) query.stockStatus = stockStatus;
        if (search) query.name = { $regex: search, $options: 'i' };

        // 1. Fetch Linked Products
        const linkedProducts = await SellerProduct.find(query)
            .populate({
                path: 'variant',
                populate: { path: 'brand_id', populate: { path: 'product_base_id' } }
            })
            .lean();

        // 2. Fetch Loose Products
        const looseProducts = await Product.find(query).lean();

        const finalProducts = [
            ...linkedProducts.map(sp => mapLinkedProduct(sp)).filter(p => p !== null),
            ...looseProducts.map(p => mapLooseProduct(p))
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json(finalProducts);
    } catch (error) {
        console.error("Get Inventory Error:", error);
        res.status(500).json({ message: 'Failed to fetch inventory' });
    }
};

// @desc    Update Quantity (Manual)
// @route   PATCH /api/seller/inventory/:id/quantity
// @access  Private (Seller)
// @desc    Adjust Stock Quantity (+/- Quick Controls)
// @route   PATCH /api/seller/inventory/:id/quantity
// @access  Private (Seller)
const updateQuantity = async (req, res) => {
    const { acquireLock } = require('../utils/lockManager');
    let lock;
    try {
        lock = await acquireLock(`lock:product:${req.params.id}`, 5000);
    } catch (lockErr) {
        return res.status(409).json({ message: 'Product stock is currently being updated. Please retry.' });
    }

    try {
        const { change, reason = 'MANUAL_ADJUST', notes } = req.body; // e.g. +5 or -2
        if (change === undefined) return res.status(400).json({ message: 'Change value required' });

        // 1. Find Product
        let product = await SellerProduct.findOne({ _id: req.params.id, seller: req.user._id })
            .populate({
                path: 'variant',
                populate: {
                    path: 'brand_id',
                    populate: {
                        path: 'product_base_id'
                    }
                }
            });
        let isLinked = true;

        if (!product) {
            product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
            isLinked = false;
        }

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const prevQty = product.quantity || 0;
        // 2. Update Quantity (Min 0)
        product.quantity = Math.max(0, prevQty + Number(change));

        // Fix: Ensure legacy fields exist to pass Mongoose Validation
        if (!product.unit) product.unit = 'piece';
        if (!product.productType) product.productType = 'STANDARD';

        // stockStatus is auto-updated in pre-save hook using lowStockThreshold/initialStock
        await product.save();

        // 3. Log Movement
        await StockMovement.create({
            seller: req.user._id,
            [isLinked ? 'sellerProduct' : 'product']: product._id,
            change: change,
            reason: reason,
            notes: notes || `Manual stock adjustment. Prev: ${prevQty}, New: ${product.quantity}`
        });

        // 4. Return Full Mapped Result
        // Reload to get any pre-save hook updates (like stockStatus)
        // Note: pre-save hooks on FindOneAndUpdate or direct save() might behave differently.
        // Since we used product.save(), hooks should run.
        let finalProduct = isLinked ? mapLinkedProduct(product) : mapLooseProduct(product);

        // Safety Fallback: If Linked Mapper fails (e.g. Broken Refs), fall back to raw data
        if (!finalProduct) {
            console.warn(`Warning: Linked Product Map Failed for ${product._id}. Returning raw data.`);
            finalProduct = {
                _id: product._id,
                name: product.name || "Unknown Product",
                quantity: product.quantity,
                stockStatus: product.stockStatus,
                status: product.stockStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK'
            };
        }

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_UPDATED', { productId: product._id.toString(), version: product.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish stock update:', busErr.message);
        }

        res.json({
            ...finalProduct,
            status: finalProduct.stockStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK' // Explicit helper for frontend
        });
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Product was modified by another request. Please retry.' });
        }
        console.error("Adjust Stock Error:", error);
        res.status(500).json({ message: 'Adjustment failed' });
    } finally {
        if (lock) {
            await lock.release().catch(err => console.error('[Redlock] Release failed:', err.message));
        }
    }
};

// @desc    Update Product Status (Single)
// @route   PUT /api/seller/products/:id
// @access  Private (Seller)
const updateProduct = async (req, res) => {
    try {
        console.log("UPDATE PRODUCT PAYLOAD:", req.body); // Debug Payload
        const {
            name,
            sellingPrice,
            mrp,
            quantity,
            availability,
            description,
            category,
            subCategory,
            unit,
            productType,
            restockType,
            // Home Business Fields
            homeBusinessType,
            preparationTime,
            productStory,
            isDraft,
            isAvailable
        } = req.body;

        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Handle File uploads
        let images = product.images || [];
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path.replace(/\\/g, "/"));
            images = [...images, ...newImages];
            product.imageUrl = images[0];
            product.images = images;
        }

        // Also allow passing a structured images array if they delete/reorder photos
        if (req.body.images) {
            try {
                const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
                if (Array.isArray(parsed)) {
                    product.images = parsed;
                    if (parsed.length > 0) product.imageUrl = parsed[0];
                }
            } catch (e) {
                // ignore
            }
        }

        const prevQty = product.quantity || 0;
        let change = 0;

        // Update Allowed Fields
        if (name) product.name = name;
        if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
        if (mrp !== undefined) product.mrp = Number(mrp);
        if (description !== undefined) product.description = description;
        if (category) product.category = category;
        if (subCategory) product.subCategory = subCategory;
        if (unit) product.unit = unit;
        if (productType) product.productType = productType;
        if (restockType) product.restockType = restockType; // NEW
        if (homeBusinessType) product.homeBusinessType = homeBusinessType;
        if (preparationTime !== undefined) product.preparationTime = preparationTime;
        if (productStory !== undefined) product.productStory = productStory;
        if (isDraft !== undefined) product.isDraft = (isDraft === 'true' || isDraft === true);
        if (isAvailable !== undefined) product.isAvailable = (isAvailable === 'true' || isAvailable === true);
        if (availability !== undefined) {
            product.availability = availability;
            product.lastConfirmedAt = new Date();
        }

        // 3. Handle Quantity Updates (Current Stock Only)
        if (quantity !== undefined) {
            const newQty = Math.max(0, Number(quantity));
            change = newQty - prevQty;
            product.quantity = newQty;
            product.baselineStock = newQty; // RESET BASELINE: Manual Edit defines new "N"
            // Note: initialStock is NEVER updated here (history only)
            
            // Auto availability logic on quantity update
            const isAvailabilityMode = product.shopType !== 'HOME_BUSINESS' && product.shopType !== 'SERVICES';
            if (isAvailabilityMode && newQty <= 0) {
                product.availability = 'UNAVAILABLE';
            }
        }

        // Logic Note: lowStockThreshold is computed in pre-save hook based on initialStock (locked)
        // status is also computed in pre-save hook based on quantity vs threshold

        await product.save();

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_UPDATED', { productId: product._id.toString(), version: product.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish product update:', busErr.message);
        }

        // 4. AI Feedback Loop (Learning)
        if (req.body.subCategory && product.needsReview) {
            try {
                await AILearning.findOneAndUpdate(
                    {
                        productName: product.name,
                        manualCategory: req.body.subCategory,
                        shopType: product.shopType
                    },
                    {
                        $inc: { occurrenceCount: 1 },
                        $set: {
                            suggestedCategory: product.category,
                            brand: product.brand,
                            lastUpdated: Date.now()
                        }
                    },
                    { upsert: true }
                );
                // Clear the flag after correction
                product.needsReview = false;
                await product.save();
            } catch (err) {
                console.error("AI Learning Log Error:", err);
            }
        }

        // 5. Update Activity Tracking
        await User.findByIdAndUpdate(req.user._id, {
            'shopDetails.lastStockUpdateAt': new Date()
        });

        // 5. Create Audit Log
        if (change !== 0) {
            await StockMovement.create({
                seller: req.user._id,
                product: product._id,
                change: change,
                reason: 'MANUAL_ADJUST',
                notes: `Update product detail. Prev: ${prevQty}, New: ${product.quantity}`
            });
        }

        res.json(product);
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Product was modified by another request. Please retry.' });
        }
        console.error("Update Product Error:", error);
        res.status(500).json({ message: 'Update failed' });
    }
};

// @desc    Get Shop Status (Lightweight for polling)
// @route   GET /api/seller/shop-status
// @access  Private (Seller confirmed)
const getShopStatus = async (req, res) => {
    try {
        const derivedStatus = deriveShopStatus(req.user.shopDetails);
        const controlledBy = req.user.shopDetails?.manualOverride ? 'MANUAL' : 'AUTO';

        res.json({
            derivedStatus,
            controlledBy,
            isManualOverride: req.user.shopDetails?.manualOverride,
            isVisible: derivedStatus === 'ONLINE',
            openingTime: req.user.shopDetails?.openingTime,
            closingTime: req.user.shopDetails?.closingTime
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ sellerId: req.user._id })
            .populate('buyerId', 'name phone email')
            .sort({ createdAt: -1 });

        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Manual Open/Close (Seller Action)
// @route   PUT /api/seller/visibility
// @access  Private (Seller)
const updateShopVisibility = async (req, res) => {
    try {
        const { isVisible } = req.body; // true = Open, false = Closed
        const user = await User.findById(req.user._id);

        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'User or shop not found' });
        }

        // LOGIC: Manual Override ON
        user.shopDetails.manualOverride = true;
        user.shopDetails.isManuallyOpen = isVisible;
        user.shopDetails.autoScheduleEnabled = false; // Implicitly disabled by manual override logic, but setting explicit false is cleaner

        // Sync Legacy Fields for safety
        user.shopDetails.isOpen = isVisible;

        await user.save();

        const newStatus = deriveShopStatus(user.shopDetails);

        // REAL-TIME UPDATE (Step 4 Fix)
        const io = getIO();
        io.emit('shop:status', {
            shopId: user._id,
            status: newStatus, // 'ONLINE' or 'OFFLINE'
            isOpen: newStatus === 'ONLINE'
        });

        res.json({
            message: `Shop Switching to Manual ${isVisible ? 'OPEN' : 'CLOSED'}`,
            isVisible: newStatus === 'ONLINE',
            derivedStatus: newStatus,
            controlledBy: 'MANUAL',
            isManualOverride: true
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop state was modified by another request. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Shop Schedule
// @route   PUT /api/seller/schedule
// @access  Private (Seller)
const updateShopSchedule = async (req, res) => {
    try {
        const { openingTime, closingTime } = req.body;
        const user = await User.findById(req.user._id);

        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'User or shop not found' });
        }

        if (openingTime) user.shopDetails.openingTime = openingTime;
        if (closingTime) user.shopDetails.closingTime = closingTime;

        await user.save();

        const newStatus = deriveShopStatus(user.shopDetails);
        res.json({
            message: 'Schedule updated',
            openingTime: user.shopDetails.openingTime,
            closingTime: user.shopDetails.closingTime,
            derivedStatus: newStatus
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop schedule was modified by another request. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enable Auto Schedule
// @route   POST /api/seller/reset-status
// @access  Private (Seller)
const resetManualStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'User or shop not found' });
        }

        // LOGIC: Manual Override OFF, Auto ON
        user.shopDetails.manualOverride = false;
        user.shopDetails.autoScheduleEnabled = true;

        await user.save();

        const newStatus = deriveShopStatus(user.shopDetails);
        res.json({
            message: 'Auto Schedule Enabled',
            derivedStatus: newStatus,
            controlledBy: 'AUTO',
            isManualOverride: false
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop status was modified by another request. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Shop Operating Mode (Step 1)
// @route   PUT /api/seller/operating-mode
// @access  Private (Seller)
const updateOperatingMode = async (req, res) => {
    try {
        const { mode } = req.body;
        if (!['GUARANTEED', 'BEST_EFFORT', 'RUSH'].includes(mode)) {
            return res.status(400).json({ message: 'Invalid Operating Mode' });
        }

        const user = await User.findById(req.user._id);
        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'User or shop not found' });
        }

        // 1. Update Mode
        user.shopDetails.operatingMode = mode;

        // 2. Enforce Auto-Accept Logic (Side Effects)
        if (mode === 'GUARANTEED') {
            user.shopDetails.autoAccept = true;
        } else if (mode === 'BEST_EFFORT' || mode === 'RUSH') {
            user.shopDetails.autoAccept = false;
        }

        await user.save();

        // 3. Real-Time Sync (Step 8 Fix)
        try {
            const io = getIO();
            const shopId = req.user._id.toString();
            // Emit to 'shop:ID' room where customers are listening
            io.to(`shop:${shopId}`).emit("shop_status_updated", {
                operatingMode: mode,
                updatedAt: new Date()
            });
        } catch (socketError) {
            console.error("Socket Emission Error:", socketError);
            // Non-blocking
        }

        res.json({
            message: `Operating Mode set to ${mode}`,
            operatingMode: user.shopDetails.operatingMode,
            autoAccept: user.shopDetails.autoAccept
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop operating mode was modified by another request. Please retry.' });
        }
        console.error("Update Operating Mode Error:", error);
        res.status(500).json({ message: 'Failed to update operating mode' });
    }
};

// @desc    Update Shop AI Automation Mode (Phase 7)
// @route   PUT /api/seller/automation-mode
// @access  Private (Seller)
const updateAutomationMode = async (req, res) => {
    try {
        const { mode, automationMode } = req.body;
        const targetMode = mode || automationMode;
        if (!['MANUAL', 'ASSISTED', 'AUTONOMOUS'].includes(targetMode)) {
            return res.status(400).json({ message: 'Invalid Automation Mode' });
        }

        const user = await User.findById(req.user._id);
        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'User or shop not found' });
        }

        user.shopDetails.automationMode = targetMode;
        await user.save();

        res.json({
            message: `Automation Mode set to ${targetMode}`,
            automationMode: user.shopDetails.automationMode
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop automation mode was modified by another request. Please retry.' });
        }
        console.error("Update Automation Mode Error:", error);
        res.status(500).json({ message: 'Failed to update automation mode' });
    }
};

// @desc    Set Daily Opening Stock (Step 2 - Confirm Availability)
// @route   POST /api/seller/inventory/start-day
// @access  Private (Seller)
const setOpeningStock = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || !user.shopDetails) {
            return res.status(404).json({ message: 'Shop details not found.' });
        }

        // 1. Check Eligibility
        const isAvailabilityMode = user.shopDetails.shopType !== 'HOME_BUSINESS' && user.shopDetails.shopType !== 'SERVICES';
        if (!isAvailabilityMode) {
            return res.status(403).json({ message: 'Confirm Availability is not supported for this shop type.' });
        }
        if (user.shopDetails?.operatingMode === 'RUSH') {
            return res.status(400).json({ message: 'Cannot confirm availability during Rush Mode.' });
        }

        // 2. Check Daily Limit (Once per day)
        const now = new Date();
        const lastSet = user.shopDetails.lastAvailabilityConfirmedAt ? new Date(user.shopDetails.lastAvailabilityConfirmedAt) : 
                        (user.shopDetails.lastOpeningStockSetAt ? new Date(user.shopDetails.lastOpeningStockSetAt) : null);

        if (lastSet && lastSet.toDateString() === now.toDateString()) {
            return res.status(400).json({ message: 'Availability already confirmed for today.' });
        }

        // 3. Confirm Availability for All Products
        console.log(`[Availability V2] Confirming availability for user ${user._id}`);

        // Update lastConfirmedAt for all local products of this seller
        await Product.updateMany(
            { seller: user._id },
            { $set: { lastConfirmedAt: now } }
        );

        // Also update SellerProduct if they have linked products
        await SellerProduct.updateMany(
            { seller: user._id },
            { $set: { lastConfirmedAt: now } }
        );

        // 4. Update User Stamp
        user.shopDetails.lastOpeningStockSetAt = now; // keep for backward compatibility
        user.shopDetails.lastAvailabilityConfirmedAt = now; // new V2 field
        await user.save();

        res.json({
            message: 'Availability confirmed for today!',
            lastAvailabilityConfirmedAt: user.shopDetails.lastAvailabilityConfirmedAt
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop availability status was modified by another request. Please retry.' });
        }
        console.error("Confirm Availability Error:", error);
        res.status(500).json({ message: 'Failed to confirm availability' });
    }
};

// @desc    Scan Order QR (Step 3 - Pickup & Stock Reduction)
// @route   POST /api/seller/orders/scan
// @access  Private (Seller)
const scanOrderQR = async (req, res) => {
    try {
        const { qrData } = req.body; // Can be string (legacy/simple) or JSON string
        const sellerId = req.user._id;

        // 1. Parse QR Data
        let orderId;
        try {
            const parsed = JSON.parse(qrData);
            orderId = parsed.orderId;
        } catch (e) {
            // Fallback: If QR is just the ID
            orderId = qrData;
        }

        // 2. Fetch Order & Validate
        const order = await Order.findOne({ _id: orderId, sellerId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to this shop.' });
        }

        if (order.status === 'FULFILLED') {
            return res.status(400).json({ message: 'Order already fulfilled.' });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Order was cancelled.' });
        }
        if (order.status !== 'READY_FOR_PICKUP') {
            return res.status(400).json({ message: 'Order is not ready for pickup yet.' });
        }

        // 3. Strict Rush Mode Check
        const user = await User.findById(sellerId);
        if (user.shopDetails?.operatingMode === 'RUSH') {
            return res.status(403).json({ message: 'QR Pickup disabled during Rush Mode. Please handle manually.' });
        }

        // 4. Stock Reduction (Atomic)
        // We only reduce stock if payment is secure or we accept cash
        // paymentMode: 'PAY_ON_VISIT' -> reducing stock implies we are collecting cash NOW
        // paymentMode: 'PREPAID' -> reducing stock confirms handover

        const bulkOps = order.items.map(item => {
            return {
                updateOne: {
                    filter: { _id: item.product },
                    update: [
                        {
                            $set: {
                                quantity: {
                                    $max: [0, { $subtract: ["$quantity", item.quantity] }]
                                },
                                onlineSalesCount: {
                                    $add: [{ $ifNull: ["$onlineSalesCount", 0] }, item.quantity]
                                }
                            }
                        },
                        {
                            $set: {
                                stockStatus: {
                                    $cond: {
                                        if: { $eq: ["$quantity", 0] },
                                        then: "OUT_OF_STOCK",
                                        else: "IN_STOCK"
                                    }
                                },
                                availability: {
                                    $cond: {
                                        if: { $eq: ["$quantity", 0] },
                                        then: "UNAVAILABLE",
                                        else: "$availability"
                                    }
                                }
                            }
                        }
                    ]
                }
            };
        });

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        // 5. Update Order Status
        order.status = 'FULFILLED';
        order.fulfilledAt = new Date();
        if (order.paymentMode === 'PAY_ON_VISIT') {
            order.paymentStatus = 'PAID'; // Assumes cash collected handled by seller on scan
        }
        await order.save();

        try {
            const { calculateSellerTrust, calculateCustomerTrust } = require('../services/trustService');
            await calculateSellerTrust(order.sellerId);
            await calculateCustomerTrust(order.customerId);
        } catch (trustErr) {
            console.error('[SellerController] Trust recalculate failed:', trustErr.message);
        }

        const { logSecurityEvent } = require('../utils/securityLogger');
        await logSecurityEvent(
            req.user._id,
            req.user.email,
            'ORDER_MODIFIED',
            req,
            { orderId: order._id, previousStatus: 'READY_FOR_PICKUP', currentStatus: 'FULFILLED', type: 'order' }
        );

        res.json({
            message: 'Order fulfilled & Stock updated',
            orderId: order._id,
            totalAmount: order.totalAmount
        });

    } catch (error) {
        console.error("Scan Order QR Error:", error);
        res.status(500).json({ message: 'Failed to scan order' });
    }
};

// @desc    Update Lead Status (e.g. Mark as Contacted)
// @route   PUT /api/seller/leads/:id
// @access  Private
const updateLeadStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await Lead.findOne({ _id: req.params.id, sellerId: req.user._id });

        if (lead) {
            lead.status = status;
            await lead.save();
            res.json({ message: 'Lead status updated', lead });
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Add a new product (Exact Item Add)
// @route   POST /api/seller/products
// @access  Private
const addProduct = async (req, res) => {
    try {
        const { calculateSellerRiskScore } = require('../utils/fraudEngine');
        const fraudResult = await calculateSellerRiskScore(req.user._id);
        if (fraudResult.score >= 80) {
            return res.status(403).json({
                message: 'Action blocked by fraud engine. Your account is suspended pending review due to suspicious activity.',
                fraudRiskScore: fraudResult.score
            });
        }

        const currentCount = await Product.countDocuments({ seller: req.user._id });
        const sellerPlanId = req.user.subscription?.planId?.toUpperCase() || 'FREE';
        const planLimit = SUBSCRIPTION_PLANS[sellerPlanId]?.productLimit;

        if (planLimit !== Infinity && currentCount >= planLimit) {
            await createNotification(
                req.user._id,
                'SYSTEM',
                '📦 Product Limit Reached',
                'Upgrade your plan to add more products.',
                'MEDIUM'
            );
            return res.status(403).json({
                message: `Product limit reached for ${SUBSCRIPTION_PLANS[sellerPlanId]?.name}. Please upgrade to add more products.`
            });
        }

        const {
            name,
            sellingPrice,
            mrp,
            category,
            categorySlug, // Added
            description,
            brand,
            variant,
            packSize,
            parentId,
            subCategory,
            quantity,
            availability,
            // Home Business Fields
            homeBusinessType,
            preparationTime,
            productStory,
            isDraft
        } = req.body;

        let imageUrl = '';
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.path.replace(/\\/g, "/"));
            imageUrl = images[0];
        } else if (req.file) {
            imageUrl = req.file.path.replace(/\\/g, "/");
            images = [imageUrl];
        }

        // Also allow passing a structured images array in the body if sent from client
        if (req.body.images) {
            try {
                const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    images = [...images, ...parsed];
                    if (!imageUrl || imageUrl === 'https://via.placeholder.com/150') {
                        imageUrl = images[0];
                    }
                }
            } catch (e) {
                // ignore
            }
        }

        let finalName = name;
        if (parentId) {
            const parent = await Product.findById(parentId);
            if (parent) finalName = `${brand || ''} ${parent.name} ${packSize || ''}`.trim();
        } else {
            finalName = `${brand || ''} ${name || variant || 'Product'} ${packSize || ''}`.trim();
        }

        // 3. AI Category & Stock Logic
        const shopType = req.user.shopDetails?.shopType || 'GROCERY_KIRANA';
        const aiResult = assignCategoryAI(finalName, brand, shopType);
        const identityHash = getProductIdentity({ name: finalName, unit: subCategory || 'piece', packSize, brand });

        // 4. Duplicate Check (Merge Logic)
        const existing = await Product.findOne({ seller: req.user._id, identityHash });
        if (existing) {
            const prevQty = existing.quantity || 0;
            const addQty = quantity !== undefined ? Number(quantity) : 0;
            existing.quantity = prevQty + addQty;

            // Log as manual adjust with note
            await StockMovement.create({
                seller: req.user._id,
                product: existing._id,
                change: addQty,
                reason: 'INITIAL_STOCK',
                notes: `Duplicate merge: ${finalName}. Prev: ${prevQty}, Added: ${addQty}`
            });

            await existing.save();
            try {
                const { publishEvent } = require('../utils/eventBus');
                await publishEvent('PRODUCT_UPDATED', { productId: existing._id.toString(), version: existing.version });
            } catch (busErr) {
                console.error('[SellerController-EventBus] Failed to publish stock update:', busErr.message);
            }
            return res.status(200).json(existing);
        }

        const isAvailabilityMode = shopType !== 'HOME_BUSINESS' && shopType !== 'SERVICES';
        let productAvailability = availability || 'AVAILABLE';
        if (isAvailabilityMode) {
            const qty = quantity !== undefined ? Number(quantity) : 0;
            if (qty <= 0) {
                productAvailability = 'UNAVAILABLE';
            }
        }

        const product = await Product.create({
            seller: req.user._id,
            name: finalName,
            brand: brand || '',
            variant: variant || '',
            packSize: packSize || '',
            sellingPrice: sellingPrice || 0,
            mrp: mrp || sellingPrice || 0,
            category: aiResult.category || category || 'General',
            categorySlug: categorySlug || 'general-provision', // Pass slug with fallback
            subCategory: subCategory || aiResult.category || 'General',
            needsReview: aiResult.needsReview,
            shopType,
            description: description || '',
            quantity: quantity !== undefined ? Number(quantity) : 0,
            initialStock: quantity !== undefined ? Number(quantity) : 0, // LOCKED: Initial = Current on Day 1
            availability: productAvailability,
            lastConfirmedAt: new Date(),
            identityHash,
            productType: 'STANDARD',
            imageUrl: imageUrl || 'https://via.placeholder.com/150',
            isExact: true,
            isParent: false,
            parentProduct: parentId || null,
            homeBusinessType: homeBusinessType || 'READY_STOCK',
            preparationTime: preparationTime || '',
            productStory: productStory || '',
            images: images,
            isDraft: isDraft === 'true' || isDraft === true
        });

        await User.findByIdAndUpdate(req.user._id, {
            'shopDetails.lastStockUpdateAt': new Date(),
            'shopDetails.lastProductAddedAt': new Date()
        });

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_CREATED', { productId: product._id.toString(), version: product.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish product creation:', busErr.message);
        }

        res.status(201).json(product);
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Product was modified by another request. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

const addProductsBulk = async (req, res) => {
    try {
        const { calculateSellerRiskScore } = require('../utils/fraudEngine');
        const fraudResult = await calculateSellerRiskScore(req.user._id);
        if (fraudResult.score >= 80) {
            return res.status(403).json({
                message: 'Action blocked by fraud engine. Your account is suspended pending review due to suspicious activity.',
                fraudRiskScore: fraudResult.score
            });
        }

        const { products } = req.body;
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products provided' });
        }

        const currentCount = await Product.countDocuments({ seller: req.user._id });
        const sellerPlanId = req.user.subscription?.planId?.toUpperCase() || 'FREE';
        const planLimit = SUBSCRIPTION_PLANS[sellerPlanId]?.productLimit;

        if (planLimit !== Infinity && (currentCount + products.length) > planLimit) {
            return res.status(403).json({ message: 'Bulk add exceeds limit' });
        }

        const shopType = req.user.shopDetails?.shopType || 'General';
        const results = { created: 0, merged: 0, failed: 0 };

        for (const p of products) {
            try {
                const qty = p.quantity !== undefined ? Number(p.quantity) : 0;
                const price = Number(p.pricePerUnit || p.sellingPrice || p.price || 0);
                const pBrand = p.brand || '';
                const pName = p.name;
                const unit = p.subCategory || p.unit || 'piece'; // Using subCategory as proxy for specific identity unit if available

                const identityHash = getProductIdentity({ name: pName, unit, packSize: p.packSize || p.unit || '', brand: pBrand });

                // Check for existing
                const existing = await Product.findOne({ seller: req.user._id, identityHash });

                if (existing) {
                    const prevQty = existing.quantity || 0;
                    existing.quantity = prevQty + qty;

                    await StockMovement.create({
                        seller: req.user._id,
                        product: existing._id,
                        change: qty,
                        reason: 'INITIAL_STOCK',
                        notes: `Bulk Duplicate merge: ${pName}. Prev: ${prevQty}, Added: ${qty}`
                    });

                    await existing.save();
                    results.merged++;
                } else {
                    // Create New
                    const aiResult = assignCategoryAI(pName, pBrand, shopType);
                    await Product.create({
                        seller: req.user._id,
                        name: pName,
                        brand: pBrand,
                        variant: p.variant || '',
                        packSize: p.packSize || p.unit || '',
                        unit: p.unit || 'piece', // Fix: Persist Unit
                        sellingPrice: price,
                        mrp: p.mrp || price,
                        category: aiResult.category || p.category || 'General',
                        categorySlug: p.categorySlug || aiResult.categorySlug || 'general-provision',
                        subCategory: p.subCategory || aiResult.category || 'General',
                        needsReview: aiResult.needsReview,
                        shopType: p.shopType || shopType,
                        description: p.description || '',
                        imageUrl: p.imageUrl || '',
                        quantity: qty,
                        initialStock: qty, // LOCKED: Initial = Current on Day 1
                        identityHash,
                        productType: 'STANDARD',
                        isExact: false,
                        isParent: true
                    });
                    results.created++;
                }
            } catch (err) {
                console.error("Bulk Item Save Error:", err);
                results.failed++;
                if (!results.errors) results.errors = [];
                results.errors.push({ name: p.name, error: err.message });
            }
        }

        await User.findByIdAndUpdate(req.user._id, {
            'shopDetails.lastProductAddedAt': Date.now(),
            'shopDetails.lastStockUpdateAt': Date.now()
        });

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_CREATED', { bulk: true, version: 1 });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish bulk product addition:', busErr.message);
        }

        res.status(201).json({
            message: `Bulk processing complete: ${results.created} created, ${results.merged} merged`,
            summary: results
        });
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict during bulk update. Please retry.' });
        }
        console.error("Bulk Add Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Seller Profile (Unified)
// @route   GET /api/seller/profile
// @access  Private
const getSellerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verificationStatus: user.verificationStatus,
            shopDetails: user.shopDetails,
            faceData: user.faceData,
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Seller Profile (Shop & Personal)
// @route   PUT /api/seller/profile
// @access  Private
const updateSellerProfile = async (req, res) => {
    try {
        const {
            // Shop Profile (Editable)
            shopName,
            shopPhone,
            shopAddress,
            description,
            openingTime,
            closingTime,
            lat,
            lng,
            category, // Added unified category
            operatingMode, // Added unified operating mode

            // Seller Profile (Editable)
            sellerPhone,

            // Preferences
            autoAccept,
            notificationPreferences

            // Note: shopType, faceData, email, sellerName are READ-ONLY
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Update Shop Details
        if (user.shopDetails) {
            if (shopName) user.shopDetails.shopName = shopName;
            if (shopPhone) user.shopDetails.phone = shopPhone;
            if (shopAddress) user.shopDetails.address = shopAddress;
            if (description !== undefined) user.shopDetails.description = description;

            if (category) {
                user.shopDetails.category = category;
                user.shopDetails.shopCategory = category; // Sync both for safety
            }
            if (openingTime) user.shopDetails.openingTime = openingTime;
            if (closingTime) user.shopDetails.closingTime = closingTime;

            // Operating Mode Logic
            if (operatingMode) {
                user.shopDetails.operatingMode = operatingMode;
                // Enforce Auto-Accept Logic (Side Effects)
                if (operatingMode === 'GUARANTEED') {
                    user.shopDetails.autoAccept = true;
                } else if (operatingMode === 'BEST_EFFORT' || operatingMode === 'RUSH') {
                    // Only update if autoAccept was provided in body, otherwise keep existing
                    if (autoAccept !== undefined) user.shopDetails.autoAccept = autoAccept;
                }
            } else if (autoAccept !== undefined) {
                user.shopDetails.autoAccept = autoAccept;
            }

            // Updated Location Logic
            if (lat !== undefined && lng !== undefined) {
                user.shopDetails.shopLocation = {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)],
                    address: shopAddress || user.shopDetails.address,
                    city: user.shopDetails.city
                };
            }
        }

        // 2. Update Seller Personal Details
        if (sellerPhone) user.phone = sellerPhone;

        // 3. Update Preferences
        if (notificationPreferences) {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...notificationPreferences
            };
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                shopDetails: user.shopDetails
            }
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Seller profile was modified by another request. Please retry.' });
        }
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product details with variants (Child Products)
// @route   GET /api/seller/products/:id
// @access  Private
const getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Ensure user owns this product
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        let variants = [];
        if (product.isParent) {
            variants = await Product.find({ parentProduct: product._id });
        }

        res.json({ product, variants });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProductsBulk = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products selected' });
        }

        // Soft Delete from Product collection (Loose/Quick Catalog)
        const products = await Product.find({ _id: { $in: productIds }, seller: req.user._id });
        for (const prod of products) {
            prod.deleted = true;
            prod.deletedAt = new Date();
            await prod.save();
        }

        // Soft Delete from SellerProduct collection (Linked/Master)
        const linkedProducts = await SellerProduct.find({ _id: { $in: productIds }, seller: req.user._id });
        for (const lp of linkedProducts) {
            lp.deleted = true;
            lp.deletedAt = new Date();
            await lp.save();
        }

        // Audit log bulk delete
        const { logSecurityEvent } = require('../utils/securityLogger');
        await logSecurityEvent(
            req.user._id,
            req.user.email,
            'PRODUCT_DELETED',
            req,
            { productIds, bulk: true }
        );

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_DELETED', { productIds, bulk: true, version: 1 });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish bulk delete:', busErr.message);
        }

        res.json({ message: 'Products deleted successfully' });
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: One or more products were modified. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Single Product
// @route   DELETE /api/seller/products/:id
// @access  Private (Seller)
const deleteProduct = async (req, res) => {
    try {
        const { logSecurityEvent } = require('../utils/securityLogger');
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });

        if (product) {
            product.deleted = true;
            product.deletedAt = new Date();
            await product.save();

            // Also try soft delete from SellerProduct if it exists (linked)
            await SellerProduct.updateMany(
                { _id: req.params.id },
                { $set: { deleted: true, deletedAt: new Date() } }
            );

            await logSecurityEvent(
                req.user._id,
                req.user.email,
                'PRODUCT_DELETED',
                req,
                { productId: req.params.id, name: product.name }
            );

            // Broadcast product update via Event Bus
            try {
                const { publishEvent } = require('../utils/eventBus');
                await publishEvent('PRODUCT_DELETED', { productId: req.params.id, version: product.version });
            } catch (busErr) {
                console.error('[SellerController-EventBus] Failed to publish product delete:', busErr.message);
            }

            res.json({ message: 'Product removed' });
        } else {
            // Check SellerProduct (Linked)
            const linked = await SellerProduct.findOne({ _id: req.params.id, seller: req.user._id });
            if (linked) {
                linked.deleted = true;
                linked.deletedAt = new Date();
                await linked.save();

                await logSecurityEvent(
                    req.user._id,
                    req.user.email,
                    'PRODUCT_DELETED',
                    req,
                    { productId: req.params.id, linked: true }
                );

                // Broadcast product update via Event Bus
                try {
                    const { publishEvent } = require('../utils/eventBus');
                    await publishEvent('PRODUCT_DELETED', { productId: req.params.id, version: linked.version || 1 });
                } catch (busErr) {
                    console.error('[SellerController-EventBus] Failed to publish product delete:', busErr.message);
                }

                res.json({ message: 'Product removed' });
            } else {
                // Check if it exists but is already deleted (to ensure idempotency)
                const mongoose = require('mongoose');
                if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                    const existsDeleted = await Product.collection.findOne({ 
                        _id: new mongoose.Types.ObjectId(req.params.id), 
                        seller: req.user._id 
                    });
                    if (existsDeleted && existsDeleted.deleted === true) {
                        return res.json({ message: 'Product removed' });
                    }
                    
                    const existsLinkedDeleted = await SellerProduct.collection.findOne({
                        _id: new mongoose.Types.ObjectId(req.params.id),
                        seller: req.user._id
                    });
                    if (existsLinkedDeleted && existsLinkedDeleted.deleted === true) {
                        return res.json({ message: 'Product removed' });
                    }
                }
                res.status(404).json({ message: 'Product not found' });
            }
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Product was modified by another request. Please retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk Update Product Status
// @route   PUT /api/seller/products/bulk-status
// @access  Private (Seller)
const updateProductsStatusBulk = async (req, res) => {
    try {
        const { productIds, status } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products selected' });
        }

        // Validate status
        if (!['AVAILABLE', 'UNAVAILABLE', 'IN_STOCK', 'LIMITED', 'OUT_OF_STOCK'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const isAvailableStatus = ['AVAILABLE', 'IN_STOCK', 'LIMITED'].includes(status);
        const availabilityVal = isAvailableStatus ? 'AVAILABLE' : 'UNAVAILABLE';
        const stockStatusVal = isAvailableStatus ? 'IN_STOCK' : 'OUT_OF_STOCK';

        // 1. Update Product Collection
        if (isAvailableStatus) {
            await Product.updateMany(
                { _id: { $in: productIds }, seller: req.user._id },
                { $set: { availability: availabilityVal, stockStatus: stockStatusVal } }
            );
            await Product.updateMany(
                { _id: { $in: productIds }, seller: req.user._id, quantity: { $lte: 0 } },
                { $set: { quantity: 50, baselineStock: 50 } }
            );
        } else {
            await Product.updateMany(
                { _id: { $in: productIds }, seller: req.user._id },
                { $set: { availability: availabilityVal, stockStatus: stockStatusVal, quantity: 0 } }
            );
        }

        // 2. Update SellerProduct Collection (Linked Products)
        if (isAvailableStatus) {
            await SellerProduct.updateMany(
                { _id: { $in: productIds }, seller: req.user._id },
                { $set: { availability: availabilityVal, stockStatus: stockStatusVal } }
            );
            await SellerProduct.updateMany(
                { _id: { $in: productIds }, seller: req.user._id, quantity: { $lte: 0 } },
                { $set: { quantity: 50 } }
            );
        } else {
            await SellerProduct.updateMany(
                { _id: { $in: productIds }, seller: req.user._id },
                { $set: { availability: availabilityVal, stockStatus: stockStatusVal, quantity: 0 } }
            );
        }

        // Update Kirana Timer
        await User.findByIdAndUpdate(req.user._id, {
            'shopDetails.lastStockUpdateAt': new Date()
        });

        // Trigger Alerts for each
        productIds.forEach(id => {
            handleStockStatusChange(req.user._id, 'Bulk Update Item', id, 100, isAvailableStatus ? 50 : 0, 10).catch(() => { });
        });

        // Broadcast product update via Event Bus
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('PRODUCT_UPDATED', { productIds, bulk: true, version: 1 });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish bulk status update:', busErr.message);
        }

        res.json({ message: 'Products updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request Face Update
// @route   POST /api/seller/face-update-request
// @access  Private (Seller)
const requestFaceUpdate = async (req, res) => {
    try {
        const { newFaceData, reason } = req.body;

        // Check if there is already a pending request
        const existingRequest = await FaceUpdateRequest.findOne({
            sellerId: req.user._id,
            status: 'PENDING'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request.' });
        }

        const request = await FaceUpdateRequest.create({
            sellerId: req.user._id,
            currentFaceData: req.user.faceData || '',
            newFaceData,
            reason
        });

        res.status(201).json(request);
    } catch (error) {
        console.error("Face Update Request Error", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Face Update Status
// @route   GET /api/seller/face-update-status
// @access  Private
const getFaceUpdateStatus = async (req, res) => {
    try {
        const latestRequest = await FaceUpdateRequest.findOne({ sellerId: req.user._id })
            .sort({ createdAt: -1 });

        res.json(latestRequest || null);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Visual Asset
// @route   POST /api/seller/visual-assets
// @access  Private (Seller)
const uploadVisualAsset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        const { type } = req.body;
        if (!['SHOP_FRONT', 'SHOP_INTERIOR', 'PRODUCT_SHELF', 'OWNER'].includes(type)) {
            return res.status(400).json({ message: 'Invalid asset type' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const assetUrl = `uploads/${req.file.filename}`;

        // Add as pending first
        const newAsset = {
            url: assetUrl,
            type,
            status: 'pending',
            createdAt: new Date()
        };

        user.shopDetails.visualAssets.push(newAsset);
        await user.save();

        const addedAssetId = user.shopDetails.visualAssets[user.shopDetails.visualAssets.length - 1]._id;

        // Perform AI Analysis (Async)
        // Note: In a real app, this might be a background job.
        // For this demo, we'll wait or trigger then response.
        const analysis = await analyzeShopImage(assetUrl, type);

        // Update asset with AI results
        const assetIndex = user.shopDetails.visualAssets.findIndex(a => a._id.toString() === addedAssetId.toString());
        if (assetIndex !== -1) {
            user.shopDetails.visualAssets[assetIndex] = {
                ...user.shopDetails.visualAssets[assetIndex].toObject(),
                ...analysis
            };
            await user.save();
        }

        res.status(201).json({
            message: 'Asset uploaded and analyzed',
            asset: user.shopDetails.visualAssets[assetIndex]
        });

    } catch (error) {
        console.error('Upload Visual Asset Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove Visual Asset
// @route   DELETE /api/seller/visual-assets/:id
// @access  Private (Seller)
const removeVisualAsset = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const asset = user.shopDetails.visualAssets.id(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Delete physical file
        const filePath = path.join(__dirname, '..', asset.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from DB
        user.shopDetails.visualAssets.pull(req.params.id);
        await user.save();

        res.json({ message: 'Asset removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Sub-categories for Seller's Shop Type
// @route   GET /api/seller/subcategories
// @access  Private (Seller)
const getSubCategories = async (req, res) => {
    try {
        const shopTypeRaw = req.user.shopDetails?.shopType || 'GROCERY_KIRANA';

        // Normalize shopType if it comes as "Grocery / Kirana" instead of "GROCERY_KIRANA"
        const mapping = {
            "Grocery / Kirana": "GROCERY_KIRANA",
            "Electrical, Hardware & Auto": "ELECTRICAL_HARDWARE_AUTO",
            "Tech & Accessories": "TECH_ACCESSORIES",
            "Student & Office": "STUDENT_OFFICE",
            "Home & Lifestyle": "HOME_LIFESTYLE",
            "Pharmacy": "PHARMACY",
            "Home Business": "HOME_BUSINESS",
            "Seasonal Store": "SEASONAL_STORE"
        };

        const key = mapping[shopTypeRaw] || shopTypeRaw;
        const subCategories = SHOP_CATEGORIES[key] || SHOP_CATEGORIES["GROCERY_KIRANA"];

        res.json(subCategories);
    } catch (error) {
        console.error("Get SubCategories Error:", error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
};

// @desc    Upload Camera Image to Cloudinary
// @route   POST /api/seller/camera/upload
// @access  Private (Seller)
const uploadCameraImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'aisle/camera_uploads',
            use_filename: true,
            unique_filename: true,
        });

        // Remove local file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ imageUrl: result.secure_url });
    } catch (error) {
        // Clean up local file if upload fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Cloudinary Upload Error:", error);
        res.status(500).json({ message: 'Image upload failed: ' + error.message });
    }
};

// @desc    Set shop GPS location
// @route   POST /api/seller/set-location
// @access  Private (Seller)
const setShopLocation = async (req, res) => {
    try {
        const { lat, lng, address, city } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Reverse geocode if address not provided
        let resolvedAddress = address;
        let resolvedCity = city;

        if (!address) {
            try {
                const axios = require('axios');
                const geoRes = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                    params: {
                        lat: lat,
                        lon: lng,
                        format: 'json'
                    },
                    headers: {
                        'User-Agent': 'Aisle/1.0'
                    }
                });

                if (geoRes.data && geoRes.data.display_name) {
                    resolvedAddress = geoRes.data.display_name;
                    resolvedCity = geoRes.data.address?.city || geoRes.data.address?.town || geoRes.data.address?.village || 'Unknown';
                }
            } catch (geoError) {
                console.error('Reverse geocoding failed:', geoError);
                // Continue with coordinates only
            }
        }

        // Update address and city
        if (resolvedAddress) {
            user.shopDetails.address = resolvedAddress;
        }
        if (resolvedCity) {
            user.shopDetails.city = resolvedCity;
        }

        // Set shop location (GeoJSON format: [longitude, latitude])
        user.shopDetails.shopLocation = {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
            address: resolvedAddress,
            city: resolvedCity || user.shopDetails.city || 'Unknown'
        };

        await user.save();

        res.json({
            message: 'Shop location saved successfully. Your shop is now visible to nearby customers.',
            shopLocation: user.shopDetails.shopLocation
        });
    } catch (error) {
        console.error('Set location error:', error);
        res.status(500).json({ message: 'Failed to set location' });
    }
};


const createAssistedListingRequest = async (req, res) => {
    try {
        const { name, mobile, address, estimatedProductCount } = req.body;
        const isPro = req.user.subscription?.planId !== 'free';

        const fileUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                // Upload to cloudinary using file path (Multer diskStorage)
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'assisted_listing_requests',
                    use_filename: true,
                    unique_filename: true
                });
                fileUrls.push(result.secure_url);

                // Clean up local file after successful upload
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        const request = await AssistedListingRequest.create({
            seller: req.user._id,
            name,
            mobile,
            address,
            isPro,
            estimatedProductCount: estimatedProductCount ? Number(estimatedProductCount) : undefined,
            files: fileUrls,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Request received successfully',
            data: request
        });
    } catch (error) {
        console.error('Assisted Listing Request Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Restock Daily Item to Baseline (One-click)
// @route   POST /api/seller/inventory/:id/restock-daily
// @access  Private (Seller)
const restockDaily = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            seller: req.user._id,
            restockType: 'DAILY' // Safety
        });

        if (!product) return res.status(404).json({ message: 'Daily product not found' });

        const oldQty = product.quantity;
        const newQty = product.baselineStock || 10; // Default safety

        if (newQty <= oldQty) {
            return res.status(400).json({ message: 'Stock already at or above baseline' });
        }

        product.quantity = newQty;
        product.stockStatus = 'IN_STOCK';
        await product.save();

        // Audit
        await StockMovement.create({
            seller: req.user._id,
            product: product._id,
            change: newQty - oldQty,
            reason: 'MANUAL_RESTOCK',
            notes: 'One-click daily restock'
        });

        res.json({ message: 'Restocked', quantity: newQty });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Stock (Inline)
// @route   POST /api/seller/inventory/:id/add-stock
// @access  Private (Seller)
const addStock = async (req, res) => {
    try {
        const { amount, updateBaseline } = req.body;
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const added = Math.max(0, Number(amount));
        product.quantity = (product.quantity || 0) + added;

        if (updateBaseline) {
            product.baselineStock = product.quantity;
        }

        await product.save();

        // Audit
        await StockMovement.create({
            seller: req.user._id,
            product: product._id,
            change: added,
            reason: 'STOCK_ADD',
            notes: 'Inline stock addition'
        });

        res.json({ message: 'Stock added', quantity: product.quantity });
    } catch (error) {
        console.error("Stock Add Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Payment Preference (Step 3)
// @route   PUT /api/seller/payment-preference
// @access  Private (Seller)
const updatePaymentPreference = async (req, res) => {
    try {
        const { acceptsOnlinePayment, paymentSetupCompleted, upiId, paymentDisplayName } = req.body;

        if (req.user.shopDetails) {
            if (acceptsOnlinePayment !== undefined) req.user.shopDetails.acceptsOnlinePayment = acceptsOnlinePayment;
            if (paymentSetupCompleted !== undefined) req.user.shopDetails.paymentSetupCompleted = paymentSetupCompleted;

            // Step 4 Data
            if (upiId) req.user.shopDetails.upiId = upiId;
            if (paymentDisplayName) req.user.shopDetails.paymentDisplayName = paymentDisplayName;
            if (upiId) req.user.shopDetails.paymentMethod = 'UPI'; // Auto-set if UPI provided

            await req.user.save();
            res.json({
                success: true,
                shopDetails: req.user.shopDetails
            });

            try {
                const { publishEvent } = require('../utils/eventBus');
                await publishEvent('USER_UPDATED', { userId: req.user._id.toString(), version: req.user.version });
            } catch (busErr) {
                console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
            }
        } else {
            res.status(404).json({ message: 'Shop details not found' });
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Payment preference was modified by another request. Please retry.' });
        }
        console.error('Update Payment Preference Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Seller Customer Visits (Unified View)
// @route   GET /api/seller/customer-visits
// @access  Private (Seller)
const getCustomerVisits = async (req, res) => {
    try {
        const CustomerVisit = require('../models/CustomerVisit');

        // Fetch all ACTIVE visits for this seller (UPCOMING or ARRIVED)
        const visits = await CustomerVisit.find({
            sellerId: req.user._id,
            visitStatus: { $in: ['UPCOMING', 'ARRIVED'] } // Filter out COMPLETED/CANCELLED
        })
            .populate('customerId', 'name mobile') // Get basic customer info
            .sort({ visitTime: 1, createdAt: -1 });

        // Format for UI
        const formatted = visits.map(v => ({
            visitId: v._id,
            customerName: v.customerId?.name || "Guest Customer",
            customerMobile: v.customerId?.mobile, // Optional
            products: v.products.map(p => ({
                name: p.name,
                qty: p.quantity,
                price: p.priceAtTime,
                image: p.image
            })),
            paymentMode: v.paymentMode,
            paymentStatus: v.paymentStatus,
            visitStatus: v.visitStatus,
            visitTime: v.visitTime || v.createdAt,
            qrToken: v.qrToken,
            totalAmount: v.products.reduce((acc, p) => acc + (p.priceAtTime * p.quantity), 0)
        }));

        res.json(formatted);

    } catch (error) {
        console.error("Get Customer Visits Error:", error);
        res.status(200).json([]); // 👈 IMPORTANT: Return empty array even on error for UI safety
    }
};

const addCustomCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Category name is required' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Seller not found' });

        const shopType = user.shopDetails?.shopType || '';
        const isFestive = shopType.toLowerCase().includes('seasonal') || shopType.toLowerCase().includes('festive');
        if (!isFestive) {
            return res.status(403).json({ message: 'Custom categories can only be added for Seasonal & Festive shops' });
        }
        
        if (!user.shopDetails.shopCategories) {
            user.shopDetails.shopCategories = [];
        }
        
        const trimmedName = name.trim();
        // Check if category already exists (case-insensitive)
        const exists = user.shopDetails.shopCategories.some(
            cat => cat.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        
        user.shopDetails.shopCategories.push(trimmedName);
        await user.save();
        
        res.status(201).json({
            message: 'Category added successfully',
            shopCategories: user.shopDetails.shopCategories
        });

        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('USER_UPDATED', { userId: user._id.toString(), version: user.version });
        } catch (busErr) {
            console.error('[SellerController-EventBus] Failed to publish USER_UPDATED:', busErr.message);
        }
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Concurrency conflict: Shop categories were modified by another request. Please retry.' });
        }
        console.error('Add Custom Category Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSellerStats,
    getShopStatus,
    getLeads,
    updateShopVisibility,
    updateLeadStatus,
    addProduct,
    addProductsBulk,
    updateSellerProfile,
    getSellerProfile,
    getSellerProducts,
    updateProduct,
    getProductDetails,
    updateProductsStatusBulk,
    deleteProductsBulk,
    deleteProduct,
    getSubscriptionStatus,
    upgradePreview,
    getInsights,
    recordInsightFeedback,
    updateShopSchedule,
    resetManualStatus,
    requestFaceUpdate,
    getFaceUpdateStatus,
    uploadVisualAsset,
    removeVisualAsset,
    getInventory,
    updateQuantity,
    getSubCategories,
    uploadCameraImage,
    setShopLocation,
    createAssistedListingRequest,
    restockDaily, // NEW
    addStock,
    updateOperatingMode, // NEW
    updateAutomationMode, // NEW
    setOpeningStock, // NEW
    scanOrderQR, // NEW
    getCustomerVisits, // NEW Step 2
    addCustomCategory
};
