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

export const fetchSalaryStructureByIdAsync = async (id) => {
  try {
    const struct = await payrollService.getSalaryStructureById(id);
    if (struct) {
      const currentList = getSalaryStructures();
      const idx = currentList.findIndex((s) => String(s.id) === String(id));
      if (idx !== -1) {
        currentList[idx] = struct;
      } else {
        currentList.push(struct);
      }
      saveSalaryStructuresToStorage(currentList);
      return struct;
    }
  } catch (err) {
    console.warn('[Data Bridge] getSalaryStructureById failed:', err.message);
  }
  return getSalaryStructureById(id);
};

export const createSalaryStructure = async (data) => {
  const res = await payrollService.createSalaryStructure(data);
  await fetchSalaryStructuresAsync();
  return res;
};

export const updateSalaryStructure = async (id, data) => {
  const res = await payrollService.updateSalaryStructure(id, data);
  await fetchSalaryStructuresAsync();
  return res;
};

export const deleteSalaryStructure = async (id) => {
  const res = await payrollService.deleteSalaryStructure(id);
  const list = getSalaryStructures().filter((s) => String(s.id) !== String(id));
  saveSalaryStructuresToStorage(list);
  await fetchSalaryStructuresAsync();
  return res;
};
