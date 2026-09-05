const { sendError } = require('../utils/response');

/**
 * Permission Authorization Middleware: requirePermission
 * Checks if authenticated user has the exact permission in database or has ADMIN role
 * @param {string} permissionCode - E.g. 'employees.read', 'payruns.create', 'timeoff.approve'
 */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    // System ADMIN has universal access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const permissions = req.user.permissions || [];
    if (!permissions.includes(permissionCode)) {
      return sendError(
        res,
        `Forbidden: You lack the required permission "${permissionCode}" to perform this action.`,
        403
      );
    }

    next();
  };
}

/**
 * Role Authorization Middleware: requireRole
 * Restricts endpoint to specific roles
 * @param  {...string} allowedRoles - E.g. 'ADMIN', 'HR_MANAGER'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your current role is "${req.user.role}".`,
        403
      );
    }

    next();
  };
}

/**
 * Own-Data Ownership Middleware: requireSelfOrAdmin
 * Enforces that standard employees can ONLY access records belonging to their own employee_id or user_id
 * @param {Function} getTargetId - Function(req) returning the ID to verify
 * @param {'employeeId'|'userId'} matchType
 */
function requireSelfOrAdmin(getTargetId, matchType = 'employeeId') {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    // Admins and HR Managers with full read can bypass
    if (req.user.role === 'ADMIN' || req.user.role === 'HR_MANAGER' || req.user.role === 'HR_PAYROLL_ADMIN' || req.user.role === 'HR_PAYROLL_USER') {
      return next();
    }

    const targetId = getTargetId(req);
    const currentId = matchType === 'employeeId' ? req.user.employeeId : req.user.id;

    if (!targetId || String(targetId) !== String(currentId)) {
      return sendError(res, 'Forbidden: You are only authorized to access your own records.', 403);
    }

    next();
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireSelfOrAdmin
};
