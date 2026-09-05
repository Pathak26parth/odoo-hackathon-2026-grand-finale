const { query, transaction } = require('../config/db');
const STATUSES = require('../constants/statuses');

/**
 * Time Off & Leave Management Service
 */
class TimeOffService {
  /**
   * Resolve employee record ID
   */
  async resolveEmployeeId(identifier) {
    if (!identifier) return null;
    const cleanStr = String(identifier).trim();
    if (/^\d+$/.test(cleanStr)) return parseInt(cleanStr, 10);
    const rows = await query('SELECT id FROM employees WHERE employee_code = ? OR email = ?', [cleanStr, cleanStr]);
    if (rows.length > 0) return rows[0].id;
    return null;
  }

  /**
   * Submit Time Off Request
   */
  async submitRequest({ employeeId, timeOffTypeId, startDate, endDate, totalDays, reason }) {
    const actualEmpId = await this.resolveEmployeeId(employeeId);
    if (!actualEmpId) {
      const err = new Error(`Employee not found for identifier "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Fetch time off type policy
    const typeRows = await query('SELECT * FROM time_off_types WHERE id = ?', [timeOffTypeId]);
    if (typeRows.length === 0) {
      const err = new Error('Invalid Time Off Type.');
      err.statusCode = 400;
      throw err;
    }

    const leaveType = typeRows[0];
    const year = new Date(startDate).getFullYear();

    // 2. Check allocation if required
    if (leaveType.requires_allocation) {
      const allocRows = await query(
        `SELECT * FROM time_off_allocations 
         WHERE employee_id = ? AND time_off_type_id = ? AND year = ? AND status = 'APPROVED'`,
        [actualEmpId, timeOffTypeId, year]
      );

      if (allocRows.length === 0) {
        const err = new Error(`No approved leave allocation found for "${leaveType.name}" in year ${year}.`);
        err.statusCode = 400;
        throw err;
      }

      const allocation = allocRows[0];
      if (parseFloat(allocation.remaining_days) < parseFloat(totalDays)) {
        const err = new Error(
          `Insufficient leave balance. Available: ${allocation.remaining_days} days, Requested: ${totalDays} days.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Create request in PENDING state
    const insertResult = await query(
      `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, total_days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [actualEmpId, timeOffTypeId, startDate, endDate, totalDays, reason]
    );

    return {
      requestId: insertResult.insertId,
      employeeId: actualEmpId,
      timeOffTypeId,
      startDate,
      endDate,
      totalDays,
      status: STATUSES.TIMEOFF_REQUEST.PENDING,
      message: 'Time off request submitted for manager approval.'
    };
  }

  /**
   * Approve Time Off Request (Deducts Allocation Balance Atomically)
   */
  async approveRequest({ requestId, approverUserId, userIp, userAgent }) {
    return transaction(async (connection) => {
      // 1. Get request
      const [reqRows] = await connection.execute(
        `SELECT r.*, t.requires_allocation, t.name AS type_name 
         FROM time_off_requests r
         JOIN time_off_types t ON r.time_off_type_id = t.id
         WHERE r.id = ? FOR UPDATE`,
        [requestId]
      );

      if (reqRows.length === 0) {
        const err = new Error('Time off request not found.');
        err.statusCode = 404;
        throw err;
      }

      const request = reqRows[0];

      if (request.status !== STATUSES.TIMEOFF_REQUEST.PENDING) {
        const err = new Error(`Cannot approve request with current status "${request.status}".`);
        err.statusCode = 400;
        throw err;
      }

      const year = new Date(request.start_date).getFullYear();

      // 2. Deduct from allocation if required
      if (request.requires_allocation) {
        const [allocRows] = await connection.execute(
          `SELECT * FROM time_off_allocations 
           WHERE employee_id = ? AND time_off_type_id = ? AND year = ? AND status = 'APPROVED'
           FOR UPDATE`,
          [request.employee_id, request.time_off_type_id, year]
        );

        if (allocRows.length === 0) {
          const err = new Error('No valid allocation found to deduct leave days from.');
          err.statusCode = 400;
          throw err;
        }

        const alloc = allocRows[0];
        const daysToDeduct = parseFloat(request.total_days);

        if (parseFloat(alloc.remaining_days) < daysToDeduct) {
          const err = new Error(`Insufficient leave balance to approve. Remaining: ${alloc.remaining_days} days.`);
          err.statusCode = 400;
          throw err;
        }

        const newTaken = parseFloat(alloc.taken_days) + daysToDeduct;
        const newRemaining = parseFloat(alloc.remaining_days) - daysToDeduct;

        await connection.execute(
          `UPDATE time_off_allocations 
           SET taken_days = ?, remaining_days = ?, updated_at = NOW() 
           WHERE id = ?`,
          [newTaken, newRemaining, alloc.id]
        );
      }

      // 3. Mark request APPROVED
      await connection.execute(
        `UPDATE time_off_requests 
         SET status = 'APPROVED', approved_by = ?, approved_at = NOW(), updated_at = NOW() 
         WHERE id = ?`,
        [approverUserId, requestId]
      );

      // 4. Audit Log
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'TIMEOFF_APPROVED', 'TimeOff', ?, 'Approved leave request', ?, ?)`,
        [approverUserId, String(requestId), userIp, userAgent]
      );

      return {
        requestId,
        status: STATUSES.TIMEOFF_REQUEST.APPROVED,
        approvedBy: approverUserId,
        message: 'Time off request approved and balance deducted.'
      };
    });
  }

  /**
   * Refuse Time Off Request
   */
  async refuseRequest({ requestId, rejectionReason, approverUserId, userIp, userAgent }) {
    const reqRows = await query('SELECT * FROM time_off_requests WHERE id = ?', [requestId]);
    if (reqRows.length === 0) {
      const err = new Error('Time off request not found.');
      err.statusCode = 404;
      throw err;
    }

    const request = reqRows[0];

    if (request.status !== STATUSES.TIMEOFF_REQUEST.PENDING) {
      const err = new Error(`Cannot refuse request with current status "${request.status}".`);
      err.statusCode = 400;
      throw err;
    }

    await query(
      `UPDATE time_off_requests 
       SET status = 'REFUSED', approved_by = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [approverUserId, rejectionReason || 'Refused by HR Manager', requestId]
    );

    // Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
       VALUES (?, 'TIMEOFF_REFUSED', 'TimeOff', ?, ?, ?, ?)`,
      [approverUserId, String(requestId), `Refused: ${rejectionReason || 'No reason provided'}`, userIp, userAgent]
    );

    return {
      requestId,
      status: STATUSES.TIMEOFF_REQUEST.REFUSED,
      rejectionReason,
      message: 'Time off request has been refused.'
    };
  }
}

module.exports = new TimeOffService();
