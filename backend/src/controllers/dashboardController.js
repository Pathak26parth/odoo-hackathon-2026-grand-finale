const { query } = require('../config/db');
const { sendSuccess } = require('../utils/response');

/**
 * Real-Time Dashboard & Analytics Controller
 * Calculates all live metrics and chart series directly from normalized MySQL records
 */
class DashboardController {
  /**
   * Get Live Dashboard Insights
   * GET /api/dashboard
   */
  async getDashboardMetrics(req, res, next) {
    try {
      const { period, departmentId } = req.query;

      // 1. KPI Cards: Total Active Employees, Total Net Salary Paid, Payslips Generated, Avg Salary
      let empSql = 'SELECT COUNT(*) AS total_employees FROM employees WHERE status = "ACTIVE"';
      const empParams = [];
      if (departmentId) {
        empSql += ' AND department_id = ?';
        empParams.push(departmentId);
      }
      const [empResult] = await query(empSql, empParams);

      // Payroll KPI metrics
      let payrollSql = `
        SELECT 
          COALESCE(SUM(p.net_amount), 0) AS total_net_paid,
          COUNT(p.id) AS total_payslips,
          COALESCE(AVG(p.net_amount), 0) AS average_salary
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        WHERE 1=1
      `;
      const payParams = [];
      if (departmentId) {
        payrollSql += ' AND e.department_id = ?';
        payParams.push(departmentId);
      }
      if (period) {
        payrollSql += ' AND p.period_start LIKE ?';
        payParams.push(`${period}%`);
      }
      const [payResult] = await query(payrollSql, payParams);

      // Approved Time Off KPI
      let leaveSql = `
        SELECT COALESCE(SUM(r.total_days), 0) AS approved_leave_days
        FROM time_off_requests r
        JOIN employees e ON r.employee_id = e.id
        WHERE r.status = 'APPROVED'
      `;
      const leaveParams = [];
      if (departmentId) {
        leaveSql += ' AND e.department_id = ?';
        leaveParams.push(departmentId);
      }
      if (period) {
        leaveSql += ' AND r.start_date LIKE ?';
        leaveParams.push(`${period}%`);
      }
      const [leaveResult] = await query(leaveSql, leaveParams);

      // Attendance Health % (Present on-time vs Late / Absent)
      let attSql = `
        SELECT 
          COUNT(*) AS total_punches,
          SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS on_time_count,
          SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
          SUM(CASE WHEN a.status = 'HALF_DAY' THEN 1 ELSE 0 END) AS half_day_count,
          SUM(CASE WHEN a.check_out IS NULL AND a.date < CURRENT_DATE THEN 1 ELSE 0 END) AS missing_checkouts,
          SUM(CASE WHEN a.is_manual_correction = TRUE THEN 1 ELSE 0 END) AS manual_edits,
          COALESCE(SUM(a.overtime_hours), 0) AS total_overtime_hours
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE 1=1
      `;
      const attParams = [];
      if (departmentId) {
        attSql += ' AND e.department_id = ?';
        attParams.push(departmentId);
      }
      if (period) {
        attSql += ' AND a.date LIKE ?';
        attParams.push(`${period}%`);
      }
      const [attResult] = await query(attSql, attParams);

      const totalPunches = parseInt(attResult.total_punches, 10) || 0;
      const onTimePunches = parseInt(attResult.on_time_count, 10) || 0;
      const attendanceHealth = totalPunches > 0 ? parseFloat(((onTimePunches / totalPunches) * 100).toFixed(1)) : 100.0;

      // 2. Department Breakdown (Headcount + Salary Expenditure)
      const deptBreakdown = await query(`
        SELECT 
          d.id,
          d.name AS department_name,
          d.code AS department_code,
          COUNT(DISTINCT e.id) AS employee_count,
          COALESCE(SUM(p.net_amount), 0) AS total_salary_cost,
          COALESCE(AVG(p.net_amount), 0) AS average_salary
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
        LEFT JOIN payslips p ON e.id = p.employee_id
        GROUP BY d.id
        ORDER BY total_salary_cost DESC
      `);

      // 3. Monthly Net Salary Trends (Historical data)
      const monthlyTrends = await query(`
        SELECT 
          DATE_FORMAT(period_end, '%Y-%m') AS month,
          DATE_FORMAT(period_end, '%b %Y') AS month_label,
          COALESCE(SUM(net_amount), 0) AS total_net_paid,
          COALESCE(SUM(gross_amount), 0) AS total_gross_cost,
          COUNT(id) AS payslips_count
        FROM payslips
        GROUP BY DATE_FORMAT(period_end, '%Y-%m'), DATE_FORMAT(period_end, '%b %Y')
        ORDER BY month ASC
        LIMIT 12
      `);

      // 4. Operational Alerts & Warnings
      const [missingBankCount] = await query(`
        SELECT COUNT(*) AS count
        FROM employees e
        LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
        WHERE e.status = 'ACTIVE' AND (ebd.account_number IS NULL OR ebd.ifsc_code IS NULL)
      `);

      const [missingContractCount] = await query(`
        SELECT COUNT(*) AS count
        FROM employees e
        LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'ACTIVE'
        WHERE e.status = 'ACTIVE' AND c.id IS NULL
      `);

      const [pendingLeaveCount] = await query(`
        SELECT COUNT(*) AS count
        FROM time_off_requests
        WHERE status = 'PENDING'
      `);

      return sendSuccess(res, 'Live dashboard metrics calculated', {
        kpi: {
          totalEmployees: parseInt(empResult.total_employees, 10) || 0,
          totalNetSalaryPaid: parseFloat(payResult.total_net_paid) || 0.00,
          payslipsGenerated: parseInt(payResult.total_payslips, 10) || 0,
          averageSalary: parseFloat(payResult.average_salary) || 0.00,
          approvedLeaveDays: parseFloat(leaveResult.approved_leave_days) || 0.00,
          attendanceHealthScore: attendanceHealth
        },
        attendanceOverview: {
          totalEntries: totalPunches,
          presentOnTime: onTimePunches,
          lateArrivals: parseInt(attResult.late_count, 10) || 0,
          halfDays: parseInt(attResult.half_day_count, 10) || 0,
          missingCheckouts: parseInt(attResult.missing_checkouts, 10) || 0,
          manualCorrections: parseInt(attResult.manual_edits, 10) || 0,
          totalOvertimeHours: parseFloat(attResult.total_overtime_hours) || 0.00
        },
        alerts: {
          missingBankDetails: missingBankCount.count,
          missingActiveContracts: missingContractCount.count,
          pendingTimeOffRequests: pendingLeaveCount.count
        },
        departmentBreakdown: deptBreakdown,
        monthlyTrends: monthlyTrends
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
