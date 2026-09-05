const { query } = require('../config/db');
const STATUSES = require('../constants/statuses');

/**
 * Attendance Service
 * Encapsulates check-in, check-out, working schedule verification, worked hours computation, and corrections
 */
class AttendanceService {
  /**
   * Resolve employee record by ID, employee_code, or email
   * @param {string|number} identifier
   * @returns {Promise<{id: number, employee_code: string, first_name: string, last_name: string}|null>}
   */
  async resolveEmployee(identifier) {
    if (!identifier) return null;
    const cleanStr = String(identifier).trim();
    if (typeof identifier === 'number' || (/^\d+$/.test(cleanStr))) {
      const rows = await query('SELECT id, employee_code, first_name, last_name FROM employees WHERE id = ?', [parseInt(cleanStr, 10)]);
      if (rows.length > 0) return rows[0];
    }
    const rows = await query('SELECT id, employee_code, first_name, last_name FROM employees WHERE employee_code = ? OR email = ?', [cleanStr, cleanStr]);
    if (rows.length > 0) return rows[0];
    return null;
  }

  /**
   * Process Employee Check-In
   * @param {Object} params - { employeeId, verificationMethod, dateStr, checkInDateTime }
   */
  async checkIn({ employeeId, verificationMethod = 'PORTAL', checkInTime = new Date() }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }
    const actualEmpId = employee.id;
    const todayStr = checkInTime.toISOString().split('T')[0];

    // Auto-close any unclosed sessions from previous days
    await query(
      `UPDATE attendance 
       SET check_out = DATE_ADD(check_in, INTERVAL 8 HOUR), 
           worked_hours = 8.00, 
           status = 'MISSING_CHECKOUT',
           correction_reason = 'System auto-closed stale session from previous day'
       WHERE employee_id = ? AND check_out IS NULL AND date < ?`,
      [actualEmpId, todayStr]
    );

    // 1. Check if employee already has an active (unclosed) check-in today
    const existing = await query(
      `SELECT id, check_in, check_out FROM attendance 
       WHERE employee_id = ? AND date = ? AND check_out IS NULL
       LIMIT 1`,
      [actualEmpId, todayStr]
    );

