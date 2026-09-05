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

      // Strict RBAC: regular employees can ONLY view their own contracts
      if (req.user.role === 'EMPLOYEE') {
        const selfEmployeeId = req.user.employeeId || req.user.employee_id;
        if (!selfEmployeeId) {
          return sendSuccess(res, 'Contracts retrieved successfully', {
            contracts: [],
            pagination: { total: 0, page: 1, limit: parseInt(limit, 10), totalPages: 0 }
          });
        }
        sql += ' AND c.employee_id = ?';
        params.push(selfEmployeeId);
      } else {
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

      // Strict RBAC: Employee cannot view another employee's contract
      if (req.user.role === 'EMPLOYEE') {
        const selfEmployeeId = req.user.employeeId || req.user.employee_id;
        if (String(rows[0].employee_id) !== String(selfEmployeeId)) {
          return sendError(res, 'Forbidden: You are strictly prohibited from viewing another employee\'s contract.', 403);
        }
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
      if (req.user.role === 'EMPLOYEE') {
        return sendError(res, 'Forbidden: Employees are not permitted to create contracts.', 403);
      }

      const {
        contractCode,
        employeeId,
        departmentId,
        department,
        jobPosition,
        position,
        wage,
        salary,
        salaryStructureId,
        salaryStructure,
        workingScheduleId,
        startDate,
        endDate,
        status = 'ACTIVE'
      } = req.body;

      const resolvedWage = wage !== undefined ? wage : salary;
      const resolvedPosition = jobPosition !== undefined ? jobPosition : (position !== undefined ? position : null);

      if (!employeeId || !resolvedWage || !startDate) {
        return sendError(res, 'employeeId, wage, and startDate are required.', 400);
      }

      // Resolve departmentId if name provided
      let resolvedDeptId = departmentId ? Number(departmentId) : null;
      if (!resolvedDeptId && department) {
        const deptRows = await query('SELECT id FROM departments WHERE name = ? LIMIT 1', [department]);
        if (deptRows.length > 0) resolvedDeptId = deptRows[0].id;
      }

      // Resolve salaryStructureId if name provided
      let resolvedStructureId = salaryStructureId ? Number(salaryStructureId) : null;
      if (!resolvedStructureId && salaryStructure) {
        const structRows = await query('SELECT id FROM salary_structures WHERE name = ? LIMIT 1', [salaryStructure]);
        if (structRows.length > 0) resolvedStructureId = structRows[0].id;
      }
      if (!resolvedStructureId) resolvedStructureId = 1;

      const cCode = contractCode || `CON-${employeeId}-${Date.now().toString().slice(-4)}`;

      // Strict Business Rule: Only ONE ACTIVE contract per employee at a time
      if (status === 'ACTIVE') {
        await query(
          'UPDATE contracts SET status = "EXPIRED", updated_at = NOW() WHERE employee_id = ? AND status = "ACTIVE"',
          [employeeId]
        );
      }

      const result = await query(
        `INSERT INTO contracts (contract_code, employee_id, department_id, job_position, wage, salary_structure_id, working_schedule_id, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cCode,
          employeeId,
          resolvedDeptId || null,
          resolvedPosition || null,
          parseFloat(resolvedWage) || 0,
          resolvedStructureId,
          workingScheduleId ? Number(workingScheduleId) : null,
          startDate,
          endDate || null,
          status
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
      if (req.user.role === 'EMPLOYEE') {
        return sendError(res, 'Forbidden: Employees are not permitted to edit contracts.', 403);
      }

      const { id } = req.params;
      const {
        departmentId,
        department,
        jobPosition,
        position,
        wage,
        salary,
        salaryStructureId,
        salaryStructure,
        workingScheduleId,
        startDate,
        endDate,
        status
      } = req.body;

      const existing = await query('SELECT * FROM contracts WHERE id = ?', [id]);
      if (existing.length === 0) {
        return sendError(res, 'Contract not found.', 404);
      }

      const normalizedStatus = status ? status.toUpperCase() : undefined;

      // Strict Business Rule: Only ONE ACTIVE contract per employee at a time
      if (normalizedStatus === 'ACTIVE') {
        await query(
          'UPDATE contracts SET status = "EXPIRED", updated_at = NOW() WHERE employee_id = ? AND status = "ACTIVE" AND id != ?',
          [existing[0].employee_id, id]
        );
      }

      // Resolve departmentId if name provided
      let resolvedDeptId = departmentId !== undefined ? (departmentId ? Number(departmentId) : null) : undefined;
      if (resolvedDeptId === undefined && department) {
        const deptRows = await query('SELECT id FROM departments WHERE name = ? LIMIT 1', [department]);
        if (deptRows.length > 0) resolvedDeptId = deptRows[0].id;
      }

      // Resolve salaryStructureId if name provided
      let resolvedStructureId = salaryStructureId !== undefined ? (salaryStructureId ? Number(salaryStructureId) : null) : undefined;
      if (resolvedStructureId === undefined && salaryStructure) {
        const structRows = await query('SELECT id FROM salary_structures WHERE name = ? LIMIT 1', [salaryStructure]);
        if (structRows.length > 0) resolvedStructureId = structRows[0].id;
      }

      const resolvedPosition = jobPosition !== undefined ? jobPosition : (position !== undefined ? position : undefined);
      const resolvedWage = wage !== undefined ? wage : (salary !== undefined ? salary : undefined);

      const fields = [];
      const params = [];

      if (resolvedDeptId !== undefined) {
        fields.push('department_id = ?');
        params.push(resolvedDeptId || null);
      }
      if (resolvedPosition !== undefined) {
        fields.push('job_position = ?');
        params.push(resolvedPosition || null);
      }
      if (resolvedWage !== undefined) {
        fields.push('wage = ?');
        params.push(parseFloat(resolvedWage) || 0);
      }
      if (resolvedStructureId !== undefined) {
        fields.push('salary_structure_id = ?');
        params.push(resolvedStructureId || null);
      }
      if (workingScheduleId !== undefined) {
        fields.push('working_schedule_id = ?');
        params.push(workingScheduleId ? Number(workingScheduleId) : null);
      }
      if (startDate !== undefined) {
        fields.push('start_date = ?');
        params.push(startDate || null);
      }
      if (endDate !== undefined) {
        fields.push('end_date = ?');
        params.push(endDate ? endDate : null);
      }
      if (normalizedStatus !== undefined) {
        fields.push('status = ?');
        params.push(normalizedStatus);
      }

      if (fields.length > 0) {
        fields.push('updated_at = NOW()');
        params.push(id);
        await query(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`, params);
      }

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
      if (req.user.role === 'EMPLOYEE') {
        return sendError(res, 'Forbidden: Employees are not permitted to delete contracts.', 403);
      }

      const { id } = req.params;
      await query('DELETE FROM contracts WHERE id = ?', [id]);
      return sendSuccess(res, 'Contract deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContractController();
