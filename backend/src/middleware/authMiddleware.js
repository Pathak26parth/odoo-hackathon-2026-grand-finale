const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');
const { sendError } = require('../utils/response');

/**
 * Authentication Middleware: requireAuth
 * Extracts Bearer JWT, validates signature & expiration, queries MySQL for active user state & permissions
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Missing or malformed Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your token.'
        });
      }
      return sendError(res, 'Invalid or expired access token.', 401);
    }

    // Query DB to verify user is active and load profile + permissions
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.role_id, 
        u.employee_id, 
        u.is_active,
        u.must_change_password,
        r.name AS role_name,
        r.display_name AS role_display_name,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.department_id,
        d.name AS department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `;

    const users = await query(sql, [decoded.userId]);

    if (users.length === 0) {
      return sendError(res, 'User account not found or has been removed.', 401);
    }

    const user = users[0];

    if (!user.is_active) {
      return sendError(res, 'Account has been deactivated. Please contact your system administrator.', 403);
    }

    // Load user permission codes from role_permissions
    const permSql = `
      SELECT p.code 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    const permRows = await query(permSql, [user.role_id]);
    const permissions = permRows.map(p => p.code);

    // Attach user identity to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role_name,
      roleId: user.role_id,
      roleDisplayName: user.role_display_name,
      employeeId: user.employee_id,
      employeeCode: user.employee_code,
      name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
      departmentId: user.department_id,
      departmentName: user.department_name,
      mustChangePassword: !!user.must_change_password,
      permissions
    };

    next();
  } catch (error) {
    console.error('[requireAuth Error]:', error);
    return sendError(res, 'Authentication verification failed.', 500);
  }
}

module.exports = {
  requireAuth
};
