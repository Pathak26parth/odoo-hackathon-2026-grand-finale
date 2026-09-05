// data/payslips.js
// Payslips management, itemized storage, and email delivery status for PeoplePay360

const STORAGE_KEY = 'peoplepay360_payslips_data';

export const INITIAL_PAYSLIPS = [
  {
    id: 'slip-001',
    slipNumber: 'SLIP-2026-09-001',
    payrunId: 'payrun-sep-2026',
    payrunName: 'September 2026 Payroll',
    employeeId: 'emp-1',
    employeeCode: 'EMP-001',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    position: 'Software Engineer',
    contractId: 'CTR-001',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    period: '01 Sep 2026 - 30 Sep 2026',
    workedDays: 22,
    basic: 75000,
    allowances: 20000,
    gross: 95000,
    deductions: 11400,
    net: 83600,
    status: 'Paid',
    emailStatus: 'Sent',
    warnings: [],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 75000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 15000 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 95000 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 9500 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1900 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 83600 }
    ]
  },
  {
    id: 'slip-002',
    slipNumber: 'SLIP-2026-09-002',
    payrunId: 'payrun-sep-2026',
    payrunName: 'September 2026 Payroll',
    employeeId: 'emp-2',
    employeeCode: 'EMP-002',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    position: 'HR Executive',
    contractId: 'CTR-002',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    period: '01 Sep 2026 - 30 Sep 2026',
    workedDays: 22,
    basic: 60000,
    allowances: 17000,
    gross: 77000,
    deductions: 9240,
    net: 67760,
    status: 'Paid',
    emailStatus: 'Sent',
    warnings: [],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 60000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 12000 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 77000 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 7700 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1540 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 67760 }
    ]
  },
  {
    id: 'slip-003',
    slipNumber: 'SLIP-2026-09-003',
    payrunId: 'payrun-sep-2026',
    payrunName: 'September 2026 Payroll',
    employeeId: 'emp-3',
    employeeCode: 'EMP-003',
    employeeName: 'Olivia Martin',
    department: 'Finance',
    position: 'Accountant',
    contractId: 'CTR-003',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    period: '01 Sep 2026 - 30 Sep 2026',
    workedDays: 21,
    basic: 64000,
    allowances: 17800,
    gross: 81800,
    deductions: 9816,
    net: 71984,
    status: 'Paid',
    emailStatus: 'Sent',
    warnings: [],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 64000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 12800 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 81800 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 8180 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1636 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 71984 }
    ]
  },
  {
    id: 'slip-004',
    slipNumber: 'SLIP-2026-09-004',
    payrunId: 'payrun-sep-2026',
    payrunName: 'September 2026 Payroll',
    employeeId: 'emp-4',
    employeeCode: 'EMP-004',
    employeeName: 'James Anderson',
    department: 'Sales',
    position: 'Sales Executive',
    contractId: 'CTR-004',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    period: '01 Sep 2026 - 30 Sep 2026',
    workedDays: 20,
    basic: 58000,
    allowances: 16600,
    gross: 74600,
    deductions: 8952,
    net: 65648,
    status: 'Paid',
    emailStatus: 'Failed',
    warnings: ['Missing bank details on file'],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 58000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 11600 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 74600 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 7460 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1492 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 65648 }
    ]
  },
  {
    id: 'slip-005',
    slipNumber: 'SLIP-2026-10-001',
    payrunId: 'payrun-oct-2026',
    payrunName: 'October 2026 Payroll',
    employeeId: 'emp-1',
    employeeCode: 'EMP-001',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    position: 'Software Engineer',
    contractId: 'CTR-001',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    period: '01 Oct 2026 - 31 Oct 2026',
    workedDays: 22,
    basic: 75000,
    allowances: 20000,
    gross: 95000,
    deductions: 11400,
    net: 83600,
    status: 'Draft',
    emailStatus: 'Not Sent',
    warnings: [],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 75000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 15000 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 95000 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 9500 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1900 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 83600 }
    ]
  },
  {
    id: 'slip-006',
    slipNumber: 'SLIP-2026-10-002',
    payrunId: 'payrun-oct-2026',
    payrunName: 'October 2026 Payroll',
    employeeId: 'emp-2',
    employeeCode: 'EMP-002',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    position: 'HR Executive',
    contractId: 'CTR-002',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    period: '01 Oct 2026 - 31 Oct 2026',
    workedDays: 22,
    basic: 60000,
    allowances: 17000,
    gross: 77000,
    deductions: 9240,
    net: 67760,
    status: 'Draft',
    emailStatus: 'Not Sent',
    warnings: [],
    lines: [
      { sequence: 1, name: 'Basic Salary', code: 'BASIC', category: 'Basic', calculation: 'Contract Wage', amount: 60000 },
      { sequence: 2, name: 'Housing Allowance', code: 'HOUSE', category: 'Allowances', calculation: '20% of Basic', amount: 12000 },
      { sequence: 3, name: 'Transport Allowance', code: 'TRANS', category: 'Allowances', calculation: 'Fixed ₹5,000', amount: 5000 },
      { sequence: 4, name: 'Gross Salary', code: 'GROSS', category: 'Gross', calculation: 'BASIC + HOUSE + TRANS', amount: 77000 },
      { sequence: 5, name: 'Tax', code: 'TAX', category: 'Deductions', calculation: '10% of Gross', amount: 7700 },
      { sequence: 6, name: 'Insurance', code: 'INSURANCE', category: 'Deductions', calculation: '2% of Gross', amount: 1540 },
      { sequence: 7, name: 'Net Salary', code: 'NET', category: 'Net', calculation: 'GROSS - Deductions', amount: 67760 }
    ]
  }
];

export const getPayslips = (payrunId = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = INITIAL_PAYSLIPS;
    if (raw) {
      list = JSON.parse(raw);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PAYSLIPS));
    }
    if (payrunId) {
      return list.filter((p) => p.payrunId === payrunId);
    }
    return list;
  } catch (err) {
    console.error('Error reading payslips from localStorage:', err);
    return INITIAL_PAYSLIPS;
  }
};

export const savePayslipsToStorage = (payslips) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payslips));
  } catch (err) {
    console.error('Error saving payslips to localStorage:', err);
  }
};

export const getPayslipById = (id) => {
  const list = getPayslips();
  return list.find((p) => p.id === id || p.slipNumber === id) || null;
};

export const createPayslipsBatch = (payslipsData) => {
  const list = getPayslips();
  const updated = [...payslipsData, ...list];
  savePayslipsToStorage(updated);
  return payslipsData;
};

export const updatePayslip = (id, updates) => {
  const list = getPayslips();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...list[index], ...updates };
  list[index] = updated;
  savePayslipsToStorage(list);
  return updated;
};

export const updatePayslipsStatusByPayrun = (payrunId, newStatus) => {
  const list = getPayslips();
  const updated = list.map((slip) => {
    if (slip.payrunId === payrunId) {
      return { ...slip, status: newStatus };
    }
    return slip;
  });
  savePayslipsToStorage(updated);
  return updated.filter((s) => s.payrunId === payrunId);
};
