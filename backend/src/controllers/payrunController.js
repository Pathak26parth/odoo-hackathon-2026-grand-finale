const { query, transaction } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const payrollService = require('../services/payrollService');
const { generatePayslipPDF } = require('../utils/pdf');
const { sendPayslipEmail } = require('../services/emailService');
const STATUSES = require('../constants/statuses');

/**
 * Payrun Batch Processing Controller
 */
class PayrunController {
  /**
   * Wizard Step 1 & 2: Scope Validation & Eligible Employee Filtering
   * POST /api/payruns/validate-scope
   */
  async validateScope(req, res, next) {
    try {
      const { salaryStructureId, periodStart, periodEnd, employeeIds = [] } = req.body;

      if (!salaryStructureId || !periodStart || !periodEnd) {
        return sendError(res, 'salaryStructureId, periodStart, and periodEnd are required.', 400);
      }

      const result = await payrollService.validatePayrunScope({
        structureId: salaryStructureId,
        periodStart,
        periodEnd,
        employeeIds
      });

      return sendSuccess(res, 'Payrun scope validated', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all Payruns (Historical & Batches)
   * GET /api/payruns
   */
  async getPayruns(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          pr.*,
          ss.name AS structure_name,
          ss.code AS structure_code,
          CONCAT(c_emp.first_name, ' ', c_emp.last_name) AS created_by_name,
          CONCAT(v_emp.first_name, ' ', v_emp.last_name) AS validated_by_name
        FROM payruns pr
        LEFT JOIN salary_structures ss ON pr.salary_structure_id = ss.id
        LEFT JOIN users c_u ON pr.created_by = c_u.id
        LEFT JOIN employees c_emp ON c_u.employee_id = c_emp.id
        LEFT JOIN users v_u ON pr.validated_by = v_u.id
        LEFT JOIN employees v_emp ON v_u.employee_id = v_emp.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND pr.status = ?';
        params.push(status.toUpperCase());
      }

      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ' ORDER BY pr.period_end DESC, pr.id DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const payruns = await query(sql, params);

      return sendSuccess(res, 'Payruns retrieved', {
        payruns,
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
   * Get Payrun by ID (with summary list of child payslips)
   * GET /api/payruns/:id
   */
  async getPayrunById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          pr.*,
          ss.name AS structure_name,
          ss.code AS structure_code,
          CONCAT(c_emp.first_name, ' ', c_emp.last_name) AS created_by_name,
          CONCAT(v_emp.first_name, ' ', v_emp.last_name) AS validated_by_name
        FROM payruns pr
        LEFT JOIN salary_structures ss ON pr.salary_structure_id = ss.id
        LEFT JOIN users c_u ON pr.created_by = c_u.id
        LEFT JOIN employees c_emp ON c_u.employee_id = c_emp.id
        LEFT JOIN users v_u ON pr.validated_by = v_u.id
        LEFT JOIN employees v_emp ON v_u.employee_id = v_emp.id
        WHERE pr.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Payrun not found.', 404);
      }

      const payrun = rows[0];

      // Fetch Child Payslips
      const slipSql = `
        SELECT 
          p.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          c.wage AS contract_wage
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN contracts c ON p.contract_id = c.id
        WHERE p.payrun_id = ?
        ORDER BY p.id ASC
      `;
      const payslips = await query(slipSql, [id]);
      payrun.payslips = payslips;

      return sendSuccess(res, 'Payrun retrieved', payrun);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create & Compute Payrun Batch (Wizard Step 2 confirmation)
   * POST /api/payruns
   */
  async createPayrun(req, res, next) {
    try {
      const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = req.body;

      const result = await payrollService.createAndComputePayrun({
        name,
        structureId: salaryStructureId,
        periodStart,
        periodEnd,
        selectedEmployeeIds: employeeIds,
        createdByUserId: req.user.id
      });

      return sendCreated(res, 'Payrun initialized and employee payslips computed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recompute Payrun Batch
   * POST /api/payruns/:id/compute
   */
  async computePayrun(req, res, next) {
    try {
      const { id } = req.params;
      const result = await payrollService.recomputePayrun(id, req.user?.id);
      return sendSuccess(res, 'Payrun recomputed successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate Payrun (Locks calculations)
   * POST /api/payruns/:id/validate
   */
  async validatePayrun(req, res, next) {
    try {
      const { id } = req.params;

      const rows = await query('SELECT * FROM payruns WHERE id = ?', [id]);
      if (rows.length === 0) return sendError(res, 'Payrun not found.', 404);

      const payrun = rows[0];
      if (payrun.status !== 'COMPUTED') {
        return sendError(res, `Cannot validate payrun in status "${payrun.status}". Must be in COMPUTED status.`, 400);
      }

      await query(
        `UPDATE payruns 
         SET status = 'VALIDATED', validated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [req.user.id, id]
      );

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description)
         VALUES (?, 'PAYRUN_VALIDATED', 'Payruns', ?, 'Validated payrun batch')`,
        [req.user.id, String(id)]
      );

      return sendSuccess(res, 'Payrun validated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark Payrun as Paid
   * POST /api/payruns/:id/pay
   */
  async markPaid(req, res, next) {
    try {
      const { id } = req.params;

      const rows = await query('SELECT * FROM payruns WHERE id = ?', [id]);
      if (rows.length === 0) return sendError(res, 'Payrun not found.', 404);

      const payrun = rows[0];
      if (payrun.status !== 'VALIDATED') {
        return sendError(res, `Cannot mark paid before validation. Current status: "${payrun.status}".`, 400);
      }

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE payruns 
           SET status = 'PAID', paid_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [id]
        );

        await connection.execute(
          `UPDATE payslips 
           SET payment_status = 'PAID', updated_at = NOW() 
           WHERE payrun_id = ?`,
          [id]
        );

        await connection.execute(
          `INSERT INTO audit_logs (user_id, action, module, record_id, description)
           VALUES (?, 'PAYRUN_PAID', 'Payruns', ?, 'Marked payrun batch as PAID')`,
          [req.user.id, String(id)]
        );
      });

      return sendSuccess(res, 'Payrun and all associated payslips marked as PAID.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send Payslips in Bulk to Employees via Email
   * POST /api/payruns/:id/send-payslips
   */
  async sendPayslipsBulk(req, res, next) {
    try {
      const { id } = req.params;

      const rows = await query('SELECT * FROM payruns WHERE id = ?', [id]);
      if (rows.length === 0) return sendError(res, 'Payrun not found.', 404);

      const payrun = rows[0];
      if (payrun.status !== 'PAID' && payrun.status !== 'VALIDATED') {
        return sendError(res, 'Cannot send payslips before payrun is validated or paid.', 400);
      }

      const slipSql = `
        SELECT 
          p.*,
          e.first_name,
          e.last_name,
          e.email,
          e.employee_code,
          e.job_position,
          d.name AS department_name,
          ss.name AS structure_name,
          ebd.account_number
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
        WHERE p.payrun_id = ?
      `;
      const payslips = await query(slipSql, [id]);

      let dispatchedCount = 0;

      for (const slip of payslips) {
        // Fetch lines
        const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [slip.id]);
        slip.lines = lines;

        const pdfBuffer = await generatePayslipPDF(slip);

        sendPayslipEmail({
          name: `${slip.first_name} ${slip.last_name}`,
          email: slip.email,
          period: `${slip.period_start} to ${slip.period_end}`,
          netSalary: slip.net_amount,
          pdfBuffer
        }).catch(err => console.error(`[Bulk Payslip Email Error for ${slip.email}]:`, err));

        await query('UPDATE payslips SET email_sent_at = NOW() WHERE id = ?', [slip.id]);
        dispatchedCount++;
      }

      // Audit Log
      await query(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description)
         VALUES (?, 'PAYSLIPS_SENT_BULK', 'Payruns', ?, ?)`,
        [req.user.id, String(id), `Dispatched ${dispatchedCount} payslip emails for payrun ${payrun.run_code}`]
      );

      return sendSuccess(res, `Dispatched ${dispatchedCount} payslips via email to employees.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Draft Payrun
   * DELETE /api/payruns/:id
   */
  async deletePayrun(req, res, next) {
    try {
      const { id } = req.params;

      const rows = await query('SELECT * FROM payruns WHERE id = ?', [id]);
      if (rows.length === 0) return sendError(res, 'Payrun not found.', 404);

      const payrun = rows[0];
      if (payrun.status === 'PAID') {
        return sendError(res, 'Cannot delete a finalized PAID payrun. Historical records are preserved.', 400);
      }

      await query('DELETE FROM payruns WHERE id = ?', [id]);
      return sendSuccess(res, 'Payrun and associated draft payslips deleted.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayrunController();
