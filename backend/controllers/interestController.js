const Interest = require('../models/Interest');
const Product = require('../models/Product');
const { sendNotification, NOTIFICATION_TYPE } = require('../services/notificationService');

// @desc    Express Interest in a Product
// @route   POST /api/interests
// @access  Private (Customer)
const createInterest = async (req, res) => {
    try {
        const { productId, sellerId } = req.body;
        const customerId = req.user._id;

        if (!productId || !sellerId) {
            return res.status(400).json({ message: 'Product ID and Seller ID are required' });
        }

        // Idempotency: Check if already interested
        const existingInterest = await Interest.findOne({ customerId, productId });
        if (existingInterest) {
            return res.status(200).json({ message: 'Interest already registered', interest: existingInterest });
        }

        const interest = await Interest.create({
            customerId,
            sellerId,
            productId,
            status: 'ACTIVE'
        });

        // Optional: Notify Seller of "Soft Signal"
        // Don't spam, maybe aggregate? For now, real-time.
        sendNotification(sellerId, NOTIFICATION_TYPE.CUSTOMER_PRODUCT_INTERESTED, {
            title: "New Interest",
            message: `${req.user.name} is interested in a product.`,
            actionLink: `/seller/visits` // Or interests view
        }).catch(err => console.error(err));

        res.status(201).json(interest);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get My Interests
// @route   GET /api/interests
// @access  Private (Customer)
const getMyInterests = async (req, res) => {
    try {
        const interests = await Interest.find({ customerId: req.user._id })
            .populate('productId', 'name price imageUrl')
            .populate('sellerId', 'name shopDetails')
            .sort({ createdAt: -1 });
        res.json(interests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createInterest,
    getMyInterests
};
