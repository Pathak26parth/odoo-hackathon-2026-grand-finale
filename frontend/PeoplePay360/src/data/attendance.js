const STORAGE_KEY = 'peoplepay360_attendance_data';

export const INITIAL_ATTENDANCE = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-01',
    checkIn: '09:05',
    checkOut: '18:10',
    workedHours: '8h 05m',
    status: 'Late',
    isManualEdit: false,
    notes: 'Traffic delay on highway',
    exceptions: ['Late Check-in']
  },
  {
    id: 'att-2',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-02',
    checkIn: '08:58',
    checkOut: '17:30',
    workedHours: '7h 32m',
    status: 'Present',
    isManualEdit: false,
    notes: 'Regular on-time shift',
    exceptions: []
  },
  {
    id: 'att-3',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-03',
    checkIn: '09:00',
    checkOut: '',
    workedHours: '0h 00m',
    status: 'Missing Check-out',
    isManualEdit: false,
    notes: 'Left office for client meeting, forgot to badge out',
    exceptions: ['Missing Check-out']
  },
  {
    id: 'att-4',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    date: '2026-09-01',
    checkIn: '08:50',
    checkOut: '18:30',
    workedHours: '8h 40m',
    status: 'Overtime',
    isManualEdit: false,
    notes: 'Month-end HR reporting completion',
    exceptions: ['Overtime (>8.5h)']
  },
  {
    id: 'att-5',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    date: '2026-09-02',
    checkIn: '09:00',
    checkOut: '17:00',
    workedHours: '7h 00m',
    status: 'Present',
    isManualEdit: false,
    notes: '',
    exceptions: []
  },
  {
    id: 'att-6',
    employeeId: 'emp-3',
    employeeName: 'Olivia Martin',
    department: 'Finance',
    date: '2026-09-01',
    checkIn: '09:25',
    checkOut: '18:00',
    workedHours: '7h 35m',
    status: 'Late',
    isManualEdit: false,
    notes: 'Late arrival noted',
    exceptions: ['Late Check-in']
  },
  {
    id: 'att-7',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    department: 'Sales',
    date: '2026-09-01',
    checkIn: '09:00',
    checkOut: '17:00',
    workedHours: '7h 00m',
    status: 'Manual Edit',
    isManualEdit: true,
    notes: 'Corrected by supervisor due to badge reader malfunction',
    exceptions: ['Manual Edit']
  },
  {
    id: 'att-8',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    department: 'Sales',
    date: '2026-09-02',
    checkIn: '',
    checkOut: '',
    workedHours: '0h 00m',
    status: 'Absent',
    isManualEdit: false,
    notes: 'Unexcused absence',
    exceptions: ['Absent Without Leave']
  },
  {
    id: 'att-9',
    employeeId: 'emp-5',
    employeeName: 'Lucas Garcia',
    department: 'Engineering',
    date: '2026-09-01',
    checkIn: '08:55',
    checkOut: '17:35',
    workedHours: '7h 40m',
    status: 'Present',
    isManualEdit: false,
    notes: '',
    exceptions: []
  }
];

export const calculateWorkedHours = (checkIn, checkOut, breakMinutes = 60) => {
  if (!checkIn || !checkOut) {
    return { formatted: '0h 00m', rawHours: 0, isValid: false };
  }

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);

  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return { formatted: '0h 00m', rawHours: 0, isValid: false };
  }

  let totalMinutes = outH * 60 + outM - (inH * 60 + inM);
  if (totalMinutes < 0) {
    // Cross midnight
    totalMinutes += 24 * 60;
  }

  // Deduct standard break if shift is longer than 5 hours (300 mins)
  const netMinutes = totalMinutes > 300 ? Math.max(0, totalMinutes - breakMinutes) : totalMinutes;
  const hours = Math.floor(netMinutes / 60);
  const mins = netMinutes % 60;

  return {
    formatted: `${hours}h ${mins < 10 ? '0' : ''}${mins}m`,
    rawHours: Math.round((netMinutes / 60) * 100) / 100,
    isValid: true
  };
};

export const evaluateAttendanceStatus = (checkIn, checkOut, isManual = false, scheduleStart = '09:00') => {
  if (!checkIn && !checkOut) {
    return 'Absent';
  }
  if (checkIn && !checkOut) {
    return 'Missing Check-out';
  }
  if (isManual) {
    return 'Manual Edit';
  }

  const { rawHours } = calculateWorkedHours(checkIn, checkOut);
  if (rawHours >= 8.5) {
    return 'Overtime';
  }

  if (checkIn > scheduleStart) {
    return 'Late';
  }

  return 'Present';
};

export const getAttendanceExceptions = (record) => {
  const exceptions = [];
  if (!record.checkIn && !record.checkOut) {
    exceptions.push('Absent Without Leave');
  }
  if (record.checkIn && !record.checkOut) {
    exceptions.push('Missing Check-out');
  }
  if (record.checkIn && record.checkIn > '09:00') {
    exceptions.push(`Late Check-in (${record.checkIn} > 09:00)`);
  }
  if (record.isManualEdit || record.status === 'Manual Edit') {
    exceptions.push('Manual Edit by Authorized Personnel');
  }
  return exceptions;
};

export const getAttendanceRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading attendance records:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
  return INITIAL_ATTENDANCE;
};

export const saveAttendanceToStorage = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving attendance records:', err);
  }
};

export const getAttendanceById = (id) => {
  const list = getAttendanceRecords();
  return list.find((r) => r.id === id) || null;
};

export const createAttendance = (data) => {
  const list = getAttendanceRecords();
  const worked = calculateWorkedHours(data.checkIn, data.checkOut);
  const status = data.status || evaluateAttendanceStatus(data.checkIn, data.checkOut, data.isManualEdit);

  const newRecord = {
    id: `att-${Date.now()}`,
    ...data,
    workedHours: worked.formatted,
    status,
    exceptions: getAttendanceExceptions({ ...data, status })
  };

  const updated = [newRecord, ...list];
  saveAttendanceToStorage(updated);
  return newRecord;
};

export const updateAttendance = (id, data) => {
  const list = getAttendanceRecords();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const worked = calculateWorkedHours(data.checkIn, data.checkOut);
  const status = data.status || evaluateAttendanceStatus(data.checkIn, data.checkOut, data.isManualEdit);

  const updatedRecord = {
    ...list[index],
    ...data,
    workedHours: worked.formatted,
    status,
    exceptions: getAttendanceExceptions({ ...data, status })
  };

  list[index] = updatedRecord;
  saveAttendanceToStorage(list);
  return updatedRecord;
};

export const deleteAttendance = (id) => {
  const list = getAttendanceRecords();
  const updated = list.filter((r) => r.id !== id);
  saveAttendanceToStorage(updated);
  return true;
};
