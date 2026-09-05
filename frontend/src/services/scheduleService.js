import api from './api';

export function normalizeSchedule(ws) {
  if (!ws) return null;
  return {
    ...ws,
    id: String(ws.id),
    name: ws.name,
    code: ws.code,
    description: ws.description || '',
    weeklyHours: parseFloat(ws.weekly_hours || ws.weeklyHours || 40),
    status: ws.status || 'Active',
    days: ws.days || []
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
