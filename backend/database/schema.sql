-- =====================================================================
-- PEOPLEPAY360 HR & PAYROLL PLATFORM - COMPLETE NORMALIZED MYSQL SCHEMA (3NF)
-- Compatible with MySQL 8.0+ / InnoDB / utf8mb4
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `peoplepay360` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `peoplepay360`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to ensure clean schema creation
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `email_verification_tokens`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `payslip_lines`;
DROP TABLE IF EXISTS `payslips`;
DROP TABLE IF EXISTS `payruns`;
DROP TABLE IF EXISTS `time_off_requests`;
DROP TABLE IF EXISTS `time_off_allocations`;
DROP TABLE IF EXISTS `time_off_types`;
DROP TABLE IF EXISTS `face_verification_logs`;
DROP TABLE IF EXISTS `face_enrollments`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `contracts`;
DROP TABLE IF EXISTS `employee_bank_details`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `salary_structure_rules`;
DROP TABLE IF EXISTS `salary_rules`;
DROP TABLE IF EXISTS `salary_structures`;
DROP TABLE IF EXISTS `working_schedule_days`;
DROP TABLE IF EXISTS `working_schedules`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;

-- ---------------------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------------------
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. PERMISSIONS
-- ---------------------------------------------------------------------
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `module` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_permissions_code` (`code`),
  INDEX `idx_permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. ROLE_PERMISSIONS (M:N Normalized)
-- ---------------------------------------------------------------------
CREATE TABLE `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. DEPARTMENTS
-- ---------------------------------------------------------------------
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `manager_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_departments_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. WORKING SCHEDULES
-- ---------------------------------------------------------------------
CREATE TABLE `working_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('STANDARD_40H', 'FLEXIBLE', 'SHIFT_BASED', 'PART_TIME') DEFAULT 'STANDARD_40H',
  `weekly_hours` DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. WORKING SCHEDULE DAYS (Daily time patterns)
-- ---------------------------------------------------------------------
CREATE TABLE `working_schedule_days` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `day_of_week` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `break_minutes` INT NOT NULL DEFAULT 60,
  `work_hours` DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`schedule_id`) REFERENCES `working_schedules`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_schedule_day` (`schedule_id`, `day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. SALARY STRUCTURES
-- ---------------------------------------------------------------------
CREATE TABLE `salary_structures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. SALARY RULES
-- ---------------------------------------------------------------------
CREATE TABLE `salary_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `category` ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET') NOT NULL,
  `sequence` INT NOT NULL DEFAULT 10,
  `computation_type` ENUM('FIXED', 'PERCENTAGE', 'FORMULA') NOT NULL DEFAULT 'FIXED',
  `value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `formula` VARCHAR(500) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_salary_rules_category` (`category`),
  INDEX `idx_salary_rules_sequence` (`sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. SALARY STRUCTURE RULES (Ordered Rules per Structure)
-- ---------------------------------------------------------------------
CREATE TABLE `salary_structure_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salary_structure_id` INT NOT NULL,
  `salary_rule_id` INT NOT NULL,
  `sequence` INT NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`salary_rule_id`) REFERENCES `salary_rules`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_structure_rule` (`salary_structure_id`, `salary_rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. EMPLOYEES (Central HR Hub)
-- ---------------------------------------------------------------------
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `job_position` VARCHAR(100) NULL,
  `department_id` INT NULL,
  `manager_id` INT NULL,
  `working_schedule_id` INT NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `date_of_birth` DATE NULL,
  `joining_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `status` ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED') DEFAULT 'ACTIVE',
  `profile_photo_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`working_schedule_id`) REFERENCES `working_schedules`(`id`) ON DELETE SET NULL,
  INDEX `idx_employees_code` (`employee_code`),
  INDEX `idx_employees_email` (`email`),
  INDEX `idx_employees_dept` (`department_id`),
  INDEX `idx_employees_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK for department manager after employees table is created
ALTER TABLE `departments` ADD CONSTRAINT `fk_dept_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 11. EMPLOYEE BANK DETAILS (Masked & Protected)
-- ---------------------------------------------------------------------
CREATE TABLE `employee_bank_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL UNIQUE,
  `account_holder_name` VARCHAR(100) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50) NOT NULL,
  `ifsc_code` VARCHAR(20) NOT NULL,
  `branch_name` VARCHAR(100) NULL,
  `account_type` ENUM('SAVINGS', 'CURRENT', 'SALARY') DEFAULT 'SALARY',
  `is_primary` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. CONTRACTS (Historical & Period-specific)
-- ---------------------------------------------------------------------
CREATE TABLE `contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contract_code` VARCHAR(50) NOT NULL UNIQUE,
  `employee_id` INT NOT NULL,
  `department_id` INT NULL,
  `job_position` VARCHAR(100) NULL,
  `wage` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `salary_structure_id` INT NOT NULL,
  `working_schedule_id` INT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `status` ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED') DEFAULT 'DRAFT',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures`(`id`),
  FOREIGN KEY (`working_schedule_id`) REFERENCES `working_schedules`(`id`) ON DELETE SET NULL,
  INDEX `idx_contracts_emp_dates` (`employee_id`, `start_date`, `end_date`),
  INDEX `idx_contracts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. USERS (Authentication & Access)
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `employee_id` INT NULL UNIQUE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `must_change_password` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role_id`),
  INDEX `idx_users_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. ATTENDANCE (Check-in, Check-out, Worked Hours, Exceptions)
-- ---------------------------------------------------------------------
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `check_in` DATETIME NOT NULL,
  `check_out` DATETIME NULL,
  `worked_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `expected_hours` DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  `overtime_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE') DEFAULT 'PRESENT',
  `is_manual_correction` BOOLEAN NOT NULL DEFAULT FALSE,
  `corrected_by` INT NULL,
  `correction_reason` VARCHAR(255) NULL,
  `verification_method` ENUM('FACE', 'MANUAL', 'KIOSK', 'PORTAL') DEFAULT 'PORTAL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`corrected_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_attendance_emp_date` (`employee_id`, `date`),
  INDEX `idx_attendance_date` (`date`),
  INDEX `idx_attendance_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. FACE ENROLLMENTS (Biometric Templates & Liveness)
