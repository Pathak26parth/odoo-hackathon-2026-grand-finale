import timeOffService, { normalizeLeaveType } from '../services/timeOffService';

const STORAGE_KEY = 'peoplepay360_time_off_types_data';

export const INITIAL_TIME_OFF_TYPES = [];

export const getTimeOffTypes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading time off types cache:', err);
  }
  return INITIAL_TIME_OFF_TYPES;
};

export const saveTimeOffTypesToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving time off types cache:', err);
  }
};

export const fetchTimeOffTypesAsync = async () => {
  try {
    const types = await timeOffService.getTimeOffTypes();
    if (types && types.length > 0) {
      saveTimeOffTypesToStorage(types);
      return types;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch time off types:', err.message);
  }
  return getTimeOffTypes();
};

export const getTimeOffTypeById = (id) => {
  const list = getTimeOffTypes();
  return list.find((t) => String(t.id) === String(id)) || null;
};

export const createTimeOffType = async (data) => {
  try {
    const res = await timeOffService.createTimeOffType(data);
    await fetchTimeOffTypesAsync();
    return res;
  } catch (err) {
    console.warn('Backend create timeoff type fallback:', err.message);
    const list = getTimeOffTypes();
    const newType = { id: String(Date.now()), ...data };
    saveTimeOffTypesToStorage([newType, ...list]);
    return newType;
  }
};

export const updateTimeOffType = async (id, data) => {
  try {
    const res = await timeOffService.updateTimeOffType(id, data);
    await fetchTimeOffTypesAsync();
    return res;
  } catch (err) {
    console.warn('Backend update timeoff type fallback:', err.message);
    const list = getTimeOffTypes();
    const idx = list.findIndex((t) => String(t.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      saveTimeOffTypesToStorage(list);
    }
    return data;
  }
};

export const deleteTimeOffType = async (id) => {
  try {
    const res = await timeOffService.deleteTimeOffType(id);
    await fetchTimeOffTypesAsync();
    return res;
  } catch (err) {
    console.error('Delete time off type failed on backend:', err.message);
    const list = getTimeOffTypes().filter((t) => String(t.id) !== String(id));
    saveTimeOffTypesToStorage(list);
    return true;
  }
};
