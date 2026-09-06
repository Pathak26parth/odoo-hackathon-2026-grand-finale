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
    role: emp.user_role || emp.role || emp.roleName || emp.role_name || emp.user_role_display || 'EMPLOYEE',
    roleDisplayName: emp.user_role_display || (emp.user_role === 'HR_MANAGER' ? 'HR Manager' : (emp.user_role === 'HR_PAYROLL_ADMIN' ? 'HR Payroll Admin' : (emp.user_role === 'HR_PAYROLL_USER' ? 'HR Payroll User' : (emp.user_role === 'ADMIN' ? 'Admin' : 'Employee')))),
    userRole: emp.user_role || emp.role || 'EMPLOYEE',
    faceEnrollmentStatus: emp.face_enrollment_status || emp.faceEnrollmentStatus || 'NOT_ENROLLED',
    contractsCount: emp.metrics?.contractsCount || emp.contractsCount || 0,
    attendanceCount: emp.metrics?.attendanceCount || emp.attendanceCount || 0,
    timeOffCount: emp.metrics?.timeOffCount || emp.timeOffCount || 0,
    allocationsCount: emp.metrics?.allocationsCount || emp.allocationsCount || 0,
    currentWage: emp.current_wage || emp.currentWage || null,
    activeContractId: emp.active_contract_id || emp.activeContractId || null,
    bankDetails: (emp.bankDetails || emp.bank_details) ? {
      id: emp.bankDetails?.id || emp.bank_details?.id,
      accountHolderName: emp.bankDetails?.accountHolderName || emp.bankDetails?.account_holder_name || emp.bank_details?.account_holder_name || '',
      bankName: emp.bankDetails?.bankName || emp.bankDetails?.bank_name || emp.bank_details?.bank_name || '',
      accountNumber: emp.bankDetails?.accountNumber || emp.bankDetails?.account_number || emp.bank_details?.account_number || '',
      accountNumberMasked: emp.bankDetails?.accountNumberMasked || emp.bankDetails?.account_number_masked || emp.bank_details?.account_number_masked || '',
      ifscCode: emp.bankDetails?.ifscCode || emp.bankDetails?.ifsc_code || emp.bank_details?.ifsc_code || '',
      branchName: emp.bankDetails?.branchName || emp.bankDetails?.branch_name || emp.bank_details?.branch_name || '',
      accountType: emp.bankDetails?.accountType || emp.bankDetails?.account_type || emp.bank_details?.account_type || 'SALARY',
      isPrimary: emp.bankDetails?.isPrimary !== undefined ? emp.bankDetails.isPrimary : (emp.bank_details?.is_primary !== undefined ? !!emp.bank_details.is_primary : true)
    } : null
  };
}

export const employeeService = {
  async getDepartments() {
    const res = await api.get('/employees/departments');
    return res.data || [];
  },

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
    let resolvedDeptId = payload.departmentId ? Number(payload.departmentId) : null;
    if (!resolvedDeptId && payload.department) {
      const deptMap = {
        'engineering': 1,
        'engineering & technology': 1,
        'human resources': 2,
        'hr': 2,
        'finance': 3,
        'finance & payroll operations': 3,
        'marketing': 4,
        'marketing & growth': 4
      };
      resolvedDeptId = deptMap[String(payload.department).trim().toLowerCase()] || 1;
    }

    const body = {
      firstName: payload.firstName || (payload.name ? payload.name.split(' ')[0] : ''),
      lastName: payload.lastName || (payload.name ? payload.name.split(' ').slice(1).join(' ') : ''),
      email: payload.email,
      phone: payload.phone || null,
      jobPosition: payload.position || payload.jobPosition || 'Employee',
      department: payload.department,
      departmentId: resolvedDeptId || 1,
      managerId: payload.managerId ? Number(payload.managerId) : null,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : 1,
      gender: payload.gender || 'OTHER',
      dateOfBirth: payload.dateOfBirth || null,
      joiningDate: payload.joiningDate || new Date().toISOString().split('T')[0],
      profilePhotoUrl: payload.avatar || payload.profilePhotoUrl || null,
      role: payload.role || payload.roleName || 'EMPLOYEE',
      roleName: payload.role || payload.roleName || 'EMPLOYEE',
      bankDetails: payload.bankDetails || (
        (payload.accountNumber || payload.bankName || payload.ifscCode) ? {
          accountHolderName: payload.accountHolderName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
          bankName: payload.bankName || 'Bank',
          accountNumber: payload.accountNumber,
          ifscCode: payload.ifscCode,
          branchName: payload.branchName || null,
          accountType: payload.accountType || 'SALARY'
        } : null
      ),
      initialContract: payload.initialContract || (payload.wage ? { wage: payload.wage, salaryStructureId: 1 } : null)
    };

    const res = await api.post('/employees', body);
    return res.data;
  },

  async updateEmployee(id, payload) {
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      position: payload.position || payload.jobPosition,
      jobPosition: payload.position || payload.jobPosition,
      department: payload.department,
      departmentId: payload.departmentId ? Number(payload.departmentId) : undefined,
      manager: payload.manager,
      managerId: payload.managerId ? Number(payload.managerId) : undefined,
      schedule: payload.schedule,
      workingScheduleId: payload.workingScheduleId ? Number(payload.workingScheduleId) : undefined,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      joiningDate: payload.joiningDate,
      status: payload.status ? payload.status.toUpperCase() : undefined,
      avatar: payload.avatar || payload.profilePhotoUrl,
      profilePhotoUrl: payload.avatar || payload.profilePhotoUrl,
      role: payload.role || payload.roleName,
      roleName: payload.role || payload.roleName,
      bankDetails: payload.bankDetails || (
        (payload.accountNumber || payload.bankName || payload.ifscCode) ? {
          accountHolderName: payload.accountHolderName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
          bankName: payload.bankName || 'Bank',
          accountNumber: payload.accountNumber,
          ifscCode: payload.ifscCode,
          branchName: payload.branchName || null,
          accountType: payload.accountType || 'SALARY'
        } : null
      )
    };

    const res = await api.put(`/employees/${id}`, body);
    const empData = res?.data?.employee || res?.data || res;
    return normalizeEmployee(empData);
  },

  async deleteEmployee(id) {
    const res = await api.delete(`/employees/${id}`);
    return res;
  },

  async uploadEmployeePhoto(id, imageOrBase64) {
    if (imageOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append('photo', imageOrBase64);
      const res = await api.post(`/upload/employee-photo/${id}`, formData);
      return res.data;
    } else {
      const res = await api.post(`/upload/employee-photo/${id}`, { image: imageOrBase64 });
      return res.data;
    }
  },

  async uploadImage(fileOrBase64, folder = 'peoplepay360/uploads') {
    if (fileOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append('image', fileOrBase64);
      formData.append('folder', folder);
      const res = await api.post('/upload/image', formData);
      return res.data?.url || res.data;
    } else {
      const res = await api.post('/upload/image', { image: fileOrBase64, folder });
      return res.data?.url || res.data;
    }
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

