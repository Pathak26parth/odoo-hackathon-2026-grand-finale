const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { validateAttendanceCorrection } = require('../middleware/validationMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// Self-Service & Punch Endpoints
router.post('/check-in', requireAuth, (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', requireAuth, (req, res, next) => attendanceController.checkOut(req, res, next));
router.post('/face-verify', requireAuth, (req, res, next) => attendanceController.faceVerify(req, res, next));
router.post('/face-check-in', requireAuth, (req, res, next) => attendanceController.faceCheckIn(req, res, next));
router.post('/face-check-out', requireAuth, (req, res, next) => attendanceController.faceCheckOut(req, res, next));

// Face Biometric Enrollment
router.post('/face/enroll', requireAuth, (req, res, next) => attendanceController.enrollFace(req, res, next));
router.get('/face/status', requireAuth, (req, res, next) => attendanceController.getFaceStatus(req, res, next));
router.delete('/face/enrollment', requireAuth, (req, res, next) => attendanceController.revokeFaceEnrollment(req, res, next));
router.get('/face/logs', requireAuth, (req, res, next) => {
  if (
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR_MANAGER' ||
    req.user.role === 'HR_PAYROLL_ADMIN' ||
    req.user.role === 'HR_PAYROLL_USER' ||
    req.user.permissions?.includes(PERMISSIONS.ATTENDANCE_READ)
  ) {
    return attendanceController.getFaceLogs(req, res, next);
  }
  if (req.user.employeeId) {
    req.query.employeeId = req.user.employeeId;
    return attendanceController.getFaceLogs(req, res, next);
  }
  return sendError(res, 'Forbidden: You do not have permission to view face verification logs.', 403);
});

// Global Attendance Query & Correction
router.get('/', requireAuth, (req, res, next) => {
  if (
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR_MANAGER' ||
    req.user.role === 'HR_PAYROLL_ADMIN' ||
    req.user.role === 'HR_PAYROLL_USER' ||
    req.user.permissions?.includes(PERMISSIONS.ATTENDANCE_READ)
  ) {
    return attendanceController.getAttendance(req, res, next);
  }
  if (req.user.employeeId) {
    req.query.employeeId = req.user.employeeId;
    return attendanceController.getAttendance(req, res, next);
  }
  return sendError(res, 'Forbidden: You do not have permission to view attendance records.', 403);
});
router.get('/:id', requireAuth, (req, res, next) => attendanceController.getAttendanceById(req, res, next));
router.patch('/:id/correct', requireAuth, requirePermission(PERMISSIONS.ATTENDANCE_CORRECT), validateAttendanceCorrection, (req, res, next) => attendanceController.correctAttendance(req, res, next));

module.exports = router;
