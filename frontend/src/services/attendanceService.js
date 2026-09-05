import api from './api';

export function normalizeAttendance(att) {
  if (!att) return null;
  const firstName = att.first_name || '';
  const lastName = att.last_name || '';
  const empName = att.employee_name || `${firstName} ${lastName}`.trim() || 'Employee';

  const formatTime = (timeVal) => {
    if (!timeVal) return null;
    if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
      return `${String(timeVal.getHours()).padStart(2, '0')}:${String(timeVal.getMinutes()).padStart(2, '0')}`;
    }
    const str = String(timeVal).trim();
    if (!str) return null;

    // Handle datetime strings like "2026-09-05 22:41:02" or "2026-09-05T22:41:02"
    if (str.includes(' ') || str.includes('T')) {
      const parts = str.split(/[ T]/);
      if (parts[1]) {
        const timePart = parts[1].replace('Z', '');
        const m = timePart.match(/^(\d{1,2}):(\d{2})/);
        if (m) {
          return `${m[1].padStart(2, '0')}:${m[2]}`;
        }
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }

    // Handle simple time strings like "09:00" or "09:00:00" or "9:00"
    const m = str.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      return `${m[1].padStart(2, '0')}:${m[2]}`;
    }

    return null;
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
    const rawList = res.data?.attendance || res.data?.records || (Array.isArray(res.data) ? res.data : []);
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

  async verifyFace(faceInput, employeeId) {
    const res = await api.post('/attendance/face-verify', { faceInput, employeeId });
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
  },

  // Employee Self-Service Attendance Endpoints
  async getMyAttendanceStatus() {
    const res = await api.get('/attendance/my-status');
    return res.data?.data || res.data;
  },

  async getMyAttendanceHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/attendance/my-history?${query}`);
    return res.data?.data || res.data;
  },

  // Attendance Regularization & Correction Requests
  async createCorrectionRequest(data) {
    const res = await api.post('/attendance/correction-requests', data);
    return res.data?.data || res.data;
  },

  async getCorrectionRequests(params = {}) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        cleanParams[key] = value;
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await api.get(`/attendance/correction-requests${query ? `?${query}` : ''}`);
    return res?.data || res;
  },

  async getCorrectionRequestById(id) {
    const res = await api.get(`/attendance/correction-requests/${id}`);
    return res.data?.data || res.data;
  },

  async approveCorrectionRequest(id, reviewerNotes = '') {
    const res = await api.post(`/attendance/correction-requests/${id}/approve`, { reviewerNotes });
    return res.data?.data || res.data;
  },

  async rejectCorrectionRequest(id, reviewerNotes = '') {
    const res = await api.post(`/attendance/correction-requests/${id}/reject`, { reviewerNotes });
    return res.data?.data || res.data;
  },

  async cancelCorrectionRequest(id) {
    const res = await api.post(`/attendance/correction-requests/${id}/cancel`);
    return res.data?.data || res.data;
  }
};

export default attendanceService;
