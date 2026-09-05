import payrollService, { normalizeRule } from '../services/payrollService';

const STORAGE_KEY = 'peoplepay360_salary_rules_data';

export const INITIAL_RULES = [];

export const calculateSalaryBreakdown = (baseSalary = 50000, rulesList = null) => {
  const wage = Number(baseSalary) || 0;
  const basic = Math.round(wage * 0.5);
  const hra = Math.round(basic * 0.5);
  const sa = Math.max(0, wage - (basic + hra));
  const gross = basic + hra + sa;
  const pf = Math.round(basic * 0.12);
  const pt = wage > 12000 ? 200 : 0;
  const tds = Math.round(gross * 0.10);
  const totalDed = pf + pt + tds;
  const net = Math.max(0, gross - totalDed);

  return [
    {
      step: 1,
      title: 'Basic Salary',
      code: 'BASIC',
      category: 'BASIC',
      type: 'base',
      calcText: '50% of Contract Wage',
      amount: basic
    },
    {
      step: 2,
      title: 'House Rent Allowance (HRA)',
      code: 'HRA',
      category: 'ALLOWANCE',
      type: 'add',
      calcText: '50% of Basic wage',
      amount: hra
    },
    {
      step: 3,
      title: 'Special Allowance (SA)',
      code: 'SA',
      category: 'ALLOWANCE',
      type: 'add',
      calcText: 'Wage - (BASIC + HRA)',
      amount: sa
    },
    {
      step: 4,
      title: 'Gross Earnings',
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
      category: 'DEDUCTION',
      type: 'deduct',
      calcText: '12% of Basic contribution',
      amount: pf
    },
    {
      step: 6,
      title: 'Professional Tax (PT)',
      code: 'PT',
      category: 'DEDUCTION',
      type: 'deduct',
      calcText: 'Statutory fixed deduction',
      amount: pt
    },
    {
      step: 7,
      title: 'Tax Deducted at Source (TDS)',
      code: 'TDS',
      category: 'DEDUCTION',
      type: 'deduct',
      calcText: '10% of Gross Earnings',
      amount: tds
    },
    {
      step: 8,
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

export const fetchSalaryRuleByIdAsync = async (id) => {
  try {
    const rule = await payrollService.getSalaryRuleById(id);
    if (rule) {
      const currentList = getSalaryRules();
      const idx = currentList.findIndex((r) => String(r.id) === String(id) || r.code === id);
      if (idx !== -1) {
        currentList[idx] = rule;
      } else {
        currentList.push(rule);
      }
      saveSalaryRulesToStorage(currentList);
      return rule;
    }
  } catch (err) {
    console.warn('[Data Bridge] getSalaryRuleById failed:', err.message);
  }
  return getSalaryRuleById(id);
};

export const createSalaryRule = async (data) => {
  const res = await payrollService.createSalaryRule(data);
  await fetchSalaryRulesAsync();
  return res;
};

export const updateSalaryRule = async (id, data) => {
  const res = await payrollService.updateSalaryRule(id, data);
  await fetchSalaryRulesAsync();
  return res;
};

export const deleteSalaryRule = async (id) => {
  const res = await payrollService.deleteSalaryRule(id);
  const list = getSalaryRules().filter((r) => String(r.id) !== String(id) && r.code !== id);
  saveSalaryRulesToStorage(list);
  await fetchSalaryRulesAsync();
  return res;
};
