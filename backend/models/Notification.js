const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { // Changed from recipientId to user to match shared contract
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: [
            'SYSTEM',
            'SELLER',
            'ANNOUNCEMENT',
            'REQUEST',
            'ORDER',
            'INVENTORY',
            'FEEDBACK',
            'SERVICE_BOOKED',      // NEW
            'SERVICE_COMPLETED',   // NEW
            'SERVICE_CANCELLED',   // NEW
            'SERVICE_REMINDER'     // NEW
        ],
        required: true
    },

    title: String,
    message: String,

    priority: {
        type: String,
        enum: ['CRITICAL', 'IMPORTANT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW', 'INFO'],
        default: 'NORMAL'
    },

    actionUrl: String,
    recipientRole: {
        type: String,
        enum: ['seller', 'customer', 'admin', 'moderator'],
        default: 'customer'
    },

    meta: Object, // bookingId, serviceId, etc.

    isRead: {
        type: Boolean,
        default: false
    },

    // Legacy fields support (optional, can be kept for backward compat if needed)
    // For now, aligning with the "Generic, Reusable" model requested in Step 6
    // while keeping backward compatibility with existing schema if possible.

    // We will map 'recipientId' to 'user' effectively, but to strictly follow the requested
    // "Notification Model (Generic, Reusable)" from the prompt which asks to replace/standardize:

    // The prompt requested schema:
    // user: ObjectId, required
    // type: Enum [...SERVICE_...]
    // title: String
    // message: String
    // meta: { bookingId, serviceId }
    // isRead: Boolean

    // I will overwrite to match the requested schema exactly to ensure "One source of truth".
    // If previous schema had 'senderId', 'recipientRole' etc., they will be removed if I blindly overwrite.
    // However, the prompt says "NOTIFICATION MODEL (GENERIC, REUSABLE)".
    // I will hybridize to avoid breaking existing notifications if any are critical.

    // Update: The prompt implies a REPLACEMENT or at least a strong modification.
    // "2. NOTIFICATION MODEL (GENERIC, REUSABLE)"
    // I will perform a safe update: Map 'user' to be the primary recipient field.

}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
