/**
 * Standardized API Response Utilities
 * Enforces uniform response envelopes across all endpoints
 */

/**
 * Send standard success response (200 OK)
 */
function sendSuccess(res, message = 'Success', data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Send resource created response (201 Created)
 */
function sendCreated(res, message = 'Resource created successfully', data = {}) {
  return res.status(201).json({
    success: true,
    message,
    data
  });
}

/**
 * Send error response
 */
function sendError(res, message = 'An error occurred', statusCode = 500, errorDetails = null) {
  const response = {
    success: false,
    message
  };

  if (errorDetails && process.env.NODE_ENV === 'development') {
    response.error = errorDetails;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send validation error response (400 Bad Request / 422)
 */
function sendValidation(res, message = 'Validation failed', errors = []) {
  return res.status(400).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
}

/**
 * Mask sensitive bank account number (e.g. "1234567890" -> "XXXXXX7890")
 */
function maskAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return '';
  const clean = accountNumber.trim();
  if (clean.length <= 4) return 'XXXX';
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendValidation,
  maskAccountNumber
};
