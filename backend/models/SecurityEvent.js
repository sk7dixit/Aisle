const mongoose = require('mongoose');

const securityEventSchema = mongoose.Schema(
    {
        event: {
            type: String,
            required: true,
            index: true,
            enum: [
                'FAILED_LOGIN',
                'LOGIN_SUCCESS',
                'OTP_ABUSE',
                'ACCOUNT_LOCK',
                'TOKEN_ABUSE',
                'SUSPICIOUS_DEVICE',
                'UNKNOWN_DEVICE',
                'ADMIN_LOGIN',
                'ROLE_CHANGE',
                'RATE_LIMIT_EXCEEDED',
                'BOT_BLOCKED',
                'FRAUD_DETECTED',
                'DDOS_ATTACK',
                'INFRA_ALERT',
                'DATABASE_LEAK_TRIGGERED',
                'ADMIN_COMPROMISE_TRIGGERED',
                'SESSION_REVOKED',
                'MFA_REQUIRED',
                'MASS_EXPORT_BLOCKED',
                'ELEVATED_AUTH_SUCCESS'
            ],
        },
        user: {
            type: String,
            required: false,
            index: true,
        },
        ip: {
            type: String,
            required: false,
            index: true,
        },
        risk: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low',
            index: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index for fast window querying
securityEventSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
