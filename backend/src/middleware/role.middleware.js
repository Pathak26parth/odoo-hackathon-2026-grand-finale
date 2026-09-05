/**
 * Role & Permission Authorization Middleware
 * Enforces Role-Based Access Control (RBAC) and Permission-Based Access Control (PBAC)
 */

/**
 * Restrict endpoint access to specific roles
 * @param  {...string} allowedRoles - E.g. 'Admin', 'HR Payroll Admin', 'HR Manager'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your current role is "${req.user.role}".`
      });
    }

    next();
  };
}

/**
 * Restrict endpoint access to users with all specified permissions (or Admin)
 * @param  {...string} requiredPermissions - E.g. 'employees:read_all', 'payruns:create'
 */
function authorizePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.'
      });
    }

    // Admins have automatic full access
    if (req.user.role === 'Admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAll = requiredPermissions.every(perm => userPerms.includes(perm));

    if (!hasAll) {
      const missing = requiredPermissions.filter(perm => !userPerms.includes(perm));
      return res.status(403).json({
        success: false,
        message: `Forbidden: You lack the required permission(s): [${missing.join(', ')}]`
      });
    }

    next();
  };
}

/**
 * Restrict endpoint access to users having at least one of the specified permissions (or Admin)
 * @param  {...string} permissions - E.g. 'employees:read_all', 'employees:read_own'
 */
function authorizeAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.'
      });
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAny = permissions.some(perm => userPerms.includes(perm));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You lack the required permission(s) from: [${permissions.join(', ')}]`
      });
    }

    next();
  };
}

/**
 * Helper to allow access if current user is Admin OR if the resource belongs to the logged-in employee/user
 * @param {Function} getResourceId - Function taking `req` and returning the target ID
 * @param {'employeeId'|'userId'} matchType - Match against req.user.employeeId or req.user.id
 */
function requireSelfOrAdmin(getResourceId, matchType = 'employeeId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    const targetId = getResourceId(req);
    const currentId = matchType === 'employeeId' ? req.user.employeeId : req.user.id;

    if (String(targetId) !== String(currentId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own records.'
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
  authorizePermissions,
  authorizeAnyPermission,
  requireSelfOrAdmin
};
