const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission, requireRole } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// Roles & Permissions Metadata
router.get('/roles', requireAuth, requirePermission(PERMISSIONS.USERS_READ), (req, res, next) => userController.getRoles(req, res, next));
router.get('/permissions', requireAuth, requirePermission(PERMISSIONS.USERS_READ), (req, res, next) => userController.getPermissions(req, res, next));
router.put('/roles/:id/permissions', requireAuth, requirePermission(PERMISSIONS.ROLES_MANAGE), (req, res, next) => userController.updateRolePermissions(req, res, next));

// User Accounts CRUD (Admin Only)
router.get('/', requireAuth, requirePermission(PERMISSIONS.USERS_READ), (req, res, next) => userController.getAllUsers(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.USERS_READ), (req, res, next) => userController.getUserById(req, res, next));
router.post('/', requireAuth, requirePermission(PERMISSIONS.USERS_CREATE), (req, res, next) => userController.createUser(req, res, next));
router.patch('/:id/role', requireAuth, requirePermission(PERMISSIONS.ROLES_MANAGE), (req, res, next) => userController.changeUserRole(req, res, next));
router.put('/:id', requireAuth, requirePermission(PERMISSIONS.USERS_UPDATE), (req, res, next) => userController.updateUser(req, res, next));
router.post('/:id/reset-password', requireAuth, requirePermission(PERMISSIONS.USERS_UPDATE), (req, res, next) => userController.resetUserPassword(req, res, next));
router.delete('/:id', requireAuth, requirePermission(PERMISSIONS.USERS_DELETE), (req, res, next) => userController.deleteUser(req, res, next));

module.exports = router;
