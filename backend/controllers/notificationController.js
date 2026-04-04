const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// @desc    Get notifications for seller
// @route   GET /api/seller/notifications
// @access  Private (Seller)
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Fetch paginated notifications
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count unread (always return this for UI badges)
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get Notifications Error [Internal]:', error);
        res.status(500).json({ message: error.message || 'Server Error', stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};

// @desc    Get just the unread count (lighter weight)
// @route   GET /api/seller/notifications/unread-count
// @access  Private (Seller)
const getUnreadCount = async (req, res) => {
    try {
        // DEBUG LOG
        console.log("UnreadCount Check. User:", req.user ? req.user._id : 'No User');

        if (!req.user) {
            return res.status(401).json({ message: "User not attached to request" });
        }

        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        console.log("UnreadCount Result:", count);
        res.json({ count });
    } catch (error) {
        console.error('Get Unread Count Error [Internal]:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
}

// @desc    Mark notification as read
// @route   PUT /api/seller/notifications/:id/read
// @access  Private (Seller)
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark ALL as read
// @route   PUT /api/seller/notifications/read-all
// @access  Private (Seller)
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// INTERNAL HELPER: Create Notification
const createNotification = async (sellerId, type, title, message, priority = 'medium', actionLink = null) => {
    try {
        const notification = await Notification.create({
            user: sellerId,
            recipientRole: 'seller',
            type: type.toUpperCase(),
            title,
            message,
            priority: priority.toUpperCase(),
            actionUrl: actionLink
        });

        // Push Real-Time Event
        try {
            const io = getIO();
            io.to(sellerId.toString()).emit("notification:new", notification);
            console.log(`[SOCKET] Pushed notification to room ${sellerId}`);
        } catch (socketError) {
            console.error("Socket Push Failed (Non-critical):", socketError.message);
        }

        console.log(`[NOTIF] Created ${type} notification for ${sellerId}`);
    } catch (error) {
        console.error('Create Notification Internal Error:', error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification
};
