const { logSecurityEvent } = require('../utils/securityLogger');

const apiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026';

  if (!apiKey || apiKey !== expectedKey) {
    await logSecurityEvent(
      null,
      'internal-service-client',
      'API_KEY_INVALID',
      req,
      {
        receivedKey: apiKey ? '[PROVIDED]' : '[NONE]',
        url: req.originalUrl
      }
    );
    return res.status(401).json({ message: 'Invalid or missing API Key.' });
  }

  next();
};

module.exports = apiKeyMiddleware;
