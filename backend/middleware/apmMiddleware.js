const { getRedisClient, isRedisActive } = require('../config/redis');
const { logSecurityEvent } = require('../utils/securityLogger');

const DDOS_RPS_THRESHOLD = parseInt(process.env.DDOS_THRESHOLD_RPS, 10) || 10000;
const EMERGENCY_MODE_DURATION_S = 900; // 15 minutes

const apmAndDdosMiddleware = async (req, res, next) => {
    const start = process.hrtime();
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';

    // Skip monitoring for health check route to avoid log spam
    if (req.originalUrl === '/health' || req.originalUrl === '/api/admin/security-dashboard') {
        return next();
    }

    if (!isRedisActive()) {
        return next();
    }

    try {
        const redis = getRedisClient();
        const currentSec = Math.floor(Date.now() / 1000);
        const rpsKey = `ddos:rps:${currentSec}`;
        
        // 1. Global RPS Tracking
        const rps = await redis.incr(rpsKey);
        if (rps === 1) {
            await redis.expire(rpsKey, 5);
        }

        // 2. Check DDoS threshold breach
        if (rps >= DDOS_RPS_THRESHOLD) {
            const isEmergencyActive = await redis.get('ddos:emergency_mode');
            if (!isEmergencyActive) {
                await redis.set('ddos:emergency_mode', 'true', 'EX', EMERGENCY_MODE_DURATION_S);
                
                // Trigger critical alert asynchronously
                logSecurityEvent(null, 'ddos-monitor', 'DDOS_ATTACK', req, {
                    reason: `DDoS attack detected: RPS spiked to ${rps} (threshold: ${DDOS_RPS_THRESHOLD})`,
                    rps,
                    ipAddress
                }).catch(err => console.error('DDoS alert fail:', err));
            }
        }

        // 3. DDoS Emergency Protection Mode Rate-Limiter
        const isEmergencyMode = await redis.get('ddos:emergency_mode');
        if (isEmergencyMode) {
            // Exceptions: Whitelisted Admin/System roles or local requests
            const isAdminPath = req.originalUrl.startsWith('/api/admin');
            const isWhitelisted = ipAddress === '127.0.0.1' || ipAddress === '::1';
            
            if (!isAdminPath && !isWhitelisted) {
                // Rate limit: 1 request per second per IP during DDoS attack
                const ipSecKey = `ddos:block:${ipAddress}:${currentSec}`;
                const ipHits = await redis.incr(ipSecKey);
                if (ipHits === 1) {
                    await redis.expire(ipSecKey, 2);
                }

                if (ipHits > 1) {
                    res.setHeader('Retry-After', '5');
                    return res.status(429).json({
                        message: 'Emergency shield active. High traffic detected. Requests are heavily throttled. Try again shortly.'
                    });
                }
            }
        }
    } catch (err) {
        console.error('[APM-DDoS] Redis tracking error:', err.message);
    }

    // 4. Measure Response Latency (APM)
    res.on('finish', async () => {
        const diff = process.hrtime(start);
        const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        const cleanUrl = req.baseUrl + req.path;

        try {
            const redis = getRedisClient();
            
            // Record raw log in Redis list (capped at 500)
            const metric = {
                url: cleanUrl,
                method: req.method,
                latency: durationMs,
                status: res.statusCode,
                timestamp: new Date().toISOString()
            };
            
            await redis.lpush('apm:latency_log', JSON.stringify(metric));
            await redis.ltrim('apm:latency_log', 0, 499);

            // Record cumulative stats for daily average
            const statsKey = `apm:stats:${req.method}:${cleanUrl}`;
            await redis.hincrby(statsKey, 'count', 1);
            await redis.hincrby(statsKey, 'total_time', durationMs);
            await redis.expire(statsKey, 86400); // 1 day TTL

            // Record slow endpoints (> 1 second) in sorted set
            if (durationMs > 1000) {
                const identifier = `${req.method} ${cleanUrl}`;
                await redis.zadd('apm:slow_endpoints', durationMs, `${identifier} at ${new Date().toISOString()}`);
                await redis.zremrangebyrank('apm:slow_endpoints', 0, -21); // keep top 20
            }

            // Track total API Error Rate
            if (res.statusCode >= 400) {
                const today = new Date().toISOString().split('T')[0];
                await redis.hincrby(`apm:errors:${today}`, `${res.statusCode}`, 1);
                await redis.expire(`apm:errors:${today}`, 86400 * 7); // keep for 7 days
            }

        } catch (err) {
            // Quiet fail to avoid impacting response
        }
    });

    next();
};

module.exports = apmAndDdosMiddleware;
