const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { validatePayrunCreation } = require('../middleware/validationMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// Wizard Step 1 & 2 Scope Check
router.post('/validate-scope', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_CREATE), (req, res, next) => payrunController.validateScope(req, res, next));

// Payrun Batch Operations
router.get('/', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_READ), (req, res, next) => payrunController.getPayruns(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_READ), (req, res, next) => payrunController.getPayrunById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_CREATE), validatePayrunCreation, (req, res, next) => payrunController.createPayrun(req, res, next));
router.post('/:id/compute', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_CREATE), (req, res, next) => payrunController.computePayrun(req, res, next));
router.post('/:id/validate', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_VALIDATE), (req, res, next) => payrunController.validatePayrun(req, res, next));
router.post('/:id/pay', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_PAY), (req, res, next) => payrunController.markPaid(req, res, next));
router.post('/:id/send-payslips', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_SEND), (req, res, next) => payrunController.sendPayslipsBulk(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.PAYRUNS_DELETE), (req, res, next) => payrunController.deletePayrun(req, res, next));

module.exports = router;
