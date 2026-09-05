import payrollService, { normalizeRule } from '../services/payrollService';

const STORAGE_KEY = 'peoplepay360_salary_rules_data';

export const INITIAL_RULES = [];

export const calculateSalaryBreakdown = (baseSalary = 50000) => {
  const basic = Number(baseSalary) || 0;
  const hra = Math.round(basic * 0.4);
  const sa = 5000;
  const gross = basic + hra + sa;
  const pf = Math.round(basic * 0.12);
  const pt = 200;
  const net = gross - (pf + pt);

  return [
    {
      step: 1,
      title: 'Basic Salary',
      code: 'BASIC',
      category: 'BASIC',
      type: 'base',
      calcText: 'Base contract wage',
      amount: basic
    },
    {
      step: 2,
      title: 'House Rent Allowance (HRA)',
      code: 'HRA',
      category: 'ALW',
      type: 'add',
      calcText: '40% of Basic wage',
      amount: hra
    },
    {
      step: 3,
      title: 'Special Allowance',
      code: 'SA',
      category: 'ALW',
      type: 'add',
      calcText: 'Fixed monthly corporate stipend',
      amount: sa
    },
    {
      step: 4,
      title: 'Gross Salary',
      code: 'GROSS',
      category: 'GROSS',
      type: 'subtotal',
      calcText: 'BASIC + HRA + SA',
      amount: gross
    },
    {
      step: 5,
      title: 'Provident Fund (PF)',
      code: 'PF',
      category: 'DED',
      type: 'deduct',
      calcText: '12% of Basic contribution',
      amount: pf
    },
    {
      step: 6,
      title: 'Professional Tax (PT)',
      code: 'PT',
      category: 'DED',
      type: 'deduct',
      calcText: 'State statutory deduction',
      amount: pt
    },
    {
      step: 7,
      title: 'Net Take Home Salary',
      code: 'NET',
      category: 'NET',
      type: 'total',
      calcText: 'GROSS - Total Deductions',
      amount: net
    }
  ];
};

export const getSalaryRules = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading salary rules cache:', err);
  }
  return INITIAL_RULES;
};

export const saveSalaryRulesToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving salary rules cache:', err);
  }
};

export const fetchSalaryRulesAsync = async () => {
  try {
    const rules = await payrollService.getSalaryRules();
    if (Array.isArray(rules)) {
      saveSalaryRulesToStorage(rules);
      return rules;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch salary rules:', err.message);
  }
  return getSalaryRules();
};

export const getSalaryRuleById = (id) => {
  const list = getSalaryRules();
  return list.find((r) => String(r.id) === String(id) || r.code === id) || null;
};

export const createSalaryRule = async (data) => {
  try {
    const res = await payrollService.createSalaryRule(data);
    await fetchSalaryRulesAsync();
    return res;
  } catch (err) {
    console.warn('Backend create salary rule fallback:', err.message);
    const list = getSalaryRules();
    const newRule = { id: String(Date.now()), ...data };
    saveSalaryRulesToStorage([newRule, ...list]);
    return newRule;
  }
};

export const updateSalaryRule = async (id, data) => {
  try {
    const res = await payrollService.updateSalaryRule(id, data);
    await fetchSalaryRulesAsync();
    return res;
  } catch (err) {
    console.warn('Backend update salary rule fallback:', err.message);
    const list = getSalaryRules();
    const idx = list.findIndex((r) => String(r.id) === String(id) || r.code === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      saveSalaryRulesToStorage(list);
    }
    return data;
  }
};

export const deleteSalaryRule = async (id) => {
  try {
    const res = await payrollService.deleteSalaryRule(id);
    await fetchSalaryRulesAsync();
    return res;
  } catch (err) {
    console.error('Delete salary rule failed on backend:', err.message);
    const list = getSalaryRules().filter((r) => String(r.id) !== String(id) && r.code !== id);
    saveSalaryRulesToStorage(list);
    return true;
  }
};
