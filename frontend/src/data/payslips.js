import payrollService, { normalizePayslip } from '../services/payrollService';

const STORAGE_KEY = 'peoplepay360_payslips_data';

export const INITIAL_PAYSLIPS = [];

export const getPayslips = (payrunId = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (payrunId) {
          return parsed.filter((s) => String(s.payrunId) === String(payrunId));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading payslips cache:', err);
  }
  return INITIAL_PAYSLIPS;
};

export const savePayslipsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving payslips cache:', err);
  }
};

export const fetchPayslipsAsync = async (params = {}) => {
  try {
    const payslips = await payrollService.getPayslips(params);
    if (Array.isArray(payslips)) {
      savePayslipsToStorage(payslips);
      return payslips;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch payslips:', err.message);
  }
  return getPayslips(typeof params === 'string' ? params : params?.payrunId);
};

export const getPayslipById = (id) => {
  const list = getPayslips();
  return list.find((s) => String(s.id) === String(id) || s.slipNumber === id) || null;
};

export const getPayslipByIdAsync = async (id) => {
  try {
    return await payrollService.getPayslipById(id);
  } catch (err) {
    return getPayslipById(id);
  }
};

export const fetchPayslipByIdAsync = getPayslipByIdAsync;

export const createPayslip = async (data) => {
  const list = getPayslips();
  const newSlip = { id: String(Date.now()), ...data };
  savePayslipsToStorage([newSlip, ...list]);
  return newSlip;
};

export const createPayslipsBatch = async (batch) => {
  const list = getPayslips();
  const updated = [...batch, ...list.filter((s) => !batch.some((b) => String(b.id) === String(s.id)))];
  savePayslipsToStorage(updated);
  return batch;
};

export const updatePayslip = async (id, data) => {
  const list = getPayslips();
  const idx = list.findIndex((s) => String(s.id) === String(id) || s.slipNumber === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    savePayslipsToStorage(list);
    return list[idx];
  }
  return data;
};

export const updatePayslipsStatusByPayrun = async (payrunId, status) => {
  const list = getPayslips();
  const updated = list.map((s) => (String(s.payrunId) === String(payrunId) ? { ...s, status } : s));
  savePayslipsToStorage(updated);
  return updated.filter((s) => String(s.payrunId) === String(payrunId));
};
