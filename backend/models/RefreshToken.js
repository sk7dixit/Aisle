const mongoose = require('mongoose');

const refreshTokenSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        deviceId: {
            type: String,
            required: true,
        },
        deviceName: {
            type: String,
            default: 'Unknown Device',
        },
        browser: {
            type: String,
            default: 'Unknown Browser',
        },
        ipAddress: {
            type: String,
            required: true,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to automatically remove expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
