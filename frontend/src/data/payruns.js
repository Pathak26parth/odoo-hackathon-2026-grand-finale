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
    if (Array.isArray(payruns)) {
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
    if (res) {
      const currentList = getPayruns();
      const idx = currentList.findIndex((p) => String(p.id) === String(id) || p.runCode === id);
      if (idx !== -1) {
        currentList[idx] = res;
      } else {
        currentList.push(res);
      }
      savePayrunsToStorage(currentList);
      return res;
    }
  } catch (err) {
    console.warn('[Data Bridge] getPayrunById failed:', err.message);
  }
  return getPayrunById(id);
};

export const createPayrun = async (data) => {
  const res = await payrollService.createPayrun(data);
  await fetchPayrunsAsync();
  return res?.payrun || res;
};

export const computePayrun = async (id) => {
  const res = await payrollService.computePayrun(id);
  await fetchPayrunsAsync();
  return res;
};

export const validatePayrun = async (id) => {
  const res = await payrollService.validatePayrun(id);
  await fetchPayrunsAsync();
  return res;
};

export const payPayrun = async (id) => {
  const res = await payrollService.payPayrun(id);
  await fetchPayrunsAsync();
  return res;
};

export const sendPayslipsBulk = async (id) => {
  const res = await payrollService.sendPayslipsBulk(id);
  await fetchPayrunsAsync();
  return res;
};

export const updatePayrun = async (id, data) => {
  if (data.status === 'COMPUTED' || data.status === 'Computed') {
    await payrollService.computePayrun(id);
  } else if (data.status === 'VALIDATED' || data.status === 'Validated') {
    await payrollService.validatePayrun(id);
  } else if (data.status === 'PAID' || data.status === 'Paid') {
    await payrollService.payPayrun(id);
  }
  const refreshed = await fetchPayrunByIdAsync(id);
  return refreshed || getPayrunById(id);
};

export const deletePayrun = async (id) => {
  const res = await payrollService.deletePayrun(id);
  const list = getPayruns().filter((p) => String(p.id) !== String(id) && p.runCode !== id);
  savePayrunsToStorage(list);
  await fetchPayrunsAsync();
  return res;
};
