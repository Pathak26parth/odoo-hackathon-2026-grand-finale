const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission, requireSelfOrAdmin } = require('../middleware/permissionMiddleware');
const { validateCreateEmployee } = require('../middleware/validationMiddleware');
const { sendError } = require('../utils/response');
const { PERMISSIONS } = require('../constants/permissions');

// Self-Service Employee Route
router.get('/me', requireAuth, (req, res, next) => employeeController.getMeEmployee(req, res, next));

// Employee Master CRUD
router.get('/', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_READ), (req, res, next) => employeeController.getAllEmployees(req, res, next));
router.get('/:id', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_CREATE), validateCreateEmployee, (req, res, next) => employeeController.createEmployee(req, res, next));
router.put('/:id', requireAuth, (req, res, next) => {
  if (
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR_MANAGER' ||
    req.user.role === 'HR_PAYROLL_ADMIN' ||
    req.user.permissions?.includes(PERMISSIONS.EMPLOYEES_UPDATE) ||
    (req.user.employeeId && (String(req.user.employeeId) === String(req.params.id) || req.user.employeeCode === req.params.id))
  ) {
    return employeeController.updateEmployee(req, res, next);
  }
  return sendError(res, 'Forbidden: You do not have permission to update this employee.', 403);
});
router.delete('/:id', requireAuth, (req, res, next) => {
  if (
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR_MANAGER' ||
    req.user.role === 'HR_PAYROLL_ADMIN' ||
    req.user.permissions?.includes(PERMISSIONS.EMPLOYEES_DELETE)
  ) {
    return employeeController.deleteEmployee(req, res, next);
  }
  return sendError(res, 'Forbidden: You do not have permission to delete this employee.', 403);
});

// Smart Button Related Record Sub-Resources
router.get('/:id/contracts', requireAuth, requirePermission(PERMISSIONS.CONTRACTS_READ), (req, res, next) => employeeController.getEmployeeContracts(req, res, next));
router.get('/:id/attendance', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeAttendance(req, res, next));
router.get('/:id/time-off', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeTimeOff(req, res, next));
router.get('/:id/payslips', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeePayslips(req, res, next));

module.exports = router;
