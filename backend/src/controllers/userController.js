const { query, transaction } = require('../config/db');
const { hashPassword } = require('../utils/password');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const authService = require('../services/authService');

/**
 * User & Role Administration Controller
 */
class UserController {
  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const { search, role, status, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          u.id, 
          u.email, 
          u.role_id, 
          u.employee_id, 
          u.is_active, 
          u.is_verified, 
          u.must_change_password, 
          u.last_login_at, 
          u.created_at,
          r.name AS role_name,
          r.display_name AS role_display_name,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.job_position,
          d.name AS department_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        sql += ` AND (u.email LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ?)`;
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q);
      }

      if (role) {
        sql += ` AND (r.name = ? OR r.display_name = ?)`;
        params.push(role, role);
      }

      if (status !== undefined) {
        sql += ` AND u.is_active = ?`;
        params.push(status === 'true' || status === '1');
      }

      // Count query
      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const users = await query(sql, params);

      return sendSuccess(res, 'Users retrieved successfully', {
        users,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          u.id, 
          u.email, 
          u.role_id, 
          u.employee_id, 
          u.is_active, 
          u.is_verified, 
          u.must_change_password, 
          u.last_login_at, 
          u.created_at,
          r.name AS role_name,
          r.display_name AS role_display_name,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.phone,
          e.job_position,
          d.name AS department_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'User not found.', 404);
      }

      return sendSuccess(res, 'User retrieved', rows[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create User Account with Role (Admin can create Admin, HR Manager, HR Payroll Admin, HR Payroll User, Employee)
   * POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const {
        email,
        password,
        role = 'EMPLOYEE',
        roleId,
        firstName,
        lastName,
        name,
        departmentId,
        jobPosition,
        phone,
        employeeId,
        createEmployeeRecord = true,
        sendInvitation = true
      } = req.body;

      if (!email || !email.trim()) {
        return sendError(res, 'Email address is required.', 400);
      }

      const result = await authService.createUserAccount({
        email,
        password,
        role,
        roleId,
        firstName,
        lastName,
        name,
        departmentId,
        jobPosition,
        phone,
        employeeId,
        createEmployeeRecord,
        sendInvitation,
        createdByUserId: req.user.id,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendCreated(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Profile / Status
   * PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, roleId, isActive, employeeId, password } = req.body;

      const userRows = await query('SELECT * FROM users WHERE id = ?', [id]);
      if (userRows.length === 0) {
        return sendError(res, 'User not found.', 404);
      }

      const existingUser = userRows[0];

      // Prevent deactivating the last active Admin account
      if (isActive === false && existingUser.role_id === 1) {
        const adminCountRows = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = 1 AND is_active = TRUE');
        if (adminCountRows[0].count <= 1) {
          return sendError(res, 'Safety lock: Cannot deactivate the last remaining active System Administrator.', 400);
        }
      }

      let updateSql = 'UPDATE users SET ';
      const updates = [];
      const params = [];

      if (roleId !== undefined || role !== undefined) {
        const finalRoleId = await authService.resolveRoleId(roleId || role);
        updates.push('role_id = ?');
        params.push(finalRoleId);
      }
      if (isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(isActive);
      }
      if (employeeId !== undefined) {
        updates.push('employee_id = ?');
        params.push(employeeId || null);
      }
      if (password) {
        const hash = await hashPassword(password);
        updates.push('password_hash = ?');
        params.push(hash);
      }

      if (updates.length === 0) {
        return sendError(res, 'No fields provided to update.', 400);
      }

      updateSql += updates.join(', ') + ', updated_at = NOW() WHERE id = ?';
      params.push(id);

      await query(updateSql, params);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'USER_UPDATED', 'Users', ?, 'Admin modified user profile/role', ?, ?)`,
        [req.user.id, String(id), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Role for a User (Admin Only)
   * PATCH /api/users/:id/role
   */
  async changeUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role, roleId } = req.body;

      if (!role && !roleId) {
        return sendError(res, 'Target role or roleId is required.', 400);
      }

      const userRows = await query('SELECT * FROM users WHERE id = ?', [id]);
      if (userRows.length === 0) {
        return sendError(res, 'User not found.', 404);
      }

      const existingUser = userRows[0];
      const targetRoleId = await authService.resolveRoleId(roleId || role);

      // Prevent demoting the last active Admin
      if (existingUser.role_id === 1 && targetRoleId !== 1) {
        const adminCountRows = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = 1 AND is_active = TRUE');
        if (adminCountRows[0].count <= 1) {
          return sendError(res, 'Safety lock: Cannot demote the last remaining active System Administrator.', 400);
        }
      }

      await query('UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?', [targetRoleId, id]);

      const roleRows = await query('SELECT name, display_name FROM roles WHERE id = ?', [targetRoleId]);
      const roleInfo = roleRows[0] || { name: 'UNKNOWN', display_name: 'Unknown' };

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'ROLE_ASSIGNED', 'Users', ?, ?, ?, ?)`,
        [
          req.user.id,
          String(id),
          `Assigned role ${roleInfo.name} (${roleInfo.display_name}) to user ${existingUser.email}`,
          req.ip,
          req.headers['user-agent'] || ''
        ]
      );

      return sendSuccess(res, `User role changed to "${roleInfo.display_name}".`, {
        userId: parseInt(id, 10),
        roleId: targetRoleId,
        role: roleInfo.name,
        roleDisplayName: roleInfo.display_name
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete / Deactivate User
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const userRows = await query('SELECT * FROM users WHERE id = ?', [id]);
      if (userRows.length === 0) {
        return sendError(res, 'User not found.', 404);
      }

      const existingUser = userRows[0];

      // Safety check: Prevent deleting last active admin or self
      if (existingUser.role_id === 1) {
        const adminCountRows = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = 1 AND is_active = TRUE');
        if (adminCountRows[0].count <= 1) {
          return sendError(res, 'Safety lock: Cannot delete the last active System Administrator.', 400);
        }
      }

      if (parseInt(id, 10) === req.user.id) {
        return sendError(res, 'Safety lock: You cannot delete your own logged-in administrator account.', 400);
      }

      await query('DELETE FROM users WHERE id = ?', [id]);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'USER_DELETED', 'Users', ?, 'Admin deleted user account', ?, ?)`,
        [req.user.id, String(id), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'User account deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all Roles with their assigned permissions
   * GET /api/roles or /api/users/roles
   */
  async getRoles(req, res, next) {
    try {
      const roles = await query('SELECT * FROM roles ORDER BY id ASC');
      
      for (const role of roles) {
        const permRows = await query(
          `SELECT p.id, p.code, p.module, p.description
           FROM permissions p
           JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = ?
           ORDER BY p.module ASC, p.code ASC`,
          [role.id]
        );
        role.permissions = permRows;
      }

      return sendSuccess(res, 'Roles retrieved', roles);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all system permissions grouped by module
   * GET /api/permissions or /api/users/permissions
   */
  async getPermissions(req, res, next) {
    try {
      const perms = await query('SELECT * FROM permissions ORDER BY module ASC, code ASC');
      
      const grouped = {};
      for (const p of perms) {
        if (!grouped[p.module]) {
          grouped[p.module] = [];
        }
        grouped[p.module].push(p);
      }

      return sendSuccess(res, 'Permissions retrieved', {
        all: perms,
        grouped
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update permissions for a role (Admin only)
   * PUT /api/roles/:id/permissions
   */
  async updateRolePermissions(req, res, next) {
    try {
      const { id: roleId } = req.params;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return sendError(res, 'permissionIds must be an array of numeric permission IDs.', 400);
      }

      const roleRows = await query('SELECT * FROM roles WHERE id = ?', [roleId]);
      if (roleRows.length === 0) {
        return sendError(res, 'Role not found.', 404);
      }

      await transaction(async (connection) => {
        // Clear existing mappings
        await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

        // Insert new mappings
        for (const pId of permissionIds) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, pId]
          );
        }

        // Audit Log
        await connection.execute(
          `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
           VALUES (?, 'ROLE_PERMISSIONS_UPDATED', 'Roles', ?, 'Admin updated permission mappings for role', ?, ?)`,
          [req.user.id, String(roleId), req.ip, req.headers['user-agent'] || '']
        );
      });

      return sendSuccess(res, `Permissions updated for role "${roleRows[0].display_name}".`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
