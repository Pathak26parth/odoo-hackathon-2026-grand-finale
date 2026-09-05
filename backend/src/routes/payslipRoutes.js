const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', requireAuth, (req, res, next) => payslipController.getPayslips(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => payslipController.getPayslipById(req, res, next));
router.get('/:id/pdf', requireAuth, (req, res, next) => payslipController.downloadPDF(req, res, next));
router.post('/:id/send', requireAuth, requirePermission(PERMISSIONS.PAYSLIPS_SEND), (req, res, next) => payslipController.sendEmail(req, res, next));

module.exports = router;
