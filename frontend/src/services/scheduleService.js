import api from './api';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function formatScheduleType(rawType) {
  if (!rawType) return 'Full-time';
  const t = String(rawType).toUpperCase().replace(/[\s-]/g, '_');
  if (t === 'STANDARD_40H' || t === 'FULL_TIME') return 'Full-time';
  if (t === 'PART_TIME') return 'Part-time';
  if (t === 'SHIFT_BASED' || t === 'SHIFT') return 'Shift';
  if (t === 'FLEXIBLE') return 'Flexible';
  return rawType;
}

export function normalizeSchedule(ws) {
  if (!ws) return null;

  // Build normalized 7-day week schedule
  const normalizedDays = WEEK_DAYS.map(dayName => {
    const match = (ws.days || []).find(d => {
      const dName = d.dayOfWeek || d.day_of_week || d.day || '';
      return dName.toUpperCase() === dayName.toUpperCase();
    });

    if (match) {
      const start = match.start_time ? match.start_time.slice(0, 5) : (match.startTime || '09:00');
      const end = match.end_time ? match.end_time.slice(0, 5) : (match.endTime || '18:00');
      const breakDur = match.break_minutes !== undefined
        ? parseFloat((match.break_minutes / 60).toFixed(2))
        : (match.breakDuration !== undefined ? parseFloat(match.breakDuration) : 1);
      const hours = parseFloat(match.work_hours || match.workHours || match.dailyHours || 0);

      return {
        day: dayName,
        working: match.working !== false && hours > 0,
        startTime: start,
        endTime: end,
        breakDuration: breakDur,
        dailyHours: hours
      };
    }

    return {
      day: dayName,
      working: false,
      startTime: '09:00',
      endTime: '13:00',
      breakDuration: 0,
      dailyHours: 0
    };
  });

  return {
    ...ws,
    id: String(ws.id),
    name: ws.name,
    code: ws.code || `WS-${String(ws.id).padStart(3, '0')}`,
    description: ws.description || '',
    type: formatScheduleType(ws.type),
    weeklyHours: parseFloat(ws.weekly_hours || ws.weeklyHours || 40),
    status: (ws.is_active === 1 || ws.is_active === true || ws.status === 'Active') ? 'Active' : 'Inactive',
    isActive: ws.is_active === 1 || ws.is_active === true || ws.status === 'Active',
    assignedEmployees: ws.assignedEmployees !== undefined ? Number(ws.assignedEmployees) : (ws.assigned_employees !== undefined ? Number(ws.assigned_employees) : 0),
    days: normalizedDays
  };
}

export const scheduleService = {
  async getSchedules() {
    const res = await api.get('/schedules');
    const raw = res.data || [];
    return raw.map(normalizeSchedule);
  },

  async getScheduleById(id) {
    const res = await api.get(`/schedules/${id}`);
    return normalizeSchedule(res.data);
  },

  async createSchedule(payload) {
    const res = await api.post('/schedules', payload);
    return res.data;
  },

  async updateSchedule(id, payload) {
    const res = await api.put(`/schedules/${id}`, payload);
    return res.data;
  },

  async deleteSchedule(id) {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
  }
};

export default scheduleService;
