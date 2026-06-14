const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const { logSecurityEvent } = require('../utils/securityLogger');

const createLimiter = (windowMs, max, reason, customMessage) => {
  return rateLimit({
    windowMs,
    max,
    skip: (req) => {
      const bypassKey = process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026';
      return req.headers['x-bypass-rate-limit'] === bypassKey || 
             process.env.NODE_ENV === 'test' || 
             process.env.NODE_ENV === 'development';
    },
    message: { message: customMessage || `Too many requests. Please try again later.` },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { singleCount: false },
    store: new RedisStore({
      sendCommand: async (...args) => {
        const { isRedisActive, getRedisClient } = require('../config/redis');
        if (isRedisActive()) {
          try {
            return await getRedisClient().call(...args);
          } catch (err) {
            console.error('[RateLimit-Redis] Command execution failed:', err.message);
          }
        }
        return 0; // Mock response to bypass rate limits gracefully when Redis is offline
      }
    }),
    handler: (req, res, next, options) => {
      logSecurityEvent(
        req.user ? req.user._id : null,
        req.body?.email || req.body?.identifier || 'unknown',
        'RATE_LIMIT_EXCEEDED',
        req,
        {
          reason: reason,
          route: req.originalUrl
        }
      ).catch(err => console.error('[RateLimit-Log] Failed to log security event:', err.message));
      res.status(options.statusCode).json(options.message);
    }
  });
};

const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  5,
  'Login limit exceeded',
  'Too many login attempts. Please try again after 15 minutes.'
);

const otpLimiter = createLimiter(
  10 * 60 * 1000, // 10 mins
  3,
  'OTP request limit exceeded',
  'Too many OTP requests. Please try again after 10 minutes.'
);

const registerLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Registration limit exceeded',
  'Too many registration attempts. Please try again after an hour.'
);

const adminLimiter = createLimiter(
  1 * 60 * 1000, // 1 min
  30,
  'Admin API limit exceeded',
  'Too many requests to admin endpoints. Rate limit exceeded.'
);

const generalLimiter = createLimiter(
  1 * 60 * 1000, // 1 min
  100,
  'General API limit exceeded',
  'Too many requests. Rate limit exceeded.'
);

module.exports = {
  loginLimiter,
  otpLimiter,
  registerLimiter,
  adminLimiter,
  generalLimiter
};
