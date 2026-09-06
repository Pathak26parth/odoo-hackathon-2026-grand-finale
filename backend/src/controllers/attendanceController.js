const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const attendanceService = require('../services/attendanceService');
const faceVerificationService = require('../services/faceVerificationService');

/**
 * Attendance & Biometric Face Verification Controller
 */
class AttendanceController {
  /**
   * Helper to securely resolve target employee and enforce self-attendance boundary for regular employees.
   */
  async _resolveAuthorizedEmployee(req, employeeIdFromBody) {
    const isPrivileged =
      req.user.role === 'ADMIN' ||
      req.user.role === 'HR_MANAGER' ||
      req.user.role === 'HR_PAYROLL_ADMIN' ||
      req.user.role === 'HR_PAYROLL_USER';

    // If privileged admin/manager and specifically provided an employeeId, resolve that employee
    if (isPrivileged && employeeIdFromBody) {
      const targetEmp = await faceVerificationService.resolveEmployee(employeeIdFromBody);
      if (!targetEmp) {
        const err = new Error(`Employee record not found for "${employeeIdFromBody}".`);
        err.statusCode = 404;
        throw err;
      }
      return targetEmp;
    }

    // Regular employee can ONLY punch or verify for themselves
    if (!req.user.employeeId) {
      const err = new Error('No employee profile is linked to your user account.');
      err.statusCode = 400;
      throw err;
    }

    // If non-privileged employee supplied another employee's code/ID, block it strictly with 403
    if (!isPrivileged && employeeIdFromBody) {
      const targetEmp = await faceVerificationService.resolveEmployee(employeeIdFromBody);
      if (targetEmp && targetEmp.id !== req.user.employeeId) {
        const err = new Error('Forbidden: Employees are strictly prohibited from verifying or recording attendance for other employees.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Resolve logged in employee record
    const selfEmp = await faceVerificationService.resolveEmployee(req.user.employeeId);
    if (!selfEmp) {
      const err = new Error('Your employee profile was not found.');
      err.statusCode = 404;
      throw err;
    }
    return selfEmp;
  }

  /**
   * Portal Check-In
   * POST /api/attendance/check-in
   */
  async checkIn(req, res, next) {
    try {
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);

      const result = await attendanceService.checkIn({
        employeeId: employee.id,
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
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);

      const result = await attendanceService.checkOut({
        employeeId: employee.id,
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
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);
      let { faceInput, deviceInfo = 'WebCam' } = req.body;

      // Unpack object payloads if frame was sent as { dataUrl: ... }
      if (faceInput && typeof faceInput === 'object') {
        faceInput = faceInput.dataUrl || faceInput.frame || faceInput.image || null;
      }

      let verification = null;

      // If already verified during the kiosk scan step in the last 3 minutes
      if (!faceInput || faceInput === 'live_camera_punch_frame') {
        const recentSuccessLogs = await query(
          `SELECT id, similarity_score, verified_at 
           FROM face_verification_logs 
           WHERE employee_id = ? AND status = 'SUCCESS' AND verified_at >= NOW() - INTERVAL 3 MINUTE 
           ORDER BY id DESC LIMIT 1`,
          [employee.id]
        );
        if (recentSuccessLogs.length > 0) {
          verification = {
            verified: true,
            status: 'SUCCESS',
            similarityScore: parseFloat(recentSuccessLogs[0].similarity_score) || 0.95,
            logId: recentSuccessLogs[0].id
          };
        }
      }

      // Run 1:1 Face Verification if not already validated
      if (!verification) {
        verification = await faceVerificationService.verifyFace({
          employeeId: employee.id,
          verificationType: 'CHECK_IN',
          faceInput,
          deviceInfo
        });
      }

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Record Check-In in Attendance
      const attResult = await attendanceService.checkIn({
        employeeId: employee.id,
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
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);
      let { faceInput, deviceInfo = 'WebCam' } = req.body;

      // Unpack object payloads if frame was sent as { dataUrl: ... }
      if (faceInput && typeof faceInput === 'object') {
        faceInput = faceInput.dataUrl || faceInput.frame || faceInput.image || null;
      }

      let verification = null;

      // If already verified during the kiosk scan step in the last 3 minutes
      if (!faceInput || faceInput === 'live_camera_punch_frame') {
        const recentSuccessLogs = await query(
          `SELECT id, similarity_score, verified_at 
           FROM face_verification_logs 
           WHERE employee_id = ? AND status = 'SUCCESS' AND verified_at >= NOW() - INTERVAL 3 MINUTE 
           ORDER BY id DESC LIMIT 1`,
          [employee.id]
        );
        if (recentSuccessLogs.length > 0) {
          verification = {
            verified: true,
            status: 'SUCCESS',
            similarityScore: parseFloat(recentSuccessLogs[0].similarity_score) || 0.95,
            logId: recentSuccessLogs[0].id
          };
        }
      }

      // Run 1:1 Face Verification if not already validated
      if (!verification) {
        verification = await faceVerificationService.verifyFace({
          employeeId: employee.id,
          verificationType: 'CHECK_OUT',
          faceInput,
          deviceInfo
        });
      }

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Record Check-Out in Attendance
      const attResult = await attendanceService.checkOut({
        employeeId: employee.id,
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
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);
      let { faceInput, deviceInfo = 'WebCam' } = req.body;

      if (faceInput && typeof faceInput === 'object') {
        faceInput = faceInput.dataUrl || faceInput.frame || faceInput.image || null;
      }

      // 1. Run 1:1 Face & Liveness Verification
      const verification = await faceVerificationService.verifyFace({
        employeeId: employee.id,
        verificationType: 'KIOSK',
        faceInput,
        deviceInfo
      });

      if (!verification.verified) {
        return sendError(res, verification.message, 400, { verificationStatus: verification.status });
      }

      // 2. Fetch employee details and today's attendance status
      const todayStatus = await attendanceService.getTodayStatus(employee.id);

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
        hasCheckedInToday: todayStatus.sessionStatus === 'CHECKED_IN',
        todayRecord: todayStatus.todayRecord,
        todayStatus
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
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);
      const { faceData, faceEmbeddingOrImage, faceInput, image, livenessScore = 0.985 } = req.body;

      const input = faceData || faceEmbeddingOrImage || faceInput || image || `template_${employee.id}_${Date.now()}`;

      const result = await faceVerificationService.enrollFace({
        employeeId: employee.id,
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
      const employee = await this._resolveAuthorizedEmployee(req, req.query.employeeId);

      const status = await faceVerificationService.getEnrollmentStatus(employee.id);

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
      const employee = await this._resolveAuthorizedEmployee(req, req.query.employeeId || req.body.employeeId);

      await query('DELETE FROM face_enrollments WHERE employee_id = ?', [employee.id]);

      await query(
        `INSERT INTO audit_logs (action, module, record_id, description)
         VALUES ('FACE_ENROLLMENT_REVOKED', 'Face', ?, 'Employee face biometrics enrollment was removed')`,
        [String(employee.id)]
      );

      return sendSuccess(res, 'Face enrollment revoked successfully.');
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

      // Check RBAC ownership if employee
      if (req.user.role === 'EMPLOYEE' && req.user.employeeId) {
        if (String(rows[0].employee_id) !== String(req.user.employeeId)) {
          return sendError(res, 'Forbidden: You are strictly prohibited from viewing another employee\'s attendance record.', 403);
        }
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

  /**
   * Get Live Attendance Status for Logged-In Employee
   * GET /api/attendance/my-status
   */
  async getMyStatus(req, res, next) {
    try {
      const employee = await this._resolveAuthorizedEmployee(req, req.query.employeeId);
      const status = await attendanceService.getTodayStatus(employee.id);
      return sendSuccess(res, 'Live attendance status retrieved', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Attendance History for Logged-In Employee
   * GET /api/attendance/my-history
   */
  async getMyHistory(req, res, next) {
    try {
      const employee = await this._resolveAuthorizedEmployee(req, req.query.employeeId);
      const history = await attendanceService.getEmployeeHistory(employee.id, req.query);
      return sendSuccess(res, 'Attendance history retrieved', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit Attendance Correction Request (Employee)
   * POST /api/attendance/correction-requests
   */
  async createCorrectionRequest(req, res, next) {
    try {
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);
      const { attendanceId, requestDate, proposedCheckIn, proposedCheckOut, reason } = req.body;

      const result = await attendanceService.createCorrectionRequest({
        employeeId: employee.id,
        attendanceId,
        requestDate,
        proposedCheckIn,
        proposedCheckOut,
        reason
      });

      return sendSuccess(res, result.message, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Attendance Correction Requests
   * GET /api/attendance/correction-requests
   */
  async getCorrectionRequests(req, res, next) {
    try {
      const isHR =
        req.user.role === 'ADMIN' ||
        req.user.role === 'HR_MANAGER' ||
        req.user.role === 'HR_PAYROLL_ADMIN' ||
        req.user.role === 'HR_PAYROLL_USER';

      let employeeIdToQuery = req.query.employeeId;
      if (!isHR) {
        employeeIdToQuery = req.user.employeeId;
      }

      const rawStatus = req.query.status;
      const cleanStatus = (rawStatus && rawStatus !== 'All' && rawStatus !== 'undefined' && rawStatus !== 'null')
        ? rawStatus
        : undefined;

      const result = await attendanceService.getCorrectionRequests({
        employeeId: employeeIdToQuery,
        status: cleanStatus,
        page: req.query.page,
        limit: req.query.limit
      });

      return sendSuccess(res, 'Attendance correction requests retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Correction Request by ID
   * GET /api/attendance/correction-requests/:id
   */
  async getCorrectionRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await attendanceService.getCorrectionRequestById(id);

      const isHR =
        req.user.role === 'ADMIN' ||
        req.user.role === 'HR_MANAGER' ||
        req.user.role === 'HR_PAYROLL_ADMIN' ||
        req.user.role === 'HR_PAYROLL_USER';

      if (!isHR && String(request.employee_id) !== String(req.user.employeeId)) {
        return sendError(res, 'Forbidden: You are strictly prohibited from viewing another employee\'s correction request.', 403);
      }

      return sendSuccess(res, 'Attendance correction request details retrieved', request);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve Attendance Correction Request (HR/Admin only)
   * POST /api/attendance/correction-requests/:id/approve
   */
  async approveCorrectionRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reviewerNotes } = req.body;

      const result = await attendanceService.approveCorrectionRequest({
        requestId: id,
        reviewerUserId: req.user.id,
        reviewerNotes,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject Attendance Correction Request (HR/Admin only)
   * POST /api/attendance/correction-requests/:id/reject
   */
  async rejectCorrectionRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reviewerNotes } = req.body;

      const result = await attendanceService.rejectCorrectionRequest({
        requestId: id,
        reviewerUserId: req.user.id,
        reviewerNotes,
        userIp: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel Attendance Correction Request (Employee only)
   * POST /api/attendance/correction-requests/:id/cancel
   */
  async cancelCorrectionRequest(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await this._resolveAuthorizedEmployee(req, req.body.employeeId);

      const result = await attendanceService.cancelCorrectionRequest({
        requestId: id,
        employeeId: employee.id
      });

      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
