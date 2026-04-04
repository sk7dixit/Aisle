const mongoose = require('mongoose');

const adminActionLogSchema = mongoose.Schema(
    {
        actionType: {
            type: String,
            required: true,
            index: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        targetType: {
            type: String,
            required: true
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'targetType', // Dynamic reference based on targetType
            required: true
        },
        previousState: {
            type: mongoose.Schema.Types.Mixed, // Can be string or object
            default: null
        },
        newState: {
            type: mongoose.Schema.Types.Mixed, // Can be string or object
            default: null
        },
        reason: {
            type: String,
            default: ''
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            default: '0.0.0.0'
        },
        severity: {
            type: String,
            enum: ['Info', 'Warning', 'Critical'],
            default: 'Info'
        }
    },
    {
        timestamps: true // Provides createdAt (timestamp) and updatedAt
    }
);

const AdminActionLog = mongoose.model('AdminActionLog', adminActionLogSchema);

module.exports = AdminActionLog;
