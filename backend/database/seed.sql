-- =====================================================================
-- PEOPLEPAY360 HR & PAYROLL PLATFORM - SEED DATA (Connected Real Data)
-- =====================================================================

USE `peoplepay360`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. SEED ROLES
-- ---------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`) VALUES
(1, 'ADMIN', 'Admin', 'System Administrator with full access to all functional areas, user management, and system configurations'),
(2, 'HR_PAYROLL_ADMIN', 'HR Payroll Admin', 'HR and Payroll Administrator with full control over HR records, payroll runs, salary structures, and rules'),
(3, 'HR_PAYROLL_USER', 'HR Payroll User', 'Payroll User with HR management access, Payrun/Payslip processing, and read-only access to salary structures and rules'),
(4, 'HR_MANAGER', 'HR Manager', 'HR Operations Manager with full CRUD on Employees, Attendance, Contracts, Schedules, and Time Off approvals'),
(5, 'EMPLOYEE', 'Employee', 'Standard Employee with self-service access to own profile, attendance check-in, and leave requests')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`), `description` = VALUES(`description`);

-- ---------------------------------------------------------------------
-- 2. SEED PERMISSIONS
-- ---------------------------------------------------------------------
INSERT INTO `permissions` (`code`, `module`, `description`) VALUES
-- Employees
('employees.read', 'Employees', 'View all employee records'),
('employees.read_own', 'Employees', 'View own employee record'),
('employees.create', 'Employees', 'Create new employee profiles'),
('employees.update', 'Employees', 'Update employee profiles'),
('employees.delete', 'Employees', 'Delete or archive employee profiles'),

-- Attendance
('attendance.read', 'Attendance', 'View all employee attendance records'),
('attendance.read_own', 'Attendance', 'View own attendance history'),
('attendance.create_own', 'Attendance', 'Record own check-in/out attendance'),
('attendance.create', 'Attendance', 'Create attendance entries for any employee'),
('attendance.update', 'Attendance', 'Update attendance records'),
('attendance.delete', 'Attendance', 'Delete attendance records'),
('attendance.correct', 'Attendance', 'Perform manual corrections on attendance with audit logging'),

-- Time Off
('timeoff.read', 'TimeOff', 'View all employee time off requests'),
('timeoff.read_own', 'TimeOff', 'View own time off requests and allocations'),
('timeoff.create_own', 'TimeOff', 'Submit time off requests for self'),
('timeoff.create', 'TimeOff', 'Create time off requests for employees'),
('timeoff.update', 'TimeOff', 'Edit time off requests'),
('timeoff.delete', 'TimeOff', 'Delete time off requests'),
('timeoff.approve', 'TimeOff', 'Approve pending time off requests'),
('timeoff.refuse', 'TimeOff', 'Refuse/reject time off requests'),
('timeoff.allocations_manage', 'TimeOff', 'Manage employee leave balance allocations'),
('timeoff.types_manage', 'TimeOff', 'Configure time off types and policies'),

-- Contracts
('contracts.read', 'Contracts', 'View employee contracts and wage details'),
('contracts.create', 'Contracts', 'Create employment contracts'),
('contracts.update', 'Contracts', 'Update contract terms and salary structure bindings'),
('contracts.delete', 'Contracts', 'Delete or terminate contracts'),

-- Schedules
('schedules.read', 'Schedules', 'View working schedules and daily shift patterns'),
('schedules.create', 'Schedules', 'Create working schedules'),
('schedules.update', 'Schedules', 'Modify working schedule configurations'),
('schedules.delete', 'Schedules', 'Delete working schedules'),

-- Payruns
('payruns.read', 'Payruns', 'View payrun batches and summaries'),
('payruns.create', 'Payruns', 'Create payrun batches via wizard'),
('payruns.update', 'Payruns', 'Update and recompute payrun batches'),
('payruns.delete', 'Payruns', 'Delete draft payruns'),
('payruns.compute', 'Payruns', 'Execute salary computation for selected employees'),
('payruns.validate', 'Payruns', 'Validate and lock payrun batches'),
('payruns.pay', 'Payruns', 'Mark payrun batches as paid'),
('payruns.send', 'Payruns', 'Send payslips in bulk to employees'),

-- Payslips
('payslips.read', 'Payslips', 'View all generated employee payslips'),
('payslips.read_own', 'Payslips', 'View own payslips in employee portal'),
('payslips.create', 'Payslips', 'Generate individual payslips'),
('payslips.update', 'Payslips', 'Modify payslip components and overrides'),
('payslips.delete', 'Payslips', 'Delete draft payslips'),
('payslips.send', 'Payslips', 'Email individual payslip to employee'),
('payslips.pdf', 'Payslips', 'Download/print payslip PDF'),

