const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const secrets = [
                process.env.JWT_SECRET_CURRENT,
                process.env.JWT_SECRET_PREVIOUS,
                process.env.JWT_SECRET || 'fallback_secret_for_dev_only_do_not_use_in_prod'
            ].filter(Boolean);

            let decoded;
            let verifyError;

            for (const sec of secrets) {
                try {
                    decoded = jwt.verify(token, sec);
                    break;
                } catch (err) {
                    verifyError = err;
                }
            }

            if (!decoded) {
                throw verifyError || new Error('Token verification failed');
            }

            // SECURITY: Block Partial/Temp Tokens from accessing protected routes
            if (decoded.scope === 'face_verify') {
                return res.status(403).json({ message: 'Partial token used. Complete face verification first.' });
            }
            if (decoded.scope === 'mfa_verify') {
                return res.status(403).json({ message: 'Partial token used. Complete Multi-Factor Authentication first.' });
            }

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log(`[AUTH] User not found for ID: ${decoded.id}`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Zero Trust: Check if account status is suspended or blocked
            if (req.user.accountStatus === 'suspended' || req.user.accountStatus === 'blocked') {
                console.log(`[AUTH] Rejected access: Account is ${req.user.accountStatus} for User ID: ${req.user._id}`);
                return res.status(401).json({ message: `Access denied. Your account is currently ${req.user.accountStatus}.` });
            }

            // Zero Trust: Continuous Session Check (confirm user has at least one active session)
            const { getRedisClient, isRedisActive } = require('../config/redis');
            const redis = getRedisClient();
            if (isRedisActive()) {
                try {
                    const sessionKeys = await redis.keys(`session:${req.user._id}:*`);
                    if (sessionKeys.length === 0) {
                        // Fallback to MongoDB check
                        const RefreshToken = require('../models/RefreshToken');
                        const dbSessionsCount = await RefreshToken.countDocuments({ userId: req.user._id });
                        if (dbSessionsCount === 0) {
                            console.log(`[AUTH] Rejected access: All sessions revoked for User ID: ${req.user._id}`);
                            return res.status(401).json({ message: 'Session expired or revoked. Please log in again.' });
                        }
                    }
                } catch (redisErr) {
                    console.error('[AUTH-REDIS] Session check failure:', redisErr.message);
                }
            } else {
                console.log(`[AUTH] Redis inactive. Skipping continuous session check (Emergency Mode) for User ID: ${req.user._id}`);
            }

            console.log(`[AUTH] User authenticated: ${req.user._id}`);
            next();
            return; // Explicit return to prevent fall-through
        } catch (error) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`
            });
        }
        next();
    };
};

// PAM: Enforce temporary elevated session verification for high-risk actions
const requireElevatedPrivilege = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, login required' });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    const { getRedisClient } = require('../config/redis');
    const redis = getRedisClient();
    const userId = req.user._id;
    const deviceId = req.headers['x-device-id'] || (req.body && req.body.deviceId) || req.query.deviceId;

    if (!deviceId) {
        return res.status(400).json({
            code: 'DEVICE_ID_REQUIRED',
            message: 'Device Identification (X-Device-Id header or deviceId body parameter) is required for elevated privilege authorization.'
        });
    }

    try {
        const mfaVerified = await redis.get(`mfa_verified:${userId}:${deviceId}`);
        if (mfaVerified === 'true') {
            return next();
        }

        // Check if user has MFA enabled
        if (!req.user.mfaEnabled) {
            return res.status(403).json({
                code: 'MFA_SETUP_REQUIRED',
                message: 'Elevated actions require Multi-Factor Authentication. Please set up and enable MFA on your account first.'
            });
        }

        // Require verification challenge
        return res.status(403).json({
            code: 'ELEVATED_MFA_REQUIRED',
            message: 'Verification Required: Please submit your current Authenticator OTP code to perform this high-privilege action.'
        });
    } catch (err) {
        console.error('[AUTH-PAM] Elevated check failed:', err.message);
        return res.status(500).json({ message: 'Security check failure' });
    }
};

const admin = authorize('admin');
const adminOnly = authorize('super_admin', 'admin');

module.exports = { protect, authorize, admin, adminOnly, requireElevatedPrivilege };
