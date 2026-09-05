-- Initial Seeds for PeoplePay360
USE `peoplepay360`;

-- 1. SEED ROLES
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'System Administrator with full access to all modules, users, and configurations'),
(2, 'HR Payroll Admin', 'HR and Payroll Administrator with full control over HR records, payroll runs, salary structures, and rules'),
(3, 'HR Payroll User', 'Payroll User with HR management access, Payrun/Payslip processing, and read-only access to salary structures and rules'),
(4, 'HR Manager', 'HR Operations Manager with full CRUD on Employees, Attendance, Contracts, Schedules, and Time Off approvals'),
(5, 'Employee', 'Standard Employee with self-service access to own profile, attendance check-in, and leave requests')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. SEED PERMISSIONS
INSERT INTO `permissions` (`code`, `module`, `description`) VALUES
-- User & Role Management
('users:read', 'Users', 'View user accounts'),
('users:write', 'Users', 'Create and edit user accounts'),
('users:delete', 'Users', 'Deactivate or delete user accounts'),
('roles:read', 'Roles', 'View system roles and permissions'),
('roles:write', 'Roles', 'Modify roles and assign permissions'),

-- Employee Management
('employees:read_all', 'Employees', 'View all employee profiles'),
('employees:read_own', 'Employees', 'View own employee profile'),
('employees:create', 'Employees', 'Create new employee profiles'),
('employees:update', 'Employees', 'Update employee profiles'),
('employees:delete', 'Employees', 'Delete or archive employee profiles'),

-- Attendance Management
('attendance:read_all', 'Attendance', 'View all employee attendance records'),
('attendance:read_own', 'Attendance', 'View own attendance history'),
('attendance:create_own', 'Attendance', 'Punch / Check-in and check-out for self'),
('attendance:create', 'Attendance', 'Create attendance entries for any employee'),
('attendance:update', 'Attendance', 'Correct or modify attendance records'),
('attendance:delete', 'Attendance', 'Delete attendance records'),

-- Working Schedules
('schedules:read', 'Schedules', 'View working schedules and time patterns'),
('schedules:create', 'Schedules', 'Create new working schedules'),
('schedules:update', 'Schedules', 'Modify working schedule configurations'),
('schedules:delete', 'Schedules', 'Delete working schedules'),

-- Contracts Management
('contracts:read', 'Contracts', 'View employee contracts and terms'),
('contracts:create', 'Contracts', 'Draft new employment contracts'),
('contracts:update', 'Contracts', 'Update contract details, wages, and status'),
('contracts:delete', 'Contracts', 'Delete or terminate contracts'),

-- Time Off & Leaves
('leaves:read_all', 'Leaves', 'View all employee leave requests'),
('leaves:read_own', 'Leaves', 'View own leave requests and balances'),
('leaves:create_own', 'Leaves', 'Submit time off requests for self'),
('leaves:create', 'Leaves', 'Create leave entries for employees'),
('leaves:update', 'Leaves', 'Edit leave requests'),
('leaves:delete', 'Leaves', 'Cancel or delete leave requests'),
('leaves:approve', 'Leaves', 'Approve pending time off requests'),
('leaves:refuse', 'Leaves', 'Refuse/reject time off requests'),
('leave_types:read', 'Leaves', 'View configured time off types'),
('leave_types:write', 'Leaves', 'Create and modify time off types'),
('leave_allocations:read', 'Leaves', 'View leave balance allocations'),
('leave_allocations:write', 'Leaves', 'Allocate and adjust leave balances'),

-- Salary Structures
('salary_structures:read', 'SalaryStructures', 'View salary structures'),
('salary_structures:create', 'SalaryStructures', 'Create new salary structures'),
('salary_structures:update', 'SalaryStructures', 'Modify salary structures and rule sequences'),
('salary_structures:delete', 'SalaryStructures', 'Delete salary structures'),

-- Salary Rules
('salary_rules:read', 'SalaryRules', 'View salary rules and computation formulas'),
('salary_rules:create', 'SalaryRules', 'Create salary rules (allowances, deductions, basic)'),
('salary_rules:update', 'SalaryRules', 'Modify salary calculation rules'),
('salary_rules:delete', 'SalaryRules', 'Delete salary rules'),

-- Payruns
('payruns:read', 'Payruns', 'View payrun batches'),
('payruns:create', 'Payruns', 'Create payrun batches via wizard'),
('payruns:update', 'Payruns', 'Update payrun batches and recompute'),
('payruns:delete', 'Payruns', 'Delete draft payruns'),
('payruns:validate', 'Payruns', 'Validate and finalize payrun batches'),
('payruns:pay', 'Payruns', 'Mark payrun batches as paid'),
('payruns:send', 'Payruns', 'Send payslips via email to employees'),

-- Payslips
('payslips:read_all', 'Payslips', 'View all employee payslips'),
('payslips:read_own', 'Payslips', 'View own finalized payslips'),
('payslips:create', 'Payslips', 'Generate individual payslips'),
('payslips:update', 'Payslips', 'Modify payslip components and overrides'),
('payslips:delete', 'Payslips', 'Delete draft payslips'),
('payslips:pdf', 'Payslips', 'Download or print payslip PDF'),

-- Reporting & Dashboard
('dashboard:view_hr', 'Dashboard', 'View HR metrics, headcount, and attendance health'),
('dashboard:view_payroll', 'Dashboard', 'View payroll costs, trends, and salary distributions'),
('reports:export', 'Reports', 'Export HR and Payroll reports')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 3. SEED ROLE PERMISSIONS MAPPING (Strictly according to PDF Role Matrix)

-- Clear existing mappings before reseeding
DELETE FROM `role_permissions`;

-- A) ADMIN: ALL PERMISSIONS
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- B) HR PAYROLL ADMIN: All HR & Payroll CRUD (excluding system user administration)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions`
WHERE `code` NOT IN ('users:read', 'users:write', 'users:delete', 'roles:write');

-- C) HR PAYROLL USER: HR Full CRUD + Payrun/Payslip (Create, Read, Update, Validate, Send) + Salary Structure/Rules (Read Only)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `permissions`
WHERE `code` NOT IN (
  'users:read', 'users:write', 'users:delete', 'roles:write',
  'salary_structures:create', 'salary_structures:update', 'salary_structures:delete',
  'salary_rules:create', 'salary_rules:update', 'salary_rules:delete',
  'payruns:delete', 'payslips:delete'
);

-- D) HR MANAGER: Full CRUD on HR Modules (Employees, Attendance, Schedules, Contracts, Leaves), NO Payroll
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, `id` FROM `permissions`
WHERE `module` IN ('Employees', 'Attendance', 'Schedules', 'Contracts', 'Leaves')
   OR `code` IN ('dashboard:view_hr', 'reports:export');

-- E) EMPLOYEE: Self-service access (Own profile, own attendance, own leaves, own payslips)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 5, `id` FROM `permissions`
WHERE `code` IN (
  'employees:read_own',
  'attendance:read_own',
  'attendance:create_own',
  'leaves:read_own',
  'leaves:create_own',
  'payslips:read_own',
  'payslips:pdf'
);

-- 4. SEED SAMPLE DEPARTMENTS
INSERT INTO `departments` (`id`, `name`, `code`) VALUES
(1, 'Engineering', 'ENG'),
(2, 'Human Resources', 'HR'),
(3, 'Finance & Payroll', 'FIN'),
(4, 'Marketing & Sales', 'MKT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
