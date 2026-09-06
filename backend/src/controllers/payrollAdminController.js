const payrollAdminService = require('../services/payrollAdminService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Controller for Payroll Admin Operations & Command Center
 */
class PayrollAdminController {
  /**
   * Get Overview Metrics & Batch Pipeline
   * GET /api/payroll-admin/overview
   */
  async getOverview(req, res, next) {
    try {
      const { period, departmentId } = req.query;
      const data = await payrollAdminService.getOverviewMetrics({ period, departmentId });
      return sendSuccess(res, 'Payroll admin overview retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run Comprehensive Pre-Payroll Compliance Check
   * GET /api/payroll-admin/compliance-check
   */
  async getComplianceCheck(req, res, next) {
    try {
      const { period } = req.query;
      const data = await payrollAdminService.runComplianceCheck({ period });
      return sendSuccess(res, 'Pre-payroll compliance audit completed', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Payroll Analytics (Monthly trends & departmental distribution)
   * GET /api/payroll-admin/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const data = await payrollAdminService.getPayrollAnalytics();
      return sendSuccess(res, 'Payroll analytics retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simulate Salary Rule Computation
   * POST /api/payroll-admin/simulate
   */
  async simulateSalary(req, res, next) {
    try {
      const { wage, structureId } = req.body;
      if (!wage) {
        return sendError(res, 'Wage is required for simulation', 400);
      }
      const data = await payrollAdminService.simulateSalaryRuleComputation({
        wage,
        structureId: structureId || 1
      });
      return sendSuccess(res, 'Salary simulation computed successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Payroll Specific Audit Logs
   * GET /api/payroll-admin/audit-logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { limit = 30 } = req.query;
      const data = await payrollAdminService.getPayrollAuditLogs({ limit });
      return sendSuccess(res, 'Payroll audit logs retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute Administrative Bulk Actions
   * POST /api/payroll-admin/bulk-action
   */
  async executeBulkAction(req, res, next) {
    try {
      const { action, payrunIds } = req.body;
      if (!action || !payrunIds) {
        return sendError(res, 'Action and payrunIds are required', 400);
      }
      const data = await payrollAdminService.executeBulkAction({
        action,
        payrunIds,
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
      return sendSuccess(res, data.message, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayrollAdminController();
