// data/payruns.js
// Payrun management and state progression for PeoplePay360

const STORAGE_KEY = 'peoplepay360_payruns_data';

export const INITIAL_PAYRUNS = [
  {
    id: 'payrun-sep-2026',
    name: 'September 2026 Payroll',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    employeeCount: 24,
    totalBasic: 1000000,
    totalAllowances: 450000,
    totalGross: 1450000,
    totalDeductions: 175000,
    totalNet: 1275000,
    status: 'Paid',
    paidAt: '2026-09-30',
    selectedEmployeeIds: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'],
    warnings: [],
    notes: 'Regular monthly salary disbursement finalized and dispatched.'
  },
  {
    id: 'payrun-aug-2026',
    name: 'August 2026 Payroll',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    employeeCount: 24,
    totalBasic: 980000,
    totalAllowances: 430000,
    totalGross: 1410000,
    totalDeductions: 170000,
    totalNet: 1240000,
    status: 'Paid',
    paidAt: '2026-08-31',
    selectedEmployeeIds: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'],
    warnings: [],
    notes: 'August payroll completed.'
  },
  {
    id: 'payrun-oct-2026',
    name: 'October 2026 Payroll',
    salaryStructureId: 'struct-1',
    salaryStructureName: 'Standard Monthly Salary',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    employeeCount: 5,
    totalBasic: 250000,
    totalAllowances: 105000,
    totalGross: 355000,
    totalDeductions: 42600,
    totalNet: 312400,
    status: 'Draft',
    paidAt: null,
    selectedEmployeeIds: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'],
    warnings: [
      '1 employee (James Anderson) has missing bank details.',
      '1 contract extension draft detected for Lucas Garcia.'
    ],
    notes: 'Upcoming month payroll draft.'
  }
];

export const getPayruns = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading payruns from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PAYRUNS));
  return INITIAL_PAYRUNS;
};

export const savePayrunsToStorage = (payruns) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payruns));
  } catch (err) {
    console.error('Error saving payruns to localStorage:', err);
  }
};

export const getPayrunById = (id) => {
  const list = getPayruns();
  return list.find((p) => p.id === id) || null;
};

export const createPayrun = (payrunData) => {
  const list = getPayruns();
  const id = `payrun-${Date.now()}`;
  const newPayrun = {
    id,
    status: 'Draft',
    paidAt: null,
    totalBasic: 0,
    totalAllowances: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employeeCount: payrunData.selectedEmployeeIds?.length || 0,
    warnings: [],
    ...payrunData
  };

  const updated = [newPayrun, ...list];
  savePayrunsToStorage(updated);
  return newPayrun;
};

export const updatePayrun = (id, updates) => {
  const list = getPayruns();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  // Paid payruns are read-only except for initial mark as paid
  if (list[index].status === 'Paid' && updates.status !== 'Paid') {
    throw new Error('Paid payruns are historical and read-only.');
  }

  const updated = { ...list[index], ...updates };
  list[index] = updated;
  savePayrunsToStorage(list);
  return updated;
};

export const deletePayrun = (id) => {
  const list = getPayruns();
  const item = list.find((p) => p.id === id);
  if (!item) return false;

  if (item.status !== 'Draft') {
    throw new Error('Only payruns in Draft status can be deleted.');
  }

  const updated = list.filter((p) => p.id !== id);
  savePayrunsToStorage(updated);
  return true;
};
