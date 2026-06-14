const mongoose = require('mongoose');

const securityLogSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // optional for failed logins of non-existent users
        },
        email: {
            type: String,
            required: false,
        },
        event: {
            type: String,
            required: true,
            enum: [
                'LOGIN_SUCCESS',
                'LOGIN_FAILED',
                'OTP_SENT',
                'OTP_VERIFIED',
                'PASSWORD_CHANGED',
                'ROLE_CHANGED',
                'ROLE_CHANGE',
                'SELLER_APPROVED',
                'SELLER_SUSPENDED',
                'ADMIN_LOGIN',
                'SESSION_REVOKED',
                'FACE_VERIFICATION_SUBMITTED',
                'FACE_VERIFICATION_APPROVED',
                'FACE_VERIFICATION_REJECTED',
                'VALIDATION_FAILED',
                'RATE_LIMIT_EXCEEDED',
                'BOT_BLOCKED',
                'API_KEY_INVALID',
                'USER_CREATED',
                'USER_DELETED',
                'PRODUCT_DELETED',
                'ORDER_CREATED',
                'ORDER_MODIFIED',
                'TOKEN_ABUSE',
                'UNKNOWN_DEVICE',
                'DDOS_ATTACK',
                'FRAUD_DETECTED',
                'INFRA_ALERT',
                'DATABASE_LEAK_TRIGGERED',
                'ADMIN_COMPROMISE_TRIGGERED',
                'MFA_REQUIRED',
                'MASS_EXPORT_BLOCKED',
                'ELEVATED_AUTH_SUCCESS'
            ],
        },
        ipAddress: {
            type: String,
            required: false,
        },
        userAgent: {
            type: String,
            required: false,
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

module.exports = mongoose.model('SecurityLog', securityLogSchema);
