import api from './api';

export function normalizeStructure(s) {
  if (!s) return null;
  return {
    ...s,
    id: String(s.id),
    name: s.name,
    code: s.code,
    description: s.description || '',
    currency: s.currency || 'INR',
    status: s.status || 'Active',
    rulesCount: s.rules?.length || s.rules_count || 0,
    rules: s.rules || []
  };
}

export function normalizeRule(r) {
  if (!r) return null;
  return {
    ...r,
    id: String(r.id),
    name: r.name,
    code: r.code,
    category: r.category,
    sequence: r.sequence || 1,
    computationType: r.computation_type || r.computationType || 'FIXED',
    value: parseFloat(r.value || 0),
    percentageBasis: r.percentage_basis || r.percentageBasis || null,
    formula: r.formula || null,
    status: r.status || 'Active'
  };
}

export function normalizePayrun(pr) {
  if (!pr) return null;
  const start = pr.period_start ? pr.period_start.split('T')[0] : '';
  const end = pr.period_end ? pr.period_end.split('T')[0] : '';
  const periodLabel = start && end ? `${start} to ${end}` : (pr.name || 'Payrun');

  return {
    ...pr,
    id: String(pr.id),
    runCode: pr.run_code || `PAYRUN-${pr.id}`,
    name: pr.name || `Payroll Run ${pr.run_code}`,
    period: periodLabel,
    periodStart: start,
    periodEnd: end,
    structure: pr.structure_name || pr.structure || 'Standard Salary Structure',
    structureId: pr.salary_structure_id || pr.structureId || 1,
    status: (pr.status || 'DRAFT').toUpperCase(),
    payslipsCount: pr.payslips_count || (pr.payslips ? pr.payslips.length : 0),
    totalGross: parseFloat(pr.total_gross || 0),
    totalDeductions: parseFloat(pr.total_deductions || 0),
    totalNet: parseFloat(pr.total_net || 0),
    createdAt: pr.created_at ? pr.created_at.split('T')[0] : '',
    payslips: pr.payslips ? pr.payslips.map(normalizePayslip) : []
  };
}

export function normalizePayslip(ps) {
  if (!ps) return null;
  const firstName = ps.first_name || '';
  const lastName = ps.last_name || '';
  const empName = ps.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';

  return {
    ...ps,
    id: String(ps.id),
    slipNumber: ps.slip_number || `SLIP-${ps.id}`,
    payrunId: String(ps.payrun_id || ps.payrunId || ''),
    payrunName: ps.payrun_name || ps.run_name || 'Payroll Batch',
    employeeId: ps.employee_code || String(ps.employee_id || ''),
    internalEmployeeId: ps.employee_id,
    employeeName: empName,
    name: empName,
    department: ps.department_name || ps.department || 'General',
    position: ps.job_position || ps.position || 'Staff',
    bankAccountMasked: ps.bank_account_masked || 'XXXX-XXXX-1234',
    period: ps.period_start && ps.period_end ? `${ps.period_start.split('T')[0]} to ${ps.period_end.split('T')[0]}` : 'Current Period',
    periodStart: ps.period_start ? ps.period_start.split('T')[0] : '',
    periodEnd: ps.period_end ? ps.period_end.split('T')[0] : '',
    basic: parseFloat(ps.basic_wage || ps.basic || 0),
    gross: parseFloat(ps.gross_salary || ps.gross || 0),
    deductions: parseFloat(ps.total_deductions || ps.deductions || 0),
    net: parseFloat(ps.net_salary || ps.net || 0),
    status: (ps.status || 'DRAFT').toUpperCase(),
    workedDays: parseFloat(ps.worked_days || 30),
    totalDaysInPeriod: ps.total_days_in_period || 30,
    lines: ps.lines || []
  };
}

export const payrollService = {
  // Salary Structures
  async getSalaryStructures() {
    const res = await api.get('/salary-structures');
    const raw = res.data || [];
    return raw.map(normalizeStructure);
  },

  async getSalaryStructureById(id) {
    const res = await api.get(`/salary-structures/${id}`);
    return normalizeStructure(res.data);
  },

  async createSalaryStructure(payload) {
    const res = await api.post('/salary-structures', payload);
    return res.data;
  },

  async updateSalaryStructure(id, payload) {
    const res = await api.put(`/salary-structures/${id}`, payload);
    return res.data;
  },

  async deleteSalaryStructure(id) {
    const res = await api.delete(`/salary-structures/${id}`);
    return res.data;
  },

  // Salary Rules
  async getSalaryRules() {
    const res = await api.get('/salary-rules');
    const raw = res.data || [];
    return raw.map(normalizeRule);
  },

  async getSalaryRuleById(id) {
    const res = await api.get(`/salary-rules/${id}`);
    return normalizeRule(res.data);
  },

  async createSalaryRule(payload) {
    const res = await api.post('/salary-rules', payload);
    return res.data;
  },

  async updateSalaryRule(id, payload) {
    const res = await api.put(`/salary-rules/${id}`, payload);
    return res.data;
  },

  async deleteSalaryRule(id) {
    const res = await api.delete(`/salary-rules/${id}`);
    return res.data;
  },

  // Payruns
  async getPayruns() {
    const res = await api.get('/payruns');
    const raw = res.data || [];
    return raw.map(normalizePayrun);
  },

  async getPayrunById(id) {
    const res = await api.get(`/payruns/${id}`);
    return normalizePayrun(res.data);
  },

  async validateScope(payload) {
    const res = await api.post('/payruns/validate-scope', payload);
    return res.data;
  },

  async createPayrun(payload) {
    const res = await api.post('/payruns', payload);
    return res.data;
  },

  async computePayrun(id) {
    const res = await api.post(`/payruns/${id}/compute`);
    return res.data;
  },

  async validatePayrun(id) {
    const res = await api.post(`/payruns/${id}/validate`);
    return res.data;
  },

  async payPayrun(id) {
    const res = await api.post(`/payruns/${id}/pay`);
    return res.data;
  },

  async sendPayslipsBulk(id) {
    const res = await api.post(`/payruns/${id}/send-payslips`);
    return res.data;
  },

  async deletePayrun(id) {
    const res = await api.delete(`/payruns/${id}`);
    return res.data;
  },

  // Payslips
  async getPayslips(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/payslips?${query}`);
    const raw = res.data?.payslips || res.data || [];
    return raw.map(normalizePayslip);
  },

  async getPayslipById(id) {
    const res = await api.get(`/payslips/${id}`);
    return normalizePayslip(res.data);
  },

  async sendPayslipEmail(id) {
    const res = await api.post(`/payslips/${id}/send`);
    return res.data;
  },

  async downloadPayslipPdf(id) {
    const blob = await api.get(`/payslips/${id}/pdf`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default payrollService;
