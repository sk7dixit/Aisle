const Visit = require('../models/Visit');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const Request = require('../models/Request');

// @desc    Scan QR Code (Arrival)
// @route   POST /api/visits/scan
// @access  Private (Seller)
const scanVisit = async (req, res) => {
    try {
        const { visitToken } = req.body;
        const sellerId = req.user._id;

        const visit = await Visit.findOne({ visitToken });
        if (!visit) {
            return res.status(404).json({ message: 'Invalid Visit Token' });
        }

        if (visit.shopId.toString() !== sellerId.toString()) {
            return res.status(403).json({ message: 'This visit does not belong to your shop.' });
        }

        // Guards
        if (visit.status !== 'SCHEDULED') {
            return res.status(400).json({ message: `Visit already ${visit.status}` });
        }

        // Time Window Logic (Optional but good)
        // For now, strict 'SCHEDULED' state is enough as entry.

        visit.status = 'ARRIVED';
        visit.arrivedAt = new Date();
        await visit.save();

        res.json({ message: 'Arrival Confirmed', visit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete Visit & Finalize Inventory
// @route   POST /api/visits/:id/complete
// @access  Private (Seller)
const completeVisit = async (req, res) => {
    try {
        const visitId = req.params.id;
        const visit = await Visit.findById(visitId);

        if (!visit) return res.status(404).json({ message: 'Visit not found' });
        if (visit.shopId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

        if (visit.status !== 'ARRIVED') {
            return res.status(400).json({ message: 'Customer must arrive (Scan QR) before completion.' });
        }

        // CRITICAL: INVENTORY FINALIZATION
        const request = await Request.findById(visit.interestRequestId);
        if (!request) return res.status(404).json({ message: 'Linked Request not found' });

        const reservation = await Reservation.findOne({ requestId: request._id, status: 'ACTIVE' });

        // 1. Mark Visit Completed
        visit.status = 'COMPLETED';
        await visit.save();

        // 2. Consume Reservation & Product Stock
        // If reservation exists, we decrement reservedCount AND countInStock.
        // If reservation expired or missing (edge case), we just decrement countInStock.

        let reservedDelta = 0;
        if (reservation) {
            reservation.status = 'CONSUMED';
            await reservation.save();
            reservedDelta = 1; // Assuming 1 unit
        }

        // Atomic Inventory Deduction
        // Decrease countInStock by 1 (Physical sale)
        // Decrease reservedCount by reservedDelta (Release hold)
        await Product.findByIdAndUpdate(request.productId, {
            $inc: {
                countInStock: -1,
                reservedCount: -reservedDelta
            }
        });

        // 3. Mark Request Completed
        request.status = 'COMPLETED';
        await request.save();

        res.json({ message: 'Visit Completed. Inventory Updated.', visit });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Exports moved to bottom

// @desc    Cancel Visit (Customer Action)
// @route   POST /api/visits/:id/cancel
// @access  Private (Customer)
const cancelVisitByCustomer = async (req, res) => {
    try {
        const visitId = req.params.id;
        const customerId = req.user._id;

        const visit = await Visit.findById(visitId);
        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        if (visit.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Guards
        if (visit.status !== 'SCHEDULED') {
            return res.status(400).json({ message: 'Only scheduled visits can be cancelled.' });
        }

        // Time Guard: Allowed until scheduledAt (Simple defensible rule)
        if (new Date() > new Date(visit.scheduledTime)) {
            return res.status(400).json({ message: 'Too late to cancel. Please contact seller.' });
        }

        // Effect 1: Update Status
        visit.status = 'CANCELLED_BY_CUSTOMER';
        await visit.save();

        // Effect 2: Release Reservation (Inventory Integrity)
        await releaseInventory(visit);

        // Effect 3: Log (Trust Recovery - No penalty, just track)
        console.log(`TrustEvent: Customer ${customerId} cancelled visit ${visitId}. Honest Intent.`);

        res.json({ message: 'Visit cancelled. Reservation released.', visit });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Trigger No-Show Check (System Cron Simulation)
// @route   POST /api/visits/check-no-show
// @access  Private (Admin/System)
const checkNoShows = async (req, res) => {
    try {
        const gracePeriodMinutes = 60; // 1 Hour Grace
        const cutoffTime = new Date(Date.now() - gracePeriodMinutes * 60 * 1000);

        // Find Stuck Scheduled Visits
        const noShows = await Visit.find({
            status: 'SCHEDULED',
            scheduledTime: { $lt: cutoffTime }
        });

        if (noShows.length === 0) {
            return res.json({ message: 'No no-shows found.', count: 0 });
        }

        let processed = 0;
        for (const visit of noShows) {
            visit.status = 'NO_SHOW';
            await visit.save();

            await releaseInventory(visit);
            console.log(`SystemEvent: Visit ${visit._id} marked NO_SHOW. Reservation released.`);
            processed++;
        }

        res.json({ message: 'No-show check complete', count: processed });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Release Inventory
const releaseInventory = async (visit) => {
    const request = await Request.findById(visit.interestRequestId);
    if (!request) return; // Should not happen

    // Find Active Reservation
    const Reservation = require('../models/Reservation');
    const reservation = await Reservation.findOne({ requestId: request._id, status: 'ACTIVE' });

    if (reservation) {
        reservation.status = 'CANCELLED'; // Or EXPIRED/RELEASED? 'CANCELLED' fits best if triggered by action.
        await reservation.save();

        // Decrement Reserved Count Only (Inventory was never deducted physically)
        if (request.productId) {
            await Product.findByIdAndUpdate(request.productId, { $inc: { reservedCount: -1 } });
        }
    }

    // Request State? 
    // If visit cancelled, request effectively cancelled too?
    request.status = 'CANCELLED';
    await request.save();
};

module.exports = {
    scanVisit,
    completeVisit,
    cancelVisitByCustomer,
    checkNoShows,
    getSellerVisits: async (req, res) => {
        try {
            const visits = await Visit.find({ shopId: req.user._id }).populate('customerId', 'name email').sort({ scheduledTime: 1 });
            res.json(visits);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getVisitByToken: async (req, res) => {
        try {
            const visit = await Visit.findOne({ visitToken: req.params.token }).populate('customerId', 'name');
            if (visit) res.json(visit);
            else res.status(404).json({ message: 'Visit not found' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    confirmVisit: scanVisit,
    updateVisitStatus: async (req, res) => {
        try {
            const visit = await Visit.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
            res.json(visit);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
