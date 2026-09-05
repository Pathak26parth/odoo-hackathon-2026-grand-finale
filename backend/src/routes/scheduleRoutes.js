const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', requireAuth, requirePermission(PERMISSIONS.SCHEDULES_READ), (req, res, next) => scheduleController.getSchedules(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.SCHEDULES_READ), (req, res, next) => scheduleController.getScheduleById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.SCHEDULES_CREATE), (req, res, next) => scheduleController.createSchedule(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.SCHEDULES_UPDATE), (req, res, next) => scheduleController.updateSchedule(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.SCHEDULES_DELETE), (req, res, next) => scheduleController.deleteSchedule(req, res, next));

module.exports = router;
