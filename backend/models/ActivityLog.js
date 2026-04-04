const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // System actions might not have a user
        },
        actorName: { type: String }, // Cache for display resilience
        actorType: { type: String }, // e.g. 'Admin', 'User', 'System'

        action: {
            type: String,
            required: true
        },

        target: {
            type: mongoose.Schema.Types.Mixed // ID or Object
        },
        targetType: {
            type: String // 'User', 'Report', 'Settings'
        },
        targetName: {
            type: String // Cache name
        },

        description: {
            type: String
        },

        severity: {
            type: String,
            enum: ['Info', 'Warning', 'Critical'],
            default: 'Info'
        },

        ip: {
            type: String
        },

        metadata: {
            type: Object // Flexible JSON for previous values, reason codes, etc.
        }
    },
    {
        timestamps: true
    }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
