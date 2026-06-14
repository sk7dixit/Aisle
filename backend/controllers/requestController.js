const Request = require('../models/Request');
const User = require('../models/User');
const Product = require('../models/Product');
const { deriveShopStatus } = require('../utils/shopStatusUtils');
const { sendNotification, NOTIFICATION_TYPE } = require('../services/notificationService');

// @desc    Create a new request (Customer intent)
// @route   POST /api/requests
// @access  Private (Customer)
const createRequest = async (req, res) => {
    try {
        const { productId, sellerId, sellerShopName, productName, visitDate, visitTime, paymentMethod } = req.body;
        const customerId = req.user._id;

        // Run Spam & Fraud Detection Check
        const { detectSpamAndFraud } = require('../services/trustService');
        const checkResult = await detectSpamAndFraud(customerId, productId, sellerId, req);
        if (checkResult.blocked) {
            return res.status(403).json({ 
                success: false, 
                message: checkResult.reason, 
                challengeRequired: checkResult.challengeRequired 
            });
        }

        // 1. Basic Validation
        if (!productId || !sellerId) {
            return res.status(400).json({ message: 'Product ID and Seller ID are required' });
        }

        // 2. Ensure Shop is ONLINE
        const seller = await User.findById(sellerId);
        if (!seller || deriveShopStatus(seller.shopDetails) !== 'ONLINE') {
            return res.status(400).json({ message: 'This shop is currently offline.' });
        }

        // 3. Check Inventory (Soft Check)
        const Product = require('../models/Product');
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // AVAILABLE = Total - Reserved
        const availableStock = product.countInStock - (product.reservedCount || 0);
        if (availableStock <= 0) {
            return res.status(400).json({ message: 'Product is currently out of stock or fully reserved.' });
        }

        // 4. DETERMINE STATUS & RESERVATION (SYSTEM DEFINITION POINT 1 & 2 & 3)
        const autoAccept = seller.shopDetails?.autoAccept || false;
        let status = 'PENDING';
        let reservation = null;
        let safetyReason = null;

        // AUTO-ACCEPT SAFETY RULES (POINT 3)
        if (autoAccept) {
            // Guard 1: Shop Status
            // Check if shop is explicitly "Closed" in status or schedule?
            // Already checked 'ONLINE' above, but let's be strict about "OPEN"
            // For now, ONLINE check covers basic availability.

            // Guard 2: Low Stock Threshold
            const lowThreshold = product.lowStockThreshold || 5;
            if (availableStock <= lowThreshold) {
                // BLOCKED: Inventory too low for auto-trust
                status = 'PENDING';
                safetyReason = 'Low Stock Safety Trigger';
            }
            // Guard 3: Request Quantity > Available (Implicitly handled by check above since request is 1 unit)
            // Guard 4: Explicit Quantity Check (for future multi-unit)
            else if (1 > availableStock) {
                status = 'PENDING';
                safetyReason = 'Insufficient Stock';
            }
            else {
                // If all safe -> AUTO_ACCEPTED
                status = 'AUTO_ACCEPTED';
            }
        }

        if (status === 'AUTO_ACCEPTED') {
            // TRIGGER RESERVATION (POINT 2)
            const Reservation = require('../models/Reservation');

            // Calculate Expiry (TTL)
            // Pay on Visit -> visitTime + grace (fallback 2 hours from now if no visit time)
            let expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // Default 2 hours
            if (visitDate && visitTime) {
                // Parse logic... simplified for now
                expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from request for simplicity
            }

            // NOTE: We don't save reservation yet as we need request ID.
        }

        // 5. Create Request
        const request = await Request.create({
            productId,
            productName: productName || product.name,
            sellerId,
            sellerShopName: sellerShopName || seller.shopDetails?.shopName,
            customerId,
            customerName: req.user.name,
            status,
            type: paymentMethod === 'PAY_NOW' ? 'PAY_NOW' : 'PAY_ON_VISIT',
            expiresAt: new Date(Date.now() + 2 * 60 * 1000), // Request expiry (intent validity)
            paymentMethod: paymentMethod || null,
            visitDate: visitDate || null,
            visitTime: visitTime || null
        });

        // 6. Create Reservation if Auto-Accepted
        if (status === 'AUTO_ACCEPTED') {
            const { acquireLock } = require('../utils/lockManager');
            let lock;
            try {
                lock = await acquireLock(`lock:product:${productId}`, 5000);
            } catch (lockErr) {
                // Lock failed, downgrade status to PENDING
                request.status = 'PENDING';
                await request.save();
                status = 'PENDING';
                console.warn(`[RequestController-Create] Lock failed. Request downgraded to PENDING for product ${productId}`);
            }

            if (status === 'AUTO_ACCEPTED') {
                try {
                    // Double check availability under lock
                    const lockedProduct = await Product.findById(productId);
                    const currentAvailable = lockedProduct.countInStock - (lockedProduct.reservedCount || 0);
                    if (currentAvailable <= 0) {
                        request.status = 'PENDING';
                        await request.save();
                        status = 'PENDING';
                    } else {
                        const Reservation = require('../models/Reservation');
                        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Hours Reservation TTL

                        reservation = await Reservation.create({
                            requestId: request._id,
                            productId,
                            sellerId,
                            quantity: 1, // Default 1 for now
                            expiresAt,
                            status: 'ACTIVE'
                        });

                        // UPDATE PRODUCT RESERVED COUNT (Atomically)
                        await Product.findByIdAndUpdate(productId, { $inc: { reservedCount: 1 } });
                    }
                } finally {
                    if (lock) {
                        await lock.release().catch(err => console.error('[Lock] Release failed:', err.message));
                    }
                }
            }
        }

        // 7. Notify Seller
        sendNotification(sellerId, NOTIFICATION_TYPE.CUSTOMER_PRODUCT_INTERESTED, {
            customerName: req.user.name,
            productName: productName || product.name,
            entityId: request._id, // Link to Request
            message: status === 'AUTO_ACCEPTED' ? 'New Auto-Accepted Request (Stock Reserved)' : 'New Visit Request (Pending Approval)',
            actionLink: `/seller/visits` // requests view refactored to visits?
        }).catch(err => console.error('Notification Error:', err));

        // 8. Update Stats
        try {
            await User.findByIdAndUpdate(sellerId, {
                $inc: { 'sellerStats.totalRequests': 1 },
                'sellerStats.lastActiveAt': new Date()
            });
            const { calculateSellerTrust } = require('../services/trustService');
            await calculateSellerTrust(sellerId);
        } catch (err) { console.warn("Stats error", err); }

        // Broadcast REQUEST_CREATED event cluster-wide
        try {
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('REQUEST_CREATED', {
                requestId: request._id.toString(),
                customerId: customerId.toString(),
                sellerId: sellerId.toString(),
                productId: productId.toString(),
                version: request.version || 1
            });
        } catch (busErr) {
            console.error('[RequestController-EventBus] REQUEST_CREATED publication failed:', busErr.message);
        }

        res.status(201).json({ request, reservation });

    } catch (error) {
        console.error("Create Request Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get requests for Seller Inbox
// @route   GET /api/requests/seller
// @access  Private (Seller)
// @desc    Get requests for Seller Inbox (Includes Orders & Requests)
// @route   GET /api/requests/seller
// @access  Private (Seller)
const getSellerRequests = async (req, res) => {
    try {
        // 1. Fetch Legacy Requests
        const requestsPromise = Request.find({ sellerId: req.user._id })
            .sort({ createdAt: -1 });

        // 2. Fetch New Orders (Visit Requests)
        const Order = require('../models/Order');
        const ordersPromise = Order.find({ sellerId: req.user._id })
            .populate('customerId', 'name email') // Get Customer Name
            .sort({ createdAt: -1 });

        const [requests, orders] = await Promise.all([requestsPromise, ordersPromise]);

        // 3. Normalize Orders to look like Requests for the UI
        const normalizedOrders = orders.map(order => ({
            _id: order._id,
            isOrder: true, // Flag to distinguish
            productId: order.items[0]?.product,
            productName: order.items.map(i => i.name).join(', ') + (order.items.length > 1 ? ` (+${order.items.length - 1})` : ''),
            sellerId: order.sellerId,
            sellerShopName: "My Shop", // Redundant for seller view
            customerId: order.customerId?._id,
            customerName: order.customerId?.name || "Guest Details",
            status: mapOrderStatusToRequest(order.status), // Map status
            originalStatus: order.status,
            type: order.paymentMode === 'PAY_ON_VISIT' ? 'PAY_ON_VISIT' : 'PREPAID',
            expiresAt: null, // Orders don't expire same way?
            createdAt: order.createdAt,
            totalAmount: order.totalAmount,
            visitDate: null // Retrieve from metadata if stored
        }));

        // Merge and Sort
        const combined = [...normalizedOrders, ...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error("Get Seller Requests Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const mapOrderStatusToRequest = (status) => {
    switch (status) {
        case 'READY_FOR_PICKUP': return 'PENDING_CONFIRMATION'; // Appear as Pending for Seller Action
        case 'PENDING': return 'PENDING_CONFIRMATION';
        case 'CONFIRMED': return 'SELLER_CONFIRMED';
        case 'COMPLETED': return 'COMPLETED';
        case 'CANCELLED': return 'REJECTED';
        default: return status;
    }
};

// @desc    Get requests for Customer (My Interests)
// @route   GET /api/requests/my-requests
// @access  Private (Customer)
const getCustomerRequests = async (req, res) => {
    try {
        const requests = await Request.find({ customerId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("Get Customer Requests Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const StockMovement = require('../models/StockMovement');
const SellerProduct = require('../models/SellerProduct');
const { calculateStockStatus, isExpired } = require('../utils/stockUtils');

// @desc    Accept Request (Seller Action)
// @route   POST /api/requests/:id/accept
// @access  Private (Seller)
const acceptRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await Request.findById(requestId);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.sellerId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: `Cannot accept request in ${request.status} state.` });
        }

        // 0. STRICT EXPIRY SAFETY (Rule 6)
        if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
            if (request.status !== 'EXPIRED') {
                request.status = 'EXPIRED';
                await request.save();
            }
            return res.status(400).json({ message: 'Request expired. Action blocked.' });
        }

        // Acquire distributed lock before checking inventory and creating reservation
        const { acquireLock } = require('../utils/lockManager');
        let lock;
        try {
            lock = await acquireLock(`lock:product:${request.productId}`, 5000);
        } catch (lockErr) {
            return res.status(409).json({ message: 'Product stock is currently locked. Please retry.' });
        }

        try {
            // 1. Check Inventory Again
            const Product = require('../models/Product');
            const product = await Product.findById(request.productId);
            const availableStock = product.countInStock - (product.reservedCount || 0);

            if (availableStock < 1) { // Assuming 1 unit
                return res.status(400).json({ message: 'Insufficient stock to accept.' });
            }

            // 2. Create Reservation
            const Reservation = require('../models/Reservation');
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 Hours Standard

            const reservation = await Reservation.create({
                requestId: request._id,
                productId: request.productId,
                sellerId: request.sellerId,
                quantity: 1,
                expiresAt,
                status: 'ACTIVE'
            });

            // 3. Create Visit (Status: SCHEDULED)
            const Visit = require('../models/Visit');
            const crypto = require('crypto');
            const visitToken = crypto.randomBytes(32).toString('hex');

            let scheduledTime = new Date();
            if (request.visitDate && request.visitTime) {
                scheduledTime = new Date(`${request.visitDate}T${request.visitTime}`);
            } else {
                scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 Hours default
            }

            await Visit.create({
                interestRequestId: request._id,
                shopId: request.sellerId,
                customerId: request.customerId,
                visitType: request.type || 'PAY_ON_VISIT',
                scheduledTime,
                status: 'SCHEDULED',
                productName: request.productName,
                customerName: request.customerName,
                visitToken,
                visitTokenExpiresAt: new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000)
            });

            // 4. Update Request
            request.status = 'AUTO_ACCEPTED';
            await request.save();

            try {
                const { calculateSellerTrust } = require('../services/trustService');
                await calculateSellerTrust(request.sellerId);
            } catch (trustErr) {
                console.error('[RequestController] Trust recalculate failed:', trustErr.message);
            }

            // 5. Update Inventory (Reserve)
            await Product.findByIdAndUpdate(request.productId, { $inc: { reservedCount: 1 } });

            // Broadcast REQUEST_ACCEPTED event cluster-wide
            try {
                const { publishEvent } = require('../utils/eventBus');
                await publishEvent('REQUEST_ACCEPTED', {
                    requestId: request._id.toString(),
                    customerId: request.customerId.toString(),
                    sellerId: request.sellerId.toString(),
                    productId: request.productId.toString(),
                    version: request.version || 1
                });
            } catch (busErr) {
                console.error('[RequestController-EventBus] REQUEST_ACCEPTED publication failed:', busErr.message);
            }

            res.json({ message: 'Request Accepted', request });
        } finally {
            if (lock) {
                await lock.release().catch(err => console.error('[Lock] Release failed:', err.message));
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const confirmRequest = acceptRequest; // Alias

// @desc    Reject Request
// @route   POST /api/requests/:id/reject
// @access  Private (Seller)
const rejectRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.sellerId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

        // STRICT EXPIRY SAFETY (Rule 6)
        if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
            if (request.status !== 'EXPIRED') {
                request.status = 'EXPIRED';
                await request.save();
            }
            return res.status(400).json({ message: 'Request expired. Action blocked.' });
        }

        request.status = 'REJECTED';
        // request.rejectReason = reason; // If field exists
        await request.save();

        try {
            const { calculateSellerTrust } = require('../services/trustService');
            await calculateSellerTrust(request.sellerId);
        } catch (trustErr) {
            console.error('[RequestController] Trust recalculate failed:', trustErr.message);
        }

        res.json({ message: 'Request Rejected', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check & Expire Stale Reservations (System Cron)
// @route   POST /api/requests/check-expired
// @access  Private (System/Admin)
const checkExpiredReservations = async (req, res) => {
    try {
        const Reservation = require('../models/Reservation');
        const Product = require('../models/Product'); // Ensure Model is loaded

        const now = new Date();

        // Find Active but Expired Reservations
        const expiredReservations = await Reservation.find({
            status: 'ACTIVE',
            expiresAt: { $lt: now }
        });

        if (expiredReservations.length === 0) {
            return res.json({ message: 'No expired reservations found.', count: 0 });
        }

        let processed = 0;
        const { acquireLock } = require('../utils/lockManager');
        for (const reservation of expiredReservations) {
            let lock;
            try {
                lock = await acquireLock(`lock:product:${reservation.productId}`, 5000);
            } catch (lockErr) {
                console.warn(`[RequestController-Expiry] Lock failed for product ${reservation.productId}. Skipping for next run.`);
                continue;
            }

            try {
                // Fetch fresh copy to verify it is still ACTIVE
                const freshRes = await Reservation.findById(reservation._id);
                if (!freshRes || freshRes.status !== 'ACTIVE') continue;

                // 1. Update Reservation
                freshRes.status = 'EXPIRED';
                await freshRes.save();

                // 2. Update Request
                const request = await Request.findById(freshRes.requestId);
                if (request) {
                    if (['PENDING', 'AUTO_ACCEPTED'].includes(request.status)) {
                        request.status = 'EXPIRED';
                        await request.save();
                    }
                }

                // 3. Release Inventory (Strict)
                await Product.findByIdAndUpdate(freshRes.productId, { $inc: { reservedCount: -1 } });
                processed++;
            } finally {
                if (lock) {
                    await lock.release().catch(err => console.error('[Lock] Release failed:', err.message));
                }
            }
        }

        res.json({ message: 'Expired reservations processed', count: processed });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Exports moved to bottom

// @desc    Create Assisted Listing Request
// @route   POST /api/requests/assisted-listing
// @access  Private (Seller)
const createAssistedListingRequest = async (req, res) => {
    try {
        const { mobile, estimatedProductCount } = req.body;
        const sellerId = req.user._id;

        // 1. Basic Validation
        if (!mobile || !estimatedProductCount) {
            return res.status(400).json({ message: 'Mobile number and approximate product count are required.' });
        }

        // 2. Handle uploaded files
        // Note: Multer middleware must be applied on route
        const files = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // 3. Create Request
        const AssistedListingRequest = require('../models/AssistedListingRequest');
        const newRequest = await AssistedListingRequest.create({
            seller: sellerId,
            name: req.user.name, // Auto-fill from User
            mobile,
            address: req.user.shopDetails?.address || 'Not Provided', // Auto-fill
            estimatedProductCount: Number(estimatedProductCount),
            files,
            status: 'pending' // Default
        });

        res.status(201).json({
            message: 'Assisted listing request submitted successfully.',
            request: newRequest
        });

    } catch (error) {
        console.error("Create Assisted Listing Request Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper
const isValidDate = (d) => d instanceof Date && !isNaN(d);

module.exports = {
    createRequest,
    getSellerRequests,
    getCustomerRequests,
    confirmRequest,
    acceptRequest,
    rejectRequest,
    checkExpiredReservations,
    createAssistedListingRequest
};


