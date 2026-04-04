const SupportTicket = require('../models/SupportTicket');

const { createNotification } = require('./notificationController');

// @desc    Create a new support ticket
// @route   POST /api/seller/support/ticket
// @access  Private (Seller)
const createTicket = async (req, res) => {
    try {
        const { issueText, phoneNumber } = req.body;
        const seller = req.user;

        if (!issueText || !phoneNumber) {
            return res.status(400).json({ message: 'Issue description and phone number are required' });
        }

        const ticket = await SupportTicket.create({
            sellerId: seller._id,
            sellerName: seller.name,
            shopName: seller.shopDetails?.shopName || 'Unknown Shop',
            city: seller.shopDetails?.location?.city || 'Unknown',
            issueText,
            phoneNumber,
            source: 'ShopLens Support',
            status: 'open'
        });

        await createNotification(
            seller._id,
            'SYSTEM',
            '📞 Support Request Received',
            'Our team will contact you soon.',
            'MEDIUM'
        );

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Support Ticket Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createTicket
};
