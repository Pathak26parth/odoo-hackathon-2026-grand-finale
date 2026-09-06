const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const timeOffRoutes = require('./timeOffRoutes');
const contractRoutes = require('./contractRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const salaryStructureRoutes = require('./salaryStructureRoutes');
const salaryRuleRoutes = require('./salaryRuleRoutes');
const payrunRoutes = require('./payrunRoutes');
const payslipRoutes = require('./payslipRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const uploadRoutes = require('./uploadRoutes');
const payrollAdminRoutes = require('./payrollAdminRoutes');
const notificationRoutes = require('./notificationRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PeoplePay360 API is running',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off', timeOffRoutes);
router.use('/contracts', contractRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/salary-structures', salaryStructureRoutes);
router.use('/salary-rules', salaryRuleRoutes);
router.use('/payruns', payrunRoutes);
router.use('/payslips', payslipRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/payroll-admin', payrollAdminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

// Shortcut routes for Employee Self-Service portal
router.use('/me/employee', (req, res, next) => {
  req.url = '/me';
  return employeeRoutes(req, res, next);
});

module.exports = router;
