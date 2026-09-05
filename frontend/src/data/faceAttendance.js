import attendanceService from '../services/attendanceService';
import employeeService from '../services/employeeService';

const REGISTRATIONS_KEY = 'peoplepay360_face_registrations_data';
const HISTORY_KEY = 'peoplepay360_face_history_data';

export const getFaceRegistrations = () => {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading face registrations:', err);
  }
  return [];
};

export const saveFaceRegistrations = (list) => {
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving face registrations:', err);
  }
};

export const fetchFaceRegistrationsAsync = async () => {
  try {
    const employees = await employeeService.getAllEmployees();
    const registrations = employees.map(emp => ({
      employeeId: emp.employeeId,
      internalId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      position: emp.position,
      faceRegistered: emp.faceEnrollmentStatus === 'ACTIVE',
      status: emp.faceEnrollmentStatus === 'ACTIVE' ? 'Registered' : 'Not Registered'
    }));
    saveFaceRegistrations(registrations);
    return registrations;
  } catch (err) {
    console.warn('[FaceBridge] Could not fetch face registrations:', err.message);
    return getFaceRegistrations();
  }
};

export const getFaceRegistrationByEmployeeId = (employeeId) => {
  const list = getFaceRegistrations();
  return list.find(
    (r) =>
      r.employeeId?.toLowerCase() === employeeId?.toLowerCase() ||
      (r.internalId && r.internalId?.toLowerCase() === employeeId?.toLowerCase())
  ) || null;
};

export const saveFaceRegistration = async (employeeData) => {
  const empId = employeeData.internalId || employeeData.employeeId;
  const res = await attendanceService.enrollFace('kiosk_live_camera_capture_hash', empId);
  await fetchFaceRegistrationsAsync();
  return res;
};

export const getFaceHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading face history:', err);
  }
  return [];
};

export const saveFaceHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving face history:', err);
  }
};

export const fetchFaceHistoryAsync = async () => {
  try {
    const logs = await attendanceService.getFaceLogs();
    const normalized = logs.map(l => ({
      id: `fce-${l.id}`,
      employeeId: l.employee_code || String(l.employee_id),
      employeeName: l.employee_name || 'Employee',
      department: l.department_name || 'General',
      date: l.verified_at ? l.verified_at.split('T')[0] : new Date().toISOString().split('T')[0],
      time: l.verified_at ? new Date(l.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
      type: l.verification_type === 'CHECK_IN' ? 'Check In' : 'Check Out',
      method: 'Face Recognition',
      verification: l.status === 'SUCCESS' ? 'Verified' : 'Rejected',
      confidence: l.similarity_score ? parseFloat((l.similarity_score * 100).toFixed(1)) : 98.7
    }));
    saveFaceHistory(normalized);
    return normalized;
  } catch (err) {
    console.warn('[FaceBridge] Could not fetch face history:', err.message);
    return getFaceHistory();
  }
};

export const addFaceHistoryRecord = (record) => {
  const list = getFaceHistory();
  const newRecord = {
    id: `fce-${Date.now()}`,
    ...record,
    method: 'Face Recognition',
    verification: 'Verified'
  };
  const updated = [newRecord, ...list];
  saveFaceHistory(updated);
  return newRecord;
};
