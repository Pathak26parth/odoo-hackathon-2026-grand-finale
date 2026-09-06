const express = require('express');
const router = express.Router();
const payrollAdminController = require('../controllers/payrollAdminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission, requireRole } = require('../middleware/permissionMiddleware');
const { ROLES } = require('../constants/roles');
const { PERMISSIONS } = require('../constants/permissions');

// Allow ADMIN, HR_PAYROLL_ADMIN, or users with PAYRUNS_READ permissions
const requirePayrollAdminAccess = (req, res, next) => {
  const allowedRoles = [ROLES.ADMIN, ROLES.HR_PAYROLL_ADMIN, 'HR_PAYROLL_MANAGER'];
  if (allowedRoles.includes(req.user?.role) || req.user?.permissions?.includes(PERMISSIONS.PAYRUNS_READ)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access restricted: Requires Payroll Administrator or System Administrator privileges.'
  });
};

// 1. Overview metrics & pipeline
router.get('/overview', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.getOverview(req, res, next)
);

// 2. Automated Pre-payroll Compliance Audit
router.get('/compliance-check', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.getComplianceCheck(req, res, next)
);

// 3. Analytics & trends
router.get('/analytics', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.getAnalytics(req, res, next)
);

// 4. Interactive Rule Calculator & Simulator
router.post('/simulate', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.simulateSalary(req, res, next)
);

// 5. Payroll Audit Logs
router.get('/audit-logs', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.getAuditLogs(req, res, next)
);

// 6. Administrative Bulk Actions (Validate All, Pay All)
router.post('/bulk-action', requireAuth, requirePayrollAdminAccess, (req, res, next) => 
  payrollAdminController.executeBulkAction(req, res, next)
);

module.exports = router;
