import scheduleService, { normalizeSchedule } from '../services/scheduleService';

const STORAGE_KEY = 'peoplepay360_schedules_data';

export const DEFAULT_WEEK_DAYS = [
  { day: 'Monday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1, dailyHours: 8 },
  { day: 'Tuesday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1, dailyHours: 8 },
  { day: 'Wednesday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1, dailyHours: 8 },
  { day: 'Thursday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1, dailyHours: 8 },
  { day: 'Friday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1, dailyHours: 8 },
  { day: 'Saturday', working: false, startTime: '09:00', endTime: '13:00', breakDuration: 0, dailyHours: 0 },
  { day: 'Sunday', working: false, startTime: '09:00', endTime: '13:00', breakDuration: 0, dailyHours: 0 }
];

export const calculateDailyHours = (startTime, endTime, breakDuration = 0, working = true) => {
  if (!working || !startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm) - breakDuration * 60;
  return Math.max(0, Math.round((totalMin / 60) * 10) / 10);
};

export const INITIAL_SCHEDULES = [
  {
    id: '1',
    name: 'Standard 40 Hours',
    type: 'Full-time',
    weeklyHours: 40,
    status: 'Active',
    assignedEmployees: 1,
    days: DEFAULT_WEEK_DAYS
  }
];

export const getSchedules = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading schedules cache:', err);
  }
  return INITIAL_SCHEDULES;
};

export const saveSchedulesToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving schedules cache:', err);
  }
};

export const fetchSchedulesAsync = async () => {
  try {
    const schedules = await scheduleService.getSchedules();
    if (schedules && schedules.length > 0) {
      saveSchedulesToStorage(schedules);
      return schedules;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch schedules:', err.message);
  }
  return getSchedules();
};

export const getScheduleById = (id) => {
  const list = getSchedules();
  return list.find((s) => String(s.id) === String(id)) || null;
};

export const createSchedule = async (data) => {
  try {
    const res = await scheduleService.createSchedule(data);
    await fetchSchedulesAsync();
    return res;
  } catch (err) {
    console.error('Create schedule failed on backend:', err.message);
    const list = getSchedules();
    const newSch = { id: String(Date.now()), ...data };
    saveSchedulesToStorage([newSch, ...list]);
    return newSch;
  }
};

export const updateSchedule = async (id, data) => {
  try {
    const res = await scheduleService.updateSchedule(id, data);
    await fetchSchedulesAsync();
    return res;
  } catch (err) {
    console.error('Update schedule failed on backend:', err.message);
    const list = getSchedules();
    const idx = list.findIndex((s) => String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      saveSchedulesToStorage(list);
    }
    return data;
  }
};

export const deleteSchedule = async (id) => {
  try {
    const res = await scheduleService.deleteSchedule(id);
    await fetchSchedulesAsync();
    return res;
  } catch (err) {
    console.error('Delete schedule failed on backend:', err.message);
    const list = getSchedules().filter((s) => String(s.id) !== String(id));
    saveSchedulesToStorage(list);
    return true;
  }
};
