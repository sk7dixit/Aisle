const mongoose = require('mongoose');

const failedNotificationSchema = new mongoose.Schema(
    {
        to: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        html: {
            type: String
        },
        attempts: {
            type: Number,
            default: 0
        },
        lastError: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'failed', 'retrying'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

const FailedNotification = mongoose.model('FailedNotification', failedNotificationSchema);

module.exports = FailedNotification;
