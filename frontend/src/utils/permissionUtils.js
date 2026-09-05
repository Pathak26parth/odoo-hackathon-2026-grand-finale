// utils/permissionUtils.js
// Enterprise RBAC permission helper for PeoplePay360

export const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin'
};

export const MODULES = {
  DASHBOARD: 'dashboard',
  EMPLOYEES: 'employees',
  CONTRACTS: 'contracts',
  WORKING_SCHEDULES: 'working_schedules',
  ATTENDANCE: 'attendance',
  FACE_REGISTRATION: 'face_registration',
  FACE_HISTORY: 'face_history',
  TIME_OFF_REQUESTS: 'time_off_requests',
  TIME_OFF_ALLOCATIONS: 'time_off_allocations',
  TIME_OFF_TYPES: 'time_off_types',
  SALARY_STRUCTURES: 'salary_structures',
  SALARY_RULES: 'salary_rules',
  PAYRUNS: 'payruns',
  PAYSLIPS: 'payslips',
  REPORTS: 'reports',
  USERS: 'users',
  ROLES: 'roles'
};

export function normalizeRoleKey(role) {
  if (!role) return '';
  const clean = String(role).toUpperCase().replace(/\s+/g, '_');
  if (clean === 'ADMIN') return 'ADMIN';
  if (clean === 'HR_PAYROLL_ADMIN' || clean === 'HR_PAYROLL_MANAGER') return 'HR_PAYROLL_MANAGER';
  if (clean === 'HR_PAYROLL_USER') return 'HR_PAYROLL_USER';
  if (clean === 'HR_MANAGER') return 'HR_MANAGER';
  if (clean === 'EMPLOYEE') return 'EMPLOYEE';
  return clean;
}

export const canView = (role, module) => {
  const r = normalizeRoleKey(role);
  if (!r) return false;
  if (r === 'ADMIN') return true;

  switch (module) {
    case MODULES.DASHBOARD:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    case MODULES.EMPLOYEES:
      // Employee only views own profile; HR roles & admin view all
      return true;

    case MODULES.CONTRACTS:
    case MODULES.WORKING_SCHEDULES:
      return r !== 'EMPLOYEE';

    case MODULES.ATTENDANCE:
      return true;

    case MODULES.FACE_REGISTRATION:
    case MODULES.FACE_HISTORY:
      return r !== 'EMPLOYEE';

    case MODULES.TIME_OFF_REQUESTS:
    case MODULES.TIME_OFF_ALLOCATIONS:
      return true;

    case MODULES.TIME_OFF_TYPES:
      return r !== 'EMPLOYEE';

    case MODULES.SALARY_STRUCTURES:
    case MODULES.SALARY_RULES:
    case MODULES.PAYRUNS:
      return (
        r === 'ADMIN' ||
        r === 'HR_PAYROLL_MANAGER' ||
        r === 'HR_PAYROLL_USER'
      );

    case MODULES.PAYSLIPS:
      // Employees view own payslips; Payroll roles view all
      return true;

    case MODULES.REPORTS:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    case MODULES.USERS:
    case MODULES.ROLES:
      return r === 'ADMIN';

    default:
      return false;
  }
};

export const canCreate = (role, module) => {
  const r = normalizeRoleKey(role);
  if (!r) return false;
  if (r === 'ADMIN') return true;

  switch (module) {
    case MODULES.EMPLOYEES:
    case MODULES.CONTRACTS:
    case MODULES.WORKING_SCHEDULES:
    case MODULES.ATTENDANCE:
    case MODULES.FACE_REGISTRATION:
      return r !== 'EMPLOYEE';

    case MODULES.TIME_OFF_REQUESTS:
      return true; // All can request time off

    case MODULES.TIME_OFF_ALLOCATIONS:
    case MODULES.TIME_OFF_TYPES:
      return r !== 'EMPLOYEE';

    case MODULES.SALARY_STRUCTURES:
    case MODULES.SALARY_RULES:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    case MODULES.PAYRUNS:
    case MODULES.PAYSLIPS:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER' || r === 'HR_PAYROLL_USER';

    case MODULES.USERS:
    case MODULES.ROLES:
      return r === 'ADMIN';

    default:
      return false;
  }
};

export const canEdit = (role, module) => {
  const r = normalizeRoleKey(role);
  if (!r) return false;
  if (r === 'ADMIN') return true;

  switch (module) {
    case MODULES.EMPLOYEES:
    case MODULES.CONTRACTS:
    case MODULES.WORKING_SCHEDULES:
    case MODULES.ATTENDANCE:
    case MODULES.TIME_OFF_ALLOCATIONS:
    case MODULES.TIME_OFF_TYPES:
      return r !== 'EMPLOYEE';

    case MODULES.TIME_OFF_REQUESTS:
      return true;

    case MODULES.SALARY_STRUCTURES:
    case MODULES.SALARY_RULES:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    case MODULES.PAYRUNS:
    case MODULES.PAYSLIPS:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER' || r === 'HR_PAYROLL_USER';

    default:
      return false;
  }
};

export const canDelete = (role, module) => {
  const r = normalizeRoleKey(role);
  if (!r) return false;
  if (r === 'ADMIN') return true;

  switch (module) {
    case MODULES.EMPLOYEES:
    case MODULES.CONTRACTS:
    case MODULES.WORKING_SCHEDULES:
    case MODULES.ATTENDANCE:
    case MODULES.TIME_OFF_ALLOCATIONS:
    case MODULES.TIME_OFF_TYPES:
      return r !== 'EMPLOYEE';

    case MODULES.TIME_OFF_REQUESTS:
      return true;

    case MODULES.SALARY_STRUCTURES:
    case MODULES.SALARY_RULES:
    case MODULES.PAYRUNS:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    default:
      return false;
  }
};

export const canApprove = (role, module) => {
  const r = normalizeRoleKey(role);
  if (!r) return false;
  if (r === 'ADMIN') return true;

  switch (module) {
    case MODULES.TIME_OFF_REQUESTS:
      return r !== 'EMPLOYEE';

    case MODULES.PAYRUNS:
      return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';

    default:
      return false;
  }
};

export const canAccessPayroll = (role) => {
  const r = normalizeRoleKey(role);
  return (
    r === 'ADMIN' ||
    r === 'HR_PAYROLL_MANAGER' ||
    r === 'HR_PAYROLL_USER'
  );
};

export const canMarkPaidAndSend = (role) => {
  const r = normalizeRoleKey(role);
  return r === 'ADMIN' || r === 'HR_PAYROLL_MANAGER';
};
