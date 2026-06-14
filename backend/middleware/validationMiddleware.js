const Joi = require('joi');
const { logSecurityEvent } = require('../utils/securityLogger');

const validateBody = (schema) => {
  return async (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errorDetails = error.details.map(d => d.message).join(', ');
      const rawEmail = req.body?.email || req.body?.identifier || 'unknown';
      const emailStr = typeof rawEmail === 'string' ? rawEmail : JSON.stringify(rawEmail);
      await logSecurityEvent(
        null,
        emailStr,
        'VALIDATION_FAILED',
        req,
        { errors: errorDetails }
      );
      return res.status(400).json({ message: 'Validation failed', errors: error.details.map(d => d.message) });
    }
    // Replace body with validated & sanitized value to prevent unexpected parameters
    req.body = value;
    next();
  };
};

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().trim().optional(),
  identifier: Joi.string().trim().optional(),
  password: Joi.string().required(),
  deviceId: Joi.string().trim().optional()
}).or('email', 'phone', 'identifier');

const sendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().trim().required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().required(),
  role: Joi.string().valid('customer', 'seller').required(),
  otp: Joi.string().trim().optional(),
  deviceId: Joi.string().trim().optional(),
  shopDetails: Joi.object({
    shopName: Joi.string().trim().optional(),
    shopAddress: Joi.string().trim().optional(),
    shopType: Joi.string().trim().optional(),
    businessLicense: Joi.string().trim().optional()
  }).optional()
});

module.exports = {
  validateBody,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema
};
