/**
 * System Permission Constants
 * Format: MODULE.ACTION
 */
const PERMISSIONS = {
  // Employee Management
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_READ_OWN: 'employees.read_own',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',

  // Attendance Management
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_READ_OWN: 'attendance.read_own',
  ATTENDANCE_CREATE_OWN: 'attendance.create_own',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_DELETE: 'attendance.delete',
  ATTENDANCE_CORRECT: 'attendance.correct',

  // Time Off / Leaves Management
  TIMEOFF_READ: 'timeoff.read',
  TIMEOFF_READ_OWN: 'timeoff.read_own',
  TIMEOFF_CREATE_OWN: 'timeoff.create_own',
  TIMEOFF_CREATE: 'timeoff.create',
  TIMEOFF_UPDATE: 'timeoff.update',
  TIMEOFF_DELETE: 'timeoff.delete',
  TIMEOFF_APPROVE: 'timeoff.approve',
  TIMEOFF_REFUSE: 'timeoff.refuse',
  TIMEOFF_ALLOCATIONS_MANAGE: 'timeoff.allocations_manage',
  TIMEOFF_TYPES_MANAGE: 'timeoff.types_manage',

  // Contracts Management
  CONTRACTS_READ: 'contracts.read',
  CONTRACTS_CREATE: 'contracts.create',
  CONTRACTS_UPDATE: 'contracts.update',
  CONTRACTS_DELETE: 'contracts.delete',

  // Working Schedules
  SCHEDULES_READ: 'schedules.read',
  SCHEDULES_CREATE: 'schedules.create',
  SCHEDULES_UPDATE: 'schedules.update',
  SCHEDULES_DELETE: 'schedules.delete',

  // Payruns
  PAYRUNS_READ: 'payruns.read',
  PAYRUNS_CREATE: 'payruns.create',
  PAYRUNS_UPDATE: 'payruns.update',
  PAYRUNS_DELETE: 'payruns.delete',
  PAYRUNS_COMPUTE: 'payruns.compute',
  PAYRUNS_VALIDATE: 'payruns.validate',
  PAYRUNS_PAY: 'payruns.pay',
  PAYRUNS_SEND: 'payruns.send',

  // Payslips
  PAYSLIPS_READ: 'payslips.read',
  PAYSLIPS_READ_OWN: 'payslips.read_own',
  PAYSLIPS_CREATE: 'payslips.create',
  PAYSLIPS_UPDATE: 'payslips.update',
  PAYSLIPS_DELETE: 'payslips.delete',
  PAYSLIPS_SEND: 'payslips.send',
  PAYSLIPS_PDF: 'payslips.pdf',

  // Salary Structures
  SALARY_STRUCTURES_READ: 'salary_structures.read',
  SALARY_STRUCTURES_CREATE: 'salary_structures.create',
  SALARY_STRUCTURES_UPDATE: 'salary_structures.update',
  SALARY_STRUCTURES_DELETE: 'salary_structures.delete',

  // Salary Rules
  SALARY_RULES_READ: 'salary_rules.read',
  SALARY_RULES_CREATE: 'salary_rules.create',
  SALARY_RULES_UPDATE: 'salary_rules.update',
  SALARY_RULES_DELETE: 'salary_rules.delete',

  // Reports & Dashboard
  REPORTS_READ: 'reports.read',
  DASHBOARD_READ: 'dashboard.read',

  // User Administration
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Biometrics & Face
  FACE_ENROLL: 'face.enroll',
  FACE_VERIFY: 'face.verify',
  FACE_MANAGE: 'face.manage'
};

module.exports = {
  PERMISSIONS
};
