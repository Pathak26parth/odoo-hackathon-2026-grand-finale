const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

/**
 * Contracts Management Controller
 */
class ContractController {
  /**
   * Get all contracts (List view with active contracts highlighted)
   * GET /api/contracts
   */
  async getContracts(req, res, next) {
    try {
      const { employeeId, status, departmentId, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          c.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          ss.name AS structure_name,
          ws.name AS schedule_name
        FROM contracts c
        JOIN employees e ON c.employee_id = e.id
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
        LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        sql += ' AND c.employee_id = ?';
        params.push(employeeId);
      }
      if (status) {
        sql += ' AND c.status = ?';
        params.push(status);
      }
      if (departmentId) {
        sql += ' AND c.department_id = ?';
        params.push(departmentId);
      }

      // Count
      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ' ORDER BY c.status = "ACTIVE" DESC, c.start_date DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const contracts = await query(sql, params);

      return sendSuccess(res, 'Contracts retrieved successfully', {
        contracts,
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
   * Get contract by ID
   * GET /api/contracts/:id
   */
  async getContractById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          c.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          ss.name AS structure_name,
          ws.name AS schedule_name
        FROM contracts c
        JOIN employees e ON c.employee_id = e.id
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
        LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
        WHERE c.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Contract not found.', 404);
      }

      return sendSuccess(res, 'Contract retrieved', rows[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Contract
   * POST /api/contracts
   */
  async createContract(req, res, next) {
    try {
      const {
        contractCode,
        employeeId,
        departmentId,
        department,
        jobPosition,
        position,
        wage,
        salaryStructureId,
        salaryStructure,
        workingScheduleId,
        workingSchedule,
        startDate,
        endDate,
        status = 'ACTIVE'
      } = req.body;

      if (!employeeId || wage === undefined || wage === null || !startDate) {
        return sendError(res, 'employeeId, wage, and startDate are required.', 400);
      }

      // 1. Resolve Employee ID
      let resolvedEmpId = null;
      const cleanEmp = String(employeeId).trim();
      if (/^\d+$/.test(cleanEmp)) {
        resolvedEmpId = parseInt(cleanEmp, 10);
      } else {
        const empRows = await query('SELECT id, department_id, job_position FROM employees WHERE employee_code = ? OR email = ? LIMIT 1', [cleanEmp, cleanEmp]);
        if (empRows.length > 0) {
          resolvedEmpId = empRows[0].id;
        }
      }

      if (!resolvedEmpId) {
        return sendError(res, `Employee not found for "${employeeId}".`, 404);
      }

      // 2. Resolve Department ID
      let resolvedDeptId = departmentId ? parseInt(departmentId, 10) : null;
      if (!resolvedDeptId && department) {
        const deptRows = await query('SELECT id FROM departments WHERE name = ? OR code = ? LIMIT 1', [department, department]);
        if (deptRows.length > 0) resolvedDeptId = deptRows[0].id;
      }

      // 3. Resolve Salary Structure ID
      let resolvedStructureId = salaryStructureId ? parseInt(salaryStructureId, 10) : null;
      if (!resolvedStructureId && salaryStructure) {
        const structRows = await query('SELECT id FROM salary_structures WHERE name = ? OR code = ? LIMIT 1', [salaryStructure, salaryStructure]);
        if (structRows.length > 0) resolvedStructureId = structRows[0].id;
      }
      if (!resolvedStructureId) {
        // Fallback to first available structure
        const defaultStruct = await query('SELECT id FROM salary_structures ORDER BY id ASC LIMIT 1');
        resolvedStructureId = defaultStruct.length > 0 ? defaultStruct[0].id : 1;
      }

      // 4. Resolve Working Schedule ID
      let resolvedScheduleId = workingScheduleId ? parseInt(workingScheduleId, 10) : null;
      if (!resolvedScheduleId && workingSchedule) {
        const schedRows = await query('SELECT id FROM working_schedules WHERE name = ? LIMIT 1', [workingSchedule]);
        if (schedRows.length > 0) resolvedScheduleId = schedRows[0].id;
      }
      if (!resolvedScheduleId) {
        const defaultSched = await query('SELECT id FROM working_schedules ORDER BY id ASC LIMIT 1');
        resolvedScheduleId = defaultSched.length > 0 ? defaultSched[0].id : 1;
      }

      const cCode = contractCode || `CON-${resolvedEmpId}-${Date.now().toString().slice(-4)}`;
      const resolvedJob = jobPosition || position || 'Staff';

      // If status is ACTIVE, ensure no overlapping ACTIVE contract exists for this employee
      if (status.toUpperCase() === 'ACTIVE') {
        await query(
          'UPDATE contracts SET status = "EXPIRED", updated_at = NOW() WHERE employee_id = ? AND status = "ACTIVE"',
          [resolvedEmpId]
        );
      }

      const result = await query(
        `INSERT INTO contracts (contract_code, employee_id, department_id, job_position, wage, salary_structure_id, working_schedule_id, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cCode,
          resolvedEmpId,
          resolvedDeptId || null,
          resolvedJob,
          parseFloat(wage) || 0,
          resolvedStructureId,
          resolvedScheduleId,
          startDate,
          endDate || null,
          status.toUpperCase()
        ]
      );

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'CONTRACT_CREATED', 'Contracts', ?, 'Created employment contract', ?, ?)`,
        [req.user.id, String(result.insertId), req.ip, req.headers['user-agent'] || '']
      );

      return sendCreated(res, 'Contract created successfully', { id: result.insertId, contractCode: cCode });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Contract
   * PUT /api/contracts/:id
   */
  async updateContract(req, res, next) {
    try {
      const { id } = req.params;
      const { departmentId, department, jobPosition, position, wage, salaryStructureId, salaryStructure, workingScheduleId, workingSchedule, startDate, endDate, status } = req.body;

      const existing = await query('SELECT * FROM contracts WHERE id = ?', [id]);
      if (existing.length === 0) {
        return sendError(res, 'Contract not found.', 404);
      }

      let resolvedDeptId = departmentId ? parseInt(departmentId, 10) : undefined;
      if (resolvedDeptId === undefined && department) {
        const deptRows = await query('SELECT id FROM departments WHERE name = ? OR code = ? LIMIT 1', [department, department]);
        if (deptRows.length > 0) resolvedDeptId = deptRows[0].id;
      }

      let resolvedStructureId = salaryStructureId ? parseInt(salaryStructureId, 10) : undefined;
      if (resolvedStructureId === undefined && salaryStructure) {
        const structRows = await query('SELECT id FROM salary_structures WHERE name = ? OR code = ? LIMIT 1', [salaryStructure, salaryStructure]);
        if (structRows.length > 0) resolvedStructureId = structRows[0].id;
      }

      let resolvedScheduleId = workingScheduleId ? parseInt(workingScheduleId, 10) : undefined;
      if (resolvedScheduleId === undefined && workingSchedule) {
        const schedRows = await query('SELECT id FROM working_schedules WHERE name = ? LIMIT 1', [workingSchedule]);
        if (schedRows.length > 0) resolvedScheduleId = schedRows[0].id;
      }

      const resolvedJob = jobPosition || position;

      await query(
        `UPDATE contracts SET
          department_id = COALESCE(?, department_id),
          job_position = COALESCE(?, job_position),
          wage = COALESCE(?, wage),
          salary_structure_id = COALESCE(?, salary_structure_id),
          working_schedule_id = COALESCE(?, working_schedule_id),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          status = COALESCE(?, status),
          updated_at = NOW()
        WHERE id = ?`,
        [
          resolvedDeptId !== undefined ? resolvedDeptId : null,
          resolvedJob !== undefined ? resolvedJob : null,
          wage !== undefined ? parseFloat(wage) : null,
          resolvedStructureId !== undefined ? resolvedStructureId : null,
          resolvedScheduleId !== undefined ? resolvedScheduleId : null,
          startDate !== undefined ? startDate : null,
          endDate !== undefined ? endDate : null,
          status !== undefined ? status.toUpperCase() : null,
          id
        ]
      );

      return sendSuccess(res, 'Contract updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Contract
   * DELETE /api/contracts/:id
   */
  async deleteContract(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM contracts WHERE id = ?', [id]);
      return sendSuccess(res, 'Contract deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContractController();
