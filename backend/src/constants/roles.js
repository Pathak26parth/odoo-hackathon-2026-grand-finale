/**
 * System Role Constants
 * Stable identifiers for database and backend enforcement
 */
const ROLES = {
  ADMIN: 'ADMIN',
  HR_PAYROLL_ADMIN: 'HR_PAYROLL_ADMIN',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE'
};

const ROLE_DISPLAY_NAMES = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.HR_PAYROLL_ADMIN]: 'HR Payroll Admin',
  [ROLES.HR_PAYROLL_USER]: 'HR Payroll User',
  [ROLES.HR_MANAGER]: 'HR Manager',
  [ROLES.EMPLOYEE]: 'Employee'
};

module.exports = {
  ROLES,
  ROLE_DISPLAY_NAMES
};
