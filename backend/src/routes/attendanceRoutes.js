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
router.post('/face-check-in', requireAuth, (req, res, next) => attendanceController.faceCheckIn(req, res, next));
router.post('/face-check-out', requireAuth, (req, res, next) => attendanceController.faceCheckOut(req, res, next));

// Face Biometric Enrollment
router.post('/face/enroll', requireAuth, (req, res, next) => attendanceController.enrollFace(req, res, next));
router.get('/face/status', requireAuth, (req, res, next) => attendanceController.getFaceStatus(req, res, next));
router.delete('/face/enrollment', requireAuth, (req, res, next) => attendanceController.revokeFaceEnrollment(req, res, next));
router.get('/face/logs', requireAuth, requirePermission(PERMISSIONS.ATTENDANCE_READ), (req, res, next) => attendanceController.getFaceLogs(req, res, next));

// Global Attendance Query & Correction
router.get('/', requireAuth, requirePermission(PERMISSIONS.ATTENDANCE_READ), (req, res, next) => attendanceController.getAttendance(req, res, next));
router.get('/:id', requireAuth, requirePermission(PERMISSIONS.ATTENDANCE_READ), (req, res, next) => attendanceController.getAttendanceById(req, res, next));
router.patch('/:id/correct', requireAuth, requirePermission(PERMISSIONS.ATTENDANCE_CORRECT), validateAttendanceCorrection, (req, res, next) => attendanceController.correctAttendance(req, res, next));

module.exports = router;
