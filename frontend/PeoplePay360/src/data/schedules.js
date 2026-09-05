const STORAGE_KEY = 'peoplepay360_schedules_data';

export const DEFAULT_WEEK_DAYS = [
  { day: 'Monday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1.0, dailyHours: 8.0 },
  { day: 'Tuesday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1.0, dailyHours: 8.0 },
  { day: 'Wednesday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1.0, dailyHours: 8.0 },
  { day: 'Thursday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1.0, dailyHours: 8.0 },
  { day: 'Friday', working: true, startTime: '09:00', endTime: '18:00', breakDuration: 1.0, dailyHours: 8.0 },
  { day: 'Saturday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 },
  { day: 'Sunday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 }
];

export const INITIAL_SCHEDULES = [
  {
    id: 'sch-1',
    name: 'Standard 40 Hours',
    type: 'Full-time',
    weeklyHours: 40.0,
    assignedEmployees: 4,
    status: 'Active',
    days: DEFAULT_WEEK_DAYS
  },
  {
    id: 'sch-2',
    name: 'Flexible Schedule',
    type: 'Flexible',
    weeklyHours: 35.0,
    assignedEmployees: 2,
    status: 'Active',
    days: [
      { day: 'Monday', working: true, startTime: '09:30', endTime: '17:30', breakDuration: 1.0, dailyHours: 7.0 },
      { day: 'Tuesday', working: true, startTime: '09:30', endTime: '17:30', breakDuration: 1.0, dailyHours: 7.0 },
      { day: 'Wednesday', working: true, startTime: '09:30', endTime: '17:30', breakDuration: 1.0, dailyHours: 7.0 },
      { day: 'Thursday', working: true, startTime: '09:30', endTime: '17:30', breakDuration: 1.0, dailyHours: 7.0 },
      { day: 'Friday', working: true, startTime: '09:30', endTime: '17:30', breakDuration: 1.0, dailyHours: 7.0 },
      { day: 'Saturday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 },
      { day: 'Sunday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 }
    ]
  },
  {
    id: 'sch-3',
    name: 'Part Time',
    type: 'Part-time',
    weeklyHours: 20.0,
    assignedEmployees: 1,
    status: 'Active',
    days: [
      { day: 'Monday', working: true, startTime: '09:00', endTime: '14:00', breakDuration: 0.0, dailyHours: 5.0 },
      { day: 'Tuesday', working: true, startTime: '09:00', endTime: '14:00', breakDuration: 0.0, dailyHours: 5.0 },
      { day: 'Wednesday', working: true, startTime: '09:00', endTime: '14:00', breakDuration: 0.0, dailyHours: 5.0 },
      { day: 'Thursday', working: true, startTime: '09:00', endTime: '14:00', breakDuration: 0.0, dailyHours: 5.0 },
      { day: 'Friday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 },
      { day: 'Saturday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 },
      { day: 'Sunday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 }
    ]
  },
  {
    id: 'sch-4',
    name: 'Night Shift',
    type: 'Shift',
    weeklyHours: 40.0,
    assignedEmployees: 1,
    status: 'Active',
    days: [
      { day: 'Monday', working: true, startTime: '22:00', endTime: '07:00', breakDuration: 1.0, dailyHours: 8.0 },
      { day: 'Tuesday', working: true, startTime: '22:00', endTime: '07:00', breakDuration: 1.0, dailyHours: 8.0 },
      { day: 'Wednesday', working: true, startTime: '22:00', endTime: '07:00', breakDuration: 1.0, dailyHours: 8.0 },
      { day: 'Thursday', working: true, startTime: '22:00', endTime: '07:00', breakDuration: 1.0, dailyHours: 8.0 },
      { day: 'Friday', working: true, startTime: '22:00', endTime: '07:00', breakDuration: 1.0, dailyHours: 8.0 },
      { day: 'Saturday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 },
      { day: 'Sunday', working: false, startTime: '00:00', endTime: '00:00', breakDuration: 0.0, dailyHours: 0.0 }
    ]
  }
];

export const getSchedules = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading schedules from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEDULES));
  return INITIAL_SCHEDULES;
};

export const saveSchedulesToStorage = (schedules) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch (err) {
    console.error('Error saving schedules to localStorage:', err);
  }
};

export const getScheduleById = (id) => {
  const list = getSchedules();
  return list.find((s) => s.id === id) || null;
};

export const calculateDailyHours = (startTime, endTime, breakDuration = 0, working = true) => {
  if (!working || !startTime || !endTime) return 0;
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);

  let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  if (totalMinutes < 0) {
    // Overnight shift calculation
    totalMinutes += 24 * 60;
  }
  const hours = Math.max(0, (totalMinutes / 60) - Number(breakDuration || 0));
  return Math.round(hours * 10) / 10;
};

export const createSchedule = (data) => {
  const list = getSchedules();
  const nextId = `sch-${Date.now()}`;
  const totalWeekly = (data.days || []).reduce(
    (acc, d) => acc + (d.working ? Number(d.dailyHours || 0) : 0),
    0
  );
  const newSchedule = {
    id: nextId,
    assignedEmployees: 0,
    status: data.status || 'Active',
    ...data,
    weeklyHours: Math.round(totalWeekly * 10) / 10
  };
  const updated = [...list, newSchedule];
  saveSchedulesToStorage(updated);
  return newSchedule;
};

export const updateSchedule = (id, data) => {
  const list = getSchedules();
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const totalWeekly = (data.days || list[index].days || []).reduce(
    (acc, d) => acc + (d.working ? Number(d.dailyHours || 0) : 0),
    0
  );
  const updated = {
    ...list[index],
    ...data,
    weeklyHours: Math.round(totalWeekly * 10) / 10
  };
  list[index] = updated;
  saveSchedulesToStorage(list);
  return updated;
};

export const deleteSchedule = (id) => {
  const list = getSchedules();
  const updated = list.filter((s) => s.id !== id);
  saveSchedulesToStorage(updated);
  return true;
};
