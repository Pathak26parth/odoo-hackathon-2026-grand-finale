const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generate short-lived Access Token (15 min)
 * Payload contains only minimal authorization identity: userId, role, roleId, employeeId
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION,
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Generate long-lived Refresh Token (7 days)
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION,
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'peoplepay360-api',
    audience: 'peoplepay360-client'
  });
}

/**
 * Hash token using SHA-256 for secure database storage
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
