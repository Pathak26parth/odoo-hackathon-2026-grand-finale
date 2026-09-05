// utils/payrollCalculation.js
// Rule-driven payroll calculation engine for PeoplePay360

/**
 * Calculates itemized payslip lines based on employee contract and configured salary rules.
 * Sorts rules by sequence and evaluates step-by-step.
 */
export const calculatePayslip = (
  employee,
  contract,
  salaryStructure,
  salaryRules = [],
  attendance = [],
  timeOff = []
) => {
  const warnings = [];

  // Check critical warnings
  if (!employee) {
    warnings.push({ type: 'Missing Employee Data', message: 'Employee profile is not found.' });
    return { basic: 0, allowances: 0, gross: 0, deductions: 0, net: 0, lines: [], warnings };
  }

  if (!contract) {
    warnings.push({
      type: 'Missing Contract',
      message: `${employee.name || 'Employee'} does not have an applicable active contract.`
    });
  } else if (contract.status === 'Expired' || (contract.endDate && new Date(contract.endDate) < new Date())) {
    warnings.push({
      type: 'Expired Contract',
      message: `Contract ${contract.id} is expired.`
    });
  }

  // Check mock bank details (e.g., if employee email is missing or flagged, or if employee id is emp-4 James Anderson simulate missing bank details)
  if (!employee.bankAccount && employee.id === 'emp-4') {
    warnings.push({
      type: 'Missing Bank Details',
      message: `${employee.name} has missing bank disbursement information.`
    });
  }

  // Base wage from contract or default 50000
  const contractWage = contract ? Number(contract.wage) || 50000 : 50000;

  // Filter and sort rules by sequence
  // If structure specifies ruleIds, filter them; otherwise use all active rules
  let applicableRules = salaryRules;
  if (salaryStructure && salaryStructure.ruleIds && salaryStructure.ruleIds.length > 0) {
    applicableRules = salaryRules.filter((r) => salaryStructure.ruleIds.includes(r.id));
  }
  // Sort ascending by sequence
  applicableRules = [...applicableRules].sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  let basic = contractWage;
  let allowances = 0;
  let gross = basic;
  let deductions = 0;
  let net = basic;

  const lines = [];
  const calculatedMap = {}; // rule code -> calculated amount

  for (const rule of applicableRules) {
    let amount = 0;
    const code = (rule.code || '').toUpperCase();
    const category = rule.category;
    const computationType = rule.computationType;

    if (code === 'BASIC' || category === 'Basic') {
      amount = contractWage;
      basic = amount;
      calculatedMap[code] = amount;
      calculatedMap['BASIC'] = amount;
    } else if (category === 'Allowances') {
      if (computationType === 'Fixed Amount') {
        amount = Number(rule.amount) || 0;
      } else if (computationType === 'Percentage') {
        const pct = Number(rule.percentage) || 0;
        const base = rule.basedOn === 'Gross Salary' ? gross : basic;
        amount = Math.round((base * pct) / 100);
      }
      allowances += amount;
      calculatedMap[code] = amount;
    } else if (code === 'GROSS' || category === 'Gross') {
      if (computationType === 'Formula' && rule.formula) {
        // Evaluate formula like BASIC + HOUSE + TRANS
        // Or simply basic + sum of allowances
        amount = basic + allowances;
      } else {
        amount = basic + allowances;
      }
      gross = amount;
      calculatedMap[code] = amount;
      calculatedMap['GROSS'] = amount;
    } else if (category === 'Deductions') {
      if (computationType === 'Percentage') {
        const pct = Number(rule.percentage) || 0;
        const base = rule.basedOn === 'Basic Salary' ? basic : gross;
        amount = Math.round((base * pct) / 100);
      } else if (computationType === 'Fixed Amount') {
        amount = Number(rule.amount) || 0;
      }
      deductions += amount;
      calculatedMap[code] = amount;
    } else if (code === 'NET' || category === 'Net') {
      amount = gross - deductions;
      net = amount;
      calculatedMap[code] = amount;
      calculatedMap['NET'] = amount;
    } else {
      // Custom / other rule
      if (computationType === 'Fixed Amount') {
        amount = Number(rule.amount) || 0;
      } else if (computationType === 'Percentage') {
        const pct = Number(rule.percentage) || 0;
        amount = Math.round((gross * pct) / 100);
      }
      calculatedMap[code] = amount;
    }

    lines.push({
      sequence: rule.sequence,
      ruleId: rule.id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      computationType: rule.computationType,
      calculation:
        computationType === 'Percentage'
          ? `${rule.percentage}% of ${rule.basedOn || 'Gross'}`
          : computationType === 'Formula'
          ? rule.formula
          : `Fixed ₹${(Number(rule.amount) || 0).toLocaleString()}`,
      amount
    });
  }

  // Ensure gross & net are aligned if no explicit rule was in the list
  if (!calculatedMap['GROSS']) {
    gross = basic + allowances;
  }
  if (!calculatedMap['NET']) {
    net = gross - deductions;
  }

  return {
    basic,
    allowances,
    gross,
    deductions,
    net,
    lines,
    warnings
  };
};

/**
 * Format currency in Indian Rupees format (₹XX,XXX)
 */
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};
