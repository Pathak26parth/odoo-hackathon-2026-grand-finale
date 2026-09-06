const { query, transaction } = require('../config/db');
const payrollService = require('./payrollService');
const { generatePayslipPDF } = require('../utils/pdf');
const { sendPayslipEmail } = require('./emailService');

/**
 * Dedicated Payroll Admin Service
 * Core business engine for pre-payroll audits, rule simulation, financial aggregations, and batch operations
 */
class PayrollAdminService {
  /**
   * Get Consolidated Payroll Admin Overview
   */
  async getOverviewMetrics({ period = null, departmentId = null } = {}) {
    // 1. All-time and Period-Specific Payrun Pipeline Counts
    const payrunStatusCounts = await query(`
      SELECT 
        status,
        COUNT(*) AS count,
        COALESCE(SUM(total_gross), 0) AS total_gross,
        COALESCE(SUM(total_deductions), 0) AS total_deductions,
        COALESCE(SUM(total_net), 0) AS total_net,
        COALESCE(SUM(employee_count), 0) AS total_slips
      FROM payruns
      GROUP BY status
    `);

    const pipeline = {
      DRAFT: { count: 0, gross: 0, deductions: 0, net: 0, slips: 0 },
      COMPUTED: { count: 0, gross: 0, deductions: 0, net: 0, slips: 0 },
      VALIDATED: { count: 0, gross: 0, deductions: 0, net: 0, slips: 0 },
      PAID: { count: 0, gross: 0, deductions: 0, net: 0, slips: 0 }
    };

    payrunStatusCounts.forEach((row) => {
      if (pipeline[row.status]) {
        pipeline[row.status] = {
          count: parseInt(row.count, 10) || 0,
          gross: parseFloat(row.total_gross) || 0,
          deductions: parseFloat(row.total_deductions) || 0,
          net: parseFloat(row.total_net) || 0,
          slips: parseInt(row.total_slips, 10) || 0
        };
      }
    });

    // 2. Active Employee & Contract Headcount
    let empSql = 'SELECT COUNT(*) AS total FROM employees WHERE status = "ACTIVE"';
    const empParams = [];
    if (departmentId) {
      empSql += ' AND department_id = ?';
      empParams.push(departmentId);
    }
    const [empCountRow] = await query(empSql, empParams);
    const totalActiveEmployees = empCountRow.total || 0;

    let contractSql = `
      SELECT 
        COUNT(c.id) AS active_contracts,
        COALESCE(SUM(c.wage), 0) AS total_wages,
        COALESCE(AVG(c.wage), 0) AS average_wage
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      WHERE c.status = 'ACTIVE' AND e.status = 'ACTIVE'
    `;
    const contractParams = [];
    if (departmentId) {
      contractSql += ' AND e.department_id = ?';
      contractParams.push(departmentId);
    }
    const [contractStats] = await query(contractSql, contractParams);

    // 3. Current or Latest Period Payslip Metrics
    let payslipSql = `
      SELECT 
        COALESCE(SUM(p.gross_amount), 0) AS period_gross,
        COALESCE(SUM(p.deduction_amount), 0) AS period_deductions,
        COALESCE(SUM(p.net_amount), 0) AS period_net,
        COUNT(p.id) AS period_payslips
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const payslipParams = [];
    if (period) {
      payslipSql += ' AND p.period_start LIKE ?';
      payslipParams.push(`${period}%`);
    }
    if (departmentId) {
      payslipSql += ' AND e.department_id = ?';
      payslipParams.push(departmentId);
    }
    const [payslipStats] = await query(payslipSql, payslipParams);

    // 4. Counts of Active Structures and Rules
    const [structCount] = await query('SELECT COUNT(*) AS count FROM salary_structures WHERE status = "ACTIVE"');
    const [ruleCount] = await query('SELECT COUNT(*) AS count FROM salary_rules WHERE status = "ACTIVE"');

    // 5. Pre-payroll Quick Health Check Counts
    const [missingBankCount] = await query(`
      SELECT COUNT(DISTINCT e.id) AS count
      FROM employees e
      LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
      WHERE e.status = 'ACTIVE' AND (ebd.account_number IS NULL OR ebd.ifsc_code IS NULL OR ebd.account_number = '' OR ebd.ifsc_code = '')
    `);

    const [missingContractCount] = await query(`
      SELECT COUNT(DISTINCT e.id) AS count
      FROM employees e
      LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'ACTIVE'
      WHERE e.status = 'ACTIVE' AND c.id IS NULL
    `);

    const [pendingLeaveCount] = await query(`
      SELECT COUNT(*) AS count
      FROM time_off_requests
      WHERE status = 'PENDING'
    `);

    // 6. Recent 5 Payruns with Structure & User details
    const recentPayruns = await query(`
      SELECT 
        pr.*,
        ss.name AS structure_name,
        ss.code AS structure_code,
        CONCAT(c_emp.first_name, ' ', c_emp.last_name) AS created_by_name
      FROM payruns pr
      LEFT JOIN salary_structures ss ON pr.salary_structure_id = ss.id
      LEFT JOIN users c_u ON pr.created_by = c_u.id
      LEFT JOIN employees c_emp ON c_u.employee_id = c_emp.id
      ORDER BY pr.id DESC
      LIMIT 5
    `);

    return {
      financials: {
        totalActiveEmployees,
        activeContractsCount: contractStats.active_contracts || 0,
        monthlyWageLiability: parseFloat(contractStats.total_wages) || 0,
        averageWage: parseFloat(contractStats.average_wage) || 0,
        periodGross: parseFloat(payslipStats.period_gross) || 0,
        periodDeductions: parseFloat(payslipStats.period_deductions) || 0,
        periodNet: parseFloat(payslipStats.period_net) || 0,
        periodPayslipsCount: parseInt(payslipStats.period_payslips, 10) || 0
      },
      pipeline,
      configuration: {
        activeStructures: structCount.count || 0,
        activeRules: ruleCount.count || 0
      },
      preflightAlerts: {
        missingBankDetails: missingBankCount.count || 0,
        missingContracts: missingContractCount.count || 0,
        pendingLeaves: pendingLeaveCount.count || 0,
        isClearForPayrun: (missingBankCount.count === 0 && missingContractCount.count === 0)
      },
      recentPayruns
    };
  }

  /**
   * Run Comprehensive Pre-Payroll Compliance Audit Engine
   * Returns itemized blockers, warnings, and calculated readiness score
   */
  async runComplianceCheck({ period = null } = {}) {
    // 1. Total active workforce
    const activeEmployees = await query(`
      SELECT 
        e.id, 
        e.employee_code, 
        e.first_name, 
        e.last_name, 
        e.email, 
        e.job_position,
        d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'ACTIVE'
      ORDER BY e.id ASC
    `);

    const totalActive = activeEmployees.length;

    // 2. Audit: Missing Bank Details
    const missingBankEmployees = await query(`
      SELECT 
        e.id, 
        e.employee_code, 
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        e.email,
        d.name AS department_name,
        ebd.account_number,
        ebd.ifsc_code
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
      WHERE e.status = 'ACTIVE' 
        AND (ebd.account_number IS NULL OR ebd.ifsc_code IS NULL OR ebd.account_number = '' OR ebd.ifsc_code = '')
    `);

    // 3. Audit: Missing Active Contracts
    const missingContractEmployees = await query(`
      SELECT 
        e.id, 
        e.employee_code, 
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        e.email,
        d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'ACTIVE'
      WHERE e.status = 'ACTIVE' AND c.id IS NULL
    `);

    // 4. Audit: Contracts without Valid Salary Structure
    const unassignedStructureContracts = await query(`
      SELECT 
        c.id AS contract_id,
        c.contract_code,
        c.wage,
        e.id AS employee_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        d.name AS department_name
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
      WHERE c.status = 'ACTIVE' AND (c.salary_structure_id IS NULL OR ss.id IS NULL OR ss.status != 'ACTIVE')
    `);

    // 5. Audit: Pending Leave Requests
    let leaveSql = `
      SELECT 
        r.id AS request_id,
        r.start_date,
        r.end_date,
        r.total_days,
        r.reason,
        tot.name AS leave_type,
        e.id AS employee_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        d.name AS department_name
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN time_off_types tot ON r.time_off_type_id = tot.id
      WHERE r.status = 'PENDING'
    `;
    const leaveParams = [];
    if (period) {
      leaveSql += ' AND (r.start_date LIKE ? OR r.end_date LIKE ?)';
      leaveParams.push(`${period}%`, `${period}%`);
    }
    const pendingLeaves = await query(leaveSql, leaveParams);

    // 6. Audit: Attendance Exceptions (Missing Checkouts)
    let attSql = `
      SELECT 
        a.id AS attendance_id,
        a.date,
        a.check_in,
        a.status,
        e.id AS employee_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) AS full_name,
        d.name AS department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.check_out IS NULL AND a.date < CURRENT_DATE
    `;
    const attParams = [];
    if (period) {
      attSql += ' AND a.date LIKE ?';
      attParams.push(`${period}%`);
    }
    attSql += ' LIMIT 20';
    const missingCheckouts = await query(attSql, attParams);

    // 7. Audit: Duplicate Payslips or Period Overlaps
    let duplicatePayslips = [];
    if (period) {
      duplicatePayslips = await query(`
        SELECT 
          p.employee_id,
          e.employee_code,
          CONCAT(e.first_name, ' ', e.last_name) AS full_name,
          COUNT(p.id) AS slip_count
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        WHERE p.period_start LIKE ?
        GROUP BY p.employee_id
        HAVING COUNT(p.id) > 1
      `, [`${period}%`]);
    }

    // Calculate overall compliance readiness score
    const blockerCount = missingBankEmployees.length + missingContractEmployees.length + unassignedStructureContracts.length;
    const warningCount = pendingLeaves.length + missingCheckouts.length + duplicatePayslips.length;

    let deduction = (missingBankEmployees.length * 15) + (missingContractEmployees.length * 20) + (unassignedStructureContracts.length * 20) + (pendingLeaves.length * 5) + (missingCheckouts.length * 3);
    const score = Math.max(0, Math.min(100, 100 - deduction));

    return {
      readinessScore: score,
      status: score >= 90 ? 'EXCELLENT' : score >= 70 ? 'MODERATE' : 'CRITICAL',
      totalActiveEmployees: totalActive,
      summary: {
        blockerCount,
        warningCount,
        isPayrunReady: blockerCount === 0
      },
      auditChecks: [
        {
          id: 'missing_contracts',
          title: 'Active Employment Contracts',
          description: 'Every active employee must have exactly one active contract specifying base wage and salary structure.',
          severity: 'BLOCKER',
          failedCount: missingContractEmployees.length,
          passed: missingContractEmployees.length === 0,
          items: missingContractEmployees,
          actionLabel: 'Assign Contracts',
          actionUrl: '/contracts/new'
        },
        {
          id: 'missing_bank',
          title: 'Employee Bank & IFSC Details',
          description: 'Direct salary disbursement requires valid Bank Account number and IFSC code.',
          severity: 'BLOCKER',
          failedCount: missingBankEmployees.length,
          passed: missingBankEmployees.length === 0,
          items: missingBankEmployees,
          actionLabel: 'Update Bank Details',
          actionUrl: '/employees'
        },
        {
          id: 'unassigned_structures',
          title: 'Salary Structure Bindings',
          description: 'Contracts must link to an active configured salary structure containing active rules.',
          severity: 'BLOCKER',
          failedCount: unassignedStructureContracts.length,
          passed: unassignedStructureContracts.length === 0,
          items: unassignedStructureContracts,
          actionLabel: 'Configure Structures',
          actionUrl: '/payroll/salary-structures'
        },
        {
          id: 'pending_leaves',
          title: 'Pending Time Off Approvals',
          description: 'Unapproved leave requests within the payroll period may result in incorrect worked day or LOP deductions.',
          severity: 'WARNING',
          failedCount: pendingLeaves.length,
          passed: pendingLeaves.length === 0,
          items: pendingLeaves,
          actionLabel: 'Review Time Off',
          actionUrl: '/time-off/requests'
        },
        {
          id: 'missing_checkouts',
          title: 'Attendance Shift Exceptions',
          description: 'Punches without check-out timestamps may cause discrepancies in total worked hours computation.',
          severity: 'WARNING',
          failedCount: missingCheckouts.length,
          passed: missingCheckouts.length === 0,
          items: missingCheckouts,
          actionLabel: 'Audit Attendance',
          actionUrl: '/attendance'
        },
        {
          id: 'duplicate_slips',
          title: 'Duplicate Payslip Prevention',
          description: 'Employees should not have multiple payslips processed in the same period scope.',
          severity: 'BLOCKER',
          failedCount: duplicatePayslips.length,
          passed: duplicatePayslips.length === 0,
          items: duplicatePayslips,
          actionLabel: 'View Payslips',
          actionUrl: '/payroll/payslips'
        }
      ]
    };
  }

  /**
   * Deep Payroll Analytics for Command Center
   */
  async getPayrollAnalytics() {
    // 1. Monthly Trends (Net & Gross for last 12 months)
    const monthlyTrends = await query(`
      SELECT 
        DATE_FORMAT(p.period_end, '%Y-%m') AS month_key,
        DATE_FORMAT(p.period_end, '%b %Y') AS month_label,
        COALESCE(SUM(p.gross_amount), 0) AS total_gross,
        COALESCE(SUM(p.deduction_amount), 0) AS total_deductions,
        COALESCE(SUM(p.net_amount), 0) AS total_net,
        COUNT(p.id) AS payslips_count,
        COALESCE(AVG(p.net_amount), 0) AS average_net
      FROM payslips p
      GROUP BY DATE_FORMAT(p.period_end, '%Y-%m'), DATE_FORMAT(p.period_end, '%b %Y')
      ORDER BY month_key ASC
      LIMIT 12
    `);

    // 2. Department Breakdown
    const departmentBreakdown = await query(`
      SELECT 
        d.id,
        d.name AS department_name,
        d.code AS department_code,
        COUNT(DISTINCT e.id) AS headcount,
        COALESCE(SUM(p.net_amount), 0) AS total_net_cost,
        COALESCE(SUM(p.gross_amount), 0) AS total_gross_cost,
        COALESCE(AVG(p.net_amount), 0) AS average_net
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
      LEFT JOIN payslips p ON e.id = p.employee_id
      GROUP BY d.id
      ORDER BY total_net_cost DESC
    `);

    // 3. Component Category Distribution (Basic vs HRA vs Allowances vs PF vs PT vs TDS)
    const componentDistribution = await query(`
      SELECT 
        pl.category,
        pl.code,
        pl.name,
        COALESCE(SUM(pl.amount), 0) AS total_amount
      FROM payslip_lines pl
      JOIN payslips p ON pl.payslip_id = p.id
      GROUP BY pl.category, pl.code, pl.name
      ORDER BY pl.category ASC, total_amount DESC
    `);

    return {
      monthlyTrends,
      departmentBreakdown,
      componentDistribution
    };
  }

  /**
   * Interactive Salary Rule Calculation Simulator
   * Allows Payroll Admin to test formula/rule sequencing dynamically for any wage and structure
   */
  async simulateSalaryRuleComputation({ wage, structureId = 1 }) {
    const numWage = parseFloat(wage);
    if (isNaN(numWage) || numWage <= 0) {
      const err = new Error('Base wage must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    // Fetch structure details
    const structRows = await query('SELECT * FROM salary_structures WHERE id = ?', [structureId]);
    if (structRows.length === 0) {
      const err = new Error(`Salary structure with ID ${structureId} not found`);
      err.statusCode = 404;
      throw err;
    }
    const structure = structRows[0];

    // Fetch ordered rules
    const rules = await query(`
      SELECT sr.*, ssr.sequence AS structure_sequence
      FROM salary_rules sr
      JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
      WHERE ssr.salary_structure_id = ? AND sr.status = 'ACTIVE'
      ORDER BY ssr.sequence ASC, sr.sequence ASC
    `, [structureId]);

    if (rules.length === 0) {
      const err = new Error('Selected salary structure has no active salary rules assigned');
      err.statusCode = 400;
      throw err;
    }

    // Simulation context
    const context = {
      wage: numWage,
      BASIC: 0,
      GROSS: 0,
      NET: 0,
      TOTAL_DED: 0
    };

    const simulatedLines = [];
    let grossAccumulator = 0;
    let deductionAccumulator = 0;

    for (const rule of rules) {
      let lineAmount = 0;
      const compType = rule.computation_type;
      const ruleVal = parseFloat(rule.value) || 0;
      let formulaExpression = rule.formula || '';

      if (compType === 'FIXED') {
        lineAmount = ruleVal;
      } else if (compType === 'PERCENTAGE') {
        if (rule.category === 'DEDUCTION') {
          // Typically percentage of BASIC or GROSS
          const base = context.BASIC > 0 ? context.BASIC : numWage;
          lineAmount = Math.round(((base * ruleVal) / 100) * 100) / 100;
        } else {
          // Allowance percentage of wage or BASIC
          lineAmount = Math.round(((numWage * ruleVal) / 100) * 100) / 100;
        }
      } else if (compType === 'FORMULA') {
        // Evaluate dynamic formula using safe token replacement
        try {
          let expr = formulaExpression
            .replace(/contract\.wage/gi, String(numWage))
            .replace(/\bwage\b/gi, String(numWage));

          // Replace known evaluated rule codes
          Object.keys(context).forEach((key) => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            expr = expr.replace(regex, String(context[key]));
          });

          // Safe math evaluation
          if (/^[0-9+\-*/().\s]+$/.test(expr)) {
            lineAmount = Math.round(Function(`'use strict'; return (${expr})`)() * 100) / 100;
          } else {
            lineAmount = 0;
          }
        } catch {
          lineAmount = 0;
        }
      }

      // Safeguard against negative values
      lineAmount = Math.max(0, lineAmount);

      // Record in context for subsequent rules
      context[rule.code] = lineAmount;

      if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE') {
        grossAccumulator += lineAmount;
      } else if (rule.category === 'GROSS') {
        context.GROSS = lineAmount || grossAccumulator;
      } else if (rule.category === 'DEDUCTION') {
        deductionAccumulator += lineAmount;
        context.TOTAL_DED = deductionAccumulator;
      } else if (rule.category === 'NET') {
        context.NET = lineAmount || Math.max(0, context.GROSS - deductionAccumulator);
      }

      simulatedLines.push({
        ruleId: rule.id,
        sequence: rule.structure_sequence || rule.sequence,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        computationType: rule.computation_type,
        formula: rule.formula || `${rule.value}%`,
        amount: lineAmount
      });
    }

    const finalGross = context.GROSS || grossAccumulator;
    const finalDeductions = context.TOTAL_DED || deductionAccumulator;
    const finalNet = context.NET || Math.max(0, finalGross - finalDeductions);

    return {
      wage: numWage,
      structure: {
        id: structure.id,
        name: structure.name,
        code: structure.code
      },
      summary: {
        gross: finalGross,
        totalDeductions: finalDeductions,
        net: finalNet
      },
      lines: simulatedLines
    };
  }

  /**
   * Get Payroll Specific Audit Trail
   */
  async getPayrollAuditLogs({ limit = 25 } = {}) {
    const logs = await query(`
      SELECT 
        al.*,
        u.email AS user_email,
        r.display_name AS user_role,
        CONCAT(e.first_name, ' ', e.last_name) AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE al.module IN ('Payruns', 'Payslips', 'SalaryStructures', 'SalaryRules', 'Contracts')
      ORDER BY al.id DESC
      LIMIT ?
    `, [parseInt(limit, 10)]);

    return logs;
  }

  /**
   * Execute Administrative Bulk Actions
   */
  async executeBulkAction({ action, payrunIds = [], userId, ip = null, userAgent = null }) {
    if (!Array.isArray(payrunIds) || payrunIds.length === 0) {
      const err = new Error('payrunIds array is required and cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    let affected = 0;

    if (action === 'validate-all') {
      const placeholders = payrunIds.map(() => '?').join(',');
      const [result] = await query(
        `UPDATE payruns 
         SET status = 'VALIDATED', validated_by = ?, updated_at = NOW() 
         WHERE id IN (${placeholders}) AND status = 'COMPUTED'`,
        [userId, ...payrunIds]
      );
      affected = result.affectedRows;

      await query(
        `INSERT INTO audit_logs (user_id, action, module, description, ip_address, user_agent)
         VALUES (?, 'BULK_VALIDATE', 'Payruns', ?, ?, ?)`,
        [userId, `Bulk validated ${affected} payrun batch(es)`, ip, userAgent]
      );
    } else if (action === 'pay-all') {
      await transaction(async (connection) => {
        const placeholders = payrunIds.map(() => '?').join(',');
        const [payrunRes] = await connection.execute(
          `UPDATE payruns 
           SET status = 'PAID', paid_at = NOW(), updated_at = NOW() 
           WHERE id IN (${placeholders}) AND status = 'VALIDATED'`,
          payrunIds
        );
        affected = payrunRes.affectedRows;

        await connection.execute(
          `UPDATE payslips 
           SET payment_status = 'PAID', updated_at = NOW() 
           WHERE payrun_id IN (${placeholders})`,
          payrunIds
        );

        await connection.execute(
          `INSERT INTO audit_logs (user_id, action, module, description, ip_address, user_agent)
           VALUES (?, 'BULK_PAY', 'Payruns', ?, ?, ?)`,
          [userId, `Bulk marked ${affected} payrun batch(es) and child payslips as PAID`, ip, userAgent]
        );
      });
    } else {
      const err = new Error(`Unsupported bulk action "${action}". Allowed: validate-all, pay-all`);
      err.statusCode = 400;
      throw err;
    }

    return {
      action,
      affectedPayruns: affected,
      message: `Successfully executed "${action}" on ${affected} payrun batch(es).`
    };
  }
}

module.exports = new PayrollAdminService();
