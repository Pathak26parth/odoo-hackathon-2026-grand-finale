import api from './api';

export function normalizeAttendance(att) {
  if (!att) return null;
  const firstName = att.first_name || '';
  const lastName = att.last_name || '';
  const empName = att.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';

  const formatTime = (timeVal) => {
    if (!timeVal) return null;
    if (typeof timeVal === 'string' && timeVal.includes('T')) {
      return new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (typeof timeVal === 'string' && timeVal.includes(':')) {
      return timeVal.slice(0, 5);
    }
    return timeVal;
  };

  return {
    ...att,
    id: String(att.id),
    employeeId: att.employee_code || String(att.employee_id),
    internalEmployeeId: att.employee_id,
    employeeName: empName,
    name: empName,
    department: att.department_name || att.department || 'General',
    date: att.date ? att.date.split('T')[0] : new Date().toISOString().split('T')[0],
    checkIn: formatTime(att.check_in || att.checkIn),
    checkOut: formatTime(att.check_out || att.checkOut),
    workedHours: parseFloat(att.worked_hours || att.workedHours || 0),
    status: att.status || 'Present',
    lateMinutes: att.late_minutes || 0,
    overtimeHours: parseFloat(att.overtime_hours || 0),
    isManualCorrection: !!att.is_manual_correction,
    verificationMethod: att.verification_method || 'PORTAL'
  };
}

export const attendanceService = {
  async getAllAttendance(params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.status) query.append('status', params.status);

    const res = await api.get(`/attendance?${query.toString()}`);
    const rawList = res.data?.records || res.data || [];
    return rawList.map(normalizeAttendance);
  },

  async getAttendanceById(id) {
    const res = await api.get(`/attendance/${id}`);
    return normalizeAttendance(res.data);
  },

  async portalCheckIn(employeeId) {
    const res = await api.post('/attendance/check-in', { employeeId });
    return res.data;
  },

  async portalCheckOut(employeeId) {
    const res = await api.post('/attendance/check-out', { employeeId });
    return res.data;
  },

  async faceCheckIn(faceInput, employeeId) {
    const res = await api.post('/attendance/face-check-in', { faceInput, employeeId });
    return res.data;
  },

  async faceCheckOut(faceInput, employeeId) {
    const res = await api.post('/attendance/face-check-out', { faceInput, employeeId });
    return res.data;
  },

  async correctAttendance(id, checkIn, checkOut, reason) {
    const res = await api.patch(`/attendance/${id}/correct`, { checkIn, checkOut, reason });
    return res.data;
  },

  // Face Biometric Management
  async getFaceStatus(employeeId) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    const res = await api.get(`/attendance/face/status${query}`);
    return res.data;
  },

  async enrollFace(faceInput, employeeId) {
    const res = await api.post('/attendance/face/enroll', {
      faceEmbeddingOrImage: faceInput,
      employeeId
    });
    return res.data;
  },

  async revokeFaceEnrollment(employeeId) {
    const res = await api.delete(`/attendance/face/enrollment?employeeId=${employeeId}`);
    return res.data;
  },

  async getFaceLogs(employeeId) {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    const res = await api.get(`/attendance/face/logs${query}`);
    return res.data || [];
  }
};

export default attendanceService;
