const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const {
  validateLogin,
  validateActivateAccount,
  validateChangePassword
} = require('../middleware/validationMiddleware');

// Public Authentication Endpoints
router.post('/login', authLimiter, validateLogin, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/activate-account', authLimiter, validateActivateAccount, (req, res, next) => authController.activateAccount(req, res, next));
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Protected User Endpoints
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.post('/logout', requireAuth, (req, res, next) => authController.logout(req, res, next));
router.post('/change-password', requireAuth, validateChangePassword, (req, res, next) => authController.changePassword(req, res, next));

module.exports = router;
