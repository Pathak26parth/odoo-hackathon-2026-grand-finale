const STORAGE_KEY = 'peoplepay360_contracts_data';

export const INITIAL_CONTRACTS = [
  {
    id: 'CTR-001',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    department: 'Engineering',
    position: 'Software Engineer',
    wage: 7500,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Active',
    notes: 'Senior level permanent employment contract.'
  },
  {
    id: 'CTR-002',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    startDate: '2024-06-01',
    endDate: '2026-06-01',
    department: 'Human Resources',
    position: 'HR Executive',
    wage: 6000,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Active',
    notes: 'HR Operations employment contract.'
  },
  {
    id: 'CTR-003',
    employeeId: 'emp-3',
    employeeName: 'Olivia Martin',
    startDate: '2024-08-15',
    endDate: '2026-08-15',
    department: 'Finance',
    position: 'Accountant',
    wage: 6400,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Active',
    notes: 'Finance and accounting management contract.'
  },
  {
    id: 'CTR-004',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    startDate: '2024-01-10',
    endDate: '2026-01-10',
    department: 'Sales',
    position: 'Sales Executive',
    wage: 5800,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Active',
    notes: 'Enterprise account lead contract.'
  },
  {
    id: 'CTR-005',
    employeeId: 'emp-5',
    employeeName: 'Lucas Garcia',
    startDate: '2026-10-01',
    endDate: '2027-10-01',
    department: 'Engineering',
    position: 'Frontend Developer',
    wage: 6800,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Draft',
    notes: 'Draft offer for upcoming contract extension.'
  },
  {
    id: 'CTR-006',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    department: 'Engineering',
    position: 'Junior Software Engineer',
    wage: 5500,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Expired',
    notes: 'Historical junior contract; successfully renewed and completed.'
  }
];

export const getContracts = (employeeId = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let contracts = INITIAL_CONTRACTS;
    if (raw) {
      contracts = JSON.parse(raw);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTRACTS));
    }
    if (employeeId) {
      return contracts.filter((c) => c.employeeId === employeeId);
    }
    return contracts;
  } catch (err) {
    console.error('Error reading contracts from localStorage:', err);
    return INITIAL_CONTRACTS;
  }
};

export const saveContractsToStorage = (contracts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  } catch (err) {
    console.error('Error saving contracts to localStorage:', err);
  }
};

export const getContractById = (id) => {
  const list = getContracts();
  return list.find((c) => c.id === id) || null;
};

export const createContract = (data) => {
  const list = getContracts();
  const nextNum = list.length + 1;
  const newContract = {
    id: `CTR-${String(nextNum).padStart(3, '0')}`,
    ...data,
    wage: Number(data.wage) || 5000
  };
  const updated = [newContract, ...list];
  saveContractsToStorage(updated);
  return newContract;
};

export const updateContract = (id, data) => {
  const list = getContracts();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;
  const updated = {
    ...list[index],
    ...data,
    wage: Number(data.wage) || list[index].wage
  };
  list[index] = updated;
  saveContractsToStorage(list);
  return updated;
};

// Check if creating/editing this active contract overlaps an existing active contract
export const checkContractOverlap = (employeeId, startDate, endDate, excludeId = null) => {
  if (!employeeId || !startDate) return null;
  const list = getContracts();
  const activeContracts = list.filter(
    (c) => c.employeeId === employeeId && c.status === 'Active' && c.id !== excludeId
  );

  const newStart = new Date(startDate).getTime();
  const newEnd = endDate ? new Date(endDate).getTime() : Infinity;

  for (const existing of activeContracts) {
    const exStart = new Date(existing.startDate).getTime();
    const exEnd = existing.endDate ? new Date(existing.endDate).getTime() : Infinity;

    // Check overlap: (StartA <= EndB) and (EndA >= StartB)
    if (newStart <= exEnd && newEnd >= exStart) {
      return existing;
    }
  }

  return null;
};
