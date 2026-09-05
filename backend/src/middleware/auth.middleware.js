const { verifyAccessToken } = require('../utils/jwt.utils');
const { query } = require('../config/db');

/**
 * Authentication Middleware
 * Validates JWT access token, checks active status, and populates req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token.'
      });
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
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid access token.'
      });
    }

    // Fetch user from DB to verify current status and active permissions
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.role_id, 
        u.employee_id, 
        u.is_active,
        r.name AS role_name,
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
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact your system administrator.'
      });
    }

    // Fetch user permissions from role_permissions
    const permSql = `
      SELECT p.code 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    const permRows = await query(permSql, [user.role_id]);
    const permissions = permRows.map(p => p.code);

    // Attach enriched user context to req
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role_name,
      roleId: user.role_id,
      employeeId: user.employee_id,
      employeeCode: user.employee_code,
      name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
      departmentId: user.department_id,
      departmentName: user.department_name,
      permissions
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

module.exports = {
  authenticate
};
