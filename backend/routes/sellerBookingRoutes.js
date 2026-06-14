const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const serviceSellerOnly = require('../middleware/serviceSellerOnly');
const { createServiceNotification } = require('../utils/serviceNotificationHelper');

// 1. GET — Seller’s Incoming Bookings
router.get(
    '/',
    protect,
    serviceSellerOnly,
    async (req, res) => {
        try {
            const bookings = await Booking.find({
                seller: req.user._id,
            })
                .populate('customer', 'name')
                .populate('service')
                .sort({ createdAt: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
    }
);

// 2. PATCH — Update Booking Status
router.patch(
    '/:id/status',
    protect,
    serviceSellerOnly,
    async (req, res) => {
        const { acquireLock } = require('../utils/lockManager');
        let lock;
        try {
            lock = await acquireLock(`lock:booking:${req.params.id}`, 5000);
        } catch (lockErr) {
            return res.status(409).json({ message: 'Booking is currently being updated by another operation. Please retry.' });
        }

        try {
            const { status } = req.body;

            if (!['COMPLETED', 'CANCELLED'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            const booking = await Booking.findOne({
                _id: req.params.id,
                seller: req.user._id,
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            if (booking.status !== 'UPCOMING') {
                return res.status(400).json({
                    message: 'Only upcoming bookings can be updated',
                });
            }

            booking.status = status;
            await booking.save();

            // 5. Hook into Booking Events: Completed / Cancelled
            if (status === 'COMPLETED') {
                await createServiceNotification({
                    userId: booking.customer,
                    type: 'SERVICE_COMPLETED',
                    title: 'Service Completed',
                    message: 'Your service has been successfully completed.',
                    meta: { bookingId: booking._id },
                });
            }

            if (status === 'CANCELLED') {
                await createServiceNotification({
                    userId: booking.customer,
                    type: 'SERVICE_CANCELLED',
                    title: 'Service Cancelled',
                    message: 'Your service booking was cancelled by the seller.',
                    meta: { bookingId: booking._id },
                });
            }

            res.json(booking);
        } catch (error) {
            res.status(500).json({ message: 'Server Error', error: error.message });
        } finally {
            if (lock) {
                await lock.release().catch(err => console.error('[Redlock] Release failed:', err.message));
            }
        }
    }
);

module.exports = router;
