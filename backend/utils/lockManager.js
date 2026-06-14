const { getRedisClient, isRedisActive } = require('../config/redis');
const Redlock = require('redlock').default || require('redlock');

let redlockInstance;

const getRedlock = () => {
    if (!redlockInstance) {
        const client = getRedisClient();
        redlockInstance = new Redlock([client], {
            // The expected clock drift; for more details see http://redis.io/topics/distlock
            driftFactor: 0.01, // time in ms = driftFactor * ttl + drift
            // The max number of times Redlock will attempt to lock a resource before failing
            retryCount: 10,
            // The time in ms between attempts
            retryDelay: 200,
            // The max time in ms randomly added to retries to improve performance under high contention
            retryJitter: 200,
            // The minimum remaining time on a lock before an extension is automatically requested (if used)
            automaticExtensionThreshold: 500
        });

        redlockInstance.on('clientError', (err) => {
            console.error('[Redlock] Redis client connection error:', err.message);
        });
    }
    return redlockInstance;
};

/**
 * Acquires a distributed lock on a given resource
 * @param {string} resource - Unique resource identifier (e.g. 'lock:stock:123')
 * @param {number} ttl - Time-to-live in milliseconds
 * @returns {Promise<Object>} - The Redlock Lock instance (with .release() method)
 */
const acquireLock = async (resource, ttl = 5000) => {
    if (!isRedisActive()) {
        console.warn(`[LockManager] Redis is inactive. Bypassing lock for resource: ${resource}`);
        return {
            release: async () => {
                console.log(`[LockManager] Released dummy lock for resource: ${resource}`);
            }
        };
    }
    try {
        const lock = await getRedlock().acquire([resource], ttl);
        console.log(`[LockManager] Acquired lock on resource: ${resource}`);
        return lock;
    } catch (err) {
        console.error(`[LockManager] Failed to acquire lock on resource: ${resource}`, err.message);
        throw new Error(`Lock acquisition failed for ${resource}: ${err.message}`);
    }
};

module.exports = { acquireLock };
