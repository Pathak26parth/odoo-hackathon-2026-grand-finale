const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { validateTimeOffRequest } = require('../middleware/validationMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// 1. Time Off Types
router.get('/types', requireAuth, (req, res, next) => timeOffController.getTypes(req, res, next));
router.post('/types', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_TYPES_MANAGE), (req, res, next) => timeOffController.createType(req, res, next));
router.put('/types/:id', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_TYPES_MANAGE), (req, res, next) => timeOffController.updateType(req, res, next));
router.delete('/types/:id', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_TYPES_MANAGE), (req, res, next) => timeOffController.deleteType(req, res, next));

// 2. Time Off Allocations
router.get('/allocations', requireAuth, (req, res, next) => timeOffController.getAllocations(req, res, next));
router.post('/allocations', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_ALLOCATIONS_MANAGE), (req, res, next) => timeOffController.createAllocation(req, res, next));

// 3. Time Off Requests
router.get('/requests', requireAuth, (req, res, next) => timeOffController.getRequests(req, res, next));
router.post('/requests', requireAuth, validateTimeOffRequest, (req, res, next) => timeOffController.createRequest(req, res, next));
router.post('/requests/:id/approve', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_APPROVE), (req, res, next) => timeOffController.approveRequest(req, res, next));
router.post('/requests/:id/refuse', requireAuth, requirePermission(PERMISSIONS.TIMEOFF_REFUSE), (req, res, next) => timeOffController.refuseRequest(req, res, next));

module.exports = router;