-- ---------------------------------------------------------------------
CREATE TABLE `face_enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL UNIQUE,
  `enrollment_status` ENUM('PENDING', 'PROCESSING', 'ACTIVE', 'FAILED', 'REVOKED') DEFAULT 'PENDING',
  `biometric_template_hash` VARCHAR(255) NOT NULL,
  `liveness_score` DECIMAL(4,3) NULL,
  `enrolled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. FACE VERIFICATION LOGS (Audit & Security)
-- ---------------------------------------------------------------------
CREATE TABLE `face_verification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `attendance_id` INT NULL,
  `verification_type` ENUM('CHECK_IN', 'CHECK_OUT', 'KIOSK') NOT NULL,
  `status` ENUM('SUCCESS', 'FAILED', 'REJECTED') NOT NULL,
  `liveness_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `similarity_score` DECIMAL(5,4) NULL,
  `failure_reason` VARCHAR(255) NULL,
  `device_info` VARCHAR(255) NULL,
  `verified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`attendance_id`) REFERENCES `attendance`(`id`) ON DELETE SET NULL,
  INDEX `idx_face_logs_emp` (`employee_id`),
  INDEX `idx_face_logs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. TIME OFF TYPES
-- ---------------------------------------------------------------------
CREATE TABLE `time_off_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `unit` ENUM('DAYS', 'HOURS') DEFAULT 'DAYS',
  `requires_allocation` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_paid` BOOLEAN NOT NULL DEFAULT TRUE,
  `max_days_per_year` INT NOT NULL DEFAULT 12,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 18. TIME OFF ALLOCATIONS (Employee Balance tracking)
-- ---------------------------------------------------------------------
CREATE TABLE `time_off_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `time_off_type_id` INT NOT NULL,
  `year` INT NOT NULL DEFAULT (YEAR(CURRENT_DATE)),
  `allocated_days` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `taken_days` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `remaining_days` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `validity_start` DATE NOT NULL,
  `validity_end` DATE NOT NULL,
  `status` ENUM('DRAFT', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`time_off_type_id`) REFERENCES `time_off_types`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_emp_timeoff_year` (`employee_id`, `time_off_type_id`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 19. TIME OFF REQUESTS (Workflow: Pending -> Approved / Refused)
-- ---------------------------------------------------------------------
CREATE TABLE `time_off_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `time_off_type_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `reason` VARCHAR(255) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REFUSED', 'CANCELLED') DEFAULT 'PENDING',
  `approved_by` INT NULL,
  `approved_at` DATETIME NULL,
  `rejection_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`time_off_type_id`) REFERENCES `time_off_types`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_timeoff_emp_dates` (`employee_id`, `start_date`, `end_date`),
  INDEX `idx_timeoff_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 20. PAYRUNS (Payroll Batches & Processing)
-- ---------------------------------------------------------------------
CREATE TABLE `payruns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `run_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `salary_structure_id` INT NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `status` ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID') DEFAULT 'DRAFT',
  `total_gross` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_deductions` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_net` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `employee_count` INT NOT NULL DEFAULT 0,
  `created_by` INT NULL,
  `validated_by` INT NULL,
  `paid_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_payruns_period` (`period_start`, `period_end`),
  INDEX `idx_payruns_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 21. PAYSLIPS (Individual Calculated Records)
-- ---------------------------------------------------------------------
CREATE TABLE `payslips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payslip_code` VARCHAR(50) NOT NULL UNIQUE,
  `payrun_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `contract_id` INT NOT NULL,
  `salary_structure_id` INT NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `worked_days` DECIMAL(4,2) NOT NULL DEFAULT 30.00,
  `total_working_days` DECIMAL(4,2) NOT NULL DEFAULT 30.00,
  `gross_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `deduction_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID',
  `email_sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`payrun_id`) REFERENCES `payruns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`),
  FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures`(`id`),
  UNIQUE KEY `uk_payrun_emp` (`payrun_id`, `employee_id`),
  INDEX `idx_payslips_emp` (`employee_id`),
  INDEX `idx_payslips_period` (`period_start`, `period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 22. PAYSLIP LINES (Computed Rule Breakdowns)
-- ---------------------------------------------------------------------
CREATE TABLE `payslip_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payslip_id` INT NOT NULL,
  `salary_rule_id` INT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `category` ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `sequence` INT NOT NULL DEFAULT 10,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`payslip_id`) REFERENCES `payslips`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`salary_rule_id`) REFERENCES `salary_rules`(`id`),
  INDEX `idx_payslip_lines_slip` (`payslip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 23. REFRESH TOKENS (Secure Dual JWT Strategy)
-- ---------------------------------------------------------------------
CREATE TABLE `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_refresh_tokens_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 24. PASSWORD RESET TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_pwd_tokens_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 25. EMAIL VERIFICATION & ACTIVATION TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE `email_verification_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_email_tokens_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 26. AUDIT LOGS (Compliance & Security Action Tracking)
-- ---------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(50) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `record_id` VARCHAR(50) NULL,
  `description` VARCHAR(255) NULL,
  `ip_address` VARCHAR(50) NULL,
  `user_agent` VARCHAR(255) NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_module` (`module`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 27. NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ALERT') DEFAULT 'INFO',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `link` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notifications_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
