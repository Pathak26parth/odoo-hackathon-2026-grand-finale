/**
 * Request Validation Helper Middleware
 * Validates request payload structures and formats before controllers execute
 */

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required and must be a non-empty string.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateRefreshToken(req, res, next) {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required.'
    });
  }

  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters.');
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validateCreateUser(req, res, next) {
  const { email, password, roleId } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Valid email format is required.');
    }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  if (!roleId || isNaN(parseInt(roleId, 10))) {
    errors.push('A valid numeric roleId is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.roleId = parseInt(roleId, 10);
  next();
}

module.exports = {
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  validateCreateUser
};
