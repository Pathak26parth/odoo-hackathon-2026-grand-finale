const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError, maskAccountNumber } = require('../utils/response');
const authService = require('../services/authService');
const cloudinaryService = require('../services/cloudinaryService');

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
        WHERE e.id = ? OR e.employee_code = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id, id]);

      if (rows.length === 0) {
        return sendError(res, 'Employee record not found.', 404);
      }

      const employee = rows[0];

      // Fetch Bank Details (Masked)
      const bankRows = await query('SELECT * FROM employee_bank_details WHERE employee_id = ? LIMIT 1', [employee.id]);
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
      const [contractCount] = await query('SELECT COUNT(*) AS count FROM contracts WHERE employee_id = ?', [employee.id]);
      const [attCount] = await query('SELECT COUNT(*) AS count FROM attendance WHERE employee_id = ?', [employee.id]);
      const [leaveCount] = await query('SELECT COUNT(*) AS count FROM time_off_requests WHERE employee_id = ?', [employee.id]);
      const [payslipCount] = await query('SELECT COUNT(*) AS count FROM payslips WHERE employee_id = ?', [employee.id]);

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

      let photoToSave = profilePhotoUrl || avatar || null;

      // Upload base64 image to Cloudinary if provided
      if (photoToSave && cloudinaryService.isBase64Image(photoToSave)) {
        try {
          photoToSave = await cloudinaryService.uploadImage(
            photoToSave,
            'peoplepay360/employees',
            `emp_new_${Date.now()}`
          );
        } catch (uploadErr) {
          console.error('[Employee Create] Cloudinary upload warning:', uploadErr.message);
        }
      }

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
        first_name,
        last_name,
        email,
        phone,
        jobPosition,
        position,
        job_position,
        departmentId,
        department_id,
        department,
        managerId,
        manager_id,
        manager,
        workingScheduleId,
        working_schedule_id,
        schedule,
        gender,
        dateOfBirth,
        date_of_birth,
        joiningDate,
        joining_date,
        status,
        profilePhotoUrl,
        profile_photo_url,
        avatar,
        bankDetails
      } = req.body;

      const existing = await query('SELECT * FROM employees WHERE id = ? OR employee_code = ?', [id, id]);
      if (existing.length === 0) {
        return sendError(res, 'Employee not found.', 404);
      }
      const actualEmpId = existing[0].id;

      let photoToUpdate = profilePhotoUrl !== undefined ? profilePhotoUrl : (profile_photo_url !== undefined ? profile_photo_url : (avatar !== undefined ? avatar : null));

      // Upload base64 image to Cloudinary if provided
      if (photoToUpdate && cloudinaryService.isBase64Image(photoToUpdate)) {
        try {
          photoToUpdate = await cloudinaryService.uploadImage(
            photoToUpdate,
            'peoplepay360/employees',
            `emp_${actualEmpId}_${Date.now()}`
          );
        } catch (uploadErr) {
          console.error('[Employee Update] Cloudinary upload warning:', uploadErr.message);
        }
      }

      const fName = firstName !== undefined ? firstName : (first_name !== undefined ? first_name : null);
      const lName = lastName !== undefined ? lastName : (last_name !== undefined ? last_name : null);
      const targetEmail = email !== undefined && email !== null ? email.trim().toLowerCase() : null;
      const targetPhone = phone !== undefined && phone !== null ? phone.trim() : null;
      const targetJobPosition = jobPosition !== undefined ? jobPosition : (position !== undefined ? position : (job_position !== undefined ? job_position : null));
      const targetGender = gender !== undefined ? gender : null;
      const targetDateOfBirth = dateOfBirth !== undefined ? dateOfBirth : (date_of_birth !== undefined ? date_of_birth : null);
      const targetJoiningDate = joiningDate !== undefined ? joiningDate : (joining_date !== undefined ? joining_date : null);
      const targetStatus = status !== undefined ? (status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : (status.toUpperCase() === 'TERMINATED' ? 'TERMINATED' : 'ACTIVE')) : null;

      // Department resolution
      let targetDeptId = null;
      if (departmentId !== undefined && departmentId !== null && !isNaN(Number(departmentId))) {
        targetDeptId = Number(departmentId);
      } else if (department_id !== undefined && department_id !== null && !isNaN(Number(department_id))) {
        targetDeptId = Number(department_id);
      } else if (department) {
        const deptStr = String(department).trim().toLowerCase();
        const depts = await query('SELECT id, name, code FROM departments');
        const matched = depts.find(d => 
          d.name.toLowerCase() === deptStr ||
          deptStr.includes(d.name.toLowerCase()) ||
          d.name.toLowerCase().includes(deptStr) ||
          d.code.toLowerCase() === deptStr
        );
        if (matched) {
          targetDeptId = matched.id;
        } else {
          try {
            const [insDept] = await query('INSERT INTO departments (name, code) VALUES (?, ?)', [department, department.slice(0, 4).toUpperCase()]);
            targetDeptId = insDept.insertId;
          } catch (e) {
            targetDeptId = 1;
          }
        }
      }

      // Manager resolution
      let targetManagerId = undefined; // undefined means preserve existing, null means explicitly clear
      if (managerId !== undefined) {
        targetManagerId = managerId !== null && !isNaN(Number(managerId)) ? Number(managerId) : null;
      } else if (manager_id !== undefined) {
        targetManagerId = manager_id !== null && !isNaN(Number(manager_id)) ? Number(manager_id) : null;
      } else if (manager !== undefined) {
        if (!manager || manager === 'None' || manager === 'null') {
          targetManagerId = null;
        } else if (manager === 'Admin User' || manager.toLowerCase().includes('admin')) {
          const adminEmps = await query('SELECT id FROM employees WHERE id = 1 LIMIT 1');
          targetManagerId = adminEmps.length > 0 ? adminEmps[0].id : null;
        } else {
          const matchedEmps = await query(
            `SELECT id FROM employees WHERE id != ? AND (CONCAT(first_name, ' ', last_name) LIKE ? OR first_name LIKE ? OR last_name LIKE ?) LIMIT 1`,
            [actualEmpId, `%${manager}%`, `%${manager}%`, `%${manager}%`]
          );
          targetManagerId = matchedEmps.length > 0 ? matchedEmps[0].id : null;
        }
      }

      // Working Schedule resolution
      let targetScheduleId = null;
      if (workingScheduleId !== undefined && workingScheduleId !== null && !isNaN(Number(workingScheduleId))) {
        targetScheduleId = Number(workingScheduleId);
      } else if (working_schedule_id !== undefined && working_schedule_id !== null && !isNaN(Number(working_schedule_id))) {
        targetScheduleId = Number(working_schedule_id);
      } else if (schedule) {
        const schedStr = String(schedule).trim().toLowerCase();
        const scheds = await query('SELECT id, name, type FROM working_schedules');
        const matched = scheds.find(s => 
          s.name.toLowerCase() === schedStr ||
          schedStr.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(schedStr)
        );
        targetScheduleId = matched ? matched.id : 1;
      }

      const sql = `
        UPDATE employees SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          job_position = COALESCE(?, job_position),
          department_id = COALESCE(?, department_id),
          manager_id = ${targetManagerId !== undefined ? '?' : 'manager_id'},
          working_schedule_id = COALESCE(?, working_schedule_id),
          gender = COALESCE(?, gender),
          date_of_birth = COALESCE(?, date_of_birth),
          joining_date = COALESCE(?, joining_date),
          status = COALESCE(?, status),
          profile_photo_url = COALESCE(?, profile_photo_url),
          updated_at = NOW()
        WHERE id = ?
      `;

      const params = [
        fName,
        lName,
        targetEmail,
        targetPhone,
        targetJobPosition,
        targetDeptId,
        ...(targetManagerId !== undefined ? [targetManagerId] : []),
        targetScheduleId,
        targetGender,
        targetDateOfBirth,
        targetJoiningDate,
        targetStatus,
        photoToUpdate,
        actualEmpId
      ];

      await query(sql, params);

      // Update linked user account if exists
      if (targetEmail) {
        await query('UPDATE users SET email = ?, updated_at = NOW() WHERE employee_id = ?', [targetEmail, actualEmpId]);
      }
      if (targetStatus) {
        const isActive = targetStatus === 'ACTIVE';
        await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE employee_id = ?', [isActive, actualEmpId]);
      }

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
            actualEmpId,
            bankDetails.accountHolderName || `${fName || existing[0].first_name} ${lName || existing[0].last_name}`,
            bankDetails.bankName || 'Bank',
            bankDetails.accountNumber.trim(),
            bankDetails.ifscCode.trim().toUpperCase(),
            bankDetails.branchName || null,
            bankDetails.accountType || 'SALARY'
          ]
        );
      }

      // Fetch fresh updated employee with joins
      const [updatedEmp] = await query(`
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
      `, [actualEmpId]);

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'EMPLOYEE_UPDATED', 'Employees', ?, 'Updated employee profile', ?, ?)`,
        [req.user.id, String(actualEmpId), req.ip, req.headers['user-agent'] || '']
      );

      return sendSuccess(res, 'Employee profile updated successfully', {
        employee: updatedEmp || null,
        ...updatedEmp,
        profilePhotoUrl: photoToUpdate || (updatedEmp ? updatedEmp.profile_photo_url : null),
        avatar: photoToUpdate || (updatedEmp ? updatedEmp.profile_photo_url : null)
      });
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
