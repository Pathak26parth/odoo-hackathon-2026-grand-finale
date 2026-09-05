const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const timeOffService = require('../services/timeOffService');

/**
 * Time Off & Leave Management Controller
 */
class TimeOffController {
  // -------------------------------------------------------------------
  // 1. TIME OFF TYPES
  // -------------------------------------------------------------------
  async getTypes(req, res, next) {
    try {
      const types = await query('SELECT * FROM time_off_types ORDER BY id ASC');
      return sendSuccess(res, 'Time off types retrieved', types);
    } catch (error) {
      next(error);
    }
  }

  async createType(req, res, next) {
    try {
      const { name, code, unit = 'DAYS', requiresAllocation = true, isPaid = true, maxDaysPerYear = 12 } = req.body;

      if (!name || !code) {
        return sendError(res, 'Name and code are required.', 400);
      }

      const result = await query(
        `INSERT INTO time_off_types (name, code, unit, requires_allocation, is_paid, max_days_per_year)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, code.toUpperCase().trim(), unit, requiresAllocation, isPaid, maxDaysPerYear]
      );

      return sendCreated(res, 'Time off type created', { id: result.insertId, name, code });
    } catch (error) {
      next(error);
    }
  }

  async updateType(req, res, next) {
    try {
      const { id } = req.params;
      const { name, unit, requiresAllocation, isPaid, maxDaysPerYear } = req.body;

      await query(
        `UPDATE time_off_types 
         SET name = COALESCE(?, name), unit = COALESCE(?, unit), 
             requires_allocation = COALESCE(?, requires_allocation), 
             is_paid = COALESCE(?, is_paid), max_days_per_year = COALESCE(?, max_days_per_year),
             updated_at = NOW()
         WHERE id = ?`,
        [name, unit, requiresAllocation, isPaid, maxDaysPerYear, id]
      );

      return sendSuccess(res, 'Time off type updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteType(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM time_off_types WHERE id = ?', [id]);
      return sendSuccess(res, 'Time off type deleted');
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------
  // 2. TIME OFF ALLOCATIONS
  // -------------------------------------------------------------------
  async getAllocations(req, res, next) {
    try {
      const { employeeId, year, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          a.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          t.name AS type_name,
          t.code AS type_code,
          t.unit AS type_unit
        FROM time_off_allocations a
        JOIN employees e ON a.employee_id = e.id
        JOIN time_off_types t ON a.time_off_type_id = t.id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        sql += ' AND a.employee_id = ?';
        params.push(employeeId);
      }
      if (year) {
        sql += ' AND a.year = ?';
        params.push(year);
      }

      sql += ' ORDER BY a.year DESC, e.first_name ASC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const allocations = await query(sql, params);
      return sendSuccess(res, 'Allocations retrieved', allocations);
    } catch (error) {
      next(error);
    }
  }

  async createAllocation(req, res, next) {
    try {
      const { employeeId, timeOffTypeId, year = new Date().getFullYear(), allocatedDays, validityStart, validityEnd } = req.body;

      if (!employeeId || !timeOffTypeId || !allocatedDays) {
        return sendError(res, 'Employee ID, Time Off Type ID, and allocatedDays are required.', 400);
      }

      const vStart = validityStart || `${year}-01-01`;
      const vEnd = validityEnd || `${year}-12-31`;

      const result = await query(
        `INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, taken_days, remaining_days, validity_start, validity_end, status)
         VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'APPROVED')
         ON DUPLICATE KEY UPDATE
           allocated_days = VALUES(allocated_days),
           remaining_days = VALUES(allocated_days) - taken_days,
           validity_start = VALUES(validity_start),
           validity_end = VALUES(validity_end);`,
        [employeeId, timeOffTypeId, year, allocatedDays, allocatedDays, vStart, vEnd]
      );

      return sendCreated(res, 'Leave allocation assigned successfully', { id: result.insertId });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------
  // 3. TIME OFF REQUESTS
  // -------------------------------------------------------------------
  async getRequests(req, res, next) {
    try {
      const { employeeId, status, departmentId, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          r.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          t.name AS type_name,
          t.code AS type_code,
          t.is_paid,
          CONCAT(app_e.first_name, ' ', app_e.last_name) AS approved_by_name
        FROM time_off_requests r
        JOIN employees e ON r.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN time_off_types t ON r.time_off_type_id = t.id
        LEFT JOIN users app_u ON r.approved_by = app_u.id
        LEFT JOIN employees app_e ON app_u.employee_id = app_e.id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        sql += ' AND r.employee_id = ?';
        params.push(employeeId);
      }
      if (status) {
        sql += ' AND r.status = ?';
        params.push(status);
      }
      if (departmentId) {
        sql += ' AND e.department_id = ?';
        params.push(departmentId);
      }

      sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const requests = await query(sql, params);
      return sendSuccess(res, 'Time off requests retrieved', requests);
    } catch (error) {
      next(error);
    }
  }

  async createRequest(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const { timeOffTypeId, startDate, endDate, totalDays, reason } = req.body;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const result = await timeOffService.submitRequest({
        employeeId,
        timeOffTypeId,
        startDate,
        endDate,
        totalDays,
        reason
      });

      return sendCreated(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;

      const result = await timeOffService.approveRequest({
        requestId: id,
        approverUserId: req.user.id,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async refuseRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const result = await timeOffService.refuseRequest({
        requestId: id,
        rejectionReason,
        approverUserId: req.user.id,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimeOffController();
