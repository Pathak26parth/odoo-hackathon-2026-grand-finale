const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// View contracts: authenticated users can access, controller scopes regular employees to their own contract
router.get('/', requireAuth, (req, res, next) => contractController.getContracts(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => contractController.getContractById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.CONTRACTS_CREATE), (req, res, next) => contractController.createContract(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.CONTRACTS_UPDATE), (req, res, next) => contractController.updateContract(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.CONTRACTS_DELETE), (req, res, next) => contractController.deleteContract(req, res, next));

module.exports = router;
