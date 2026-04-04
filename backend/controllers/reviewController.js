const Review = require('../models/Review');
const User = require('../models/User');
const Visit = require('../models/Visit');

// @desc    Create a review for a shop
// @route   POST /api/customer/shop/:id/review
// @access  Private
const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const shopId = req.params.id;
        const customerId = req.user._id;

        // 1. Verify Visit
        const hasVisited = await Visit.findOne({
            shopId,
            customerId,
            status: 'COMPLETED' // Or at least ARRIVED if we want to be lenient
        });

        // For MVP, we might allow rating if they HAVE a visit record at all (SCHEDULED+) 
        // to be less strict, but "COMPLETED" is the user requirement.
        // Let's check for ANY successful visit interaction.
        if (!hasVisited) {
            return res.status(403).json({ message: 'You must visit the shop before rating.' });
        }

        // 2. Check if already reviewed
        const existingReview = await Review.findOne({ shopId, customerId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this shop.' });
        }

        // 3. Create Review
        const review = await Review.create({
            shopId,
            customerId,
            rating,
            comment
        });

        // 4. Update Shop Average Rating
        const allReviews = await Review.find({ shopId });
        const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

        await User.findByIdAndUpdate(shopId, {
            'shopDetails.rating': parseFloat(avgRating.toFixed(1)),
            'shopDetails.numReviews': allReviews.length
        });

        res.status(201).json({
            message: 'Feedback submitted successfully!',
            review
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews for a shop (Seller Access)
// @route   GET /api/seller/reviews
// @access  Private (Seller)
const getSellerReviews = async (req, res) => {
    try {
        const shopId = req.user._id;

        const reviews = await Review.find({ shopId })
            .populate('customerId', 'name')
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

        res.json({
            reviews,
            summary: {
                averageRating: parseFloat(avgRating.toFixed(1)),
                totalReviews
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log a simple visit to a shop
// @route   POST /api/customer/shop/:id/visit
// @access  Private
const logVisit = async (req, res) => {
    try {
        const shopId = req.params.id;
        const customerId = req.user._id;

        // Use update with upsert to prevent duplicates
        await Visit.findOneAndUpdate(
            { shopId, customerId, visitType: 'VISIT_LOG' },
            {
                shopId,
                customerId,
                visitType: 'VISIT_LOG',
                status: 'COMPLETED',
                scheduledTime: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Visit logged successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if a customer has visited a shop
// @route   GET /api/customer/shop/:id/has-visited
// @access  Private
const checkHasVisited = async (req, res) => {
    try {
        const shopId = req.params.id;
        const customerId = req.user._id;

        const visit = await Visit.findOne({ shopId, customerId, status: 'COMPLETED' });
        const review = await Review.findOne({ shopId, customerId });

        res.json({
            visited: !!visit,
            reviewed: !!review
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createReview, getSellerReviews, logVisit, checkHasVisited };
