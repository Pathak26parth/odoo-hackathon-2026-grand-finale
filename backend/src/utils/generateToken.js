const crypto = require('crypto');

/**
 * Generate a random cryptographically secure token string (64-char hex)
 */
function generateCryptoToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compute SHA-256 hash of a crypto token for safe database persistence
 */
function hashCryptoToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateCryptoToken,
  hashCryptoToken
};
