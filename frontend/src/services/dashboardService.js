import api from './api';

export const dashboardService = {
  async getDashboardData(params = {}) {
    const query = new URLSearchParams();
    if (params.period) query.append('period', params.period);
    if (params.departmentId && params.departmentId !== 'All') query.append('departmentId', params.departmentId);

    const res = await api.get(`/dashboard?${query.toString()}`);
    return res.data;
  }
};

export default dashboardService;