-- Salary Structures
('salary_structures.read', 'SalaryStructures', 'View salary structures'),
('salary_structures.create', 'SalaryStructures', 'Create salary structures'),
('salary_structures.update', 'SalaryStructures', 'Modify salary structures and rule sequences'),
('salary_structures.delete', 'SalaryStructures', 'Delete salary structures'),

-- Salary Rules
('salary_rules.read', 'SalaryRules', 'View salary calculation rules'),
('salary_rules.create', 'SalaryRules', 'Create salary calculation rules'),
('salary_rules.update', 'SalaryRules', 'Update salary rules'),
('salary_rules.delete', 'SalaryRules', 'Delete salary rules'),

-- Reports & Dashboard
('reports.read', 'Reports', 'Generate and export HR & Payroll reports'),
('dashboard.read', 'Dashboard', 'View live HR and Payroll analytics dashboard'),

-- User Administration
('users.read', 'Users', 'View user accounts'),
('users.create', 'Users', 'Create user accounts'),
('users.update', 'Users', 'Update user accounts and activation status'),
('users.delete', 'Users', 'Deactivate or delete users'),
('roles.manage', 'Roles', 'Manage roles and system permission mappings'),
('permissions.manage', 'Permissions', 'Manage fine-grained permissions'),

-- Biometrics & Face Attendance
('face.enroll', 'Face', 'Enroll face template for biometric attendance'),
('face.verify', 'Face', 'Perform face verification for attendance check-in/out'),
('face.manage', 'Face', 'Manage biometric enrollments and view verification logs')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- ---------------------------------------------------------------------
-- 3. SEED ROLE PERMISSIONS MAPPING (Strict RBAC Specification)
-- ---------------------------------------------------------------------
DELETE FROM `role_permissions`;

