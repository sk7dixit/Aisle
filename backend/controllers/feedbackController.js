const Feedback = require('../models/Feedback');

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private (Seller)
const createFeedback = async (req, res) => {
    try {
        const { feedbackType, rating, message } = req.body;
        const seller = req.user;

        // Validation
        if (!feedbackType || !message) {
            return res.status(400).json({ message: 'Type and message are required' });
        }

        // Simple "AI" Summary Generation (Internal Logic)
        // Truncate to first sentence or 100 chars
        const summary = message.length > 200
            ? message.substring(0, 197) + '...'
            : message;

        const feedbackData = {
            sellerId: seller._id,
            sellerName: seller.name,
            shopName: seller.shopDetails?.shopName || 'Unknown Shop',
            shopType: seller.shopDetails?.shopType || 'Unknown',
            city: seller.shopDetails?.location?.city || 'Unknown',
            feedbackType,
            message,
            aiSummary: summary, // Save generated summary
            status: 'open'
        };

        // Only add rating if it is provided and valid (>= 1)
        if (rating && rating > 0) {
            feedbackData.rating = rating;
        }

        const { createNotification } = require('./notificationController');

        const feedback = new Feedback(feedbackData);
        await feedback.save(); // Ensure saved first

        // TRIGGER NOTIFICATION: System Receipt
        // In a real app, this would be triggered by a customer rating, but here we confirm receipt
        await createNotification(
            seller._id,
            'feedback',
            'Feedback Received',
            'We received your feedback! Our team is reviewing it.',
            'low'
        );

        res.status(201).json(feedback);
    } catch (error) {
        console.error('Create Feedback Error Details:', error); // Log full error object
        res.status(500).json({ message: 'Server Error', error: error.message }); // Return error text for debugging
    }
};

// @desc    Get logged in seller's feedback
// @route   GET /api/feedback/my-feedback
// @access  Private (Seller)
const getMyFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ sellerId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        console.error('Get My Feedback Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all feedback (Admin)
// @route   GET /api/admin/feedback
// @access  Private (Admin)
const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({})
            .sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        console.error('Get All Feedback Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to feedback (Admin)
// @route   PUT /api/admin/feedback/:id/reply
// @access  Private (Admin)
const replyToFeedback = async (req, res) => {
    try {
        const { message, status } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.adminReply = {
            message,
            repliedAt: Date.now(),
            adminId: req.user._id
        };
        feedback.status = status || 'resolved';

        await feedback.save();
        res.json(feedback);
    } catch (error) {
        console.error('Reply Feedback Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createFeedback,
    getMyFeedback,
    getAllFeedback,
    replyToFeedback
};
