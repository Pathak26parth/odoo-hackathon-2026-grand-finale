import api from './api';

export function normalizeLeaveType(t) {
  if (!t) return null;
  return {
    ...t,
    id: String(t.id),
    name: t.name,
    code: t.code,
    allocationType: t.allocation_type || (t.requires_allocation ? 'Fixed Allocation' : 'No Allocation'),
    maxDaysPerYear: parseFloat(t.max_days_per_year || 0),
    color: t.color || 'blue',
    requiresApproval: !!t.requires_approval,
    requiresAllocation: !!t.requires_allocation,
    isPaid: !!t.is_paid,
    status: t.status || 'Active'
  };
}

export function normalizeAllocation(a) {
  if (!a) return null;
  const firstName = a.first_name || '';
  const lastName = a.last_name || '';
  const empName = a.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';
  const typeName = a.type_name || a.leaveType || a.timeOffTypeName || 'Paid Time Off';
  const allocated = parseFloat(a.allocated_days || a.allocatedDays || a.allocated || 0);
  const taken = parseFloat(a.taken_days || a.takenDays || a.taken || 0);
  const remaining = parseFloat(a.remaining_days || a.remainingDays || a.remaining || (allocated - taken));
  const validStart = a.validity_start ? String(a.validity_start).split('T')[0] : (a.validFrom || `${a.year || 2026}-01-01`);
  const validEnd = a.validity_end ? String(a.validity_end).split('T')[0] : (a.validUntil || `${a.year || 2026}-12-31`);

  return {
    ...a,
    id: String(a.id),
    employeeId: a.employee_code || (a.employee_id ? `EMP-${String(a.employee_id).padStart(3, '0')}` : String(a.employee_id)),
    internalEmployeeId: a.employee_id || a.internalEmployeeId,
    employeeName: empName,
    leaveType: typeName,
    timeOffTypeName: typeName,
    timeOffTypeId: String(a.time_off_type_id || a.timeOffTypeId || 1),
    year: a.year || new Date().getFullYear(),
    allocated: allocated,
    allocatedDays: allocated,
    taken: taken,
    takenDays: taken,
    remaining: remaining,
    remainingDays: remaining,
    validFrom: validStart,
    validUntil: validEnd,
    validityStart: validStart,
    validityEnd: validEnd,
    unit: a.unit || 'Days',
    status: (a.status || 'Approved').toUpperCase()
  };
}

export function normalizeLeaveRequest(r) {
  if (!r) return null;
  const firstName = r.first_name || '';
  const lastName = r.last_name || '';
  const empName = r.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';
  const typeName = r.type_name || r.leaveType || r.timeOffTypeName || 'Paid Time Off';
  const dur = parseFloat(r.total_days || r.totalDays || r.duration || 1);

  return {
    ...r,
    id: String(r.id),
    employeeId: r.employee_code || (r.employee_id ? `EMP-${String(r.employee_id).padStart(3, '0')}` : String(r.employee_id)),
    internalEmployeeId: r.employee_id || r.internalEmployeeId,
    employeeName: empName,
    department: r.department_name || r.department || 'General',
    leaveType: typeName,
    timeOffTypeName: typeName,
    timeOffTypeId: String(r.time_off_type_id || r.timeOffTypeId || 1),
    startDate: r.start_date ? String(r.start_date).split('T')[0] : (r.startDate || ''),
    endDate: r.end_date ? String(r.end_date).split('T')[0] : (r.endDate || ''),
    duration: dur,
    totalDays: dur,
    unit: r.unit || 'Days',
    reason: r.reason || '',
    status: (r.status || 'Pending').charAt(0).toUpperCase() + (r.status || 'Pending').slice(1).toLowerCase(),
    approverName: r.approver_name || r.approved_by_name || null,
    approvedAt: r.approved_at || null,
    rejectionReason: r.rejection_reason || null,
    createdAt: r.created_at ? String(r.created_at).split('T')[0] : ''
  };
}

export const timeOffService = {
  // Types
  async getTimeOffTypes() {
    const res = await api.get('/time-off/types');
    const raw = res.data || [];
    return raw.map(normalizeLeaveType);
  },

  async createTimeOffType(payload) {
    const res = await api.post('/time-off/types', payload);
    return res.data;
  },

  async updateTimeOffType(id, payload) {
    const res = await api.put(`/time-off/types/${id}`, payload);
    return res.data;
  },

  async deleteTimeOffType(id) {
    const res = await api.delete(`/time-off/types/${id}`);
    return res.data;
  },

  // Allocations
  async getAllocations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/time-off/allocations?${query}`);
    const raw = res.data || [];
    return raw.map(normalizeAllocation);
  },

  async createAllocation(payload) {
    const res = await api.post('/time-off/allocations', {
      employeeId: payload.employeeId,
      timeOffTypeId: payload.timeOffTypeId,
      year: payload.year || new Date().getFullYear(),
      allocatedDays: payload.allocatedDays || payload.days,
      validityStart: payload.validityStart,
      validityEnd: payload.validityEnd
    });
    return res.data;
  },

  // Requests
  async getRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/time-off/requests?${query}`);
    const raw = res.data || [];
    return raw.map(normalizeLeaveRequest);
  },

  async createRequest(payload) {
    const res = await api.post('/time-off/requests', {
      employeeId: payload.employeeId,
      timeOffTypeId: payload.timeOffTypeId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalDays: payload.duration || payload.totalDays,
      reason: payload.reason
    });
    return res.data;
  },

  async approveRequest(id) {
    const res = await api.post(`/time-off/requests/${id}/approve`);
    return res.data;
  },

  async refuseRequest(id, rejectionReason) {
    const res = await api.post(`/time-off/requests/${id}/refuse`, { rejectionReason });
    return res.data;
  }
};

export default timeOffService;
