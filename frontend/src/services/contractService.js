import api from './api';

export function normalizeContract(c) {
  if (!c) return null;
  const firstName = c.first_name || '';
  const lastName = c.last_name || '';
  const empName = c.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';

  return {
    ...c,
    id: String(c.id),
    contractCode: c.contract_code || `CON-${c.id}`,
    reference: c.contract_code || `CON-${c.id}`,
    employeeId: c.employee_code || String(c.employee_id),
    internalEmployeeId: c.employee_id,
    employeeName: empName,
    employee: empName,
    position: c.job_position || c.position || 'Staff',
    department: c.department_name || c.department || 'General',
    departmentId: c.department_id || null,
    structure: c.structure_name || c.structure || 'Standard Salary Structure',
    salaryStructureId: c.salary_structure_id || 1,
    schedule: c.schedule_name || c.schedule || 'Standard 40 Hours',
    workingScheduleId: c.working_schedule_id || 1,
    wage: parseFloat(c.wage || 0),
    salary: parseFloat(c.wage || 0),
    startDate: c.start_date ? c.start_date.split('T')[0] : '',
    endDate: c.end_date ? c.end_date.split('T')[0] : null,
    status: (c.status || 'Active').toUpperCase() === 'ACTIVE' ? 'Active' : (c.status || 'Active')
  };
}

export const contractService = {
  async getContracts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/contracts?${query}`);
    const rawList = res.data?.contracts || res.data || [];
    return rawList.map(normalizeContract);
  },

  async getContractById(id) {
    const res = await api.get(`/contracts/${id}`);
    return normalizeContract(res.data);
  },

  async createContract(payload) {
    const res = await api.post('/contracts', {
      employeeId: payload.internalEmployeeId || payload.employeeId,
      departmentId: payload.departmentId ? Number(payload.departmentId) : null,
      jobPosition: payload.position || payload.jobPosition,
      wage: payload.wage || payload.salary,
      salaryStructureId: payload.salaryStructureId ? Number(payload.salaryStructureId) : 1,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : 1,
      startDate: payload.startDate,
      endDate: payload.endDate || null,
      status: payload.status ? payload.status.toUpperCase() : 'ACTIVE'
    });
    return res.data;
  },

  async updateContract(id, payload) {
    const res = await api.put(`/contracts/${id}`, {
      departmentId: payload.departmentId ? Number(payload.departmentId) : undefined,
      jobPosition: payload.position || payload.jobPosition,
      wage: payload.wage || payload.salary,
      salaryStructureId: payload.salaryStructureId ? Number(payload.salaryStructureId) : undefined,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : undefined,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: payload.status ? payload.status.toUpperCase() : undefined
    });
    return res.data;
  },

  async deleteContract(id) {
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
  }
};

export default contractService;
