const { query, transaction } = require('../config/db');
const { comparePassword, hashPassword, validatePasswordComplexity } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const authService = require('../services/authService');
const STATUSES = require('../constants/statuses');

/**
 * Auth Controller
 */
class AuthController {
  /**
   * Login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const sql = `
        SELECT 
          u.id, 
          u.email, 
          u.password_hash, 
          u.role_id, 
          u.employee_id, 
          u.is_active,
          u.must_change_password,
          r.name AS role_name,
          r.display_name AS role_display_name,
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

      // Generic authentication error to avoid email enumeration
      if (users.length === 0) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const user = users[0];

      if (!user.is_active) {
        return sendError(res, 'Your account has been deactivated. Please contact your administrator.', 403);
      }

      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      // Fetch user permission codes
      const permRows = await query(
        `SELECT p.code 
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [user.role_id]
      );
      const permissions = permRows.map(p => p.code);

      // Generate Tokens
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

      // Store Refresh Token hash in DB
      const tokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
      );

      // Update last login
      await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'LOGIN', 'Auth', ?, 'User logged in successfully', ?, ?)`,
        [user.id, String(user.id), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'Login successful', {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role_name,
          roleDisplayName: user.role_display_name,
          roleId: user.role_id,
          employeeId: user.employee_id,
          employeeCode: user.employee_code,
          name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
          jobPosition: user.job_position,
          departmentId: user.department_id,
          departmentName: user.department_name,
          profilePhotoUrl: user.profile_photo_url,
          avatar: user.profile_photo_url,
          mustChangePassword: !!user.must_change_password,
          permissions
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken: incomingToken } = req.body;
      if (!incomingToken) {
        return sendError(res, 'Refresh token is required.', 400);
      }

      let decoded;
      try {
        decoded = verifyRefreshToken(incomingToken);
      } catch (err) {
        return sendError(res, 'Invalid or expired refresh token.', 401);
      }

      const tokenHash = hashToken(incomingToken);

      const rows = await query(
        `SELECT rt.*, u.role_id, u.employee_id, u.is_active, r.name AS role_name, e.employee_code
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN employees e ON u.employee_id = e.id
         WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      if (rows.length === 0) {
        return sendError(res, 'Refresh token is invalid, revoked, or expired.', 401);
      }

      const tokenData = rows[0];

      if (!tokenData.is_active) {
        return sendError(res, 'User account is inactive.', 403);
      }

      const tokenPayload = {
        userId: tokenData.user_id,
        email: decoded.email,
        role: tokenData.role_name,
        roleId: tokenData.role_id,
        employeeId: tokenData.employee_id,
        employeeCode: tokenData.employee_code
      };

      const newAccessToken = generateAccessToken(tokenPayload);

      return sendSuccess(res, 'Token refreshed successfully', {
        accessToken: newAccessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken: incomingToken } = req.body;

      if (incomingToken) {
        const tokenHash = hashToken(incomingToken);
        await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?', [tokenHash]);
      }

      if (req.user) {
        await query(
          `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
           VALUES (?, 'LOGOUT', 'Auth', ?, 'User logged out', ?, ?)`,
          [req.user.id, String(req.user.id), req.ip, req.headers['user-agent'] || '']
        );
      }

      return sendSuccess(res, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User Profile
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;

      const sql = `
        SELECT 
          u.id, 
          u.email, 
          u.role_id, 
          u.employee_id, 
          u.is_active, 
          u.must_change_password,
          u.last_login_at,
          u.created_at,
          r.name AS role_name,
          r.display_name AS role_display_name,
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
          d.code AS department_code,
          fe.enrollment_status AS face_enrollment_status
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN face_enrollments fe ON e.id = fe.employee_id
        WHERE u.id = ?
        LIMIT 1
      `;

      const rows = await query(sql, [userId]);

      if (rows.length === 0) {
        return sendError(res, 'User profile not found.', 404);
      }

      const user = rows[0];

      return sendSuccess(res, 'User profile retrieved', {
        id: user.id,
        email: user.email,
        role: user.role_name,
        roleDisplayName: user.role_display_name,
        roleId: user.role_id,
        roleDescription: user.role_description,
        employeeId: user.employee_id,
        mustChangePassword: !!user.must_change_password,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        profilePhotoUrl: user.profile_photo_url,
        avatar: user.profile_photo_url,
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
          profilePhotoUrl: user.profile_photo_url,
          avatar: user.profile_photo_url,
          faceEnrollmentStatus: user.face_enrollment_status || 'NOT_ENROLLED'
        } : null,
        permissions: req.user.permissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate Employee Account via Email Token
   * POST /api/auth/activate-account
   */
  async activateAccount(req, res, next) {
    try {
      const { token, email, newPassword } = req.body;
      const complexity = validatePasswordComplexity(newPassword);
      if (!complexity.valid) {
        return sendError(res, complexity.message, 400);
      }

      const result = await authService.activateAccount({ token, email, newPassword });
      return sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, 'Email is required.', 400);

      const result = await authService.forgotPassword({ email });
      return sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, email, newPassword } = req.body;
      const complexity = validatePasswordComplexity(newPassword);
      if (!complexity.valid) {
        return sendError(res, complexity.message, 400);
      }

      const result = await authService.resetPassword({ token, email, newPassword });
      return sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password (Authenticated User)
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const rows = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) {
        return sendError(res, 'User not found.', 404);
      }

      const isMatch = await comparePassword(currentPassword, rows[0].password_hash);
      if (!isMatch) {
        return sendError(res, 'Current password is incorrect.', 400);
      }

      const complexity = validatePasswordComplexity(newPassword);
      if (!complexity.valid) {
        return sendError(res, complexity.message, 400);
      }

      const newHash = await hashPassword(newPassword);
      await query('UPDATE users SET password_hash = ?, must_change_password = FALSE, updated_at = NOW() WHERE id = ?', [newHash, userId]);

      // Revoke all existing refresh tokens
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [userId]);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'CHANGE_PASSWORD', 'Auth', ?, 'Password updated successfully', ?, ?)`,
        [userId, String(userId), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'Password updated successfully. Please log in again with your new credentials.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
