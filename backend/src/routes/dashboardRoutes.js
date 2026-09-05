const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', requireAuth, requirePermission(PERMISSIONS.DASHBOARD_READ), (req, res, next) => dashboardController.getDashboardMetrics(req, res, next));

module.exports = router;
