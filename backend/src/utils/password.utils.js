const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password 
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against stored bcrypt hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
