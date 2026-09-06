import api from './api';

export const payrollAdminService = {
  /**
   * Get Consolidated Payroll Overview
   */
  async getOverview(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/payroll-admin/overview?${query}`);
    return res.data;
  },

  /**
   * Run Comprehensive Pre-Payroll Compliance Audit
   */
  async getComplianceCheck(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/payroll-admin/compliance-check?${query}`);
    return res.data;
  },

  /**
   * Get Deep Payroll Analytics (Trends, Department Breakdown, Components)
   */
  async getAnalytics() {
    const res = await api.get('/payroll-admin/analytics');
    return res.data;
  },

  /**
   * Simulate Salary Rule Computation for any wage & structure
   */
  async simulateSalary(wage, structureId = 1) {
    const res = await api.post('/payroll-admin/simulate', { wage, structureId });
    return res.data;
  },

  /**
   * Get Payroll Specific Audit Logs
   */
  async getAuditLogs(limit = 25) {
    const res = await api.get(`/payroll-admin/audit-logs?limit=${limit}`);
    return res.data || [];
  },

  /**
   * Execute Administrative Bulk Action
   */
  async executeBulkAction(action, payrunIds = []) {
    const res = await api.post('/payroll-admin/bulk-action', { action, payrunIds });
    return res.data;
  }
};

export default payrollAdminService;
