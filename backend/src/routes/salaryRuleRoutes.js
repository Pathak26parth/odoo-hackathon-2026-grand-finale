const express = require('express');
const router = express.Router();
const salaryRuleController = require('../controllers/salaryRuleController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', requireAuth, requirePermission(PERMISSIONS.SALARY_RULES_READ), (req, res, next) => salaryRuleController.getRules(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_RULES_READ), (req, res, next) => salaryRuleController.getRuleById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.SALARY_RULES_CREATE), (req, res, next) => salaryRuleController.createRule(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_RULES_UPDATE), (req, res, next) => salaryRuleController.updateRule(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_RULES_DELETE), (req, res, next) => salaryRuleController.deleteRule(req, res, next));

module.exports = router;
