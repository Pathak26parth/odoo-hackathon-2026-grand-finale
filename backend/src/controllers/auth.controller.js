const { query, transaction } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  hashToken 
} = require('../utils/jwt.utils');

/**
 * User Login
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Fetch user with role & employee information
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.password_hash, 
        u.role_id, 
        u.employee_id, 
        u.is_active,
        r.name AS role_name,
        r.description AS role_description,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.job_position,
        e.department_id,
        e.profile_photo_url,
        d.name AS department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.email = ?
      LIMIT 1
    `;

    const users = await query(sql, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // 2. Check active status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.'
      });
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 4. Fetch role permissions
    const permSql = `
      SELECT p.code 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    const permRows = await query(permSql, [user.role_id]);
    const permissions = permRows.map(p => p.code);

    // 5. Generate Access & Refresh Tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role_name,
      roleId: user.role_id,
      employeeId: user.employee_id,
      employeeCode: user.employee_code
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // 6. Store Refresh Token Hash in DB (7 days expiry)
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, tokenHash, expiresAt]
    );

    // 7. Update last_login timestamp
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // 8. Record audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent)
       VALUES (?, 'LOGIN', 'AUTH', ?, ?, ?)`,
      [user.id, String(user.id), req.ip || req.connection?.remoteAddress, req.headers['user-agent'] || '']
    );

    // 9. Send response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role_name,
          roleDescription: user.role_description,
          roleId: user.role_id,
          employeeId: user.employee_id,
          employeeCode: user.employee_code,
          name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
          jobPosition: user.job_position,
          departmentId: user.department_id,
          departmentName: user.department_name,
          profilePhotoUrl: user.profile_photo_url,
          permissions
        }
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Refresh Access Token
 * POST /api/auth/refresh-token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: incomingToken } = req.body;

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token.'
      });
    }

    const tokenHash = hashToken(incomingToken);

    // Check if token exists in DB, is not revoked, and not expired
    const tokenRows = await query(
      `SELECT rt.*, u.role_id, u.employee_id, u.is_active, r.name AS role_name, e.employee_code
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked or expired. Please log in again.'
      });
    }

    const tokenData = tokenRows[0];

    if (!tokenData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive.'
      });
    }

    // Generate new Access Token
    const tokenPayload = {
      userId: tokenData.user_id,
      email: decoded.email,
      role: tokenData.role_name,
      roleId: tokenData.role_id,
      employeeId: tokenData.employee_id,
      employeeCode: tokenData.employee_code
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Logout
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (incomingToken) {
      const tokenHash = hashToken(incomingToken);
      await query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
        [tokenHash]
      );
    }

    // Also if authenticated, record audit
    if (req.user) {
      await query(
        `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent)
         VALUES (?, 'LOGOUT', 'AUTH', ?, ?)`,
        [req.user.id, req.ip, req.headers['user-agent'] || '']
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get Current Authenticated User Profile
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.role_id, 
        u.employee_id, 
        u.is_active, 
        u.last_login,
        u.created_at,
        r.name AS role_name,
        r.description AS role_description,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email AS employee_email,
        e.phone,
        e.job_position,
        e.department_id,
        e.gender,
        e.date_of_birth,
        e.joining_date,
        e.status AS employee_status,
        e.profile_photo_url,
        d.name AS department_name,
        d.code AS department_code
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `;

    const rows = await query(sql, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const user = rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role_name,
        roleId: user.role_id,
        roleDescription: user.role_description,
        employeeId: user.employee_id,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        employee: user.employee_id ? {
          id: user.employee_id,
          employeeCode: user.employee_code,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.employee_email,
          phone: user.phone,
          jobPosition: user.job_position,
          departmentId: user.department_id,
          departmentName: user.department_name,
          departmentCode: user.department_code,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          joiningDate: user.joining_date,
          status: user.employee_status,
          profilePhotoUrl: user.profile_photo_url
        } : null,
        permissions: req.user.permissions
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Change Password
 * POST /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const rows = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await comparePassword(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const newHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    // Revoke all existing refresh tokens for security
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [userId]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent)
       VALUES (?, 'CHANGE_PASSWORD', 'AUTH', ?, ?)`,
      [userId, req.ip, req.headers['user-agent'] || '']
    );

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new credentials.'
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword
};
