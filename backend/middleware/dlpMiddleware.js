const { logSecurityEvent } = require('../utils/securityLogger');
const { sendSecurityAlert } = require('../utils/alertDispatcher');
const AuditTrail = require('../models/AuditTrail');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { getRedisClient } = require('../config/redis');

/**
 * DLP Middleware to intercept outgoing payloads and restrict large record datasets.
 * If data size exceeds the maximum threshold, it triggers automated account suspension.
 * @param {number} maxRecords Maximum allowed documents returned per single query.
 */
const dlpGuard = (maxRecords = 100) => {
    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = async function (data) {
            let recordCount = 0;

            if (Array.isArray(data)) {
                recordCount = data.length;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.users)) recordCount = data.users.length;
                else if (Array.isArray(data.sellers)) recordCount = data.sellers.length;
                else if (Array.isArray(data.products)) recordCount = data.products.length;
                else if (Array.isArray(data.logs)) recordCount = data.logs.length;
            }

            // Exceeds safety threshold and requested by a privileged actor (admin/moderator)
            // super_admin is excluded from auto-suspension to allow emergency admin exports, but will still be audited.
            if (recordCount > maxRecords && req.user && ['admin', 'moderator', 'super_admin'].includes(req.user.role)) {
                const userId = req.user._id;
                const email = req.user.email;
                const role = req.user.role;
                const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';

                const logDetails = {
                    reason: 'DLP policy breach: Mass dataset download/export attempt',
                    recordCount,
                    maxAllowed: maxRecords,
                    requestedUrl: req.originalUrl,
                    actorRole: role
                };

                // 1. Audit Trail Logging (Immutable)
                try {
                    await AuditTrail.create({
                        actorId: userId,
                        actorEmail: email,
                        action: 'MASS_EXPORT_BLOCKED',
                        targetId: userId.toString(),
                        targetType: 'User',
                        details: logDetails,
                        ipAddress,
                        userAgent: req.headers['user-agent'] || 'unknown',
                        deviceId: (req.body && req.body.deviceId) || req.query.deviceId || req.headers['x-device-id'] || 'unknown'
                    });
                } catch (auditErr) {
                    console.error('[DLP-AUDIT] Failed to create AuditTrail record:', auditErr.message);
                }

                // 2. Security Log Event Logging
                try {
                    await logSecurityEvent(userId, email, 'TOKEN_ABUSE', req, {
                        reason: 'Mass export limit breached',
                        recordCount,
                        maxAllowed: maxRecords
                    });
                } catch (secErr) {
                    console.error('[DLP-SEC] Failed to log security event:', secErr.message);
                }

                // 3. Dispatch SOC Notification
                try {
                    await sendSecurityAlert({
                        title: 'Data Loss Prevention (DLP) Block Triggered',
                        message: `Privileged account ${email} (${role}) triggered a DLP block trying to retrieve ${recordCount} records (max allowed: ${maxRecords}).`,
                        risk: 'critical',
                        event: 'MASS_EXPORT_BLOCKED',
                        details: logDetails
                    });
                } catch (alertErr) {
                    console.error('[DLP-ALERT] Alert dispatch failed:', alertErr.message);
                }

                // 4. Insider Threat Auto-Suspension & Session Revocation (only for standard admins & moderators)
                if (role !== 'super_admin') {
                    try {
                        // Suspend account status
                        await User.findByIdAndUpdate(userId, { accountStatus: 'suspended' });

                        // Evict active sessions in Redis
                        const redis = getRedisClient();
                        const keys = await redis.keys(`session:${userId}:*`);
                        for (const key of keys) {
                            const sessionData = await redis.get(key);
                            if (sessionData) {
                                try {
                                    const s = JSON.parse(sessionData);
                                    if (s.tokenHash) await redis.del(`session:${s.tokenHash}`);
                                } catch (e) {}
                            }
                            await redis.del(key);
                        }
                        const refreshKeys = await redis.keys(`refresh:${userId}:*`);
                        for (const rk of refreshKeys) {
                            await redis.del(rk);
                        }

                        // Broadcast Security Alert globally
                        const { publishEvent } = require('../utils/eventBus');
                        await publishEvent('SECURITY_ALERT', { userId: userId.toString(), reason: 'DLP Insider Threat Auto-Suspension' });

                        // Evict sessions in Mongo
                        await RefreshToken.deleteMany({ userId });

                        console.log(`[DLP] Account ${email} suspended, sessions terminated globally.`);
                    } catch (suspendErr) {
                        console.error('[DLP-CONTAINMENT] Failed to execute auto-suspension:', suspendErr.message);
                    }
                }

                // 5. Block request
                res.status(403);
                return originalJson.call(this, {
                    code: 'DLP_VIOLATION',
                    message: `Security Access Blocked: Enforced Data Loss Prevention (DLP) limits. This request requested ${recordCount} items, which violates the security threshold of ${maxRecords} maximum records. The event has been audited and the security response team notified.`
                });
            }

            return originalJson.call(this, data);
        };

        next();
    };
};

module.exports = { dlpGuard };
