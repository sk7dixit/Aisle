const mongoose = require('mongoose');

const auditTrailSchema = mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        actorEmail: {
            type: String,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        targetId: {
            type: String,
            default: null
        },
        targetType: {
            type: String,
            default: null
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            default: 'unknown'
        },
        deviceId: {
            type: String,
            default: 'unknown'
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false } // Only capture creation timestamp
    }
);

// Enforce Application-Level Immutability via Mongoose Hooks
auditTrailSchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('Audit trail records are immutable and cannot be updated.');
    }
});

auditTrailSchema.pre('validate', function () {
    if (!this.isNew) {
        throw new Error('Audit trail records are immutable and cannot be modified.');
    }
});

// Create model
const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

module.exports = AuditTrail;
