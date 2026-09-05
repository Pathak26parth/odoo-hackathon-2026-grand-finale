const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const attendanceService = require('../services/attendanceService');
const faceVerificationService = require('../services/faceVerificationService');

/**
 * Attendance & Biometric Face Verification Controller
 */
class AttendanceController {
  /**
   * Portal Check-In
   * POST /api/attendance/check-in
   */
  async checkIn(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const result = await attendanceService.checkIn({
        employeeId,
        verificationMethod: 'PORTAL',
        checkInTime: new Date()
      });

      return sendCreated(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Portal Check-Out
   * POST /api/attendance/check-out
   */
  async checkOut(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const result = await attendanceService.checkOut({
        employeeId,
        verificationMethod: 'PORTAL',
        checkOutTime: new Date()
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 1:1 Face Verified Check-In
   * POST /api/attendance/face-check-in
   */
  async faceCheckIn(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const { faceInput, deviceInfo = 'WebCam' } = req.body;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      // 1. Run 1:1 Face & Liveness Verification
      const verification = await faceVerificationService.verifyFace({
        employeeId,
        verificationType: 'CHECK_IN',
        faceInput,
        deviceInfo
      });

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Record Check-In in Attendance
      const attResult = await attendanceService.checkIn({
        employeeId,
        verificationMethod: 'FACE',
        checkInTime: new Date()
      });

      // 3. Link attendance_id in face_verification_logs
      if (verification.logId) {
        await query('UPDATE face_verification_logs SET attendance_id = ? WHERE id = ?', [
          attResult.attendanceId,
          verification.logId
        ]);
      }

      return sendCreated(res, 'Face verified successfully. Check-in recorded.', {
        verificationStatus: 'SUCCESS',
        similarityScore: verification.similarityScore,
        livenessVerified: true,
        attendance: attResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 1:1 Face Verified Check-Out
   * POST /api/attendance/face-check-out
   */
  async faceCheckOut(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const { faceInput, deviceInfo = 'WebCam' } = req.body;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      // 1. Run 1:1 Face & Liveness Verification
      const verification = await faceVerificationService.verifyFace({
        employeeId,
        verificationType: 'CHECK_OUT',
        faceInput,
        deviceInfo
      });

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Record Check-Out in Attendance
      const attResult = await attendanceService.checkOut({
        employeeId,
        verificationMethod: 'FACE',
        checkOutTime: new Date()
      });

      // 3. Link attendance_id in face_verification_logs
      if (verification.logId) {
        await query('UPDATE face_verification_logs SET attendance_id = ? WHERE id = ?', [
          attResult.attendanceId,
          verification.logId
        ]);
      }

      return sendSuccess(res, 'Face verified successfully. Check-out recorded.', {
        verificationStatus: 'SUCCESS',
        similarityScore: verification.similarityScore,
        workedHours: attResult.workedHours,
        attendance: attResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 1:1 Face Verification Only (Does not punch until confirmed)
   * POST /api/attendance/face-verify
   */
  async faceVerify(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const { faceInput, deviceInfo = 'WebCam' } = req.body;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      // 1. Run 1:1 Face & Liveness Verification
      const verification = await faceVerificationService.verifyFace({
        employeeId,
        verificationType: 'KIOSK',
        faceInput,
        deviceInfo
      });

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Fetch employee details and today's attendance status
      const employee = await faceVerificationService.resolveEmployee(employeeId);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecords = await query(
        `SELECT id, check_in, check_out, status, worked_hours 
         FROM attendance 
         WHERE employee_id = ? AND date = ? 
         ORDER BY id DESC LIMIT 1`,
        [employee.id, todayStr]
      );
      const todayRecord = todayRecords.length > 0 ? todayRecords[0] : null;
      const hasCheckedInToday = Boolean(todayRecord && todayRecord.check_in && !todayRecord.check_out);

      // Fetch department and job position if available
      const empDetails = await query(
        `SELECT e.*, d.name as department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = ?`,
        [employee.id]
      );
      const empInfo = empDetails[0] || employee;

      return sendSuccess(res, 'Face verified successfully.', {
        verificationStatus: 'SUCCESS',
        similarityScore: verification.similarityScore,
        livenessVerified: true,
        employee: {
          id: empInfo.id,
          employeeId: empInfo.employee_code,
          employeeName: `${empInfo.first_name} ${empInfo.last_name}`.trim(),
          department: empInfo.department_name || 'General',
          position: empInfo.job_position || 'Employee',
          profilePhotoUrl: empInfo.profile_photo_url
        },
        hasCheckedInToday,
        todayRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enroll Face Template (Self-Service)
   * POST /api/attendance/face/enroll
   */
  async enrollFace(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const { faceData, faceEmbeddingOrImage, faceInput, image, livenessScore = 0.985 } = req.body;

      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const input = faceData || faceEmbeddingOrImage || faceInput || image || `template_${employeeId}_${Date.now()}`;

      const result = await faceVerificationService.enrollFace({
        employeeId,
        faceEmbeddingOrImage: input,
        livenessScore
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Face Enrollment Status
   * GET /api/face/status
   */
  async getFaceStatus(req, res, next) {
    try {
      const employeeId = req.query.employeeId || req.user.employeeId;
      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const status = await faceVerificationService.getEnrollmentStatus(employeeId);
      return sendSuccess(res, 'Face enrollment status retrieved', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke Face Enrollment
   * DELETE /api/face/enrollment
   */
  async revokeFaceEnrollment(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      if (!employeeId) {
        return sendError(res, 'Employee ID is required.', 400);
      }

      const result = await faceVerificationService.revokeEnrollment(employeeId, req.user.id);
      return sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Attendance Records (Global list with filters)
   * GET /api/attendance
   */
  async getAttendance(req, res, next) {
    try {
      const { employeeId, departmentId, date, startDate, endDate, status, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT 
          a.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          d.name AS department_name,
          CONCAT(c_user.first_name, ' ', c_user.last_name) AS corrected_by_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN users u ON a.corrected_by = u.id
        LEFT JOIN employees c_user ON u.employee_id = c_user.id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        sql += ' AND (a.employee_id = ? OR e.employee_code = ?)';
        params.push(employeeId, employeeId);
      }

      if (departmentId) {
        sql += ' AND (e.department_id = ? OR d.name = ?)';
        params.push(departmentId, departmentId);
      }

      if (date) {
        sql += ' AND a.date = ?';
        params.push(date);
      }

      if (startDate && endDate) {
        sql += ' AND a.date >= ? AND a.date <= ?';
        params.push(startDate, endDate);
      }

      if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
      }

      // Count
      const countRows = await query(`SELECT COUNT(*) as total FROM (${sql}) as sub`, params);
      const total = countRows[0].total;

      sql += ' ORDER BY a.date DESC, a.check_in DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const records = await query(sql, params);

      return sendSuccess(res, 'Attendance records retrieved', {
        attendance: records,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Attendance by ID
   * GET /api/attendance/:id
   */
  async getAttendanceById(req, res, next) {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          a.*,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.job_position,
          d.name AS department_name,
          CONCAT(c_user.first_name, ' ', c_user.last_name) AS corrected_by_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN users u ON a.corrected_by = u.id
        LEFT JOIN employees c_user ON u.employee_id = c_user.id
        WHERE a.id = ?
        LIMIT 1
      `;
      const rows = await query(sql, [id]);

      if (rows.length === 0) {
        return sendError(res, 'Attendance record not found.', 404);
      }

      return sendSuccess(res, 'Attendance details retrieved', rows[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Attendance Correction (Requires attendance.correct)
   * PATCH /api/attendance/:id/correct
   */
  async correctAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { checkIn, checkOut, reason } = req.body;

      const result = await attendanceService.correctAttendance({
        attendanceId: id,
        correctedCheckIn: checkIn,
        correctedCheckOut: checkOut,
        reason,
        correctedByUserId: req.user.id,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendSuccess(res, 'Attendance record corrected successfully with audit trail.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Face Verification Logs
   * GET /api/face/logs
   */
  async getFaceLogs(req, res, next) {
    try {
      const { employeeId, status, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      let sql = `
        SELECT fvl.*, e.employee_code, e.first_name, e.last_name
        FROM face_verification_logs fvl
        JOIN employees e ON fvl.employee_id = e.id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        sql += ' AND (fvl.employee_id = ? OR e.employee_code = ?)';
        params.push(employeeId, employeeId);
      }
      if (status) {
        sql += ' AND fvl.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY fvl.verified_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const logs = await query(sql, params);
      return sendSuccess(res, 'Face verification logs retrieved', logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
