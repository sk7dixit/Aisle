const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { getRedisClient } = require('../config/redis');
const { logSecurityEvent } = require('../utils/securityLogger');
const { sendSecurityAlert } = require('../utils/alertDispatcher');

/**
 * Triggers an automated incident response playbook.
 * @route   POST /api/admin/incident-response/trigger
 * @access  Private/SuperAdmin
 */
const triggerIncidentResponsePlaybook = async (req, res) => {
    const { playbook, targetAdminId } = req.body;
    const adminUser = req.user; // Set by auth protect middleware

    if (!playbook) {
        return res.status(400).json({ message: 'Playbook parameter required' });
    }

    try {
        const redis = getRedisClient();

        if (playbook === 'DATABASE_LEAK') {
            // Playbook: Database Leak Mitigation
            // 1. Log event
            await logSecurityEvent(adminUser._id, adminUser.email, 'DATABASE_LEAK_TRIGGERED', req, {
                triggeredBy: adminUser.email
            });

            // 2. Terminate all active sessions globally (Redis + DB)
            const keys = await redis.keys('session:*');
            for (const key of keys) {
                await redis.del(key);
            }
            const refreshKeys = await redis.keys('refresh:*');
            for (const rk of refreshKeys) {
                await redis.del(rk);
            }
            const roles = ['customer', 'seller', 'admin', 'super_admin', 'moderator'];
            for (const r of roles) {
                await redis.del(`online:${r}`);
            }

            // Broadcast Security Alert globally to evict all users and disconnect all sockets
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('SECURITY_ALERT', { userId: 'all', reason: 'Global database leak playbook triggered' });
            await RefreshToken.deleteMany({}); // Delete all DB sessions

            // 3. Mark all users as requiring password reset
            await User.updateMany({}, {
                $set: {
                    failedAttempts: 0,
                    lockUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // Lock out until reset
                }
            });

            await sendSecurityAlert({
                title: 'Playbook Triggered: DATABASE_LEAK',
                message: `Mitigation completed: All global user sessions terminated. All accounts locked for security. Key rotation required.`,
                risk: 'critical',
                event: 'DATABASE_LEAK_TRIGGERED',
                details: { operator: adminUser.email }
            });

            return res.json({
                message: 'DATABASE_LEAK playbook executed successfully. All active sessions terminated. All accounts locked pending verification/reset.'
            });
        }

        if (playbook === 'DDOS_ATTACK') {
            // Playbook: Manual DDoS Shield Activation
            await redis.set('ddos:emergency_mode', 'true', 'EX', 900); // 15 minutes

            await logSecurityEvent(adminUser._id, adminUser.email, 'DDOS_ATTACK', req, {
                reason: 'Manual emergency shield activation by administrator',
                triggeredBy: adminUser.email
            });

            await sendSecurityAlert({
                title: 'Playbook Triggered: DDOS_SHIELD',
                message: `DDoS Emergency Protection Mode manually activated for 15 minutes.`,
                risk: 'high',
                event: 'DDOS_ATTACK',
                details: { operator: adminUser.email }
            });

            return res.json({
                message: 'DDOS_ATTACK playbook executed successfully. DDoS Emergency Shield is active for 15 minutes.'
            });
        }

        if (playbook === 'ADMIN_COMPROMISE') {
            if (!targetAdminId) {
                return res.status(400).json({ message: 'Target compromised Admin ID required' });
            }

            const compromisedUser = await User.findById(targetAdminId);
            if (!compromisedUser) {
                return res.status(404).json({ message: 'Compromised admin user not found' });
            }

            if (!['admin', 'super_admin', 'moderator'].includes(compromisedUser.role)) {
                return res.status(400).json({ message: 'Target user is not an administrator' });
            }

            // 1. Suspend the compromised admin account
            compromisedUser.accountStatus = 'suspended';
            await compromisedUser.save();

            // 2. Invalidate all sessions for the compromised admin
            // Broadcast Security Alert globally to evict this admin and disconnect their sockets
            const { publishEvent } = require('../utils/eventBus');
            await publishEvent('SECURITY_ALERT', { userId: compromisedUser._id.toString(), reason: 'Admin credentials compromised' });
            await RefreshToken.deleteMany({ userId: compromisedUser._id });

            // 3. Log event
            await logSecurityEvent(adminUser._id, adminUser.email, 'ADMIN_COMPROMISE_TRIGGERED', req, {
                compromisedAdminEmail: compromisedUser.email,
                compromisedAdminId: compromisedUser._id,
                triggeredBy: adminUser.email
            });

            await sendSecurityAlert({
                title: 'Playbook Triggered: ADMIN_COMPROMISE',
                message: `Administrative credentials contained: Suspended admin account ${compromisedUser.email} and revoked all their sessions.`,
                risk: 'critical',
                event: 'ADMIN_COMPROMISE_TRIGGERED',
                details: { target: compromisedUser.email, operator: adminUser.email }
            });

            return res.json({
                message: `ADMIN_COMPROMISE playbook executed successfully. Suspended admin account ${compromisedUser.email} and invalidated all active sessions.`
            });
        }

        return res.status(400).json({ message: `Unknown playbook: ${playbook}` });

    } catch (error) {
        console.error('[IncidentController] Error triggering playbook:', error.message);
        res.status(500).json({ message: 'Incident response trigger failed', error: error.message });
    }
};

module.exports = {
    triggerIncidentResponsePlaybook
};
