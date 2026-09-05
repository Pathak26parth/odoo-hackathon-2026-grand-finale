import api from './api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';

export function normalizeEmployee(emp) {
  if (!emp) return null;
  const firstName = emp.first_name || emp.firstName || '';
  const lastName = emp.last_name || emp.lastName || '';
  const fullName = emp.name || `${firstName} ${lastName}`.trim() || 'Employee';

  return {
    ...emp,
    id: String(emp.id),
    internalId: String(emp.id),
    employeeId: emp.employee_code || emp.employeeId || `EMP-${String(emp.id).padStart(3, '0')}`,
    firstName,
    lastName,
    name: fullName,
    email: emp.email || '',
    phone: emp.phone || '',
    position: emp.job_position || emp.position || 'Employee',
    jobPosition: emp.job_position || emp.position || 'Employee',
    department: emp.department_name || emp.department || 'General',
    departmentId: emp.department_id || emp.departmentId || null,
    manager: emp.manager_name || emp.manager || 'None',
    managerId: emp.manager_id || emp.managerId || null,
    schedule: emp.schedule_name || emp.schedule || 'Standard 40 Hours',
    workingScheduleId: emp.working_schedule_id || emp.workingScheduleId || 1,
    status: (emp.status || 'Active').toUpperCase() === 'ACTIVE' ? 'Active' : (emp.status || 'Active'),
    avatar: emp.profile_photo_url || emp.avatar || DEFAULT_AVATAR,
    profilePhotoUrl: emp.profile_photo_url || emp.avatar || DEFAULT_AVATAR,
    gender: emp.gender || 'OTHER',
    dateOfBirth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
    joiningDate: emp.joining_date ? emp.joining_date.split('T')[0] : '',
    faceEnrollmentStatus: emp.face_enrollment_status || emp.faceEnrollmentStatus || 'NOT_ENROLLED',
    contractsCount: emp.metrics?.contractsCount || emp.contractsCount || 0,
    attendanceCount: emp.metrics?.attendanceCount || emp.attendanceCount || 0,
    timeOffCount: emp.metrics?.timeOffCount || emp.timeOffCount || 0,
    allocationsCount: emp.metrics?.allocationsCount || emp.allocationsCount || 0,
    currentWage: emp.current_wage || emp.currentWage || null,
    activeContractId: emp.active_contract_id || emp.activeContractId || null,
    bankDetails: emp.bankDetails || null
  };
}

export const employeeService = {
  async getAllEmployees(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.departmentId && params.departmentId !== 'All') query.append('departmentId', params.departmentId);
    if (params.status && params.status !== 'All') query.append('status', params.status.toUpperCase());
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit || 50);

    const res = await api.get(`/employees?${query.toString()}`);
    const rawList = res.data?.employees || res.data || [];
    return rawList.map(normalizeEmployee);
  },

  async getEmployeeById(id) {
    const res = await api.get(`/employees/${id}`);
    return normalizeEmployee(res.data);
  },

  async getMeEmployee() {
    const res = await api.get('/employees/me');
    return normalizeEmployee(res.data);
  },

  async createEmployee(payload) {
    const body = {
      firstName: payload.firstName || (payload.name ? payload.name.split(' ')[0] : ''),
      lastName: payload.lastName || (payload.name ? payload.name.split(' ').slice(1).join(' ') : ''),
      email: payload.email,
      phone: payload.phone || null,
      jobPosition: payload.position || payload.jobPosition || 'Employee',
      departmentId: payload.departmentId ? Number(payload.departmentId) : (payload.department ? 1 : null),
      managerId: payload.managerId ? Number(payload.managerId) : null,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : 1,
      gender: payload.gender || 'OTHER',
      dateOfBirth: payload.dateOfBirth || null,
      joiningDate: payload.joiningDate || new Date().toISOString().split('T')[0],
      profilePhotoUrl: payload.avatar || payload.profilePhotoUrl || null,
      roleName: payload.role || 'EMPLOYEE',
      bankDetails: payload.bankDetails || null,
      initialContract: payload.initialContract || (payload.wage ? { wage: payload.wage, salaryStructureId: 1 } : null)
    };

    const res = await api.post('/employees', body);
    return res.data;
  },

  async updateEmployee(id, payload) {
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      jobPosition: payload.position || payload.jobPosition,
      departmentId: payload.departmentId ? Number(payload.departmentId) : undefined,
      managerId: payload.managerId ? Number(payload.managerId) : undefined,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : undefined,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      joiningDate: payload.joiningDate,
      status: payload.status ? payload.status.toUpperCase() : undefined,
      profilePhotoUrl: payload.avatar || payload.profilePhotoUrl,
      bankDetails: payload.bankDetails
    };

    const res = await api.put(`/employees/${id}`, body);
    return res;
  },

  async deleteEmployee(id) {
    const res = await api.delete(`/employees/${id}`);
    return res;
  },

  async getEmployeeContracts(id) {
    const res = await api.get(`/employees/${id}/contracts`);
    return res.data || [];
  },

  async getEmployeeAttendance(id, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/employees/${id}/attendance?${query}`);
    return res.data || [];
  },

  async getEmployeeTimeOff(id) {
    const res = await api.get(`/employees/${id}/time-off`);
    return res.data || { requests: [], allocations: [] };
  },

  async getEmployeePayslips(id) {
    const res = await api.get(`/employees/${id}/payslips`);
    return res.data || [];
  }
};

export default employeeService;
