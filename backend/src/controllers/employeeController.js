const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError, maskAccountNumber } = require('../utils/response');
const authService = require('../services/authService');

/**
 * Employee Master Management Controller
 */
class EmployeeController {
  /**
   * Get all employees (Kanban/List views with search & filters)
   * GET /api/employees
   */
  async getAllEmployees(req, res, next) {
    try {
      const { search, departmentId, status, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          e.id, 
          e.employee_code, 
          e.first_name, 
          e.last_name, 
          e.email, 
          e.phone, 
          e.job_position, 
          e.department_id, 
          e.manager_id, 
          e.working_schedule_id, 
          e.gender, 
          e.date_of_birth, 
          e.joining_date, 
          e.status, 
          e.profile_photo_url, 
          e.created_at,
          d.name AS department_name,
          d.code AS department_code,
          CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
          ws.name AS schedule_name,
          fe.enrollment_status AS face_enrollment_status,
          c.wage AS current_wage,
          c.id AS active_contract_id
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        LEFT JOIN face_enrollments fe ON e.id = fe.employee_id
        LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'ACTIVE'
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ? OR e.job_position LIKE ?)`;
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q, q);
      }

      if (departmentId) {
        sql += ` AND e.department_id = ?`;
        params.push(departmentId);
      }

      if (status) {
        sql += ` AND e.status = ?`;
        params.push(status);
      }

      // Count
      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ` ORDER BY e.id ASC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const employees = await query(sql, params);

      return sendSuccess(res, 'Employees retrieved successfully', {
        employees,
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
   * Get employee by ID (Unified Form Hub)
   * GET /api/employees/:id
   */
  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          e.*,
          d.name AS department_name,
          d.code AS department_code,
          CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
          ws.name AS schedule_name,
          ws.weekly_hours AS schedule_weekly_hours,
          fe.enrollment_status AS face_enrollment_status,
          fe.enrolled_at AS face_enrolled_at,
          u.id AS user_id,
          u.is_active AS user_is_active,
          r.name AS user_role,
          r.display_name AS user_role_display
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        LEFT JOIN face_enrollments fe ON e.id = fe.employee_id
        LEFT JOIN users u ON e.id = u.employee_id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE e.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Employee record not found.', 404);
      }

      const employee = rows[0];

      // Fetch Bank Details (Masked)
      const bankRows = await query('SELECT * FROM employee_bank_details WHERE employee_id = ? LIMIT 1', [id]);
      if (bankRows.length > 0) {
        const b = bankRows[0];
        employee.bankDetails = {
          id: b.id,
          accountHolderName: b.account_holder_name,
          bankName: b.bank_name,
          accountNumberMasked: maskAccountNumber(b.account_number),
          ifscCode: b.ifsc_code,
          branchName: b.branch_name,
          accountType: b.account_type,
          isPrimary: !!b.is_primary
        };
      } else {
        employee.bankDetails = null;
      }

      // Smart Button Metric Counts
      const [contractCount] = await query('SELECT COUNT(*) AS count FROM contracts WHERE employee_id = ?', [id]);
      const [attCount] = await query('SELECT COUNT(*) AS count FROM attendance WHERE employee_id = ?', [id]);
      const [leaveCount] = await query('SELECT COUNT(*) AS count FROM time_off_requests WHERE employee_id = ?', [id]);
      const [payslipCount] = await query('SELECT COUNT(*) AS count FROM payslips WHERE employee_id = ?', [id]);

      employee.metrics = {
        contractsCount: contractCount ? contractCount.count : 0,
        attendanceCount: attCount ? attCount.count : 0,
        timeOffCount: leaveCount ? leaveCount.count : 0,
        payslipsCount: payslipCount ? payslipCount.count : 0
      };

      return sendSuccess(res, 'Employee details retrieved', employee);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get logged-in employee self profile
   * GET /api/me/employee
   */
  async getMeEmployee(req, res, next) {
    try {
      if (!req.user.employeeId) {
        return sendError(res, 'No employee record associated with your user account.', 404);
      }

      req.params.id = req.user.employeeId;
      return this.getEmployeeById(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Employee + User Account + Bank Details + Initial Contract + Invitation Email
   * (Accessible by HR Manager, HR Payroll Admin, Admin)
   * POST /api/employees
   */
  async createEmployee(req, res, next) {
    try {
      const {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        jobPosition,
        departmentId,
        managerId,
        workingScheduleId,
        gender,
        dateOfBirth,
        joiningDate,
        profilePhotoUrl,
        avatar,
        roleName = 'EMPLOYEE',
        bankDetails,
        initialContract
      } = req.body;

      const photoToSave = profilePhotoUrl || avatar || null;

      // Security check: Only System Admin can assign elevated roles; HR Manager always creates EMPLOYEE role
      const effectiveRole = req.user.role === 'ADMIN' ? (roleName || 'EMPLOYEE') : 'EMPLOYEE';

      const result = await authService.createEmployeeWithAccount({
        employeeData: {
          employeeCode,
          firstName,
          lastName,
          email,
          phone,
          jobPosition,
          departmentId,
          managerId,
          workingScheduleId,
          gender,
          dateOfBirth,
          joiningDate,
          profilePhotoUrl: photoToSave
        },
        roleName: effectiveRole,
        bankData: bankDetails || null,
        initialContract: initialContract || null,
        createdByUserId: req.user.id,
        userIp: req.ip,
        userAgent: req.get('User-Agent')
      });

      return sendSuccess(res, 'Employee onboarded successfully.', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Employee Profile
   * PUT /api/employees/:id
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        phone,
        jobPosition,
        departmentId,
        managerId,
        workingScheduleId,
        gender,
        dateOfBirth,
        joiningDate,
        status,
        profilePhotoUrl,
        avatar,
        bankDetails
      } = req.body;

      const photoToUpdate = profilePhotoUrl !== undefined ? profilePhotoUrl : (avatar !== undefined ? avatar : null);

      const existing = await query('SELECT * FROM employees WHERE id = ?', [id]);
      if (existing.length === 0) {
        return sendError(res, 'Employee not found.', 404);
      }

      const sql = `
        UPDATE employees SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          job_position = COALESCE(?, job_position),
          department_id = COALESCE(?, department_id),
          manager_id = COALESCE(?, manager_id),
          working_schedule_id = COALESCE(?, working_schedule_id),
          gender = COALESCE(?, gender),
          date_of_birth = COALESCE(?, date_of_birth),
          joining_date = COALESCE(?, joining_date),
          status = COALESCE(?, status),
          profile_photo_url = COALESCE(?, profile_photo_url),
          updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, [
        firstName !== undefined ? firstName : null,
        lastName !== undefined ? lastName : null,
        phone !== undefined ? phone : null,
        jobPosition !== undefined ? jobPosition : null,
        departmentId !== undefined ? departmentId : null,
        managerId !== undefined ? managerId : null,
        workingScheduleId !== undefined ? workingScheduleId : null,
        gender !== undefined ? gender : null,
        dateOfBirth !== undefined ? dateOfBirth : null,
        joiningDate !== undefined ? joiningDate : null,
        status !== undefined ? status : null,
        photoToUpdate !== undefined ? photoToUpdate : null,
        id
      ]);

      // Update Bank Details if provided
      if (bankDetails && bankDetails.accountNumber && bankDetails.ifscCode) {
        await query(
          `INSERT INTO employee_bank_details (employee_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             account_holder_name = VALUES(account_holder_name),
             bank_name = VALUES(bank_name),
             account_number = VALUES(account_number),
             ifsc_code = VALUES(ifsc_code),
             branch_name = VALUES(branch_name),
             account_type = VALUES(account_type),
             updated_at = NOW()`,
          [
            id,
            bankDetails.accountHolderName || `${firstName || existing[0].first_name} ${lastName || existing[0].last_name}`,
            bankDetails.bankName || 'Bank',
            bankDetails.accountNumber.trim(),
            bankDetails.ifscCode.trim().toUpperCase(),
            bankDetails.branchName || null,
            bankDetails.accountType || 'SALARY'
          ]
        );
      }

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'EMPLOYEE_UPDATED', 'Employees', ?, 'Updated employee profile', ?, ?)`,
        [req.user.id, String(id), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'Employee profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete / Terminate Employee
   * DELETE /api/employees/:id
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await query('SELECT * FROM employees WHERE id = ?', [id]);
      if (existing.length === 0) {
        return sendError(res, 'Employee not found.', 404);
      }

      // Soft delete by updating status to TERMINATED
      await query('UPDATE employees SET status = "TERMINATED", updated_at = NOW() WHERE id = ?', [id]);
      await query('UPDATE users SET is_active = FALSE WHERE employee_id = ?', [id]);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'EMPLOYEE_TERMINATED', 'Employees', ?, 'Employee marked terminated and user deactivated', ?, ?)`,
        [req.user.id, String(id), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'Employee status updated to Terminated and user access deactivated.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related contracts for an employee
   * GET /api/employees/:id/contracts
   */
  async getEmployeeContracts(req, res, next) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT c.*, ss.name AS structure_name, ws.name AS schedule_name
        FROM contracts c
        LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
        LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
        WHERE c.employee_id = ?
        ORDER BY c.start_date DESC
      `;
      const contracts = await query(sql, [id]);
      return sendSuccess(res, 'Employee contracts retrieved', contracts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related attendance records for an employee
   * GET /api/employees/:id/attendance
   */
  async getEmployeeAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { month, year } = req.query;

      let sql = 'SELECT * FROM attendance WHERE employee_id = ?';
      const params = [id];

      if (month && year) {
        sql += ' AND MONTH(date) = ? AND YEAR(date) = ?';
        params.push(month, year);
      }

      sql += ' ORDER BY date DESC, check_in DESC LIMIT 100';

      const records = await query(sql, params);
      return sendSuccess(res, 'Employee attendance history retrieved', records);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related time off records for an employee
   * GET /api/employees/:id/time-off
   */
  async getEmployeeTimeOff(req, res, next) {
    try {
      const { id } = req.params;
      const requests = await query(
        `SELECT r.*, t.name AS type_name, t.code AS type_code, CONCAT(u.first_name, ' ', u.last_name) AS approver_name
         FROM time_off_requests r
         JOIN time_off_types t ON r.time_off_type_id = t.id
         LEFT JOIN users app_u ON r.approved_by = app_u.id
         LEFT JOIN employees u ON app_u.employee_id = u.id
         WHERE r.employee_id = ?
         ORDER BY r.created_at DESC`,
        [id]
      );

      const allocations = await query(
        `SELECT a.*, t.name AS type_name, t.code AS type_code 
         FROM time_off_allocations a
         JOIN time_off_types t ON a.time_off_type_id = t.id
         WHERE a.employee_id = ?
         ORDER BY a.year DESC`,
        [id]
      );

      return sendSuccess(res, 'Employee time off records retrieved', {
        requests,
        allocations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related payslips for an employee
   * GET /api/employees/:id/payslips
   */
  async getEmployeePayslips(req, res, next) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT p.*, pr.run_code, pr.name AS run_name, ss.name AS structure_name
        FROM payslips p
        JOIN payruns pr ON p.payrun_id = pr.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        WHERE p.employee_id = ?
        ORDER BY p.period_end DESC
      `;
      const payslips = await query(sql, [id]);
      return sendSuccess(res, 'Employee payslips retrieved', payslips);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
