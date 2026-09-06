const { query, transaction } = require('../config/db');
const STATUSES = require('../constants/statuses');

/**
 * Payroll & Salary Computation Engine
 */
class PayrollService {
  /**
   * Find the active contract applicable to the specific payroll period
   * (Does not simply pick the latest contract; resolves period validity)
   */
  async getApplicableContract(employeeId, periodStart, periodEnd) {
    const sql = `
      SELECT c.*, ss.name AS structure_name, ss.code AS structure_code
      FROM contracts c
      JOIN salary_structures ss ON c.salary_structure_id = ss.id
      WHERE c.employee_id = ?
        AND c.status = 'ACTIVE'
        AND c.start_date <= ?
        AND (c.end_date IS NULL OR c.end_date >= ?)
      ORDER BY c.start_date DESC
      LIMIT 1
    `;
    const rows = await query(sql, [employeeId, periodEnd, periodStart]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Compute Salary Breakdown using ordered Salary Rules
   */
  async computeSalary({ contract, structureId, workedDays = 30, totalWorkingDays = 30 }) {
    // 1. Fetch all ordered salary rules for this structure
    const ruleSql = `
      SELECT sr.*, ssr.sequence AS structure_sequence
      FROM salary_rules sr
      JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
      WHERE ssr.salary_structure_id = ? AND sr.status = 'ACTIVE'
      ORDER BY ssr.sequence ASC, sr.sequence ASC
    `;
    const rules = await query(ruleSql, [structureId]);

    const wage = parseFloat(contract.wage) || 0.00;
    const prorationFactor = totalWorkingDays > 0 ? Math.min(1, workedDays / totalWorkingDays) : 1;

    const context = {
      wage,
      workedDays,
      totalWorkingDays,
      BASIC: 0,
      HRA: 0,
      SA: 0,
      GROSS: 0,
      PF: 0,
      PT: 0,
      TDS: 0,
      TOTAL_DED: 0,
      NET: 0
    };

    const computedLines = [];
    let grossTotal = 0;
    let deductionTotal = 0;

    for (const rule of rules) {
      let amount = 0;

      switch (rule.code) {
        case 'BASIC':
          // Default: 50% of contract wage
          amount = wage * 0.50 * prorationFactor;
          context.BASIC = amount;
          break;

        case 'HRA':
          // Default: 50% of Basic
          amount = context.BASIC * 0.50;
          context.HRA = amount;
          break;

        case 'SA':
          // Special Allowance: Balance of prorated wage
          const proratedWage = wage * prorationFactor;
          amount = Math.max(0, proratedWage - (context.BASIC + context.HRA));
          context.SA = amount;
          break;

        case 'GROSS':
          amount = context.BASIC + context.HRA + context.SA;
          context.GROSS = amount;
          grossTotal = amount;
          break;

        case 'PF':
          // 12% of Basic
          amount = context.BASIC * 0.12;
          context.PF = amount;
          break;

        case 'PT':
          // Fixed 200 INR per month (exempt if wage < 12000)
          amount = wage > 12000 ? (parseFloat(rule.value) || 200.00) : 0.00;
          context.PT = amount;
          break;

        case 'TDS':
          // 10% on gross earnings
          amount = context.GROSS * 0.10;
          context.TDS = amount;
          break;

        case 'TOTAL_DED':
        case 'TD':
        case 'TOTAL_DEDUCTION':
        case 'TOTAL_DEDUCTIONS':
        case 'TOT_DED':
          amount = (context.PF || 0) + (context.PT || 0) + (context.TDS || 0);
          if (deductionTotal > 0 && amount === 0) {
            amount = deductionTotal;
          }
          context.TOTAL_DED = amount;
          context.TD = amount;
          deductionTotal = amount;
          break;

        case 'NET':
        case 'NET_PAY':
        case 'NET_SALARY':
          const dedToDeduct = context.TOTAL_DED || context.TD || deductionTotal;
          amount = Math.max(0, context.GROSS - dedToDeduct);
          context.NET = amount;
          break;

        default:
          if (rule.computation_type === 'FIXED') {
            amount = parseFloat(rule.value) || 0.00;
          } else if (rule.computation_type === 'PERCENTAGE') {
            amount = context.BASIC * (parseFloat(rule.value) / 100);
          } else {
            amount = parseFloat(rule.value) || 0.00;
          }

          if (rule.category === 'ALLOWANCE' || rule.category === 'BASIC') {
            grossTotal += amount;
          } else if (rule.category === 'DEDUCTION') {
            deductionTotal += amount;
          }
          break;
      }

      const roundedAmt = parseFloat(amount.toFixed(2));
      computedLines.push({
        salaryRuleId: rule.id,
        code: rule.code,
        category: rule.category,
        name: rule.name,
        sequence: rule.structure_sequence || rule.sequence,
        amount: roundedAmt
      });
    }

    const netTotal = Math.max(0, grossTotal - deductionTotal);

    return {
      grossAmount: parseFloat(grossTotal.toFixed(2)),
      deductionAmount: parseFloat(deductionTotal.toFixed(2)),
      netAmount: parseFloat(netTotal.toFixed(2)),
      lines: computedLines
    };
  }

  /**
   * Validate Payrun Scope & Pre-Flight Warnings for Eligible Staff
   */
  async validatePayrunScope({ structureId, periodStart, periodEnd, employeeIds = [] }) {
    const warnings = [];
    const eligibleEmployees = [];
    const blockingErrors = [];

    // Query selected or all active employees
    let empQuery = `
      SELECT e.id, e.employee_code, e.first_name, e.last_name, e.email, e.status,
             d.name AS department_name,
             ebd.account_number, ebd.ifsc_code, ebd.bank_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
      WHERE e.status = 'ACTIVE'
    `;
    const params = [];

    if (employeeIds.length > 0) {
      empQuery += ` AND e.id IN (${employeeIds.map(() => '?').join(',')})`;
      params.push(...employeeIds);
    }

    const employees = await query(empQuery, params);

    for (const emp of employees) {
      const empName = `${emp.first_name} ${emp.last_name} (${emp.employee_code})`;

      // 1. Contract check for payroll period
      const contract = await this.getApplicableContract(emp.id, periodStart, periodEnd);
      if (!contract) {
        blockingErrors.push(`Employee ${empName} does not have an active contract valid for period ${periodStart} to ${periodEnd}.`);
        continue;
      }

      // 2. Duplicate payslip check
      const duplicateCheck = await query(
        `SELECT p.id, pr.run_code 
         FROM payslips p
         JOIN payruns pr ON p.payrun_id = pr.id
         WHERE p.employee_id = ? AND p.period_start = ? AND p.period_end = ?`,
        [emp.id, periodStart, periodEnd]
      );

      if (duplicateCheck.length > 0) {
        warnings.push(`Warning: Duplicate payslip detected for ${empName} in payrun ${duplicateCheck[0].run_code}.`);
      }

      // 3. Bank details check
      if (!emp.account_number || !emp.ifsc_code) {
        warnings.push(`Warning: Missing or incomplete bank details for ${empName}. Direct deposit might fail.`);
      }

      eligibleEmployees.push({
        id: emp.id,
        employeeCode: emp.employee_code,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        department: emp.department_name,
        contractId: contract.id,
        wage: contract.wage,
        structureId: contract.salary_structure_id,
        hasBankDetails: !!(emp.account_number && emp.ifsc_code)
      });
    }

    return {
      eligibleCount: eligibleEmployees.length,
      eligibleEmployees,
      warnings,
      blockingErrors
    };
  }

  /**
   * Execute Payrun Batch Computation and Save Payslips
   */
  async createAndComputePayrun({ name, structureId, periodStart, periodEnd, selectedEmployeeIds, createdByUserId }) {
    return transaction(async (connection) => {
      // 1. Generate unique run code
      const runCode = `PR-${periodStart.replace(/-/g, '').substring(0, 6)}-${Date.now().toString().slice(-4)}`;

      // 2. Create Payrun in DRAFT
      const [runInsert] = await connection.execute(
        `INSERT INTO payruns (run_code, name, salary_structure_id, period_start, period_end, status, created_by)
         VALUES (?, ?, ?, ?, ?, 'COMPUTED', ?)`,
        [runCode, name, structureId, periodStart, periodEnd, createdByUserId]
      );

      const payrunId = runInsert.insertId;
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let count = 0;

      // 3. Compute and insert each employee's payslip
      for (const empId of selectedEmployeeIds) {
        const contract = await this.getApplicableContract(empId, periodStart, periodEnd);
        if (!contract) continue;

        // Calculate worked days from attendance records during period
        const [attRows] = await connection.execute(
          `SELECT COUNT(*) AS present_days 
           FROM attendance 
           WHERE employee_id = ? AND date >= ? AND date <= ? AND status IN ('PRESENT', 'LATE')`,
          [empId, periodStart, periodEnd]
        );
        const workedDays = attRows.length > 0 && attRows[0].present_days > 0 ? attRows[0].present_days : 30;

        const computation = await this.computeSalary({
          contract,
          structureId,
          workedDays,
          totalWorkingDays: 30
        });

        const payslipCode = `PS-${periodStart.replace(/-/g, '').substring(0, 6)}-R${payrunId}-${empId.toString().padStart(3, '0')}`;

        const [slipInsert] = await connection.execute(
          `INSERT INTO payslips (payslip_code, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, total_working_days, gross_amount, deduction_amount, net_amount, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 30.00, ?, ?, ?, 'UNPAID')`,
          [
            payslipCode,
            payrunId,
            empId,
            contract.id,
            structureId,
            periodStart,
            periodEnd,
            workedDays,
            computation.grossAmount,
            computation.deductionAmount,
            computation.netAmount
          ]
        );

        const payslipId = slipInsert.insertId;

        // Insert payslip lines
        for (const line of computation.lines) {
          await connection.execute(
            `INSERT INTO payslip_lines (payslip_id, salary_rule_id, code, category, name, sequence, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [payslipId, line.salaryRuleId, line.code, line.category, line.name, line.sequence, line.amount]
          );
        }

        totalGross += computation.grossAmount;
        totalDeductions += computation.deductionAmount;
        totalNet += computation.netAmount;
        count++;
      }

      // 4. Update Payrun totals
      await connection.execute(
        `UPDATE payruns 
         SET total_gross = ?, total_deductions = ?, total_net = ?, employee_count = ?, status = 'COMPUTED', updated_at = NOW()
         WHERE id = ?`,
        [totalGross, totalDeductions, totalNet, count, payrunId]
      );

      // 5. Audit Log
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description)
         VALUES (?, 'PAYRUN_COMPUTED', 'Payruns', ?, ?)`,
        [createdByUserId, String(payrunId), `Computed payrun ${runCode} for ${count} employees`]
      );

      return {
        payrunId,
        runCode,
        status: STATUSES.PAYRUN.COMPUTED,
        employeeCount: count,
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2))
      };
    });
  }

  /**
   * Recompute an existing Payrun batch and recalculate its payslips
   */
  async recomputePayrun(payrunId, userId = null) {
    const runRows = await query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
    if (runRows.length === 0) {
      throw new Error('Payrun not found');
    }

    const payrun = runRows[0];
    if (payrun.status === 'PAID') {
      throw new Error('Cannot recompute a finalized PAID payrun.');
    }

    return transaction(async (connection) => {
      // 1. Get current employee IDs in this payrun, or active employees with valid contracts
      const [existingSlips] = await connection.execute(
        'SELECT DISTINCT employee_id FROM payslips WHERE payrun_id = ?',
        [payrunId]
      );

      let empIds = existingSlips.map((r) => r.employee_id);
      if (empIds.length === 0) {
        const [activeEmps] = await connection.execute(
          "SELECT id FROM employees WHERE status = 'ACTIVE'"
        );
        empIds = activeEmps.map((r) => r.id);
      }

      // 2. Delete existing payslip_lines and payslips for this payrun
      await connection.execute(
        `DELETE pl FROM payslip_lines pl 
         JOIN payslips p ON pl.payslip_id = p.id 
         WHERE p.payrun_id = ?`,
        [payrunId]
      );
      await connection.execute('DELETE FROM payslips WHERE payrun_id = ?', [payrunId]);

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let count = 0;

      // 3. Compute and insert each employee's payslip
      for (const empId of empIds) {
        const contract = await this.getApplicableContract(empId, payrun.period_start, payrun.period_end);
        if (!contract) continue;

        // Calculate worked days from attendance records during period
        const [attRows] = await connection.execute(
          `SELECT COUNT(*) AS present_days 
           FROM attendance 
           WHERE employee_id = ? AND date >= ? AND date <= ? AND status IN ('PRESENT', 'LATE')`,
          [empId, payrun.period_start, payrun.period_end]
        );
        const workedDays = attRows.length > 0 && attRows[0].present_days > 0 ? attRows[0].present_days : 30;

        const computation = await this.computeSalary({
          contract,
          structureId: payrun.salary_structure_id,
          workedDays,
          totalWorkingDays: 30
        });

        const payslipCode = `PS-${payrun.period_start.replace(/-/g, '').substring(0, 6)}-R${payrunId}-${empId.toString().padStart(3, '0')}`;

        const [slipInsert] = await connection.execute(
          `INSERT INTO payslips (payslip_code, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, total_working_days, gross_amount, deduction_amount, net_amount, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 30.00, ?, ?, ?, 'UNPAID')`,
          [
            payslipCode,
            payrunId,
            empId,
            contract.id,
            payrun.salary_structure_id,
            payrun.period_start,
            payrun.period_end,
            workedDays,
            computation.grossAmount,
            computation.deductionAmount,
            computation.netAmount
          ]
        );

        const payslipId = slipInsert.insertId;

        for (const line of computation.lines) {
          await connection.execute(
            `INSERT INTO payslip_lines (payslip_id, salary_rule_id, code, category, name, sequence, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [payslipId, line.salaryRuleId, line.code, line.category, line.name, line.sequence, line.amount]
          );
        }

        totalGross += computation.grossAmount;
        totalDeductions += computation.deductionAmount;
        totalNet += computation.netAmount;
        count++;
      }

      // 4. Update Payrun totals and set to COMPUTED
      await connection.execute(
        `UPDATE payruns 
         SET total_gross = ?, total_deductions = ?, total_net = ?, employee_count = ?, status = 'COMPUTED', updated_at = NOW()
         WHERE id = ?`,
        [totalGross, totalDeductions, totalNet, count, payrunId]
      );

      // 5. Audit Log
      if (userId) {
        await connection.execute(
          `INSERT INTO audit_logs (user_id, action, module, record_id, description)
           VALUES (?, 'PAYRUN_RECOMPUTED', 'Payruns', ?, ?)`,
          [userId, String(payrunId), `Recomputed payrun ${payrun.run_code} for ${count} employees`]
        );
      }

      return {
        payrunId,
        runCode: payrun.run_code,
        status: STATUSES.PAYRUN.COMPUTED,
        employeeCount: count,
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2))
      };
    });
  }
}

module.exports = new PayrollService();
