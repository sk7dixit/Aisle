const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const createServiceNotification = async ({
    userId,
    type,
    title,
    message,
    meta,
}) => {
    try {
        await Notification.create({
            user: userId,
            type,
            title,
            message,
            meta,
        });

        await Activity.create({
            user: userId,
            action: title,
            context: 'SERVICE',
            referenceId: meta?.bookingId,
        });
    } catch (error) {
        console.error("Error creating service notification:", error);
        // Fail silently to not block the main transaction
    }
};

module.exports = { createServiceNotification };