    if (existing.length > 0) {
      const err = new Error('You already have an active check-in session for today. Please check out first.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch employee's assigned working schedule for expected start time
    const schedRows = await query(
      `SELECT ws.id, wsd.start_time, wsd.work_hours, wsd.break_minutes
       FROM employees e
       LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
       LEFT JOIN working_schedule_days wsd ON ws.id = wsd.schedule_id AND wsd.day_of_week = UPPER(DAYNAME(?))
       WHERE e.id = ?`,
      [todayStr, actualEmpId]
    );

    let status = STATUSES.ATTENDANCE.PRESENT;
    let expectedHours = 8.00;

    if (schedRows.length > 0 && schedRows[0].start_time) {
      expectedHours = parseFloat(schedRows[0].work_hours) || 8.00;
      const schedStart = schedRows[0].start_time; // e.g. "09:00:00"
      
      const checkInHourMin = checkInTime.toTimeString().substring(0, 5); // "09:15"
      const schedHourMin = schedStart.substring(0, 5); // "09:00"

      // 15-minute grace period
      const [sh, sm] = schedHourMin.split(':').map(Number);
      const [ch, cm] = checkInHourMin.split(':').map(Number);
      const scheduledMinutes = sh * 60 + sm;
      const actualMinutes = ch * 60 + cm;

      if (actualMinutes > scheduledMinutes + 15) {
        status = STATUSES.ATTENDANCE.LATE;
      }
    }

    // 3. Insert Attendance record
    const insertResult = await query(
      `INSERT INTO attendance (employee_id, date, check_in, status, expected_hours, verification_method)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actualEmpId, todayStr, checkInTime, status, expectedHours, verificationMethod]
    );

    return {
      attendanceId: insertResult.insertId,
      employeeId: actualEmpId,
      employeeCode: employee.employee_code,
      date: todayStr,
      checkIn: checkInTime,
      status,
      expectedHours,
      verificationMethod,
      message: status === STATUSES.ATTENDANCE.LATE ? 'Check-in recorded (Late mark applied).' : 'Check-in successful.'
    };
  }

  /**
   * Process Employee Check-Out
   * @param {Object} params - { employeeId, verificationMethod, checkOutTime }
   */
  async checkOut({ employeeId, verificationMethod = 'PORTAL', checkOutTime = new Date() }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }
    const actualEmpId = employee.id;
    const todayStr = checkOutTime.toISOString().split('T')[0];

    // 1. Find open attendance record for today (or most recent open record)
    const openRows = await query(
      `SELECT id, check_in, expected_hours, status 
       FROM attendance 
       WHERE employee_id = ? AND check_out IS NULL 
       ORDER BY check_in DESC 
       LIMIT 1`,
      [actualEmpId]
    );

    if (openRows.length === 0) {
      const err = new Error('No active check-in record found to check out from.');
      err.statusCode = 400;
      throw err;
    }

    const record = openRows[0];
    const checkInTime = new Date(record.check_in);
    
    // Ensure checkOutTime is after checkInTime
    if (checkOutTime < checkInTime) {
      const err = new Error('Check-out time cannot be earlier than check-in time.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Calculate worked hours
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const rawHours = diffMs / (1000 * 60 * 60);
    
    // Deduct standard break if worked > 5 hours
    const breakHours = rawHours > 5 ? 1.0 : 0.0;
    const workedHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));
    
    const expectedHours = parseFloat(record.expected_hours) || 8.00;
    const overtimeHours = workedHours > expectedHours ? parseFloat((workedHours - expectedHours).toFixed(2)) : 0.00;

    let finalStatus = record.status;
    if (workedHours < (expectedHours / 2)) {
      finalStatus = STATUSES.ATTENDANCE.HALF_DAY;
    }

    // 3. Update attendance record
    await query(
      `UPDATE attendance 
       SET check_out = ?, worked_hours = ?, overtime_hours = ?, status = ?
       WHERE id = ?`,
      [checkOutTime, workedHours, overtimeHours, finalStatus, record.id]
    );

    return {
      attendanceId: record.id,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workedHours,
      overtimeHours,
      status: finalStatus,
      message: 'Check-out successful. Worked hours calculated.'
    };
  }

  /**
   * Manual Attendance Correction with Audit Trail
   */
  async correctAttendance({ attendanceId, correctedCheckIn, correctedCheckOut, reason, correctedByUserId, userIp, userAgent }) {
    const existingRows = await query('SELECT * FROM attendance WHERE id = ?', [attendanceId]);
    if (existingRows.length === 0) {
      const err = new Error('Attendance record not found.');
      err.statusCode = 404;
      throw err;
    }

    const prev = existingRows[0];
    const pad = (n) => String(n).padStart(2, '0');

    // Determine base date YYYY-MM-DD from record or today
    let baseDateStr = new Date().toISOString().split('T')[0];
    if (prev.date) {
      if (prev.date instanceof Date && !isNaN(prev.date.getTime())) {
        baseDateStr = `${prev.date.getFullYear()}-${pad(prev.date.getMonth() + 1)}-${pad(prev.date.getDate())}`;
      } else {
        const m = String(prev.date).match(/^\d{4}-\d{2}-\d{2}/);
        if (m) baseDateStr = m[0];
      }
    }

    const parseDateTime = (val) => {
      if (!val) return null;
      if (val instanceof Date && !isNaN(val.getTime())) return val;
      const str = String(val).trim();
      if (!str) return null;

      // HH:mm or HH:mm:ss
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
        const timeWithSec = str.length === 5 ? `${str}:00` : str;
        const normalizedTime = timeWithSec.length === 7 ? `0${timeWithSec}` : timeWithSec;
        return new Date(`${baseDateStr}T${normalizedTime}`);
      }

      // "YYYY-MM-DD HH:mm:ss"
      if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
        return new Date(str.replace(/\s+/, 'T'));
      }

      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
      return null;
    };

    const toSqlDateTime = (d) => {
      if (!d || isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const checkInDate = parseDateTime(correctedCheckIn);
    if (!checkInDate) {
      const err = new Error('Invalid check-in timestamp format provided.');
      err.statusCode = 400;
      throw err;
    }

    const checkOutDate = correctedCheckOut ? parseDateTime(correctedCheckOut) : null;

    let workedHours = 0;
    let overtimeHours = 0;

    if (checkOutDate) {
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      const rawHours = diffMs / (1000 * 60 * 60);
      const breakHours = rawHours > 5 ? 1.0 : 0.0;
      workedHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));
      const expected = parseFloat(prev.expected_hours) || 8.00;
      overtimeHours = workedHours > expected ? parseFloat((workedHours - expected).toFixed(2)) : 0.00;
    }

    const sqlCheckIn = toSqlDateTime(checkInDate);
    const sqlCheckOut = toSqlDateTime(checkOutDate);

    // Update attendance
    await query(
      `UPDATE attendance 
       SET check_in = ?, check_out = ?, worked_hours = ?, overtime_hours = ?, 
           is_manual_correction = TRUE, corrected_by = ?, correction_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [sqlCheckIn, sqlCheckOut, workedHours, overtimeHours, correctedByUserId, reason, attendanceId]
    );

    // Record Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent, details)
       VALUES (?, 'ATTENDANCE_CORRECTED', 'Attendance', ?, ?, ?, ?, ?)`,
      [
        correctedByUserId,
        String(attendanceId),
        `Manual correction: ${reason}`,
        userIp,
        userAgent,
        JSON.stringify({
          before: { check_in: prev.check_in, check_out: prev.check_out, worked_hours: prev.worked_hours },
          after: { check_in: sqlCheckIn, check_out: sqlCheckOut, worked_hours: workedHours, reason }
        })
      ]
    );

    return {
      attendanceId,
      checkIn: sqlCheckIn,
      checkOut: sqlCheckOut,
      workedHours,
      isManualCorrection: true,
      reason
    };
  }

  /**
   * Get Live Today's Attendance Status & Shift Timeout
   */
  async getTodayStatus(employeeId) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }
    const actualEmpId = employee.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Auto-close stale unclosed sessions from previous days (> 16 hours old)
    await query(
      `UPDATE attendance 
       SET check_out = DATE_ADD(check_in, INTERVAL 8 HOUR), 
           worked_hours = 8.00, 
           status = 'MISSING_CHECKOUT',
           correction_reason = 'System auto-closed stale unclosed attendance session'
       WHERE employee_id = ? AND check_out IS NULL AND (date < ? OR TIMESTAMPDIFF(HOUR, check_in, NOW()) > 16)`,
      [actualEmpId, todayStr]
    );

    // Fetch today's most recent attendance record
    const todayRecords = await query(
      `SELECT a.*, 
              d.name AS department_name,
              e.employee_code,
              e.first_name,
              e.last_name,
              e.job_position
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.employee_id = ? AND a.date = ?
       ORDER BY a.id DESC LIMIT 1`,
      [actualEmpId, todayStr]
    );

    // Also fetch working schedule information
    const schedRows = await query(
      `SELECT ws.name as schedule_name, ws.type as schedule_type, wsd.start_time, wsd.end_time, wsd.work_hours, wsd.break_minutes
       FROM employees e
       LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
       LEFT JOIN working_schedule_days wsd ON ws.id = wsd.schedule_id AND wsd.day_of_week = UPPER(DAYNAME(?))
       WHERE e.id = ?`,
      [todayStr, actualEmpId]
    );

    const sched = schedRows.length > 0 ? schedRows[0] : null;
    const scheduledStart = sched?.start_time ? String(sched.start_time).substring(0, 5) : '09:00';
    const scheduledEnd = sched?.end_time ? String(sched.end_time).substring(0, 5) : '18:00';
    const expectedHours = sched ? parseFloat(sched.work_hours || 8) : 8.0;

    let sessionStatus = 'NOT_CHECKED_IN';
    let todayRecord = null;
    let elapsedSeconds = 0;
    let elapsedFormatted = '0h 0m';
    let isTimedOut = false;

    if (todayRecords.length > 0) {
      const rec = todayRecords[0];
      const hasCheckedIn = Boolean(rec.check_in);
      const hasCheckedOut = Boolean(rec.check_out);

      if (hasCheckedIn && !hasCheckedOut) {
        sessionStatus = 'CHECKED_IN';
        const checkInDate = new Date(rec.check_in);
        const diffMs = Math.max(0, now.getTime() - checkInDate.getTime());
        elapsedSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        elapsedFormatted = `${hours}h ${mins}m`;

        // Check if session exceeded 14 hours
        if (hours >= 14) {
          isTimedOut = true;
        }
      } else if (hasCheckedIn && hasCheckedOut) {
        sessionStatus = 'CHECKED_OUT';
        const totalMinutes = Math.round((parseFloat(rec.worked_hours) || 0) * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        elapsedFormatted = `${hours}h ${mins}m`;
      }

      const formatTime = (timeVal) => {
        if (!timeVal) return null;
        const d = new Date(timeVal);
        return isNaN(d.getTime()) ? String(timeVal) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      };

      todayRecord = {
        id: rec.id,
        date: rec.date,
        checkIn: formatTime(rec.check_in),
        checkOut: formatTime(rec.check_out),
        rawCheckIn: rec.check_in,
        rawCheckOut: rec.check_out,
        workedHours: parseFloat(rec.worked_hours || 0),
        expectedHours: parseFloat(rec.expected_hours || expectedHours),
        overtimeHours: parseFloat(rec.overtime_hours || 0),
        status: rec.status,
        verificationMethod: rec.verification_method || 'FACE'
      };
    }

    return {
      employee: {
        id: employee.id,
        employeeCode: employee.employee_code,
        name: `${employee.first_name} ${employee.last_name}`.trim(),
        department: employee.department_name || 'Engineering & Technology',
        position: employee.job_position || 'Full Stack Engineer'
      },
      date: todayStr,
      sessionStatus,
      canCheckIn: sessionStatus !== 'CHECKED_IN',
      canCheckOut: sessionStatus === 'CHECKED_IN',
      isTimedOut,
      elapsedSeconds,
      elapsedFormatted,
      todayRecord,
      schedule: {
        name: sched?.schedule_name || 'Standard 40 Hours',
        scheduledStart,
        scheduledEnd,
        expectedHours,
        maxSessionHours: 14
      }
    };
  }

  /**
   * Get Employee Attendance History with KPIs
   */
  async getEmployeeHistory(employeeId, { startDate, endDate, status, limit = 50, page = 1 } = {}) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }
    const actualEmpId = employee.id;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = 'WHERE a.employee_id = ?';
    const params = [actualEmpId];

    if (startDate) {
      whereClause += ' AND a.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND a.date <= ?';
      params.push(endDate);
    }
    if (status && status !== 'All') {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    // Aggregated Metrics
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN a.status != 'ABSENT' THEN 1 END) as total_days_present,
        COALESCE(SUM(a.worked_hours), 0) as total_worked_hours,
        COALESCE(AVG(CASE WHEN a.worked_hours > 0 THEN a.worked_hours END), 0) as avg_hours_per_day,
        COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as total_late_days,
        COALESCE(SUM(a.overtime_hours), 0) as total_overtime_hours
      FROM attendance a
      ${whereClause}
    `;
    const statsRows = await query(statsQuery, params);
    const stats = statsRows[0] || {};

    const totalDaysPresent = parseInt(stats.total_days_present || 0, 10);
    const totalWorkedHours = parseFloat(stats.total_worked_hours || 0);
    const avgHoursPerDay = parseFloat(stats.avg_hours_per_day || 0).toFixed(1);
    const totalLateDays = parseInt(stats.total_late_days || 0, 10);
    const onTimePercentage = totalDaysPresent > 0
      ? Math.round(((totalDaysPresent - totalLateDays) / totalDaysPresent) * 100)
      : 100;

    // Count
    const countRows = await query(`SELECT COUNT(*) as total FROM attendance a ${whereClause}`, params);
    const total = countRows[0].total;

    // Records
    const recordsQuery = `
      SELECT 
        a.*,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        d.name AS department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY a.date DESC, a.check_in DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const rawRecords = await query(recordsQuery, queryParams);

    const formatTime = (timeVal) => {
      if (!timeVal) return null;
      const d = new Date(timeVal);
      return isNaN(d.getTime()) ? String(timeVal) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const records = rawRecords.map((r) => ({
      id: String(r.id),
      date: r.date ? String(r.date).split('T')[0] : '',
      checkIn: formatTime(r.check_in),
      checkOut: formatTime(r.check_out),
      rawCheckIn: r.check_in,
      rawCheckOut: r.check_out,
      workedHours: parseFloat(r.worked_hours || 0),
      expectedHours: parseFloat(r.expected_hours || 8),
      overtimeHours: parseFloat(r.overtime_hours || 0),
      status: r.status,
      verificationMethod: r.verification_method || 'FACE',
      isManualCorrection: Boolean(r.is_manual_correction),
      correctionReason: r.correction_reason,
      employeeName: r.employee_name,
      department: r.department_name
    }));

    return {
      summary: {
        totalDaysPresent,
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(1)),
        avgHoursPerDay: parseFloat(avgHoursPerDay),
        totalLateDays,
        onTimePercentage,
        totalOvertimeHours: parseFloat(parseFloat(stats.total_overtime_hours || 0).toFixed(1))
      },
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Submit an Attendance Correction Request (Employee)
   */
  async createCorrectionRequest({ employeeId, attendanceId, requestDate, proposedCheckIn, proposedCheckOut, reason }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }

    if (!proposedCheckIn || !proposedCheckOut) {
      const err = new Error('Both proposed check-in and proposed check-out times are required.');
      err.statusCode = 400;
      throw err;
    }

    const checkIn = new Date(proposedCheckIn);
    const checkOut = new Date(proposedCheckOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      const err = new Error('Invalid date/time format for proposed check-in or check-out.');
      err.statusCode = 400;
      throw err;
    }

    if (checkOut <= checkIn) {
      const err = new Error('Proposed check-out time must be after proposed check-in time.');
      err.statusCode = 400;
      throw err;
    }

    if (!reason || !reason.trim()) {
      const err = new Error('Reason/justification is required for attendance correction requests.');
      err.statusCode = 400;
      throw err;
    }

    // Check if there is already a PENDING request for this employee and date
    const pendingExisting = await query(
      `SELECT id FROM attendance_correction_requests 
       WHERE employee_id = ? AND request_date = ? AND status = 'PENDING'`,
      [employee.id, requestDate]
    );
    if (pendingExisting.length > 0) {
      const err = new Error('A pending correction request already exists for this date. Please wait for HR review.');
      err.statusCode = 400;
      throw err;
    }

    // If attendanceId is provided, verify it belongs to this employee
    let verifiedAttendanceId = null;
    if (attendanceId) {
      const attRows = await query('SELECT id, employee_id FROM attendance WHERE id = ?', [attendanceId]);
      if (attRows.length > 0 && String(attRows[0].employee_id) === String(employee.id)) {
        verifiedAttendanceId = attRows[0].id;
      }
    }

    const insertResult = await query(
      `INSERT INTO attendance_correction_requests 
       (employee_id, attendance_id, request_date, proposed_check_in, proposed_check_out, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [employee.id, verifiedAttendanceId, requestDate, checkIn, checkOut, reason.trim()]
    );

    return {
      requestId: insertResult.insertId,
      employeeId: employee.id,
      requestDate,
      proposedCheckIn: checkIn,
      proposedCheckOut: checkOut,
      reason: reason.trim(),
      status: 'PENDING',
      message: 'Attendance correction request submitted successfully to HR.'
    };
  }

  /**
   * Get Correction Requests (Supports filtering by employee, status, pagination)
   */
  async getCorrectionRequests({ employeeId, status, page = 1, limit = 50 } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (employeeId) {
      const employee = await this.resolveEmployee(employeeId);
      if (employee) {
        whereClause += ' AND acr.employee_id = ?';
        params.push(employee.id);
      }
    }

    if (status && status !== 'All' && status !== 'undefined' && status !== 'null') {
      whereClause += ' AND acr.status = ?';
      params.push(status);
    }

    const countRows = await query(
      `SELECT COUNT(*) as total FROM attendance_correction_requests acr ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const sql = `
      SELECT 
        acr.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        u.email AS reviewer_email,
        a.check_in AS original_check_in,
        a.check_out AS original_check_out,
        a.status AS original_status
      FROM attendance_correction_requests acr
      JOIN employees e ON acr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON acr.reviewed_by = u.id
      LEFT JOIN attendance a ON acr.attendance_id = a.id
      ${whereClause}
      ORDER BY acr.id DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    const formatTime = (timeVal) => {
      if (!timeVal) return null;
      const d = new Date(timeVal);
      return isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const requests = rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeCode: r.employee_code,
      employeeName: r.employee_name,
      department: r.department_name,
      attendanceId: r.attendance_id,
      requestDate: r.request_date ? String(r.request_date).split('T')[0] : '',
      proposedCheckIn: formatTime(r.proposed_check_in),
      proposedCheckOut: formatTime(r.proposed_check_out),
      rawProposedCheckIn: r.proposed_check_in,
      rawProposedCheckOut: r.proposed_check_out,
      originalCheckIn: formatTime(r.original_check_in),
      originalCheckOut: formatTime(r.original_check_out),
      originalStatus: r.original_status,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewer_email,
      reviewedAt: r.reviewed_at,
      reviewerNotes: r.reviewer_notes,
      createdAt: r.created_at
    }));

    return {
      requests,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get Single Correction Request by ID
   */
  async getCorrectionRequestById(requestId) {
    const rows = await query(
      `SELECT 
        acr.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        u.email AS reviewer_email,
        a.check_in AS original_check_in,
        a.check_out AS original_check_out,
        a.status AS original_status
      FROM attendance_correction_requests acr
      JOIN employees e ON acr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON acr.reviewed_by = u.id
      LEFT JOIN attendance a ON acr.attendance_id = a.id
      WHERE acr.id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      const err = new Error('Attendance correction request not found.');
      err.statusCode = 404;
      throw err;
    }

    return rows[0];
  }

  /**
   * Approve an Attendance Correction Request (Updates actual attendance record)
   */
  async approveCorrectionRequest({ requestId, reviewerUserId, reviewerNotes, userIp = null, userAgent = null }) {
    const existing = await this.getCorrectionRequestById(requestId);
    if (existing.status !== 'PENDING') {
      const err = new Error(`Request cannot be approved because its current status is "${existing.status}".`);
      err.statusCode = 400;
      throw err;
    }

    const checkIn = new Date(existing.proposed_check_in);
    const checkOut = new Date(existing.proposed_check_out);

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const rawHours = diffMs / (1000 * 60 * 60);
    const breakHours = rawHours > 5 ? 1.0 : 0.0;
    const workedHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));
    const expectedHours = 8.00;
    const overtimeHours = workedHours > expectedHours ? parseFloat((workedHours - expectedHours).toFixed(2)) : 0.00;

    let finalStatus = 'PRESENT';
    if (workedHours < 4.0) {
      finalStatus = 'HALF_DAY';
    }

    let attendanceRecordId = existing.attendance_id;

    if (attendanceRecordId) {
      // Update existing attendance record
      await query(
        `UPDATE attendance 
         SET check_in = ?, check_out = ?, worked_hours = ?, overtime_hours = ?, status = ?,
             is_manual_correction = TRUE, corrected_by = ?, correction_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [checkIn, checkOut, workedHours, overtimeHours, finalStatus, reviewerUserId, existing.reason, attendanceRecordId]
      );
    } else {
      // Check if attendance row exists for that date and employee
      const existingDateRows = await query(
        'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
        [existing.employee_id, existing.request_date]
      );
      if (existingDateRows.length > 0) {
        attendanceRecordId = existingDateRows[0].id;
        await query(
          `UPDATE attendance 
           SET check_in = ?, check_out = ?, worked_hours = ?, overtime_hours = ?, status = ?,
               is_manual_correction = TRUE, corrected_by = ?, correction_reason = ?, updated_at = NOW()
           WHERE id = ?`,
          [checkIn, checkOut, workedHours, overtimeHours, finalStatus, reviewerUserId, existing.reason, attendanceRecordId]
        );
      } else {
        // Insert new attendance record
        const insertAtt = await query(
          `INSERT INTO attendance 
           (employee_id, date, check_in, check_out, worked_hours, expected_hours, overtime_hours, status, is_manual_correction, corrected_by, correction_reason, verification_method)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, 'MANUAL')`,
          [existing.employee_id, existing.request_date, checkIn, checkOut, workedHours, expectedHours, overtimeHours, finalStatus, reviewerUserId, existing.reason]
        );
        attendanceRecordId = insertAtt.insertId;
      }
    }

    // Update correction request
    await query(
      `UPDATE attendance_correction_requests 
       SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), reviewer_notes = ?, attendance_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [reviewerUserId, reviewerNotes || 'Approved by HR', attendanceRecordId, requestId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent, details)
       VALUES (?, 'ATTENDANCE_CORRECTION_APPROVED', 'Attendance', ?, ?, ?, ?, ?)`,
      [
        reviewerUserId,
        String(requestId),
        `Approved attendance correction for employee #${existing.employee_id}`,
        userIp,
        userAgent,
        JSON.stringify({
          requestId,
          attendanceRecordId,
          proposedCheckIn: checkIn,
          proposedCheckOut: checkOut,
          workedHours,
          reviewerNotes
        })
      ]
    );

    return {
      requestId,
      status: 'APPROVED',
      attendanceId: attendanceRecordId,
      workedHours,
      overtimeHours,
      message: 'Attendance correction request approved and attendance record updated.'
    };
  }

  /**
   * Reject an Attendance Correction Request
   */
  async rejectCorrectionRequest({ requestId, reviewerUserId, reviewerNotes, userIp = null, userAgent = null }) {
    const existing = await this.getCorrectionRequestById(requestId);
    if (existing.status !== 'PENDING') {
      const err = new Error(`Request cannot be rejected because its current status is "${existing.status}".`);
      err.statusCode = 400;
      throw err;
    }

    await query(
      `UPDATE attendance_correction_requests 
       SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), reviewer_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [reviewerUserId, reviewerNotes || 'Rejected by HR', requestId]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent, details)
       VALUES (?, 'ATTENDANCE_CORRECTION_REJECTED', 'Attendance', ?, ?, ?, ?, ?)`,
      [
        reviewerUserId,
        String(requestId),
        `Rejected attendance correction for employee #${existing.employee_id}`,
        userIp,
        userAgent,
        JSON.stringify({
          requestId,
          reviewerNotes
        })
      ]
    );

    return {
      requestId,
      status: 'REJECTED',
      message: 'Attendance correction request has been rejected.'
    };
  }

  /**
   * Cancel an Attendance Correction Request (Employee action)
   */
  async cancelCorrectionRequest({ requestId, employeeId }) {
    const existing = await this.getCorrectionRequestById(requestId);
    if (String(existing.employee_id) !== String(employeeId)) {
      const err = new Error('Forbidden: You can only cancel your own correction requests.');
      err.statusCode = 403;
      throw err;
    }

    if (existing.status !== 'PENDING') {
      const err = new Error(`Only PENDING requests can be cancelled. Current status is "${existing.status}".`);
      err.statusCode = 400;
      throw err;
    }

    await query(
      `UPDATE attendance_correction_requests 
       SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = ?`,
      [requestId]
    );

    return {
      requestId,
      status: 'CANCELLED',
      message: 'Attendance correction request has been cancelled.'
    };
  }
}

module.exports = new AttendanceService();
