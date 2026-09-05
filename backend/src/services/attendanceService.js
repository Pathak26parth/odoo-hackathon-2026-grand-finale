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
    const checkIn = new Date(correctedCheckIn);
    const checkOut = correctedCheckOut ? new Date(correctedCheckOut) : null;

    let workedHours = 0;
    let overtimeHours = 0;

    if (checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const rawHours = diffMs / (1000 * 60 * 60);
      const breakHours = rawHours > 5 ? 1.0 : 0.0;
      workedHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));
      const expected = parseFloat(prev.expected_hours) || 8.00;
      overtimeHours = workedHours > expected ? parseFloat((workedHours - expected).toFixed(2)) : 0.00;
    }

    // Update attendance
    await query(
      `UPDATE attendance 
       SET check_in = ?, check_out = ?, worked_hours = ?, overtime_hours = ?, 
           is_manual_correction = TRUE, corrected_by = ?, correction_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [checkIn, checkOut, workedHours, overtimeHours, correctedByUserId, reason, attendanceId]
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
          after: { check_in: checkIn, check_out: checkOut, worked_hours: workedHours, reason }
        })
      ]
    );

    return {
      attendanceId,
      checkIn,
      checkOut,
      workedHours,
      isManualCorrection: true,
      reason
    };
  }
}

module.exports = new AttendanceService();
