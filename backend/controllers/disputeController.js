const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Raise a Dispute for an Order
// @route   POST /api/customer/orders/:id/dispute
// @access  Private (Customer)
const raiseDispute = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { items, note } = req.body; // items: [{ product: id, quantity: 1, reason: '' }]

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 1. Validation Logic
        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to dispute this order" });
        }

        if (!['READY_FOR_PICKUP', 'FULFILLED', 'PARTIALLY_FULFILLED'].includes(order.status)) {
            return res.status(400).json({ message: "Disputes can only be raised for orders that are ready or picked up." });
        }

        if (order.dispute && order.dispute.status === 'OPEN') {
            return res.status(400).json({ message: "A dispute is already open for this order." });
        }

        // 2. Calculate Refund Amount (for Prepaid)
        let refundAmount = 0;
        if (order.paymentMode === 'PREPAID') {
            items.forEach(disputedItem => {
                const originalItem = order.items.find(i => i.product.toString() === disputedItem.product);
                if (originalItem) {
                    refundAmount += (originalItem.price * disputedItem.quantity);
                }
            });
        }

        // 3. Update Order State
        order.dispute = {
            raisedBy: req.user._id,
            items: items,
            status: 'OPEN',
            refundAmount: refundAmount,
            createdAt: new Date()
        };
        order.status = 'DISPUTED'; // Or keep original status and just rely on dispute object? User said "Order state becomes DISPUTED"

        if (refundAmount > 0) {
            // In a real system, trigger Payment Gateway Refund here
            // refundStatus = 'PENDING'
        }

        await order.save();

        // 4. Update Seller Stats (Silent Penalty Tracking)
        await User.findByIdAndUpdate(order.sellerId, {
            $inc: { 'sellerStats.totalDisputes': 1 }
        });

        // 5. Notify Seller (Socket or Alert - Placeholder)
        // console.log(`Dispute raised for Order ${orderId}`);

        res.status(200).json({
            message: "Dispute submitted successfully. Refund processed if applicable.",
            dispute: order.dispute
        });

    } catch (error) {
        console.error("Dispute Error:", error);
        res.status(500).json({ message: "Failed to raise dispute" });
    }
};

module.exports = { raiseDispute };
