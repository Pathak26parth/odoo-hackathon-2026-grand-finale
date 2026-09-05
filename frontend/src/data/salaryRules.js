const STORAGE_KEY = 'peoplepay360_salary_rules_data';

export const INITIAL_SALARY_RULES = [
  {
    id: 'rule-1',
    sequence: 1,
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'Basic',
    computationType: 'Fixed Amount',
    amount: 50000,
    percentage: 0,
    basedOn: 'None',
    formula: '',
    valueDisplay: '₹50,000',
    status: 'Active',
    description: 'Primary base pay component defined in the employee contract.'
  },
  {
    id: 'rule-2',
    sequence: 2,
    name: 'Housing Allowance',
    code: 'HOUSE',
    category: 'Allowances',
    computationType: 'Percentage',
    amount: 0,
    percentage: 20,
    basedOn: 'Basic Salary',
    formula: '',
    valueDisplay: '20% of Basic',
    status: 'Active',
    description: 'Statutory accommodation and housing support allowance.'
  },
  {
    id: 'rule-3',
    sequence: 3,
    name: 'Transport Allowance',
    code: 'TRANS',
    category: 'Allowances',
    computationType: 'Fixed Amount',
    amount: 5000,
    percentage: 0,
    basedOn: 'None',
    formula: '',
    valueDisplay: '₹5,000',
    status: 'Active',
    description: 'Fixed monthly conveyance reimbursement.'
  },
  {
    id: 'rule-4',
    sequence: 4,
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    computationType: 'Formula',
    amount: 0,
    percentage: 0,
    basedOn: 'None',
    formula: 'BASIC + HOUSE + TRANS',
    valueDisplay: 'BASIC + HOUSE + TRANS',
    status: 'Active',
    description: 'Sum total of basic pay and all regular earnings.'
  },
  {
    id: 'rule-5',
    sequence: 5,
    name: 'Tax',
    code: 'TAX',
    category: 'Deductions',
    computationType: 'Percentage',
    amount: 0,
    percentage: 10,
    basedOn: 'Gross Salary',
    formula: '',
    valueDisplay: '10% of Gross',
    status: 'Active',
    description: 'Standard withholding income tax deduction.'
  },
  {
    id: 'rule-6',
    sequence: 6,
    name: 'Insurance',
    code: 'INSURANCE',
    category: 'Deductions',
    computationType: 'Percentage',
    amount: 0,
    percentage: 2,
    basedOn: 'Gross Salary',
    formula: '',
    valueDisplay: '2% of Gross',
    status: 'Active',
    description: 'Mandatory health and corporate medical coverage deduction.'
  },
  {
    id: 'rule-7',
    sequence: 7,
    name: 'Net Salary',
    code: 'NET',
    category: 'Net',
    computationType: 'Formula',
    amount: 0,
    percentage: 0,
    basedOn: 'None',
    formula: 'GROSS - TAX - INSURANCE',
    valueDisplay: 'GROSS - TAX - INSURANCE',
    status: 'Active',
    description: 'Final net payable amount after taxes and statutory withholdings.'
  }
];

export const getSalaryRules = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.sort((a, b) => Number(a.sequence) - Number(b.sequence));
    }
  } catch (err) {
    console.error('Error reading salary rules from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SALARY_RULES));
  return INITIAL_SALARY_RULES;
};

export const saveSalaryRulesToStorage = (rules) => {
  try {
    const sorted = [...rules].sort((a, b) => Number(a.sequence) - Number(b.sequence));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.error('Error saving salary rules to localStorage:', err);
  }
};

export const getSalaryRuleById = (id) => {
  const list = getSalaryRules();
  return list.find((r) => r.id === id) || null;
};

export const createSalaryRule = (data) => {
  const list = getSalaryRules();
  let valueDisplay = '';
  if (data.computationType === 'Fixed Amount') {
    valueDisplay = `₹${Number(data.amount || 0).toLocaleString()}`;
  } else if (data.computationType === 'Percentage') {
    valueDisplay = `${data.percentage}% of ${data.basedOn || 'Basic'}`;
  } else {
    valueDisplay = data.formula || 'Custom Formula';
  }

  const newRule = {
    id: `rule-${Date.now()}`,
    sequence: Number(data.sequence) || list.length + 1,
    status: data.status || 'Active',
    valueDisplay,
    ...data
  };

  const updated = [...list, newRule];
  saveSalaryRulesToStorage(updated);
  return newRule;
};

export const updateSalaryRule = (id, data) => {
  const list = getSalaryRules();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  let valueDisplay = data.valueDisplay;
  if (data.computationType === 'Fixed Amount') {
    valueDisplay = `₹${Number(data.amount || 0).toLocaleString()}`;
  } else if (data.computationType === 'Percentage') {
    valueDisplay = `${data.percentage}% of ${data.basedOn || 'Basic'}`;
  } else if (data.computationType === 'Formula') {
    valueDisplay = data.formula || 'Custom Formula';
  }

  const updated = {
    ...list[index],
    ...data,
    sequence: Number(data.sequence) || list[index].sequence,
    valueDisplay: valueDisplay || list[index].valueDisplay
  };

  list[index] = updated;
  saveSalaryRulesToStorage(list);
  return updated;
};

export const deleteSalaryRule = (id) => {
  const list = getSalaryRules();
  const updated = list.filter((r) => r.id !== id);
  saveSalaryRulesToStorage(updated);
  return true;
};

// Calculate visual calculation preview step-by-step
export const calculateSalaryBreakdown = (baseSalary = 50000) => {
  const basic = Number(baseSalary) || 50000;
  const house = Math.round(basic * 0.20);
  const trans = 5000;
  const gross = basic + house + trans;
  const tax = Math.round(gross * 0.10);
  const insurance = Math.round(gross * 0.02);
  const net = gross - tax - insurance;

  return [
    {
      step: 1,
      title: 'Basic Salary',
      code: 'BASIC',
      category: 'Basic',
      calcText: 'Input Base Salary',
      amount: basic,
      isTotal: false,
      type: 'base'
    },
    {
      step: 2,
      title: 'Housing Allowance',
      code: 'HOUSE',
      category: 'Allowances',
      calcText: '20% of Basic',
      amount: house,
      isTotal: false,
      type: 'add'
    },
    {
      step: 3,
      title: 'Transport Allowance',
      code: 'TRANS',
      category: 'Allowances',
      calcText: 'Fixed Allowance',
      amount: trans,
      isTotal: false,
      type: 'add'
    },
    {
      step: 4,
      title: 'Gross Salary',
      code: 'GROSS',
      category: 'Gross',
      calcText: 'BASIC + HOUSE + TRANS',
      amount: gross,
      isTotal: true,
      type: 'subtotal'
    },
    {
      step: 5,
      title: 'Tax',
      code: 'TAX',
      category: 'Deductions',
      calcText: '10% of Gross',
      amount: tax,
      isTotal: false,
      type: 'deduct'
    },
    {
      step: 6,
      title: 'Insurance',
      code: 'INSURANCE',
      category: 'Deductions',
      calcText: '2% of Gross',
      amount: insurance,
      isTotal: false,
      type: 'deduct'
    },
    {
      step: 7,
      title: 'Net Salary',
      code: 'NET',
      category: 'Net',
      calcText: 'GROSS - TAX - INSURANCE',
      amount: net,
      isTotal: true,
      type: 'net'
    }
  ];
};
