const SecurityLog = require('../models/SecurityLog');
const SecurityEvent = require('../models/SecurityEvent');
const logger = require('../config/logger');
const { sendSecurityAlert } = require('./alertDispatcher');

// Maps events to appropriate security risk levels
const getRiskLevel = (event) => {
    switch (event) {
        case 'DDOS_ATTACK':
        case 'DATABASE_LEAK_TRIGGERED':
        case 'ADMIN_COMPROMISE_TRIGGERED':
            return 'critical';
        case 'BOT_BLOCKED':
        case 'OTP_ABUSE':
        case 'ROLE_CHANGE':
        case 'ROLE_CHANGED':
        case 'SELLER_SUSPENDED':
        case 'FRAUD_DETECTED':
            return 'high';
        case 'LOGIN_FAILED':
        case 'FAILED_LOGIN':
        case 'RATE_LIMIT_EXCEEDED':
        case 'ACCOUNT_LOCK':
        case 'TOKEN_ABUSE':
        case 'SUSPICIOUS_DEVICE':
        case 'UNKNOWN_DEVICE':
            return 'medium';
        default:
            return 'low';
    }
};

/**
 * Logs a security event to the database and Winston. Triggers brute-force alerts.
 * @param {string} userId - User ID (optional)
 * @param {string} email - Email (optional)
 * @param {string} event - The type of security event
 * @param {Object} req - Express request object to extract IP and user-agent (optional)
 * @param {Object} details - Additional event metadata (optional)
 */
const logSecurityEvent = async (userId, email, event, req, details = {}) => {
    try {
        let ipAddress = 'unknown';
        let userAgent = 'unknown';

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';
            if (typeof ipAddress === 'string') {
                ipAddress = ipAddress.split(',')[0].trim();
            }
            userAgent = req.headers['user-agent'] || 'unknown';
        }

        // Resolve location and country info
        try {
            const { getIpLocation } = require('./geoIp');
            const geoLoc = await getIpLocation(ipAddress);
            details.countryCode = geoLoc.countryCode || 'IN';
            details.country = geoLoc.country || 'India';
            details.city = geoLoc.city || 'Delhi';
        } catch (geoErr) {
            // ignore
        }

        const risk = getRiskLevel(event);
        const emailStr = (email && typeof email === 'string') ? email.toLowerCase().trim() : undefined;

        // Track rate limits in Redis
        if (event === 'RATE_LIMIT_EXCEEDED' || event === 'BOT_BLOCKED') {
            try {
                const { getRedisClient } = require('../config/redis');
                const redis = getRedisClient();
                const today = new Date().toISOString().split('T')[0];
                await redis.hincrby(`rate_limit:blocked:${today}`, ipAddress, 1);
                await redis.hincrby(`rate_limit:blocked_countries:${today}`, details.countryCode || 'unknown', 1);
                await redis.expire(`rate_limit:blocked:${today}`, 86400 * 30);
                await redis.expire(`rate_limit:blocked_countries:${today}`, 86400 * 30);
            } catch (redisErr) {
                // ignore
            }
        }

        // 1. Create entry in original SecurityLog collection
        let log;
        try {
            log = await SecurityLog.create({
                userId: userId || undefined,
                email: emailStr,
                event: event === 'FAILED_LOGIN' ? 'LOGIN_FAILED' : event,
                ipAddress,
                userAgent,
                details,
            });
        } catch (dbErr) {
            console.error('[SecurityLogger] Failed to write SecurityLog:', dbErr.message);
        }

        // 2. Create entry in new SecurityEvent collection
        let mappedEvent = event;
        if (event === 'LOGIN_FAILED') mappedEvent = 'FAILED_LOGIN';
        if (event === 'ROLE_CHANGE') mappedEvent = 'ROLE_CHANGE';

        try {
            await SecurityEvent.create({
                event: mappedEvent,
                user: emailStr || (userId ? userId.toString() : 'anonymous'),
                ip: ipAddress,
                risk,
                details,
            });
        } catch (dbErr) {
            console.error('[SecurityLogger] Failed to write SecurityEvent:', dbErr.message);
        }

        // 3. Log to Winston Centralized Security Log
        logger.security(`[${risk.toUpperCase()}] Security event registered: ${mappedEvent}`, {
            userId,
            email: emailStr,
            ipAddress,
            userAgent,
            risk,
            details
        });

        // 4. Brute force detector: Check for 100 failed logins in the past 5 minutes
        if (mappedEvent === 'FAILED_LOGIN') {
            try {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                const failedCount = await SecurityEvent.countDocuments({
                    event: 'FAILED_LOGIN',
                    createdAt: { $gte: fiveMinutesAgo }
                });

                if (failedCount >= 100) {
                    await sendSecurityAlert({
                        title: 'Potential Credential Stuffing / Brute-Force Attack',
                        message: `Detected ${failedCount} failed logins globally across the platform in the last 5 minutes.`,
                        risk: 'critical',
                        event: 'FAILED_LOGIN',
                        details: {
                            timeframe: '5m',
                            failedCount,
                            lastIp: ipAddress,
                            lastEmail: emailStr
                        }
                    });
                }
            } catch (err) {
                console.error('[SecurityLogger] Failed checking login velocity:', err.message);
            }
        }

        // 5. Send alerts immediately for critical risks or important warnings
        if (risk === 'critical') {
            await sendSecurityAlert({
                title: `Critical Incident - ${mappedEvent}`,
                message: `A critical security incident of type ${mappedEvent} was registered.`,
                risk: 'critical',
                event: mappedEvent,
                details: { userId, email: emailStr, ipAddress, details }
            });
        } else if (risk === 'high' && mappedEvent !== 'FRAUD_DETECTED') {
            // High risk events (excluding individual fraud triggers which are handled by the engine)
            await sendSecurityAlert({
                title: `High Risk Threat - ${mappedEvent}`,
                message: `A high risk security event was flagged on the server.`,
                risk: 'high',
                event: mappedEvent,
                details: { userId, email: emailStr, ipAddress, details }
            });
        }

        return log;
    } catch (error) {
        console.error('[SecurityLog] Error writing security log:', error.message);
    }
};

module.exports = { logSecurityEvent };
