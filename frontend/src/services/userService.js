import api from './api';

export function normalizeUser(u) {
  if (!u) return null;
  const firstName = u.first_name || '';
  const lastName = u.last_name || '';
  const empName = `${firstName} ${lastName}`.trim() || u.email.split('@')[0];

  return {
    ...u,
    id: String(u.id),
    name: empName,
    email: u.email,
    role: u.role_display_name || u.role_name || u.role,
    roleName: u.role_name || u.role,
    roleId: u.role_id,
    employeeId: u.employee_code || (u.employee_id ? String(u.employee_id) : null),
    internalEmployeeId: u.employee_id,
    department: u.department_name || 'General',
    position: u.job_position || 'Staff',
    isActive: !!u.is_active,
    status: u.is_active ? 'Active' : 'Inactive',
    createdAt: u.created_at ? u.created_at.split('T')[0] : ''
  };
}

export const userService = {
  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/users?${query}`);
    const rawList = res.data?.users || res.data || [];
    return rawList.map(normalizeUser);
  },

  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return normalizeUser(res.data);
  },

  async createUser(payload) {
    const res = await api.post('/users', {
      email: payload.email,
      password: payload.password,
      role: payload.role,
      roleId: payload.roleId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: payload.name,
      departmentId: payload.departmentId,
      jobPosition: payload.jobPosition || payload.position,
      phone: payload.phone,
      employeeId: payload.employeeId,
      createEmployeeRecord: payload.createEmployeeRecord !== false,
      sendInvitation: payload.sendInvitation !== false
    });
    return res.data;
  },

  async updateUser(id, payload) {
    const res = await api.put(`/users/${id}`, payload);
    return res.data;
  },

  async changeUserRole(id, roleOrRoleId) {
    const body = typeof roleOrRoleId === 'number' ? { roleId: roleOrRoleId } : { role: roleOrRoleId };
    const res = await api.patch(`/users/${id}/role`, body);
    return res.data;
  },

  async deleteUser(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  async getRoles() {
    const res = await api.get('/users/roles');
    return res.data || [];
  },

  async getPermissions() {
    const res = await api.get('/users/permissions');
    return res.data || { all: [], grouped: {} };
  },

  async updateRolePermissions(roleId, permissionIds) {
    const res = await api.put(`/users/roles/${roleId}/permissions`, { permissionIds });
    return res.data;
  }
};

export default userService;
