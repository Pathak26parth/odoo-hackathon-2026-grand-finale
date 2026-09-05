import attendanceService, { normalizeAttendance } from '../services/attendanceService';

const STORAGE_KEY = 'peoplepay360_attendance_data';

export const INITIAL_ATTENDANCE = [];

export const getAttendanceRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading attendance cache:', err);
  }
  return INITIAL_ATTENDANCE;
};

export const saveAttendanceToStorage = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving attendance cache:', err);
  }
};

export const fetchAttendanceAsync = async (params = {}) => {
  try {
    const records = await attendanceService.getAllAttendance(params);
    if (Array.isArray(records)) {
      saveAttendanceToStorage(records);
      return records;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch attendance from backend:', err.message);
  }
  return getAttendanceRecords();
};

export const fetchAttendanceRecordsAsync = fetchAttendanceAsync;

export const getAttendanceById = (id) => {
  const list = getAttendanceRecords();
  return list.find((a) => String(a.id) === String(id)) || null;
};

export const createAttendance = async (data) => {
  try {
    const empId = data.internalEmployeeId || data.employeeId;
    const res = await attendanceService.portalCheckIn(empId);
    await fetchAttendanceAsync();
    return res;
  } catch (err) {
    console.warn('Backend check-in fallback:', err.message);
    const list = getAttendanceRecords();
    const newRecord = { id: String(Date.now()), ...data };
    saveAttendanceToStorage([newRecord, ...list]);
    return newRecord;
  }
};

export const updateAttendance = async (id, data) => {
  try {
    const res = await attendanceService.correctAttendance(id, data.checkIn, data.checkOut, data.reason || data.notes || 'Correction');
    await fetchAttendanceAsync();
    return res;
  } catch (err) {
    console.warn('Backend update attendance fallback:', err.message);
    const list = getAttendanceRecords();
    const idx = list.findIndex((a) => String(a.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      saveAttendanceToStorage(list);
    }
    return data;
  }
};

export const deleteAttendance = async (id) => {
  const list = getAttendanceRecords().filter((a) => String(a.id) !== String(id));
  saveAttendanceToStorage(list);
  return true;
};

export const calculateWorkedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return { hours: 0, formatted: '0h 0m' };
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const diffM = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
  const h = Math.floor(diffM / 60);
  const m = diffM % 60;
  const hoursNum = parseFloat((diffM / 60).toFixed(2));
  return {
    hours: hoursNum,
    formatted: `${h}h ${m}m`,
    toString() {
      return `${h}h ${m}m`;
    }
  };
};

export const evaluateAttendanceStatus = (checkIn, checkOut, isManualEdit = false) => {
  if (isManualEdit) return 'Manual Edit';
  if (!checkIn && !checkOut) return 'Absent';
  if (checkIn && !checkOut) return 'Missing Check-out';

  const [inH, inM] = (checkIn || '09:00').split(':').map(Number);
  const inMinutes = inH * 60 + inM;
  const shiftStartMinutes = 9 * 60; // 09:00 AM

  if (inMinutes > shiftStartMinutes + 15) {
    return 'Late';
  }

  const [outH, outM] = (checkOut || '18:00').split(':').map(Number);
  const totalMinutes = outH * 60 + outM - inMinutes;
  if (totalMinutes > 9 * 60) {
    return 'Overtime';
  }

  return 'Present';
};

export const getAttendanceExceptions = (record) => {
  const exceptions = [];
  if (!record) return exceptions;

  if (record.checkIn && !record.checkOut) {
    exceptions.push({
      type: 'Missing Check-out',
      severity: 'warning',
      message: 'Employee has checked in but check-out time is missing.'
    });
  }

  if (record.checkIn) {
    const [inH, inM] = record.checkIn.split(':').map(Number);
    if (inH * 60 + inM > 9 * 60 + 15) {
      exceptions.push({
        type: 'Late Arrival',
        severity: 'info',
        message: `Arrival at ${record.checkIn} is past the 09:00 AM shift start.`
      });
    }
  }

  if (record.isManualEdit || record.status === 'Manual Edit') {
    exceptions.push({
      type: 'Manual Correction',
      severity: 'info',
      message: 'This record contains manual supervisor adjustments.'
    });
  }

  return exceptions;
};
