import timeOffService, { normalizeAllocation } from '../services/timeOffService';

const STORAGE_KEY = 'peoplepay360_allocations_data';

export const INITIAL_ALLOCATIONS = [];

export const getAllocations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading allocations cache:', err);
  }
  return INITIAL_ALLOCATIONS;
};

export const getEmployeeAllocations = (employeeId) => {
  const all = getAllocations();
  return all.filter((a) => String(a.employeeId) === String(employeeId) || a.employeeCode === employeeId);
};

export const saveAllocationsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving allocations cache:', err);
  }
};

export const fetchAllocationsAsync = async (params = {}) => {
  try {
    const allocations = await timeOffService.getAllocations(params);
    if (Array.isArray(allocations)) {
      saveAllocationsToStorage(allocations);
      return allocations;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch allocations:', err.message);
  }
  return getAllocations();
};

export const getAllocationById = (id) => {
  const list = getAllocations();
  return list.find((a) => String(a.id) === String(id)) || null;
};

export const createAllocation = async (data) => {
  try {
    const res = await timeOffService.createAllocation(data);
    await fetchAllocationsAsync();
    return res;
  } catch (err) {
    console.warn('Backend create allocation failed:', err.message);
    const list = getAllocations();
    const newAlloc = { id: String(Date.now()), ...data };
    saveAllocationsToStorage([newAlloc, ...list]);
    return newAlloc;
  }
};

export const updateAllocation = async (id, data) => {
  const list = getAllocations();
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    saveAllocationsToStorage(list);
    return list[idx];
  }
  return data;
};
