const { sendError } = require('../utils/response');

/**
 * 404 Route Not Found Handler
 */
function notFoundHandler(req, res, next) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Centralized Application Error Handler
 */
function errorMiddleware(err, req, res, next) {
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}

module.exports = {
  notFoundHandler,
  errorMiddleware
};
