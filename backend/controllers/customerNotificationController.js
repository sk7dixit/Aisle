const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/customer/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        res.json({
            notifications,
            unreadCount,
            page,
            totalPages: Math.ceil((await Notification.countDocuments({ user: userId })) / limit)
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/customer/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Ensure user owns this notification
        if (notification.user.toString() !== req.user.id) {
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

// @desc    Mark ALL notifications as read
// @route   PUT /api/customer/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Internal Utility to create notification (to be imported by other controllers)
const createNotification = async ({ user, recipientRole = 'customer', senderId = null, senderRole = 'system', type, title, message, actionUrl, priority = 'LOW' }) => {
    try {
        const notification = await Notification.create({
            user,
            recipientRole,
            senderId,
            senderRole,
            type,
            title,
            message,
            actionUrl,
            priority
        });
        return notification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification // Exporting utility for internal use
};