-- A) ADMIN: ALL Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- B) HR_PAYROLL_ADMIN: All HR & Payroll CRUD (excluding system user administration)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions`
WHERE `code` NOT IN (
  'users.read', 'users.create', 'users.update', 'users.delete',
  'roles.manage', 'permissions.manage'
);

-- C) HR_PAYROLL_USER: HR Full CRUD + Payrun/Payslip (Read, Create, Update, Compute, Validate, Send) + Salary Structure/Rules (Read Only)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `permissions`
WHERE `code` NOT IN (
  'users.read', 'users.create', 'users.update', 'users.delete',
  'roles.manage', 'permissions.manage',
  'salary_structures.create', 'salary_structures.update', 'salary_structures.delete',
  'salary_rules.create', 'salary_rules.update', 'salary_rules.delete',
  'payruns.delete', 'payslips.delete', 'payruns.pay'
);

-- D) HR_MANAGER: Full CRUD on HR Modules (Employees, Attendance, Schedules, Contracts, Time Off), NO Payroll
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, `id` FROM `permissions`
WHERE `module` IN ('Employees', 'Attendance', 'Schedules', 'Contracts', 'TimeOff', 'Face')
   OR `code` IN ('dashboard.read', 'reports.read');

-- E) EMPLOYEE: Self-service access (Own profile, own attendance, own time-off, own payslips, face enrollment)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 5, `id` FROM `permissions`
WHERE `code` IN (
  'employees.read_own',
  'attendance.read_own',
  'attendance.create_own',
  'timeoff.read_own',
  'timeoff.create_own',
  'payslips.read_own',
  'payslips.pdf',
  'face.enroll',
  'face.verify'
);

-- ---------------------------------------------------------------------
-- 4. DEPARTMENTS
-- ---------------------------------------------------------------------
INSERT INTO `departments` (`id`, `name`, `code`) VALUES
(1, 'Engineering & Technology', 'ENG'),
(2, 'Human Resources', 'HR'),
(3, 'Finance & Payroll Operations', 'FIN'),
(4, 'Marketing & Growth', 'MKT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ---------------------------------------------------------------------
-- 5. WORKING SCHEDULES & DAYS (Auto-calculated weekly hours)
-- ---------------------------------------------------------------------
INSERT INTO `working_schedules` (`id`, `name`, `type`, `weekly_hours`, `is_active`) VALUES
(1, 'Standard Full-Time (40h/week)', 'STANDARD_40H', 40.00, TRUE),
(2, 'Operations Shift (48h/week)', 'SHIFT_BASED', 48.00, TRUE)
ON DUPLICATE KEY UPDATE `weekly_hours` = VALUES(`weekly_hours`);

DELETE FROM `working_schedule_days`;
-- Schedule 1: Mon-Fri 09:00 - 18:00 (60 min break = 8h/day * 5 = 40h)
INSERT INTO `working_schedule_days` (`schedule_id`, `day_of_week`, `start_time`, `end_time`, `break_minutes`, `work_hours`) VALUES
(1, 'MONDAY', '09:00:00', '18:00:00', 60, 8.00),
(1, 'TUESDAY', '09:00:00', '18:00:00', 60, 8.00),
(1, 'WEDNESDAY', '09:00:00', '18:00:00', 60, 8.00),
(1, 'THURSDAY', '09:00:00', '18:00:00', 60, 8.00),
(1, 'FRIDAY', '09:00:00', '18:00:00', 60, 8.00);

-- Schedule 2: Mon-Sat 09:00 - 18:00 (60 min break = 8h/day * 6 = 48h)
INSERT INTO `working_schedule_days` (`schedule_id`, `day_of_week`, `start_time`, `end_time`, `break_minutes`, `work_hours`) VALUES
(2, 'MONDAY', '09:00:00', '18:00:00', 60, 8.00),
(2, 'TUESDAY', '09:00:00', '18:00:00', 60, 8.00),
(2, 'WEDNESDAY', '09:00:00', '18:00:00', 60, 8.00),
(2, 'THURSDAY', '09:00:00', '18:00:00', 60, 8.00),
(2, 'FRIDAY', '09:00:00', '18:00:00', 60, 8.00),
(2, 'SATURDAY', '09:00:00', '18:00:00', 60, 8.00);

-- ---------------------------------------------------------------------
-- 6. SALARY RULES
-- ---------------------------------------------------------------------
INSERT INTO `salary_rules` (`id`, `name`, `code`, `category`, `sequence`, `computation_type`, `value`, `formula`, `status`) VALUES
(1, 'Basic Salary', 'BASIC', 'BASIC', 10, 'FIXED', 0.00, 'contract.wage * 0.50', 'ACTIVE'),
(2, 'House Rent Allowance (HRA)', 'HRA', 'ALLOWANCE', 20, 'PERCENTAGE', 50.00, 'BASIC * 0.50', 'ACTIVE'),
(3, 'Special Allowance', 'SA', 'ALLOWANCE', 30, 'FORMULA', 0.00, 'contract.wage - (BASIC + HRA)', 'ACTIVE'),
(4, 'Gross Earnings', 'GROSS', 'GROSS', 40, 'FORMULA', 0.00, 'BASIC + HRA + SA', 'ACTIVE'),
(5, 'Provident Fund (PF)', 'PF', 'DEDUCTION', 50, 'PERCENTAGE', 12.00, 'BASIC * 0.12', 'ACTIVE'),
(6, 'Professional Tax (PT)', 'PT', 'DEDUCTION', 60, 'FIXED', 200.00, '200', 'ACTIVE'),
(7, 'Tax Deducted at Source (TDS)', 'TDS', 'DEDUCTION', 70, 'PERCENTAGE', 10.00, 'GROSS * 0.10', 'ACTIVE'),
(8, 'Total Deductions', 'TOTAL_DED', 'DEDUCTION', 80, 'FORMULA', 0.00, 'PF + PT + TDS', 'ACTIVE'),
(9, 'Net Salary', 'NET', 'NET', 90, 'FORMULA', 0.00, 'GROSS - TOTAL_DED', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `formula` = VALUES(`formula`);

-- ---------------------------------------------------------------------
-- 7. SALARY STRUCTURES & STRUCTURE RULES
-- ---------------------------------------------------------------------
INSERT INTO `salary_structures` (`id`, `name`, `code`, `description`, `status`) VALUES
(1, 'Regular Full-Time Structure', 'REG_SAL_2026', 'Standard monthly salary structure with Basic, HRA, SA, PF, PT, and TDS calculations', 'ACTIVE'),
(2, 'Contractor Compensation Structure', 'CONTRACT_SAL_2026', 'Simple fixed compensation structure for consultants with TDS deduction', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

DELETE FROM `salary_structure_rules`;
INSERT INTO `salary_structure_rules` (`salary_structure_id`, `salary_rule_id`, `sequence`) VALUES
(1, 1, 10),
(1, 2, 20),
(1, 3, 30),
(1, 4, 40),
(1, 5, 50),
(1, 6, 60),
(1, 7, 70),
(1, 8, 80),
(1, 9, 90),
(2, 1, 10),
(2, 4, 40),
(2, 7, 70),
(2, 9, 90);

-- ---------------------------------------------------------------------
-- 8. TIME OFF TYPES
-- ---------------------------------------------------------------------
INSERT INTO `time_off_types` (`id`, `name`, `code`, `unit`, `requires_allocation`, `is_paid`, `max_days_per_year`) VALUES
(1, 'Paid Privilege Leave', 'PL', 'DAYS', TRUE, TRUE, 15),
(2, 'Casual Leave', 'CL', 'DAYS', TRUE, TRUE, 12),
(3, 'Sick Leave', 'SL', 'DAYS', TRUE, TRUE, 10),
(4, 'Unpaid Leave / LOP', 'UL', 'DAYS', FALSE, FALSE, 30)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ---------------------------------------------------------------------
-- 9. EMPLOYEES
-- ---------------------------------------------------------------------
INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `last_name`, `email`, `phone`, `job_position`, `department_id`, `manager_id`, `working_schedule_id`, `gender`, `date_of_birth`, `joining_date`, `status`, `profile_photo_url`) VALUES
(1, 'EMP-001', 'System', 'Administrator', 'admin@peoplepay360.com', '+91 98765 43210', 'Platform Administrator', 1, NULL, 1, 'MALE', '1990-05-15', '2024-01-01', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'),
(2, 'EMP-002', 'Marcus', 'Vance', 'payrolladmin@peoplepay360.com', '+91 98765 43211', 'Lead Payroll Administrator', 3, 1, 1, 'MALE', '1988-08-20', '2024-02-01', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'),
(3, 'EMP-003', 'Elena', 'Rostova', 'payrolluser@peoplepay360.com', '+91 98765 43212', 'Payroll Specialist', 3, 2, 1, 'FEMALE', '1994-03-12', '2024-03-01', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'),
(4, 'EMP-004', 'Sarah', 'Jenkins', 'hrmanager@peoplepay360.com', '+91 98765 43213', 'Head of Human Resources', 2, 1, 1, 'FEMALE', '1991-11-28', '2024-01-15', 'ACTIVE', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'),
(5, 'EMP-005', 'Dhruvil', 'Patel', 'employee@peoplepay360.com', '+91 98765 43214', 'Senior Software Engineer', 1, 1, 1, 'MALE', '1998-07-07', '2024-04-01', 'ACTIVE', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'),
(6, 'EMP-006', 'Priya', 'Sharma', 'priya.sharma@peoplepay360.com', '+91 98765 43215', 'Senior UI/UX Designer', 1, 1, 1, 'FEMALE', '1996-09-18', '2024-05-01', 'ACTIVE', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80')
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`);

