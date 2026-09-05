import { deductAllocationBalance, restoreAllocationBalance } from './allocations';

const STORAGE_KEY = 'peoplepay360_timeoff_requests_data';

export const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    startDate: '2026-09-14',
    endDate: '2026-09-16',
    duration: 3,
    unit: 'Days',
    reason: 'Family annual holiday trip',
    status: 'Pending',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-09-02'
  },
  {
    id: 'req-2',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    department: 'Engineering',
    timeOffTypeId: 'tot-2',
    timeOffTypeName: 'Sick Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    duration: 2,
    unit: 'Days',
    reason: 'Flu recovery (medical certificate provided)',
    status: 'Approved',
    reviewedBy: 'Emma Wilson (HR Manager)',
    reviewedAt: '2026-08-10',
    createdAt: '2026-08-09'
  },
  {
    id: 'req-3',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    department: 'Human Resources',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    startDate: '2026-09-21',
    endDate: '2026-09-25',
    duration: 5,
    unit: 'Days',
    reason: 'Personal leave',
    status: 'Pending',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-09-03'
  },
  {
    id: 'req-4',
    employeeId: 'emp-3',
    employeeName: 'Olivia Martin',
    department: 'Finance',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Annual Leave',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    duration: 5,
    unit: 'Days',
    reason: 'Summer vacation',
    status: 'Approved',
    reviewedBy: 'Admin User',
    reviewedAt: '2026-06-25',
    createdAt: '2026-06-24'
  },
  {
    id: 'req-5',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    department: 'Sales',
    timeOffTypeId: 'tot-3',
    timeOffTypeName: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-20',
    duration: 1,
    unit: 'Days',
    reason: 'Home repairs & technician visit',
    status: 'Refused',
    reviewedBy: 'Emma Wilson (HR Manager)',
    reviewedAt: '2026-08-19',
    createdAt: '2026-08-18'
  }
];

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  if (end < start) return 0;

  // Calculate inclusive calendar days
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const getTimeOffRequests = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading time off requests from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
  return INITIAL_REQUESTS;
};

export const saveTimeOffRequestsToStorage = (requests) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Error saving time off requests to localStorage:', err);
  }
};

export const getTimeOffRequestById = (id) => {
  const list = getTimeOffRequests();
  return list.find((r) => r.id === id) || null;
};

export const createTimeOffRequest = (data) => {
  const list = getTimeOffRequests();
  const duration = Number(data.duration) || calculateDuration(data.startDate, data.endDate);

  const newRequest = {
    id: `req-${Date.now()}`,
    ...data,
    duration,
    status: 'Pending',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = [newRequest, ...list];
  saveTimeOffRequestsToStorage(updated);
  return newRequest;
};

export const approveTimeOffRequest = (id, reviewerName = 'HR Manager') => {
  const list = getTimeOffRequests();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const request = list[index];
  if (request.status === 'Approved') return request;

  // Update request status
  const updated = {
    ...request,
    status: 'Approved',
    reviewedBy: reviewerName,
    reviewedAt: new Date().toISOString().split('T')[0]
  };

  list[index] = updated;
  saveTimeOffRequestsToStorage(list);

  // Automatically deduct balance from allocation
  deductAllocationBalance(request.employeeId, request.timeOffTypeName, request.duration);

  return updated;
};

export const refuseTimeOffRequest = (id, reviewerName = 'HR Manager') => {
  const list = getTimeOffRequests();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const request = list[index];
  const previousStatus = request.status;

  const updated = {
    ...request,
    status: 'Refused',
    reviewedBy: reviewerName,
    reviewedAt: new Date().toISOString().split('T')[0]
  };

  list[index] = updated;
  saveTimeOffRequestsToStorage(list);

  // If was previously approved, restore balance
  if (previousStatus === 'Approved') {
    restoreAllocationBalance(request.employeeId, request.timeOffTypeName, request.duration);
  }

  return updated;
};

export const deleteTimeOffRequest = (id) => {
  const list = getTimeOffRequests();
  const updated = list.filter((r) => r.id !== id);
  saveTimeOffRequestsToStorage(updated);
  return true;
};
