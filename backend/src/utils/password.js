const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');

const SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS || 12;

/**
 * Hash plain text password using bcrypt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with bcrypt hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password complexity:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
function validatePasswordComplexity(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }

  return { valid: true };
}

/**
 * Generate a cryptographically secure random temporary password
 */
function generateSecurePassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + numbers + symbols;

  let pwd = '';
  pwd += upper[crypto.randomInt(0, upper.length)];
  pwd += lower[crypto.randomInt(0, lower.length)];
  pwd += numbers[crypto.randomInt(0, numbers.length)];
  pwd += symbols[crypto.randomInt(0, symbols.length)];

  for (let i = 4; i < length; i++) {
    pwd += all[crypto.randomInt(0, all.length)];
  }

  // Shuffle
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordComplexity,
  generateSecurePassword
};