-- Set Department Managers
UPDATE `departments` SET `manager_id` = 1 WHERE `id` = 1;
UPDATE `departments` SET `manager_id` = 4 WHERE `id` = 2;
UPDATE `departments` SET `manager_id` = 2 WHERE `id` = 3;

-- ---------------------------------------------------------------------
-- 10. EMPLOYEE BANK DETAILS (Protected & Maskable)
-- ---------------------------------------------------------------------
INSERT INTO `employee_bank_details` (`id`, `employee_id`, `account_holder_name`, `bank_name`, `account_number`, `ifsc_code`, `branch_name`, `account_type`, `is_primary`) VALUES
(1, 1, 'System Administrator', 'HDFC Bank', '50100456789012', 'HDFC0001234', 'Gandhinagar Main', 'SALARY', TRUE),
(2, 2, 'Marcus Vance', 'State Bank of India', '30200876543210', 'SBIN0005678', 'Infocity Branch', 'SALARY', TRUE),
(3, 3, 'Elena Rostova', 'ICICI Bank', '10980567123499', 'ICIC0009988', 'Corporate Park', 'SALARY', TRUE),
(4, 4, 'Sarah Jenkins', 'Axis Bank', '91201004561234', 'UTIB0002233', 'Sector 11 Branch', 'SALARY', TRUE),
(5, 5, 'Dhruvil Patel', 'HDFC Bank', '50100889911223', 'HDFC0001234', 'Gandhinagar Main', 'SALARY', TRUE),
(6, 6, 'Priya Sharma', 'Kotak Mahindra Bank', '60100554433221', 'KKBK0007788', 'GIFT City Branch', 'SALARY', TRUE)
ON DUPLICATE KEY UPDATE `bank_name` = VALUES(`bank_name`), `account_number` = VALUES(`account_number`);

