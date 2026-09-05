// data/faceAttendance.js
// Storage and mock management for Face Recognition Attendance

const REGISTRATIONS_KEY = 'peoplepay360_face_registrations_data';
const HISTORY_KEY = 'peoplepay360_face_history_data';

export const INITIAL_FACE_REGISTRATIONS = [
  {
    employeeId: 'EMP-001',
    internalId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    position: 'Software Engineer',
    faceRegistered: true,
    registeredAt: '2026-08-15',
    status: 'Registered'
  },
  {
    employeeId: 'EMP-002',
    internalId: 'emp-2',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    position: 'HR Executive',
    faceRegistered: true,
    registeredAt: '2026-08-20',
    status: 'Registered'
  },
  {
    employeeId: 'EMP-003',
    internalId: 'emp-3',
    employeeName: 'Olivia Martin',
    department: 'Finance',
    position: 'Accountant',
    faceRegistered: true,
    registeredAt: '2026-08-25',
    status: 'Registered'
  },
  {
    employeeId: 'EMP-004',
    internalId: 'emp-4',
    employeeName: 'James Anderson',
    department: 'Sales',
    position: 'Sales Executive',
    faceRegistered: false,
    registeredAt: null,
    status: 'Not Registered'
  },
  {
    employeeId: 'EMP-005',
    internalId: 'emp-5',
    employeeName: 'Lucas Garcia',
    department: 'Engineering',
    position: 'Frontend Developer',
    faceRegistered: false,
    registeredAt: null,
    status: 'Not Registered'
  }
];

export const INITIAL_FACE_HISTORY = [
  {
    id: 'fce-1',
    employeeId: 'EMP-001',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-05',
    time: '09:02 AM',
    type: 'Check In',
    method: 'Face Recognition',
    verification: 'Verified',
    confidence: 98.7
  },
  {
    id: 'fce-2',
    employeeId: 'EMP-002',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    date: '2026-09-05',
    time: '08:55 AM',
    type: 'Check In',
    method: 'Face Recognition',
    verification: 'Verified',
    confidence: 99.1
  },
  {
    id: 'fce-3',
    employeeId: 'EMP-003',
    employeeName: 'Olivia Martin',
    department: 'Finance',
    date: '2026-09-05',
    time: '09:12 AM',
    type: 'Check In',
    method: 'Face Recognition',
    verification: 'Verified',
    confidence: 97.8
  },
  {
    id: 'fce-4',
    employeeId: 'EMP-001',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-04',
    time: '06:15 PM',
    type: 'Check Out',
    method: 'Face Recognition',
    verification: 'Verified',
    confidence: 98.4
  },
  {
    id: 'fce-5',
    employeeId: 'EMP-001',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    date: '2026-09-04',
    time: '08:58 AM',
    type: 'Check In',
    method: 'Face Recognition',
    verification: 'Verified',
    confidence: 98.9
  }
];

export const getFaceRegistrations = () => {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading face registrations:', err);
  }
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(INITIAL_FACE_REGISTRATIONS));
  return INITIAL_FACE_REGISTRATIONS;
};

export const saveFaceRegistrations = (list) => {
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving face registrations:', err);
  }
};

export const getFaceRegistrationByEmployeeId = (employeeId) => {
  const list = getFaceRegistrations();
  return list.find(
    (r) =>
      r.employeeId.toLowerCase() === employeeId.toLowerCase() ||
      (r.internalId && r.internalId.toLowerCase() === employeeId.toLowerCase())
  ) || null;
};

export const saveFaceRegistration = (employeeData) => {
  const list = getFaceRegistrations();
  const index = list.findIndex(
    (r) =>
      r.employeeId.toLowerCase() === employeeData.employeeId.toLowerCase() ||
      (r.internalId && r.internalId.toLowerCase() === (employeeData.internalId || '').toLowerCase())
  );

  const updatedEntry = {
    employeeId: employeeData.employeeId,
    internalId: employeeData.internalId || employeeData.id,
    employeeName: employeeData.employeeName || employeeData.name,
    department: employeeData.department,
    position: employeeData.position,
    faceRegistered: true,
    registeredAt: new Date().toISOString().split('T')[0],
    status: 'Registered'
  };

  let updatedList;
  if (index >= 0) {
    updatedList = [...list];
    updatedList[index] = { ...updatedList[index], ...updatedEntry };
  } else {
    updatedList = [updatedEntry, ...list];
  }

  saveFaceRegistrations(updatedList);
  return updatedEntry;
};

export const getFaceHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading face history:', err);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(INITIAL_FACE_HISTORY));
  return INITIAL_FACE_HISTORY;
};

export const saveFaceHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving face history:', err);
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
