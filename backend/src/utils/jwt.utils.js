const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'peoplepay360_access_secret_key_default';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'peoplepay360_refresh_secret_key_default';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Generate Access Token (Short-lived)
 * @param {Object} payload - { userId, email, role, roleId, employeeId }
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Generate Refresh Token (Long-lived)
 * @param {Object} payload - { userId, email }
 * @returns {string}
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Verify Access Token
 * @param {string} token 
 * @returns {Object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Verify Refresh Token
 * @param {string} token 
 * @returns {Object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Hash token using SHA-256 for database storage
 * @param {string} token 
 * @returns {string}
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};
