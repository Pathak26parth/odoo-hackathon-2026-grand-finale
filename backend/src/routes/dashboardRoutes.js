const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');
const { sendError } = require('../utils/response');

router.get('/', requireAuth, (req, res, next) => {
  if (
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR_MANAGER' ||
    req.user.role === 'HR_PAYROLL_ADMIN' ||
    req.user.role === 'HR_PAYROLL_USER' ||
    req.user.permissions?.includes('dashboard.read') ||
    req.user.permissions?.includes('dashboard:view_hr') ||
    req.user.permissions?.includes('dashboard:view_payroll')
  ) {
    return dashboardController.getDashboardMetrics(req, res, next);
  }
  return sendError(res, 'Forbidden: You do not have permission to access the admin dashboard.', 403);
});

module.exports = router;
