const STORAGE_KEY = 'peoplepay360_salary_structures_data';

export const INITIAL_SALARY_STRUCTURES = [
  {
    id: 'struct-1',
    name: 'Standard Monthly Salary',
    description: 'Standard salary structure for full-time employees with basic pay, allowances, and statutory tax withholdings.',
    ruleIds: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6', 'rule-7'],
    ruleCount: 7,
    assignedEmployees: 24,
    status: 'Active'
  },
  {
    id: 'struct-2',
    name: 'Executive Salary Structure',
    description: 'Salary structure for management and executive employees with extended allowances and incentive coverage.',
    ruleIds: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6', 'rule-7'],
    ruleCount: 7,
    assignedEmployees: 8,
    status: 'Active'
  },
  {
    id: 'struct-3',
    name: 'Part-Time Salary',
    description: 'Hour-based and flexible shift salary structure with simplified allowance and withholding rules.',
    ruleIds: ['rule-1', 'rule-3', 'rule-5', 'rule-7'],
    ruleCount: 4,
    assignedEmployees: 12,
    status: 'Active'
  }
];

export const getSalaryStructures = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading salary structures from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SALARY_STRUCTURES));
  return INITIAL_SALARY_STRUCTURES;
};

export const saveSalaryStructuresToStorage = (structures) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structures));
  } catch (err) {
    console.error('Error saving salary structures to localStorage:', err);
  }
};

export const getSalaryStructureById = (id) => {
  const list = getSalaryStructures();
  return list.find((s) => s.id === id) || null;
};

export const createSalaryStructure = (data) => {
  const list = getSalaryStructures();
  const ruleIds = data.ruleIds || [];
  const newStructure = {
    id: `struct-${Date.now()}`,
    name: data.name || '',
    description: data.description || '',
    ruleIds,
    ruleCount: ruleIds.length,
    assignedEmployees: data.assignedEmployees || 0,
    status: data.status || 'Active'
  };

  const updated = [...list, newStructure];
  saveSalaryStructuresToStorage(updated);
  return newStructure;
};

export const updateSalaryStructure = (id, data) => {
  const list = getSalaryStructures();
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const ruleIds = data.ruleIds || list[index].ruleIds || [];
  const updated = {
    ...list[index],
    ...data,
    ruleIds,
    ruleCount: ruleIds.length
  };

  list[index] = updated;
  saveSalaryStructuresToStorage(list);
  return updated;
};

export const deleteSalaryStructure = (id) => {
  const list = getSalaryStructures();
  const updated = list.filter((s) => s.id !== id);
  saveSalaryStructuresToStorage(updated);
  return true;
};
