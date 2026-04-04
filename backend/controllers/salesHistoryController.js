const Visit = require('../models/Visit');
const Request = require('../models/Request');
const Product = require('../models/Product');

// @desc    Get Sales History (Completed Visits)
// @route   GET /api/seller/history
// @access  Private (Seller)
const getSalesHistory = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Fetch all completed visits for this seller
        const completedVisits = await Visit.find({
            shopId: sellerId,
            status: 'COMPLETED'
        })
            .populate({
                path: 'interestRequestId',
                populate: {
                    path: 'productId',
                    select: 'name price images'
                }
            })
            .populate('customerId', 'name')
            .sort({ updatedAt: -1 }); // Most recent first

        // Group by date
        const groupedHistory = {};

        completedVisits.forEach(visit => {
            const completedDate = new Date(visit.updatedAt);
            const dateKey = completedDate.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!groupedHistory[dateKey]) {
                groupedHistory[dateKey] = {
                    date: dateKey,
                    displayDate: formatDateLabel(completedDate),
                    items: []
                };
            }

            // Extract product info from the request
            const request = visit.interestRequestId;
            if (request && request.productId) {
                const product = request.productId;
                groupedHistory[dateKey].items.push({
                    visitId: visit._id,
                    productName: product.name,
                    quantity: request.quantity || 1,
                    price: product.price * (request.quantity || 1),
                    time: completedDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    customerName: visit.customerId?.name || 'Customer',
                    paymentMode: visit.paymentMode || 'Cash'
                });
            }
        });

        // Convert to array and sort by date (most recent first)
        const historyArray = Object.values(groupedHistory).sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        res.json(historyArray);
    } catch (error) {
        console.error('Sales History Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Helper function to format date labels
const formatDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    // Format as "25 Jan 2026"
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

module.exports = {
    getSalesHistory
};
