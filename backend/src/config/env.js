const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_NAME: process.env.DB_NAME || 'peoplepay360',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'peoplepay360_access_secret_key_2026_prod_ready_sec_token_v1',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'peoplepay360_refresh_secret_key_2026_prod_ready_sec_token_v1',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  EMAIL_VERIFICATION_EXPIRATION_HOURS: parseInt(process.env.EMAIL_VERIFICATION_EXPIRATION_HOURS, 10) || 24,
  PASSWORD_RESET_EXPIRATION_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRATION_HOURS, 10) || 1,

  // SMTP / Mailer
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'PeoplePay360 <no-reply@peoplepay360.com>',

  // Cloudinary Cloud Storage
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Python AI Face Service
  FACE_SERVICE_URL: process.env.FACE_SERVICE_URL || 'http://localhost:8000'
};

module.exports = env;

