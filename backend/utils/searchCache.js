const { getRedisClient, isRedisActive } = require('../config/redis');

class SearchCache {
    constructor(ttlSeconds = 300) { // Default 5 minutes
        this.ttl = ttlSeconds;
        this.localCache = new Map();
    }

    async get(key) {
        if (!isRedisActive()) {
            const entry = this.localCache.get(key);
            if (!entry) return null;
            if (Date.now() > entry.expiry) {
                this.localCache.delete(key);
                return null;
            }
            return entry.data;
        }

        try {
            const redis = getRedisClient();
            const data = await redis.get(`search:cache:${key}`);
            if (!data) return null;
            return JSON.parse(data);
        } catch (err) {
            console.error('[SearchCache] Redis get error:', err.message);
            return null;
        }
    }

    async set(key, data, customTtl) {
        const ttl = customTtl || this.ttl;
        if (!isRedisActive()) {
            this.localCache.set(key, {
                data,
                expiry: Date.now() + (ttl * 1000)
            });
            return;
        }

        try {
            const redis = getRedisClient();
            await redis.set(`search:cache:${key}`, JSON.stringify(data), 'EX', ttl);
        } catch (err) {
            console.error('[SearchCache] Redis set error:', err.message);
        }
    }

    async has(key) {
        const val = await this.get(key);
        return val !== null;
    }

    async clear() {
        this.localCache.clear();
        if (!isRedisActive()) return;

        try {
            const redis = getRedisClient();
            const keys = await redis.keys('search:cache:*');
            if (keys && keys.length > 0) {
                // Node ioredis expects separate parameters or array unpacked
                await redis.del(...keys);
            }
            console.log('[SearchCache] Cleared all Redis search cache entries.');
        } catch (err) {
            console.error('[SearchCache] Redis clear error:', err.message);
        }
    }
}

const cache = new SearchCache();
module.exports = cache;
