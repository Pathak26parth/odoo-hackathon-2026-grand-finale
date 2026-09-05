const STORAGE_KEY = 'peoplepay360_allocations_data';

export const INITIAL_ALLOCATIONS = [
  {
    id: 'alloc-1',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    allocated: 20,
    taken: 5,
    remaining: 15,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-2',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    timeOffTypeId: 'tot-2',
    timeOffTypeName: 'Sick Leave',
    allocated: 10,
    taken: 2,
    remaining: 8,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-3',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    allocated: 22,
    taken: 4,
    remaining: 18,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-4',
    employeeId: 'emp-3',
    employeeName: 'Olivia Martin',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    allocated: 20,
    taken: 8,
    remaining: 12,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-5',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    allocated: 18,
    taken: 0,
    remaining: 18,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-6',
    employeeId: 'emp-5',
    employeeName: 'Lucas Garcia',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    allocated: 20,
    taken: 3,
    remaining: 17,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'alloc-7',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    timeOffTypeId: 'tot-3',
    timeOffTypeName: 'Casual Leave',
    allocated: 5,
    taken: 1,
    remaining: 4,
    unit: 'Days',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  }
];

export const getAllocations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading allocations from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ALLOCATIONS));
  return INITIAL_ALLOCATIONS;
};

export const saveAllocationsToStorage = (allocations) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allocations));
  } catch (err) {
    console.error('Error saving allocations to localStorage:', err);
  }
};

export const getAllocationById = (id) => {
  const list = getAllocations();
  return list.find((a) => a.id === id) || null;
};

export const getEmployeeAllocations = (employeeId) => {
  const list = getAllocations();
  return list.filter((a) => a.employeeId === employeeId);
};

export const createAllocation = (data) => {
  const list = getAllocations();
  const allocated = Number(data.allocated || 0);
  const taken = Number(data.taken || 0);
  const remaining = Math.max(0, allocated - taken);

  const newAllocation = {
    id: `alloc-${Date.now()}`,
    ...data,
    allocated,
    taken,
    remaining,
    status: data.status || 'Active'
  };

  const updated = [newAllocation, ...list];
  saveAllocationsToStorage(updated);
  return newAllocation;
};

export const updateAllocation = (id, data) => {
  const list = getAllocations();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const current = list[index];
  const allocated = Number(data.allocated !== undefined ? data.allocated : current.allocated);
  const taken = Number(data.taken !== undefined ? data.taken : current.taken);
  const remaining = Math.max(0, allocated - taken);

  const updatedAllocation = {
    ...current,
    ...data,
    allocated,
    taken,
    remaining
  };

  list[index] = updatedAllocation;
  saveAllocationsToStorage(list);
  return updatedAllocation;
};

export const deductAllocationBalance = (employeeId, timeOffTypeName, duration) => {
  const list = getAllocations();
  const index = list.findIndex(
    (a) =>
      a.employeeId === employeeId &&
      a.timeOffTypeName.toLowerCase() === (timeOffTypeName || '').toLowerCase() &&
      a.status === 'Active'
  );

  if (index === -1) {
    console.warn(`No active allocation found for employee ${employeeId} and type ${timeOffTypeName}`);
    return false;
  }

  const alloc = list[index];
  const newTaken = Number(alloc.taken || 0) + Number(duration || 0);
  const newRemaining = Math.max(0, Number(alloc.allocated || 0) - newTaken);

  list[index] = {
    ...alloc,
    taken: newTaken,
    remaining: newRemaining
  };

  saveAllocationsToStorage(list);
  return true;
};

export const restoreAllocationBalance = (employeeId, timeOffTypeName, duration) => {
  const list = getAllocations();
  const index = list.findIndex(
    (a) =>
      a.employeeId === employeeId &&
      a.timeOffTypeName.toLowerCase() === (timeOffTypeName || '').toLowerCase()
  );

  if (index === -1) return false;

  const alloc = list[index];
  const newTaken = Math.max(0, Number(alloc.taken || 0) - Number(duration || 0));
  const newRemaining = Math.max(0, Number(alloc.allocated || 0) - newTaken);

  list[index] = {
    ...alloc,
    taken: newTaken,
    remaining: newRemaining
  };

  saveAllocationsToStorage(list);
  return true;
};

export const deleteAllocation = (id) => {
  const list = getAllocations();
  const updated = list.filter((a) => a.id !== id);
  saveAllocationsToStorage(updated);
  return true;
};
