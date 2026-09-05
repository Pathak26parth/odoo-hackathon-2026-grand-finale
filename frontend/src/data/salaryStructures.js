import payrollService, { normalizeStructure } from '../services/payrollService';

const STORAGE_KEY = 'peoplepay360_salary_structures_data';

export const INITIAL_STRUCTURES = [];

export const getSalaryStructures = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading salary structures cache:', err);
  }
  return INITIAL_STRUCTURES;
};

export const saveSalaryStructuresToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving salary structures cache:', err);
  }
};

export const fetchSalaryStructuresAsync = async () => {
  try {
    const structures = await payrollService.getSalaryStructures();
    if (Array.isArray(structures)) {
      saveSalaryStructuresToStorage(structures);
      return structures;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch salary structures:', err.message);
  }
  return getSalaryStructures();
};

export const getSalaryStructureById = (id) => {
  const list = getSalaryStructures();
  return list.find((s) => String(s.id) === String(id)) || null;
};

export const createSalaryStructure = async (data) => {
  try {
    const res = await payrollService.createSalaryStructure(data);
    await fetchSalaryStructuresAsync();
    return res;
  } catch (err) {
    console.warn('Backend create salary structure fallback:', err.message);
    const list = getSalaryStructures();
    const newStruct = { id: String(Date.now()), ...data };
    saveSalaryStructuresToStorage([newStruct, ...list]);
    return newStruct;
  }
};

export const updateSalaryStructure = async (id, data) => {
  try {
    const res = await payrollService.updateSalaryStructure(id, data);
    await fetchSalaryStructuresAsync();
    return res;
  } catch (err) {
    console.warn('Backend update salary structure fallback:', err.message);
    const list = getSalaryStructures();
    const idx = list.findIndex((s) => String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      saveSalaryStructuresToStorage(list);
    }
    return data;
  }
};

export const deleteSalaryStructure = async (id) => {
  try {
    const res = await payrollService.deleteSalaryStructure(id);
    await fetchSalaryStructuresAsync();
    return res;
  } catch (err) {
    console.error('Delete salary structure failed on backend:', err.message);
    const list = getSalaryStructures().filter((s) => String(s.id) !== String(id));
    saveSalaryStructuresToStorage(list);
    return true;
  }
};
