const STORAGE_KEY = 'peoplepay360_timeoff_types_data';

export const INITIAL_TIMEOFF_TYPES = [
  {
    id: 'tot-1',
    name: 'Annual Leave',
    description: 'Standard paid vacation and annual leave allowance for employees.',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegration: true,
    status: 'Active'
  },
  {
    id: 'tot-2',
    name: 'Sick Leave',
    description: 'Medical and sick recovery leave supported by medical documentation.',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegration: true,
    status: 'Active'
  },
  {
    id: 'tot-3',
    name: 'Casual Leave',
    description: 'Short-notice personal leave for urgent personal errands.',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegration: false,
    status: 'Active'
  },
  {
    id: 'tot-4',
    name: 'Unpaid Leave',
    description: 'Time off without pay applicable when all statutory allowances are exhausted.',
    unit: 'Days',
    requiresAllocation: false,
    requiresApproval: true,
    payrollIntegration: true,
    status: 'Active'
  },
  {
    id: 'tot-5',
    name: 'Maternity Leave',
    description: 'Statutory maternal care leave for eligible female employees.',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegration: true,
    status: 'Active'
  },
  {
    id: 'tot-6',
    name: 'Compensatory Off',
    description: 'Time off granted in exchange for worked overtime or holiday shifts.',
    unit: 'Hours',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegration: false,
    status: 'Active'
  }
];

export const getTimeOffTypes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading time off types:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TIMEOFF_TYPES));
  return INITIAL_TIMEOFF_TYPES;
};

export const saveTimeOffTypesToStorage = (types) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  } catch (err) {
    console.error('Error saving time off types:', err);
  }
};

export const getTimeOffTypeById = (id) => {
  const list = getTimeOffTypes();
  return list.find((t) => t.id === id) || null;
};

export const createTimeOffType = (data) => {
  const list = getTimeOffTypes();
  const newType = {
    id: `tot-${Date.now()}`,
    requiresAllocation: data.requiresAllocation ?? true,
    requiresApproval: data.requiresApproval ?? true,
    payrollIntegration: data.payrollIntegration ?? false,
    status: data.status || 'Active',
    ...data
  };

  const updated = [...list, newType];
  saveTimeOffTypesToStorage(updated);
  return newType;
};

export const updateTimeOffType = (id, data) => {
  const list = getTimeOffTypes();
  const index = list.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedType = {
    ...list[index],
    ...data
  };

  list[index] = updatedType;
  saveTimeOffTypesToStorage(list);
  return updatedType;
};

export const deleteTimeOffType = (id) => {
  const list = getTimeOffTypes();
  const updated = list.filter((t) => t.id !== id);
  saveTimeOffTypesToStorage(updated);
  return true;
};
