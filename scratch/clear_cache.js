require('dotenv').config({ path: 'backend/.env' });
const searchCache = require('../backend/utils/searchCache');
const { getRedisClient } = require('../backend/config/redis');

async function run() {
    console.log("Clearing search cache...");
    await searchCache.clear();
    console.log("Search cache cleared successfully.");

    // Direct Redis flush to be extra sure
    try {
        const redis = getRedisClient();
        await redis.flushall();
        console.log("Redis cache flushed completely via flushall.");
    } catch (err) {
        console.warn("Redis flushall failed or not active:", err.message);
    }
    
    process.exit(0);
}

run();
