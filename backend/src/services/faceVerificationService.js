const crypto = require('crypto');
const { query } = require('../config/db');
const env = require('../config/env');
const STATUSES = require('../constants/statuses');
const cloudinaryService = require('./cloudinaryService');
const aiProcessManager = require('./aiProcessManager');

/**
 * Biometric Face Verification Service
 * Bridges Node.js backend with Python InsightFace/ArcFace + MediaPipe microservice.
 */
class FaceVerificationService {
  /**
   * Check if Python Face Microservice is online
   */
  async checkPythonHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${env.FACE_SERVICE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
      return { online: false, status: res.status };
    } catch {
      return { online: false, message: 'Python Face Service offline' };
    }
  }

  /**
   * Resolve employee record by ID, employee_code, or email
   * @param {string|number} identifier
   * @returns {Promise<{id: number, employee_code: string, first_name: string, last_name: string, profile_photo_url: string}|null>}
   */
  async resolveEmployee(identifier) {
    if (!identifier) return null;
    const cleanStr = String(identifier).trim();
    if (typeof identifier === 'number' || (/^\d+$/.test(cleanStr))) {
      const rows = await query('SELECT id, employee_code, first_name, last_name, profile_photo_url FROM employees WHERE id = ?', [parseInt(cleanStr, 10)]);
      if (rows.length > 0) return rows[0];
    }
    const rows = await query('SELECT id, employee_code, first_name, last_name, profile_photo_url FROM employees WHERE employee_code = ? OR email = ?', [cleanStr, cleanStr]);
    if (rows.length > 0) return rows[0];
    return null;
  }

  /**
   * Enroll an employee's face template
   * @param {Object} params - { employeeId, faceEmbeddingOrImage, livenessScore }
   */
  async enrollFace({ employeeId, faceEmbeddingOrImage, livenessScore = 0.98 }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }
    const actualEmpId = employee.id;

    let uploadedPhotoUrl = null;

    // If input is a base64 camera capture, upload directly to Cloudinary
    if (faceEmbeddingOrImage && typeof faceEmbeddingOrImage === 'string' && cloudinaryService.isBase64Image(faceEmbeddingOrImage)) {
      try {
        uploadedPhotoUrl = await cloudinaryService.uploadImage(
          faceEmbeddingOrImage,
          'peoplepay360/faces',
          `face_${actualEmpId}_${Date.now()}`
        );
        // Persist real photo URL in employee record
        await query('UPDATE employees SET profile_photo_url = ?, updated_at = NOW() WHERE id = ?', [
          uploadedPhotoUrl,
          actualEmpId
        ]);
        employee.profile_photo_url = uploadedPhotoUrl;
      } catch (uploadErr) {
        console.warn('[FaceEnroll] Cloudinary face photo upload warning:', uploadErr.message);
      }
    }

    // Generate secure hash of biometric template/embedding
    const templateHash = crypto
      .createHash('sha256')
      .update(typeof faceEmbeddingOrImage === 'string' ? faceEmbeddingOrImage : JSON.stringify(faceEmbeddingOrImage))
      .digest('hex');

    const sql = `
      INSERT INTO face_enrollments (employee_id, enrollment_status, biometric_template_hash, liveness_score, enrolled_at)
      VALUES (?, 'ACTIVE', ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        enrollment_status = 'ACTIVE',
        biometric_template_hash = VALUES(biometric_template_hash),
        liveness_score = VALUES(liveness_score),
        updated_at = NOW();
    `;

    await query(sql, [actualEmpId, templateHash, livenessScore]);

    // Notify Python AI microservice to index the face template
    try {
      const imgToRegister = uploadedPhotoUrl || (typeof faceEmbeddingOrImage === 'string' && (faceEmbeddingOrImage.startsWith('http') || faceEmbeddingOrImage.startsWith('data:image')) ? faceEmbeddingOrImage : employee.profile_photo_url);
      if (imgToRegister && (imgToRegister.startsWith('data:image') || imgToRegister.startsWith('http'))) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        await fetch(`${env.FACE_SERVICE_URL}/api/face/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imgToRegister,
            employee_id: employee.employee_code || String(actualEmpId)
          }),
          signal: controller.signal
        }).catch(() => {});
        clearTimeout(timeoutId);
      }
    } catch (e) {
      console.warn('[FaceEnroll] Python microservice sync note:', e.message);
    }

    // Record audit log
    await query(
      `INSERT INTO audit_logs (action, module, record_id, description)
       VALUES ('FACE_ENROLLED', 'Face', ?, 'Employee completed face attendance enrollment')`,
      [String(actualEmpId)]
    );

    return {
      success: true,
      enrollmentStatus: 'ACTIVE',
      templateHash,
      profilePhotoUrl: uploadedPhotoUrl || employee.profile_photo_url,
      message: 'Face enrolled successfully for biometric attendance.'
    };
  }

  /**
   * Check employee enrollment status
   */
  async getEnrollmentStatus(employeeId) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      return { isEnrolled: false, status: 'NOT_ENROLLED' };
    }

    const rows = await query(
      'SELECT id, employee_id, enrollment_status, liveness_score, enrolled_at, updated_at FROM face_enrollments WHERE employee_id = ?',
      [employee.id]
    );

    if (rows.length === 0) {
      return { isEnrolled: false, status: 'NOT_ENROLLED' };
    }

    const enrollment = rows[0];
    return {
      isEnrolled: enrollment.enrollment_status === 'ACTIVE',
      status: enrollment.enrollment_status,
      enrolledAt: enrollment.enrolled_at,
      updatedAt: enrollment.updated_at
    };
  }

  /**
   * Run 1:1 Identity and Liveness Verification
   * @param {Object} params - { employeeId, verificationType, faceInput, deviceInfo }
   */
  async verifyFace({ employeeId, verificationType = 'CHECK_IN', faceInput, deviceInfo = 'WebCam/Kiosk' }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      return {
        verified: false,
        status: 'REJECTED',
        message: `Employee record not found for "${employeeId}".`
      };
    }
    const actualEmpId = employee.id;

    // 1. Verify enrollment exists and is ACTIVE
    let enrollmentRows = await query(
      'SELECT fe.*, e.profile_photo_url, e.employee_code FROM face_enrollments fe JOIN employees e ON fe.employee_id = e.id WHERE fe.employee_id = ? AND fe.enrollment_status = "ACTIVE"',
      [actualEmpId]
    );

    if (enrollmentRows.length === 0) {
      // Auto-enroll if employee exists on file
      try {
        await this.enrollFace({
          employeeId: actualEmpId,
          faceEmbeddingOrImage: faceInput || employee.profile_photo_url || `template_${actualEmpId}_auto`,
          livenessScore: 0.985
        });
        enrollmentRows = [{
          employee_id: actualEmpId,
          employee_code: employee.employee_code,
          profile_photo_url: employee.profile_photo_url
        }];
      } catch (enrollErr) {
        console.warn('[FaceVerify] Auto-enrollment error:', enrollErr.message);
        await this.logVerification({
          employeeId: actualEmpId,
          verificationType,
          status: STATUSES.FACE_LOG.REJECTED,
          livenessVerified: false,
          failureReason: 'Employee has no active face enrollment on file.',
          deviceInfo
        });

        return {
          verified: false,
          status: 'REJECTED',
          message: 'Face attendance is not enrolled for this employee. Please complete face enrollment in your profile.'
        };
      }
    }

    const enrollment = enrollmentRows[0];
    let similarityScore = 0.0;
    let isLive = true;
    let matchSuccess = false;
    let failureMsg = 'Face identity verification failed. Face does not match registered profile photo.';

    // 2. Validate input image payload
    if (faceInput && typeof faceInput === 'object') {
      faceInput = faceInput.dataUrl || faceInput.frame || faceInput.image || faceInput.url || null;
    }

    if (!faceInput || typeof faceInput !== 'string' || (!faceInput.startsWith('data:image') && !faceInput.startsWith('http') && !faceInput.endsWith('.jpg') && !faceInput.endsWith('.png'))) {
      await this.logVerification({
        employeeId: actualEmpId,
        verificationType,
        status: STATUSES.FACE_LOG.FAILED,
        livenessVerified: false,
        similarityScore: 0.0,
        failureReason: 'Invalid or missing camera frame input.',
        deviceInfo
      });

      return {
        verified: false,
        status: 'FAILED',
        similarityScore: 0.0,
        message: 'Invalid camera frame capture. Please ensure your camera is active and well-lit.'
      };
    }

    // 3. Call Python InsightFace / ArcFace Microservice
    const sendAttendanceRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const registeredImg = enrollment.profile_photo_url || faceInput;

      const res = await fetch(`${env.FACE_SERVICE_URL}/api/face/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registered_image: registeredImg,
          live_image: faceInput,
          employee_id: enrollment.employee_code,
          action: verificationType
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res;
    };

    try {
      let pyResponse;
      try {
        pyResponse = await sendAttendanceRequest();
      } catch (firstErr) {
        // Attempt to auto-wake Python service if offline
        const isUp = await aiProcessManager.ensureAiService();
        if (isUp) {
          pyResponse = await sendAttendanceRequest();
        } else {
          throw firstErr;
        }
      }

      const pyResult = await pyResponse.json().catch(() => ({}));

      if (pyResponse.ok) {
        if (pyResult.success === false) {
          matchSuccess = false;
          failureMsg = pyResult.error?.message || pyResult.message || 'Face biometrics analysis failed.';
        } else if (pyResult.data) {
          similarityScore = pyResult.data.similarity || 0.0;
          matchSuccess = pyResult.data.match === true;
          isLive = pyResult.data.liveness !== false;
        } else if (pyResult.match !== undefined) {
          similarityScore = pyResult.similarity || 0.0;
          matchSuccess = pyResult.match === true;
          isLive = pyResult.liveness !== false;
        }
      } else {
        matchSuccess = false;
        failureMsg = pyResult.error?.message || pyResult.message || `Face recognition service error (${pyResponse.status})`;
      }
    } catch (fetchErr) {
      console.warn('[FaceService] Python Face AI service communication error:', fetchErr.message);
      matchSuccess = false;
      failureMsg = 'Face AI biometrics microservice unavailable. Please ensure the AI face service is running on port 8000.';
    }

    if (!isLive) {
      await this.logVerification({
        employeeId: actualEmpId,
        verificationType,
        status: STATUSES.FACE_LOG.FAILED,
        livenessVerified: false,
        similarityScore,
        failureReason: 'Anti-spoof liveness check failed (presentation attack detected).',
        deviceInfo
      });

      return {
        verified: false,
        status: 'FAILED',
        similarityScore,
        message: 'Liveness verification failed. Please look directly at the camera and avoid glare.'
      };
    }

    if (!matchSuccess || similarityScore < 0.40) {
      await this.logVerification({
        employeeId: actualEmpId,
        verificationType,
        status: STATUSES.FACE_LOG.FAILED,
        livenessVerified: isLive,
        similarityScore,
        failureReason: failureMsg,
        deviceInfo
      });

      return {
        verified: false,
        status: 'FAILED',
        similarityScore,
        message: failureMsg
      };
    }

    // 4. Record Successful Verification Log
    const logId = await this.logVerification({
      employeeId: actualEmpId,
      verificationType,
      status: STATUSES.FACE_LOG.SUCCESS,
      livenessVerified: true,
      similarityScore,
      deviceInfo
    });

    return {
      verified: true,
      status: 'SUCCESS',
      similarityScore,
      livenessVerified: true,
      logId,
      message: 'Face verification successful.'
    };
  }

  /**
   * Log verification attempt in face_verification_logs
   */
  async logVerification({ employeeId, attendanceId = null, verificationType, status, livenessVerified = false, similarityScore = null, failureReason = null, deviceInfo = null }) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      console.warn('[FaceLog] Cannot log verification: employee not found for identifier:', employeeId);
      return null;
    }

    const validTypes = ['CHECK_IN', 'CHECK_OUT', 'KIOSK'];
    const validType = validTypes.includes(verificationType) ? verificationType : 'KIOSK';

    const sql = `
      INSERT INTO face_verification_logs 
        (employee_id, attendance_id, verification_type, status, liveness_verified, similarity_score, failure_reason, device_info, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await query(sql, [
      employee.id,
      attendanceId,
      validType,
      status,
      livenessVerified,
      similarityScore,
      failureReason,
      deviceInfo
    ]);
    return result.insertId;
  }

  /**
   * Revoke Face Enrollment
   */
  async revokeEnrollment(employeeId, revokedByUserId = null) {
    const employee = await this.resolveEmployee(employeeId);
    if (!employee) {
      const err = new Error(`Employee record not found for "${employeeId}".`);
      err.statusCode = 404;
      throw err;
    }

    await query(
      'UPDATE face_enrollments SET enrollment_status = "REVOKED", updated_at = NOW() WHERE employee_id = ?',
      [employee.id]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, module, record_id, description)
       VALUES (?, 'FACE_REVOKED', 'Face', ?, 'Face enrollment revoked')`,
      [revokedByUserId, String(employee.id)]
    );

    return { success: true, message: 'Face enrollment revoked.' };
  }
}

module.exports = new FaceVerificationService();
