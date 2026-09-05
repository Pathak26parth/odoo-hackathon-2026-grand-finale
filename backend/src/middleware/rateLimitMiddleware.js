const rateLimit = require('express-rate-limit');

/**
 * Auth Rate Limiter
 * Protects login, registration, and reset endpoints from brute-force attacks
 */
const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Generous in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  apiLimiter
};
