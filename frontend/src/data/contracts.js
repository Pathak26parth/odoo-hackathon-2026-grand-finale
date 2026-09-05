import contractService, { normalizeContract } from '../services/contractService';

const STORAGE_KEY = 'peoplepay360_contracts_data';

export const INITIAL_CONTRACTS = [];

export const getContracts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading contracts cache:', err);
  }
  return INITIAL_CONTRACTS;
};

export const saveContractsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving contracts cache:', err);
  }
};

export const fetchContractsAsync = async (params = {}) => {
  try {
    const contracts = await contractService.getContracts(params);
    if (Array.isArray(contracts)) {
      saveContractsToStorage(contracts);
      return contracts;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch contracts:', err.message);
  }
  return getContracts();
};

export const getContractById = (id) => {
  const list = getContracts();
  return list.find((c) => String(c.id) === String(id) || c.reference === id) || null;
};

export const fetchContractByIdAsync = async (id) => {
  try {
    const ctr = await contractService.getContractById(id);
    return ctr;
  } catch (err) {
    return getContractById(id);
  }
};

export const checkContractOverlap = (employeeId, startDate, endDate, excludeId = null) => {
  const all = getContracts();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date('2099-12-31');

  return all.find((c) => {
    if (String(c.employeeId) !== String(employeeId)) return false;
    if (excludeId && (String(c.id) === String(excludeId) || c.reference === excludeId)) return false;
    if (c.status !== 'Active') return false;

    const cStart = new Date(c.startDate);
    const cEnd = c.endDate ? new Date(c.endDate) : new Date('2099-12-31');

    return start <= cEnd && end >= cStart;
  }) || null;
};

export const createContract = async (data) => {
  try {
    const res = await contractService.createContract(data);
    await fetchContractsAsync();
    return res;
  } catch (err) {
    console.error('Create contract failed on backend:', err.message);
    throw err;
  }
};

export const updateContract = async (id, data) => {
  try {
    const res = await contractService.updateContract(id, data);
    await fetchContractsAsync();
    return res;
  } catch (err) {
    console.error('Update contract failed on backend:', err.message);
    throw err;
  }
};

export const deleteContract = async (id) => {
  try {
    const res = await contractService.deleteContract(id);
    await fetchContractsAsync();
    return res;
  } catch (err) {
    console.error('Delete contract failed on backend:', err.message);
    throw err;
  }
};
