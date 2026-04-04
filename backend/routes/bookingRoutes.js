const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

const { createServiceNotification } = require('../utils/serviceNotificationHelper');
const User = require('../models/User'); // Need User model to check seller type

// Create booking
router.post('/', protect, async (req, res) => {
    try {
        const booking = await Booking.create({
            ...req.body,
            customer: req.user._id,
        });

        // 5. Hook into Booking Events: Booking Created
        // We need to fetch the seller to check their shopType
        const seller = await User.findById(req.body.seller);

        // Robust check for service shop type (matching serviceSellerOnly middleware logic)
        const type = seller?.shopDetails?.shopType || seller?.shopDetails?.category || seller?.shopDetails?.shopCategory;

        if (type && type.toLowerCase() === 'services') {
            await createServiceNotification({
                userId: seller._id,
                type: 'SERVICE_BOOKED',
                title: 'New Service Booking',
                message: 'A new service has been booked by a customer.',
                meta: { bookingId: booking._id },
            });
        }

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Get customer bookings
router.get('/my', protect, async (req, res) => {
    try {
        // Populate service and seller details. Note: Ensure 'Service' model is registered if populating
        // For now we populate seller. Service population might need adjustment if logic differs.
        const bookings = await Booking.find({ customer: req.user._id })
            // .populate('service') // Uncomment when Service model is confirmed/linked
            .populate('seller', 'shopDetails.shopName')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
