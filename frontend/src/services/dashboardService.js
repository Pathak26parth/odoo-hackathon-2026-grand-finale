import api from './api';

export const dashboardService = {
  async getDashboardData(params = {}) {
    const query = new URLSearchParams();
    if (params.period && params.period !== 'All') {
      query.append('period', params.period);
    }
    if (params.departmentId && params.departmentId !== 'All') {
      query.append('departmentId', params.departmentId);
    }
    if (params.type && params.type !== 'All') {
      query.append('type', params.type);
    }

    const res = await api.get(`/dashboard?${query.toString()}`);
    return res?.data?.data || res?.data || res;
  }
};

export default dashboardService;
