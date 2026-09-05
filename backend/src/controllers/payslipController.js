const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { generatePayslipPDF } = require('../utils/pdf');
const { sendPayslipEmail } = require('../services/emailService');

/**
 * Individual Payslip Controller
 */
class PayslipController {
  /**
   * Get Payslips (with pagination & filters)
   * GET /api/payslips
   */
  async getPayslips(req, res, next) {
    try {
      const { employeeId, payrunId, periodStart, periodEnd, status, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          p.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          pr.run_code,
          pr.name AS payrun_name,
          ss.name AS structure_name
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN payruns pr ON p.payrun_id = pr.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        WHERE 1=1
      `;
      const params = [];

      // If logged in as standard Employee, restrict to own payslips
      if (req.user.role === 'EMPLOYEE') {
        sql += ' AND p.employee_id = ?';
        params.push(req.user.employeeId);
      } else if (employeeId) {
        sql += ' AND p.employee_id = ?';
        params.push(employeeId);
      }

      if (payrunId) {
        sql += ' AND p.payrun_id = ?';
        params.push(payrunId);
      }
      if (status) {
        sql += ' AND p.payment_status = ?';
        params.push(status.toUpperCase());
      }
      if (periodStart && periodEnd) {
        sql += ' AND p.period_start >= ? AND p.period_end <= ?';
        params.push(periodStart, periodEnd);
      }

      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ' ORDER BY p.period_end DESC, p.id DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const payslips = await query(sql, params);

      return sendSuccess(res, 'Payslips retrieved', {
        payslips,
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
   * Get Payslip by ID (with rule lines)
   * GET /api/payslips/:id
   */
  async getPayslipById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          p.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.email,
          e.job_position,
          d.name AS department_name,
          pr.run_code,
          pr.name AS payrun_name,
          ss.name AS structure_name,
          c.wage AS contract_wage
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN payruns pr ON p.payrun_id = pr.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        LEFT JOIN contracts c ON p.contract_id = c.id
        WHERE p.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Payslip not found.', 404);
      }

      const payslip = rows[0];

      // If logged in as standard Employee, restrict to own record
      if (req.user.role === 'EMPLOYEE' && payslip.employee_id !== req.user.employeeId) {
        return sendError(res, 'Forbidden: You can only view your own payslips.', 403);
      }

      // Fetch Lines
      const lines = await query(
        'SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC',
        [id]
      );
      payslip.lines = lines;

      return sendSuccess(res, 'Payslip details retrieved', payslip);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download Payslip PDF
   * GET /api/payslips/:id/pdf
   */
  async downloadPDF(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          p.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.email,
          e.job_position,
          d.name AS department_name,
          ss.name AS structure_name,
          ebd.account_number
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
        WHERE p.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Payslip not found.', 404);
      }

      const payslip = rows[0];

      if (req.user.role === 'EMPLOYEE' && payslip.employee_id !== req.user.employeeId) {
        return sendError(res, 'Forbidden: You can only view your own payslips.', 403);
      }

      const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [id]);
      payslip.lines = lines;

      const pdfBuffer = await generatePayslipPDF(payslip);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payslip.payslip_code}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send Individual Payslip Email
   * POST /api/payslips/:id/send
   */
  async sendEmail(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          p.*,
          e.first_name,
          e.last_name,
          e.email,
          e.employee_code,
          e.job_position,
          d.name AS department_name,
          ss.name AS structure_name
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
        WHERE p.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Payslip not found.', 404);
      }

      const payslip = rows[0];
      const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [id]);
      payslip.lines = lines;

      const pdfBuffer = await generatePayslipPDF(payslip);

      await sendPayslipEmail({
        name: `${payslip.first_name} ${payslip.last_name}`,
        email: payslip.email,
        period: `${payslip.period_start} to ${payslip.period_end}`,
        netSalary: payslip.net_amount,
        pdfBuffer
      });

      await query('UPDATE payslips SET email_sent_at = NOW() WHERE id = ?', [id]);

      return sendSuccess(res, `Payslip emailed successfully to ${payslip.email}`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayslipController();
