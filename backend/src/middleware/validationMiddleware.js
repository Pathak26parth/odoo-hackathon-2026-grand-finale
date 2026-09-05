const { sendValidation } = require('../utils/response');

/**
 * Validation Middleware Helpers
 */

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return sendValidation(res, 'Login validation failed', errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateActivateAccount(req, res, next) {
  const { token, email, newPassword } = req.body;
  const errors = [];

  if (!token) errors.push('Activation token is required.');
  if (!email) errors.push('Email is required.');
  if (!newPassword || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  if (errors.length > 0) {
    return sendValidation(res, 'Account activation validation failed', errors);
  }

  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push('Current password is required.');
  if (!newPassword || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  if (errors.length > 0) {
    return sendValidation(res, 'Password change validation failed', errors);
  }

  next();
}

function validateCreateEmployee(req, res, next) {
  const { firstName, lastName, email } = req.body;
  const errors = [];

  if (!firstName || !firstName.trim()) errors.push('First name is required.');
  if (!lastName || !lastName.trim()) errors.push('Last name is required.');
  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) errors.push('Valid email format is required.');
  }

  if (errors.length > 0) {
    return sendValidation(res, 'Employee validation failed', errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateAttendanceCorrection(req, res, next) {
  const { checkIn, reason } = req.body;
  const errors = [];

  if (!checkIn) errors.push('Corrected check-in timestamp is required.');
  if (!reason || !reason.trim()) errors.push('Correction reason is mandatory for audit compliance.');

  if (errors.length > 0) {
    return sendValidation(res, 'Attendance correction validation failed', errors);
  }

  next();
}

function validateTimeOffRequest(req, res, next) {
  const { timeOffTypeId, startDate, endDate, totalDays } = req.body;
  const errors = [];

  if (!timeOffTypeId) errors.push('Time off type is required.');
  if (!startDate) errors.push('Start date is required.');
  if (!endDate) errors.push('End date is required.');
  if (!totalDays || parseFloat(totalDays) <= 0) errors.push('Total days must be greater than 0.');

  if (errors.length > 0) {
    return sendValidation(res, 'Time off request validation failed', errors);
  }

  next();
}

function validatePayrunCreation(req, res, next) {
  const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Payrun name is required.');
  if (!salaryStructureId) errors.push('Salary structure ID is required.');
  if (!periodStart) errors.push('Period start date is required.');
  if (!periodEnd) errors.push('Period end date is required.');
  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    errors.push('At least one eligible employee must be selected for the payrun.');
  }

  if (errors.length > 0) {
    return sendValidation(res, 'Payrun creation validation failed', errors);
  }

  next();
}

module.exports = {
  validateLogin,
  validateActivateAccount,
  validateChangePassword,
  validateCreateEmployee,
  validateAttendanceCorrection,
  validateTimeOffRequest,
  validatePayrunCreation
};
