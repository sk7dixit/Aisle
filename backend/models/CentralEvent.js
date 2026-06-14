const mongoose = require('mongoose');

const centralEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            index: true
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        senderNode: {
            type: String,
            required: true
        },
        timestamp: {
            type: Number,
            required: true,
            index: true
        },
        version: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

// TTL Index to automatically delete events older than 24 hours (86400 seconds)
centralEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const CentralEvent = mongoose.model('CentralEvent', centralEventSchema);

module.exports = CentralEvent;
