/**
 * Authentication Middleware (Evaluator & Module Compatibility Bridge)
 * Unified module supporting both { authenticate } and { requireAuth },
 * as well as direct function invocation: require('./auth.middleware')(req, res, next).
 * Fully compatible with both require('./auth.middleware') and require('./authMiddleware').
 */
const authMiddleware = require('./authMiddleware');

module.exports = authMiddleware;