-- ---------------------------------------------------------------------
-- 11. CONTRACTS (Active & Historical Period-Specific)
-- ---------------------------------------------------------------------
INSERT INTO `contracts` (`id`, `contract_code`, `employee_id`, `department_id`, `job_position`, `wage`, `salary_structure_id`, `working_schedule_id`, `start_date`, `end_date`, `status`) VALUES
(1, 'CON-EMP-001-2024', 1, 1, 'Platform Administrator', 150000.00, 1, 1, '2024-01-01', NULL, 'ACTIVE'),
(2, 'CON-EMP-002-2024', 2, 3, 'Lead Payroll Administrator', 120000.00, 1, 1, '2024-02-01', NULL, 'ACTIVE'),
(3, 'CON-EMP-003-2024', 3, 3, 'Payroll Specialist', 85000.00, 1, 1, '2024-03-01', NULL, 'ACTIVE'),
(4, 'CON-EMP-004-2024', 4, 2, 'Head of Human Resources', 110000.00, 1, 1, '2024-01-15', NULL, 'ACTIVE'),
(5, 'CON-EMP-005-2024', 5, 1, 'Senior Software Engineer', 95000.00, 1, 1, '2024-04-01', NULL, 'ACTIVE'),
(6, 'CON-EMP-006-2024', 6, 1, 'Senior UI/UX Designer', 90000.00, 1, 1, '2024-05-01', NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE `wage` = VALUES(`wage`), `status` = VALUES(`status`);

-- ---------------------------------------------------------------------
-- 12. TIME OFF ALLOCATIONS & REQUESTS
-- ---------------------------------------------------------------------
INSERT INTO `time_off_allocations` (`id`, `employee_id`, `time_off_type_id`, `year`, `allocated_days`, `taken_days`, `remaining_days`, `validity_start`, `validity_end`, `status`) VALUES
(1, 5, 1, 2026, 15.00, 2.00, 13.00, '2026-01-01', '2026-12-31', 'APPROVED'),
(2, 5, 2, 2026, 12.00, 1.00, 11.00, '2026-01-01', '2026-12-31', 'APPROVED'),
(3, 5, 3, 2026, 10.00, 0.00, 10.00, '2026-01-01', '2026-12-31', 'APPROVED'),
(4, 6, 1, 2026, 15.00, 0.00, 15.00, '2026-01-01', '2026-12-31', 'APPROVED'),
(5, 6, 2, 2026, 12.00, 2.00, 10.00, '2026-01-01', '2026-12-31', 'APPROVED')
ON DUPLICATE KEY UPDATE `allocated_days` = VALUES(`allocated_days`), `remaining_days` = VALUES(`remaining_days`);

INSERT INTO `time_off_requests` (`id`, `employee_id`, `time_off_type_id`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `approved_by`, `approved_at`) VALUES
(1, 5, 1, '2026-08-10', '2026-08-11', 2.00, 'Family function in home town', 'APPROVED', 4, '2026-08-08 11:30:00'),
(2, 5, 2, '2026-08-25', '2026-08-25', 1.00, 'Personal work', 'APPROVED', 4, '2026-08-24 16:45:00'),
(3, 6, 2, '2026-09-10', '2026-09-11', 2.00, 'Medical appointment and recovery', 'PENDING', NULL, NULL)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- ---------------------------------------------------------------------
-- 13. ATTENDANCE & BIOMETRIC RECORDS
-- ---------------------------------------------------------------------
INSERT INTO `face_enrollments` (`id`, `employee_id`, `enrollment_status`, `biometric_template_hash`, `liveness_score`, `enrolled_at`) VALUES
(1, 5, 'ACTIVE', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 0.985, '2026-08-01 09:15:00'),
(2, 6, 'ACTIVE', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 0.991, '2026-08-02 10:00:00')
ON DUPLICATE KEY UPDATE `enrollment_status` = VALUES(`enrollment_status`);

INSERT INTO `attendance` (`id`, `employee_id`, `date`, `check_in`, `check_out`, `worked_hours`, `expected_hours`, `overtime_hours`, `status`, `verification_method`) VALUES
(1, 5, '2026-09-01', '2026-09-01 08:55:00', '2026-09-01 18:05:00', 8.16, 8.00, 0.16, 'PRESENT', 'FACE'),
(2, 5, '2026-09-02', '2026-09-02 09:15:00', '2026-09-02 18:15:00', 8.00, 8.00, 0.00, 'LATE', 'FACE'),
(3, 5, '2026-09-03', '2026-09-03 08:50:00', '2026-09-03 18:00:00', 8.16, 8.00, 0.16, 'PRESENT', 'FACE'),
(4, 5, '2026-09-04', '2026-09-04 09:00:00', '2026-09-04 18:00:00', 8.00, 8.00, 0.00, 'PRESENT', 'FACE'),
(5, 6, '2026-09-01', '2026-09-01 09:05:00', '2026-09-01 18:00:00', 7.91, 8.00, 0.00, 'PRESENT', 'FACE'),
(6, 6, '2026-09-02', '2026-09-02 09:00:00', '2026-09-02 18:00:00', 8.00, 8.00, 0.00, 'PRESENT', 'FACE'),
(7, 6, '2026-09-03', '2026-09-03 08:45:00', '2026-09-03 18:30:00', 8.75, 8.00, 0.75, 'PRESENT', 'FACE')
ON DUPLICATE KEY UPDATE `worked_hours` = VALUES(`worked_hours`), `status` = VALUES(`status`);

-- ---------------------------------------------------------------------
-- 14. SAMPLE PAYRUN & PAYSLIPS (For live Dashboard data)
-- ---------------------------------------------------------------------
INSERT INTO `payruns` (`id`, `run_code`, `name`, `salary_structure_id`, `period_start`, `period_end`, `status`, `total_gross`, `total_deductions`, `total_net`, `employee_count`, `created_by`, `validated_by`, `paid_at`) VALUES
(1, 'PAYRUN-2026-08', 'August 2026 General Payroll', 1, '2026-08-01', '2026-08-31', 'PAID', 650000.00, 147200.00, 502800.00, 6, 2, 2, '2026-08-31 17:00:00')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `total_net` = VALUES(`total_net`);

INSERT INTO `payslips` (`id`, `payslip_code`, `payrun_id`, `employee_id`, `contract_id`, `salary_structure_id`, `period_start`, `period_end`, `worked_days`, `total_working_days`, `gross_amount`, `deduction_amount`, `net_amount`, `payment_status`) VALUES
(1, 'PS-202608-001', 1, 1, 1, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 150000.00, 34200.00, 115800.00, 'PAID'),
(2, 'PS-202608-002', 1, 2, 2, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 120000.00, 27400.00, 92600.00, 'PAID'),
(3, 'PS-202608-003', 1, 3, 3, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 85000.00, 19400.00, 65600.00, 'PAID'),
(4, 'PS-202608-004', 1, 4, 4, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 110000.00, 25100.00, 84900.00, 'PAID'),
(5, 'PS-202608-005', 1, 5, 5, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 95000.00, 21700.00, 73300.00, 'PAID'),
(6, 'PS-202608-006', 1, 6, 6, 1, '2026-08-01', '2026-08-31', 30.00, 30.00, 90000.00, 19400.00, 70600.00, 'PAID')
ON DUPLICATE KEY UPDATE `payment_status` = VALUES(`payment_status`), `net_amount` = VALUES(`net_amount`);

-- Payslip Lines for Employee 5 (Dhruvil Patel: ₹95,000 wage)
DELETE FROM `payslip_lines` WHERE `payslip_id` = 5;
INSERT INTO `payslip_lines` (`payslip_id`, `salary_rule_id`, `code`, `category`, `name`, `sequence`, `amount`) VALUES
(5, 1, 'BASIC', 'BASIC', 'Basic Salary', 10, 47500.00),
(5, 2, 'HRA', 'ALLOWANCE', 'House Rent Allowance (HRA)', 20, 23750.00),
(5, 3, 'SA', 'ALLOWANCE', 'Special Allowance', 30, 23750.00),
(5, 4, 'GROSS', 'GROSS', 'Gross Earnings', 40, 95000.00),
(5, 5, 'PF', 'DEDUCTION', 'Provident Fund (PF)', 50, 5700.00),
(5, 6, 'PT', 'DEDUCTION', 'Professional Tax (PT)', 60, 200.00),
(5, 7, 'TDS', 'DEDUCTION', 'Tax Deducted at Source (TDS)', 70, 9500.00),
(5, 8, 'TOTAL_DED', 'DEDUCTION', 'Total Deductions', 80, 21700.00),
(5, 9, 'NET', 'NET', 'Net Salary', 90, 73300.00);

SET FOREIGN_KEY_CHECKS = 1;
