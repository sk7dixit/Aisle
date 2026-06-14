const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;

let redisClient;
let redisPubClient;
let redisSubClient;

const getRedisConfig = () => {
  if (process.env.REDIS_SENTINELS) {
    const sentinels = process.env.REDIS_SENTINELS.split(',').map(s => {
      const parts = s.trim().split(':');
      return { host: parts[0], port: parseInt(parts[1], 10) };
    });
    const config = {
      sentinels,
      name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        return Math.min(times * 100, 3000);
      }
    };
    if (REDIS_PASSWORD) {
      config.password = REDIS_PASSWORD;
      config.sentinelPassword = REDIS_PASSWORD;
    }
    return config;
  }

  const config = {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT, 10),
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      return Math.min(times * 100, 3000);
    }
  };
  if (REDIS_PASSWORD) {
    config.password = REDIS_PASSWORD;
  }
  return config;
};

try {
  const cfg = getRedisConfig();
  redisClient = new Redis(cfg);
  redisPubClient = new Redis(cfg);
  redisSubClient = new Redis(cfg);

  // Setup connection handlers
  redisClient.on('error', (err) => {
    console.error(`[Redis] Connection error (${err.message}). Operating in Read-Only Emergency Mode.`);
  });

  redisPubClient.on('error', (err) => {
    // Suppress crash from pub client when offline
  });

  redisSubClient.on('error', (err) => {
    // Suppress crash from sub client when offline
  });

  redisClient.on('connect', () => {
    console.log(`[Redis] Connected/Reconnected successfully`);
  });
} catch (error) {
  console.error(`[Redis] CRITICAL: Initialization failed: ${error.message}. Running in Read-Only Emergency Mode.`);
}

module.exports = {
  getRedisClient: () => redisClient,
  getPubClient: () => redisPubClient,
  getSubClient: () => redisSubClient,
  isRedisActive: () => {
    return redisClient && redisClient.status === 'ready';
  }
};
