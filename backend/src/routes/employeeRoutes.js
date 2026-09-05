const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission, requireSelfOrAdmin } = require('../middleware/permissionMiddleware');
const { validateCreateEmployee } = require('../middleware/validationMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// Self-Service Employee Route
router.get('/me', requireAuth, (req, res, next) => employeeController.getMeEmployee(req, res, next));

// Employee Master CRUD
router.get('/', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_READ), (req, res, next) => employeeController.getAllEmployees(req, res, next));
router.get('/:id', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_CREATE), validateCreateEmployee, (req, res, next) => employeeController.createEmployee(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_UPDATE), (req, res, next) => employeeController.updateEmployee(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.EMPLOYEES_DELETE), (req, res, next) => employeeController.deleteEmployee(req, res, next));

// Smart Button Related Record Sub-Resources
router.get('/:id/contracts', requireAuth, requirePermission(PERMISSIONS.CONTRACTS_READ), (req, res, next) => employeeController.getEmployeeContracts(req, res, next));
router.get('/:id/attendance', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeAttendance(req, res, next));
router.get('/:id/time-off', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeeTimeOff(req, res, next));
router.get('/:id/payslips', requireAuth, requireSelfOrAdmin(req => req.params.id), (req, res, next) => employeeController.getEmployeePayslips(req, res, next));

module.exports = router;
