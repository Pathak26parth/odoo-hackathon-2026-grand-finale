import payrollService, { normalizePayrun } from '../services/payrollService';

const STORAGE_KEY = 'peoplepay360_payruns_data';

export const INITIAL_PAYRUNS = [];

export const getPayruns = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading payruns cache:', err);
  }
  return INITIAL_PAYRUNS;
};

export const savePayrunsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving payruns cache:', err);
  }
};

export const fetchPayrunsAsync = async () => {
  try {
    const payruns = await payrollService.getPayruns();
    if (payruns && payruns.length > 0) {
      savePayrunsToStorage(payruns);
      return payruns;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch payruns:', err.message);
  }
  return getPayruns();
};

export const getPayrunById = (id) => {
  const list = getPayruns();
  return list.find((p) => String(p.id) === String(id) || p.runCode === id) || null;
};

export const fetchPayrunByIdAsync = async (id) => {
  try {
    const res = await payrollService.getPayrunById(id);
    return res;
  } catch (err) {
    return getPayrunById(id);
  }
};

export const createPayrun = async (data) => {
  try {
    const res = await payrollService.createPayrun(data);
    await fetchPayrunsAsync();
    return res;
  } catch (err) {
    console.warn('Backend create payrun fallback:', err.message);
    const list = getPayruns();
    const newRun = {
      id: String(Date.now()),
      runCode: `PAYRUN-${Date.now()}`,
      status: 'Draft',
      totalBasic: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      ...data
    };
    savePayrunsToStorage([newRun, ...list]);
    return newRun;
  }
};

export const updatePayrun = async (id, data) => {
  try {
    // If computing or validating or paying
    if (data.status === 'COMPUTED' || data.status === 'Computed') {
      await payrollService.computePayrun(id);
    } else if (data.status === 'VALIDATED' || data.status === 'Validated') {
      await payrollService.validatePayrun(id);
    } else if (data.status === 'PAID' || data.status === 'Paid') {
      await payrollService.payPayrun(id);
    }
    await fetchPayrunsAsync();
  } catch (err) {
    console.warn('Backend update payrun fallback:', err.message);
    const list = getPayruns();
    const idx = list.findIndex((p) => String(p.id) === String(id) || p.runCode === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      savePayrunsToStorage(list);
    }
  }
  return getPayrunById(id);
};

export const deletePayrun = async (id) => {
  try {
    const res = await payrollService.deletePayrun(id);
    await fetchPayrunsAsync();
    return res;
  } catch (err) {
    console.error('Delete payrun failed on backend:', err.message);
    const list = getPayruns().filter((p) => String(p.id) !== String(id) && p.runCode !== id);
    savePayrunsToStorage(list);
    return true;
  }
};
