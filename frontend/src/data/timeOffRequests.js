import timeOffService, { normalizeLeaveRequest } from '../services/timeOffService';

const STORAGE_KEY = 'peoplepay360_time_off_requests_data';

export const INITIAL_TIME_OFF_REQUESTS = [];

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

export const getTimeOffRequests = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading time off requests cache:', err);
  }
  return INITIAL_TIME_OFF_REQUESTS;
};

export const saveTimeOffRequestsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving time off requests cache:', err);
  }
};

export const fetchTimeOffRequestsAsync = async (params = {}) => {
  try {
    const requests = await timeOffService.getRequests(params);
    if (requests && requests.length > 0) {
      saveTimeOffRequestsToStorage(requests);
      return requests;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch time off requests:', err.message);
  }
  return getTimeOffRequests();
};

export const getTimeOffRequestById = (id) => {
  const list = getTimeOffRequests();
  return list.find((r) => String(r.id) === String(id)) || null;
};

export const createTimeOffRequest = async (data) => {
  try {
    const res = await timeOffService.createRequest(data);
    await fetchTimeOffRequestsAsync();
    return res;
  } catch (err) {
    console.warn('Backend create timeoff failed:', err.message);
    const list = getTimeOffRequests();
    const newReq = { id: String(Date.now()), ...data, status: 'Pending' };
    saveTimeOffRequestsToStorage([newReq, ...list]);
    return newReq;
  }
};

export const approveTimeOffRequest = async (id, approverName = 'HR Manager') => {
  try {
    const res = await timeOffService.approveRequest(id);
    await fetchTimeOffRequestsAsync();
    return res;
  } catch (err) {
    console.warn('Backend approve timeoff failed:', err.message);
    const list = getTimeOffRequests();
    const idx = list.findIndex((r) => String(r.id) === String(id));
    if (idx !== -1) {
      list[idx].status = 'Approved';
      saveTimeOffRequestsToStorage(list);
    }
    return { success: true };
  }
};

export const refuseTimeOffRequest = async (id, approverName = 'HR Manager', reason = '') => {
  try {
    const res = await timeOffService.refuseRequest(id, reason);
    await fetchTimeOffRequestsAsync();
    return res;
  } catch (err) {
    console.warn('Backend refuse timeoff failed:', err.message);
    const list = getTimeOffRequests();
    const idx = list.findIndex((r) => String(r.id) === String(id));
    if (idx !== -1) {
      list[idx].status = 'Refused';
      saveTimeOffRequestsToStorage(list);
    }
    return { success: true };
  }
};

export const updateTimeOffRequestStatus = async (id, status, reason = '') => {
  if (status.toUpperCase() === 'APPROVED') {
    return approveTimeOffRequest(id);
  } else {
    return refuseTimeOffRequest(id, '', reason);
  }
};
