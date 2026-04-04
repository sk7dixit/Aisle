const CustomerVisit = require('../models/CustomerVisit');
const User = require('../models/User');

// @desc    Scan Customer Visit QR (Pass: Arrival)
// @route   POST /api/customer-visits/scan
// @access  Private (Seller)
const scanVisitQR = async (req, res) => {
    try {
        const { qrToken } = req.body;

        if (!qrToken) {
            return res.status(400).json({ message: "QR Token is required" });
        }

        // 1. Find the visit by QR Token
        constvisit = await CustomerVisit.findOne({ qrToken });

        if (!visit) {
            // Security: Invalid Token
            return res.status(404).json({ message: "Invalid or expired QR Code." });
        }

        // 2. Security Check: Does this visit belong to the scanning seller?
        if (visit.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "This QR code belongs to another shop." });
        }

        // 3. Check State
        if (visit.visitStatus === 'COMPLETED' || visit.visitStatus === 'CANCELLED') {
            // Logic: If already completed, show INFO but don't error out hard
            // This mimics the "Already Completed" check we had before
            return res.status(200).json({
                type: 'INFO',
                message: `Visit already ${visit.visitStatus.toLowerCase()}.`,
                visitId: visit._id
            });
        }

        // 4. Update Status to ARRIVED (if not already)
        if (visit.visitStatus === 'UPCOMING') {
            visit.visitStatus = 'ARRIVED';
            await visit.save();
        }

        // 5. Determine Response based on Payment Status
        let responsePayload = {
            visitId: visit._id,
            customerName: "Guest", // Default
            totalAmount: visit.products.reduce((acc, p) => acc + (p.priceAtTime * p.quantity), 0)
        };

        // Fetch customer name if available
        if (visit.customerId) {
            const customer = await User.findById(visit.customerId).select('name');
            if (customer) responsePayload.customerName = customer.name;
        }

        if (visit.paymentStatus === 'COMPLETED') {
            // CASE A: PAID
            return res.status(200).json({
                ...responsePayload,
                type: 'PAID',
                message: "Payment already completed via UPI. You may hand over the products.",
                action: "HAND_OVER"
            });
        } else {
            // CASE B: PAY ON VISIT (or PENDING)
            return res.status(200).json({
                ...responsePayload,
                type: 'PAY_ON_VISIT',
                message: "Payment pending. Please collect payment from the customer.",
                action: "COLLECT_PAYMENT"
            });
        }

    } catch (error) {
        console.error("Scan Visit Error:", error);
        res.status(500).json({ message: "Server Error during Scan" });
    }
};

// @desc    Complete Customer Visit (Final Step)
// @route   POST /api/customer-visits/:id/complete
// @access  Private (Seller)
const completeVisit = async (req, res) => {
    try {
        const { id } = req.params;

        const visit = await CustomerVisit.findById(id);

        if (!visit) {
            return res.status(404).json({ message: "Visit not found" });
        }

        if (visit.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Update States
        visit.visitStatus = 'COMPLETED';

        // If it was Pay on Visit, we assume seller collected payment
        if (visit.paymentMode === 'PAY_ON_VISIT' && visit.paymentStatus === 'PENDING') {
            visit.paymentStatus = 'COMPLETED';
        }

        await visit.save();

        res.json({ success: true, message: "Visit marked as completed." });

    } catch (error) {
        console.error("Complete Visit Error:", error);
        res.status(500).json({ message: "Failed to complete visit" });
    }
};

// @desc    Get Customer Visits (My Visits)
// @route   GET /api/customer-visits/my-visits
// @access  Private (Customer)
const getMyVisits = async (req, res) => {
    try {
        const visits = await CustomerVisit.find({ customerId: req.user._id })
            .populate('sellerId', 'name shopDetails.shopName shopDetails.address')
            .sort({ visitTime: 1, createdAt: -1 });

        const formatted = visits.map(v => {
            const obj = v.toObject();
            // Security: Only show QR for Upcoming visits
            if (v.visitStatus !== 'UPCOMING') {
                delete obj.qrToken;
            }
            return obj;
        });

        res.json(formatted);
    } catch (error) {
        console.error("Get My Visits Error:", error);
        res.status(500).json({ message: "Failed to fetch visits" });
    }
};

module.exports = {
    scanVisitQR,
    completeVisit,
    getMyVisits
};
