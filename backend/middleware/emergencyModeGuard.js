const { getRedisClient, isRedisActive } = require('../config/redis');

const emergencyModeGuard = async (req, res, next) => {
    // 1. Check Redis emergency mode key
    if (isRedisActive()) {
        try {
            const redis = getRedisClient();
            if (redis) {
                const emergencyMode = await redis.get('aisle:emergency_mode');
                if (emergencyMode === 'true') {
                    // Restrict non-administrative routes
                    const isAdminRoute = req.path.startsWith('/api/admin');
                    const isAuthRoute = req.path.startsWith('/api/auth');

                    if (!isAdminRoute && !isAuthRoute) {
                        return res.status(503).json({
                            code: 'EMERGENCY_SHUTDOWN',
                            message: 'The cluster is currently in Emergency Maintenance Mode. All non-administrative operations are suspended.'
                        });
                    }
                }
            }
        } catch (err) {
            console.error('[EmergencyGuard] Redis check failed:', err.message);
        }
    }

    if (!isRedisActive() && req.method !== 'GET') {
        return res.status(503).json({
            code: 'EMERGENCY_READ_ONLY',
            message: 'The system is currently operating in Read-Only Emergency Mode due to temporary database maintenance. New logins, registrations, and modifications are temporarily disabled.'
        });
    }
    next();
};

module.exports = emergencyModeGuard;
