const Order = require('../models/Order');
const CustomerVisit = require('../models/CustomerVisit');
const SupportRequest = require('../models/SupportRequest');
const User = require('../models/User');

// @desc    Get all orders and visits for a customer
// @route   GET /api/customer/orders
// @access  Private (Customer)
const getOrders = async (req, res) => {
    try {
        const customerId = req.user._id;

        // Fetch regular orders
        const regularOrders = await Order.find({ customerId })
            .populate('sellerId', 'shopDetails')
            .sort({ createdAt: -1 });

        // Fetch visits (which act as pickup orders)
        const visits = await CustomerVisit.find({ customerId })
            .populate('sellerId', 'shopDetails')
            .sort({ createdAt: -1 });

        const unified = [];

        regularOrders.forEach(o => {
            unified.push({
                _id: o._id,
                orderType: 'regular',
                sellerId: o.sellerId?._id || o.sellerId,
                shopName: o.sellerId?.shopDetails?.shopName || 'Unknown Shop',
                items: o.items.map(i => ({
                    productId: i.product,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    image: i.image
                })),
                totalAmount: o.totalAmount,
                status: o.status, // PENDING, CONFIRMED, READY_FOR_PICKUP, FULFILLED, CANCELLED
                paymentMode: o.paymentMode, // PAY_ON_VISIT, PREPAID
                paymentStatus: o.paymentStatus, // PENDING, PAID, FAILED
                dispute: o.dispute,
                createdAt: o.createdAt
            });
        });

        visits.forEach(v => {
            const totalAmount = v.products.reduce((sum, p) => sum + p.priceAtTime * p.quantity, 0);
            unified.push({
                _id: v._id,
                orderType: 'visit',
                sellerId: v.sellerId?._id || v.sellerId,
                shopName: v.sellerId?.shopDetails?.shopName || 'Unknown Shop',
                items: v.products.map(p => ({
                    productId: p.productId,
                    name: p.name,
                    quantity: p.quantity,
                    price: p.priceAtTime,
                    image: p.image
                })),
                totalAmount,
                status: v.visitStatus, // UPCOMING, ARRIVED, COMPLETED, CANCELLED, MISSED
                paymentMode: v.paymentMode, // PAY_ON_VISIT, PAID_ONLINE
                paymentStatus: v.paymentStatus, // PENDING, COMPLETED, FAILED, REFUNDED
                createdAt: v.createdAt
            });
        });

        // Sort by date descending
        unified.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(unified);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order tracking status and details
// @route   GET /api/customer/order-status/:id
// @access  Private (Customer)
const getOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const customerId = req.user._id;

        let order = await Order.findById(orderId).populate('sellerId', 'shopDetails');
        let orderType = 'regular';

        if (!order) {
            order = await CustomerVisit.findById(orderId).populate('sellerId', 'shopDetails');
            orderType = 'visit';
        }

        if (!order) {
            return res.status(404).json({ message: 'Order or Visit not found' });
        }

        if (order.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this order status' });
        }

        const status = orderType === 'regular' ? order.status : order.visitStatus;
        const totalAmount = orderType === 'regular' ? order.totalAmount : order.products.reduce((sum, p) => sum + p.priceAtTime * p.quantity, 0);
        const shopName = order.sellerId?.shopDetails?.shopName || 'Unknown Shop';

        // Calculate timeline status mapping
        let steps = {
            placed: true,
            confirmed: false,
            preparing: false,
            packed: false,
            outForDelivery: false,
            delivered: false
        };

        if (orderType === 'regular') {
            if (['CONFIRMED', 'READY_FOR_PICKUP', 'FULFILLED', 'DISPUTED'].includes(status)) steps.confirmed = true;
            if (['READY_FOR_PICKUP', 'FULFILLED'].includes(status)) steps.preparing = true;
            if (['READY_FOR_PICKUP', 'FULFILLED'].includes(status)) steps.packed = true;
            if (status === 'READY_FOR_PICKUP') steps.outForDelivery = true; // Simulating out-for-delivery/ready
            if (status === 'FULFILLED') {
                steps.outForDelivery = true;
                steps.delivered = true;
            }
        } else {
            // visit Status: UPCOMING, ARRIVED, COMPLETED, CANCELLED, MISSED
            if (['UPCOMING', 'ARRIVED', 'COMPLETED'].includes(status)) steps.confirmed = true;
            if (['ARRIVED', 'COMPLETED'].includes(status)) steps.preparing = true;
            if (['ARRIVED', 'COMPLETED'].includes(status)) steps.packed = true;
            if (status === 'ARRIVED') steps.outForDelivery = true; // Arrived at pickup / ready
            if (status === 'COMPLETED') {
                steps.outForDelivery = true;
                steps.delivered = true;
            }
        }

        // Delay detection logic
        let delayDetected = false;
        let delayMinutes = 0;
        let delayReason = "";

        const createdTime = new Date(order.createdAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - createdTime) / 60000);

        if (['PENDING', 'UPCOMING', 'CONFIRMED'].includes(status) && diffMinutes > 15) {
            delayDetected = true;
            delayMinutes = diffMinutes + 10;
            delayReason = "High seller workload and pending delivery coordinator assignment.";
        }

        // Driver coordinates and distance simulation
        let driverDistance = null;
        let driverETA = null;
        if (['CONFIRMED', 'UPCOMING', 'PENDING'].includes(status)) {
            driverDistance = "1.8 km";
            driverETA = "12:45 PM – 1:15 PM";
        }

        res.json({
            orderId: order._id,
            orderType,
            shopName,
            status,
            totalAmount,
            steps,
            delay: {
                detected: delayDetected,
                minutes: delayMinutes,
                reason: delayReason
            },
            driver: {
                distance: driverDistance,
                eta: driverETA
            },
            createdAt: order.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process refund eligibility check & request
// @route   POST /api/customer/refund-request
// @access  Private (Customer)
const processRefundRequest = async (req, res) => {
    try {
        const { orderId } = req.body;
        const customerId = req.user._id;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        let order = await Order.findById(orderId);
        let orderType = 'regular';

        if (!order) {
            order = await CustomerVisit.findById(orderId);
            orderType = 'visit';
        }

        if (!order) {
            return res.status(404).json({ message: 'Order or Visit not found' });
        }

        if (order.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const paymentStatus = order.paymentStatus;
        const status = orderType === 'regular' ? order.status : order.visitStatus;
        const paymentMode = order.paymentMode;
        const totalAmount = orderType === 'regular' ? order.totalAmount : order.products.reduce((sum, p) => sum + p.priceAtTime * p.quantity, 0);

        let eligible = false;
        let refundAmount = 0;
        let reason = "";
        let processingTime = "3-5 Business Days";

        if (paymentMode === 'PAY_ON_VISIT') {
            eligible = false;
            reason = "This order was set to 'Pay on Visit' (COD). No online payment was charged, so no refund is applicable.";
        } else if (paymentStatus === 'PENDING' || paymentStatus === 'FAILED') {
            eligible = false;
            reason = "Payment for this order was not completed or failed. No refund can be processed.";
        } else if (['CANCELLED', 'FAILED', 'DISPUTED'].includes(status) || paymentStatus === 'REFUNDED') {
            eligible = true;
            refundAmount = totalAmount;
            reason = `Order is cancelled/disputed and online payment of ₹${totalAmount} was previously captured. Full refund approved.`;
        } else {
            eligible = false;
            reason = "This order has already been completed. Under standard store policy, refunds on completed transactions require raising an items dispute.";
        }

        res.json({
            orderId,
            eligible,
            refundAmount,
            reason,
            processingTime
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Raise a dispute (wrong product / price issue) and escalate to operations
// @route   POST /api/customer/dispute
// @access  Private (Customer)
const raiseDisputeUnified = async (req, res) => {
    try {
        const { orderId, items, note, images = [] } = req.body;
        const customerId = req.user._id;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID required' });
        }

        let order = await Order.findById(orderId).populate('sellerId');
        let orderType = 'regular';

        if (!order) {
            order = await CustomerVisit.findById(orderId).populate('sellerId');
            orderType = 'visit';
        }

        if (!order) {
            return res.status(404).json({ message: 'Order or Visit not found' });
        }

        if (order.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const sellerName = order.sellerId?.name || order.sellerId?.shopDetails?.shopName || 'Unknown Merchant';
        const priority = 'high';

        // Write support request in SupportRequest (operational queue)
        const ticket = await SupportRequest.create({
            user: customerId,
            identifier: req.user.phone || '9876543210',
            category: 'Shopping',
            summary: `Dispute raised for Order #${orderId.toString().slice(-6)}. Issue: ${note || 'Wrong items / Mismatch'}`,
            status: 'open',
            priority,
            images,
            meta: {
                orderId,
                orderType,
                disputedItems: items,
                sellerName
            }
        });

        // Set state as DISPUTED on order schema
        if (orderType === 'regular') {
            order.dispute = {
                raisedBy: customerId,
                items: items,
                status: 'OPEN',
                refundAmount: order.paymentMode === 'PREPAID' ? order.totalAmount : 0,
                createdAt: new Date()
            };
            order.status = 'DISPUTED';
            await order.save();
        } else {
            order.notes = `Disputed: ${note || 'Items issue'}`;
            await order.save();
        }

        // Increment total disputes on seller
        await User.findByIdAndUpdate(order.sellerId?._id || order.sellerId, {
            $inc: { 'sellerStats.totalDisputes': 1 }
        }).catch(() => {});

        res.json({
            message: "Dispute submitted successfully. Operations team notified.",
            ticketId: ticket._id,
            priority,
            dispute: {
                orderId,
                sellerName,
                note,
                items
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel an order or visit
// @route   POST /api/customer/cancel-order
// @access  Private (Customer)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const customerId = req.user._id;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        let order = await Order.findById(orderId);
        let orderType = 'regular';

        if (!order) {
            order = await CustomerVisit.findById(orderId);
            orderType = 'visit';
        }

        if (!order) {
            return res.status(404).json({ message: 'Order or Visit not found' });
        }

        if (order.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const status = orderType === 'regular' ? order.status : order.visitStatus;

        if (orderType === 'regular') {
            if (['FULFILLED', 'CANCELLED'].includes(status)) {
                return res.status(400).json({ message: `Cannot cancel order in ${status} state.` });
            }
            order.status = 'CANCELLED';
            await order.save();
        } else {
            if (['COMPLETED', 'CANCELLED', 'MISSED'].includes(status)) {
                return res.status(400).json({ message: `Cannot cancel visit in ${status} state.` });
            }
            order.visitStatus = 'CANCELLED';
            await order.save();
        }

        try {
            const { calculateSellerTrust, calculateCustomerTrust } = require('../services/trustService');
            await calculateSellerTrust(order.sellerId);
            await calculateCustomerTrust(order.customerId);
        } catch (trustErr) {
            console.error('[CustomerResolutionController] Trust recalculate failed:', trustErr.message);
        }

        const totalAmount = orderType === 'regular' ? order.totalAmount : order.products.reduce((sum, p) => sum + p.priceAtTime * p.quantity, 0);
        const refundEligible = order.paymentMode === 'PAID_ONLINE' || order.paymentMode === 'PREPAID';

        res.json({
            message: "Order successfully cancelled.",
            orderId,
            status: 'CANCELLED',
            refund: {
                eligible: refundEligible,
                amount: refundEligible ? totalAmount : 0,
                processingTime: refundEligible ? "1-3 Business Days" : "N/A"
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all escalation tickets raised by the customer
// @route   GET /api/customer/tickets
// @access  Private (Customer)
const getTickets = async (req, res) => {
    try {
        const customerId = req.user._id;
        const tickets = await SupportRequest.find({ user: customerId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single ticket details
// @route   GET /api/customer/ticket/:id
// @access  Private (Customer)
const getTicketDetail = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await SupportRequest.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.user && ticket.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create operations ticket manually (Escalate Support)
// @route   POST /api/customer/escalate
// @access  Private (Customer)
const escalateTicket = async (req, res) => {
    try {
        const { category = 'Other', summary, logs = [], priority = 'high', images = [], meta = {} } = req.body;
        const customerId = req.user._id;

        const ticketLogs = logs.map(l => {
            const isUser = l.toLowerCase().startsWith('[user]');
            return {
                sender: isUser ? 'user' : 'bot',
                text: l.replace(/^\[(user|bot)\]\s*/i, ''),
                timestamp: new Date()
            };
        });

        const ticket = await SupportRequest.create({
            user: customerId,
            identifier: req.user.phone || '9876543210',
            category,
            summary: summary || 'Customer requested operations escalation',
            status: 'open',
            logs: ticketLogs,
            priority,
            images,
            meta
        });

        res.status(201).json({
            message: "Ticket created and escalated to operations support.",
            ticketId: ticket._id,
            priority: ticket.priority,
            status: ticket.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrders,
    getOrderStatus,
    processRefundRequest,
    raiseDisputeUnified,
    cancelOrder,
    getTickets,
    getTicketDetail,
    escalateTicket
};
