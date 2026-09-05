const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.get('/', requireAuth, requirePermission(PERMISSIONS.SALARY_STRUCTURES_READ), (req, res, next) => salaryStructureController.getStructures(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_STRUCTURES_READ), (req, res, next) => salaryStructureController.getStructureById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.SALARY_STRUCTURES_CREATE), (req, res, next) => salaryStructureController.createStructure(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_STRUCTURES_UPDATE), (req, res, next) => salaryStructureController.updateStructure(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.SALARY_STRUCTURES_DELETE), (req, res, next) => salaryStructureController.deleteStructure(req, res, next));

module.exports = router;
