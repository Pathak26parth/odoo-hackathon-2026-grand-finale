# PeoplePay360: HR & Payroll Platform — Backend

> Enterprise-grade, clean, and normalized HR & Payroll REST API built with Node.js, Express.js, and local MySQL (`mysql2` parameterized queries, strictly NO ORM).

---

## 1. System Architecture & Tech Stack

- **Runtime & Framework**: Node.js (`v22+`), Express.js (`v4.21+`)
- **Database**: Local MySQL 8.0+ (`InnoDB`, `utf8mb4_unicode_ci`)
- **Database Driver**: `mysql2/promise` with Connection Pooling & Transactions
- **Security & RBAC**:
  - Bcrypt password hashing (`12` salt rounds)
  - Dual JWT Strategy (15-minute Access Token + 7-day Refresh Token hashed with SHA-256 in MySQL)
  - Server-side Database-driven Role-Based Access Control (RBAC) & Permission-Based Access Control (PBAC)
  - Helmet security headers, CORS origin restrictions, and Rate Limiting on authentication endpoints
- **Biometric Face Attendance**: 1:1 Identity Verification and Active Liveness Protection abstraction with full verification audit logging
- **Email Delivery**: Nodemailer with automated payslip PDF attachments and employee onboarding invitations (with simulated dev mode logger)
- **Document Rendering**: PDFKit on-the-fly payslip PDF generation

---

## 2. Directory Structure

```
backend/
├── database/
│   ├── schema.sql                   # Normalized 3NF DDL for all 27 tables
│   └── seed.sql                     # Rich initial datasets with interconnected business flows
├── src/
│   ├── config/
│   │   ├── db.js                    # MySQL connection pool, parameterized query & transaction helpers
│   │   └── env.js                   # Centralized environment variable loader
│   ├── constants/
│   │   ├── roles.js                 # 5 Stable system roles
│   │   ├── permissions.js           # Granular MODULE.ACTION permission codes
│   │   └── statuses.js              # Lifecycle statuses (Employee, Contract, Payrun, Payslip, Face, Leaves)
│   ├── controllers/
│   │   ├── authController.js        # Login, refresh, logout, me, changePassword, activateAccount, resetPassword
│   │   ├── userController.js        # Admin user accounts CRUD, role assignments, permissions management
│   │   ├── employeeController.js    # Master employee CRUD, bank details, smart button sub-resources
│   │   ├── attendanceController.js  # Portal punches, 1:1 face verification punches, manual corrections with audit
│   │   ├── timeOffController.js     # Leave types, allocations, requests, approve/refuse workflows
│   │   ├── contractController.js    # Historical & active period contracts management
│   │   ├── scheduleController.js    # Working schedules and auto weekly hours computation
│   │   ├── salaryStructureController.js # Salary structures & rule sequencing
│   │   ├── salaryRuleController.js  # Salary computation rules (Basic, HRA, SA, PF, PT, TDS, Gross, Net)
│   │   ├── payrunController.js      # 2-step payrun wizard, scope validation, batch computation, lock & pay
│   │   ├── payslipController.js     # Individual payslips, rule breakdowns, dynamic PDF, email delivery
│   │   ├── dashboardController.js   # Real-time calculated KPI metrics, attendance health, department charts
│   │   ├── payrollAdminController.js # Command center overview, pre-flight audits, simulator, bulk actions
│   │   └── notificationController.js # In-app notification center, unread badges, mark as read, delete
│   ├── middleware/
│   │   ├── authMiddleware.js        # requireAuth: validates JWT access token & attaches req.user
│   │   ├── permissionMiddleware.js  # requirePermission, requireRole, requireSelfOrAdmin
│   │   ├── validationMiddleware.js  # Request validation helpers
│   │   ├── rateLimitMiddleware.js   # Rate limiting against brute-force attacks
│   │   └── errorMiddleware.js       # Centralized 404 and 500 error handlers
│   ├── services/
│   │   ├── authService.js           # Employee onboarding, invitations, token-based activations
│   │   ├── emailService.js          # Nodemailer transactional email delivery
│   │   ├── attendanceService.js     # Schedule matching, late detection, worked/overtime hours calculation
│   │   ├── timeOffService.js        # Balance validation and atomic deduction on approval
│   │   ├── payrollService.js        # Period contract resolution, sequential rule engine, payrun computation
│   │   ├── payrollAdminService.js   # Pipeline metrics, dynamic wage simulation, pre-flight audits
│   │   └── faceVerificationService.js # 1:1 biometrics & liveness verification engine
│   ├── utils/
│   │   ├── jwt.js                   # JWT sign/verify with SHA-256 token hashing
│   │   ├── password.js              # Bcrypt hashing & complexity validation
│   │   ├── response.js              # Standardized JSON response envelopes & bank masking
│   │   ├── generateToken.js         # Cryptographic random token generation
│   │   └── pdf.js                   # PDFKit payslip PDF generation
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── userRoutes.js            # /api/users/*, /api/roles, /api/permissions
│   │   ├── employeeRoutes.js        # /api/employees/*
│   │   ├── attendanceRoutes.js      # /api/attendance/*
│   │   ├── timeOffRoutes.js         # /api/time-off/*
│   │   ├── contractRoutes.js        # /api/contracts/*
│   │   ├── scheduleRoutes.js        # /api/schedules/*
│   │   ├── salaryStructureRoutes.js # /api/salary-structures/*
│   │   ├── salaryRuleRoutes.js      # /api/salary-rules/*
│   │   ├── payrunRoutes.js          # /api/payruns/*
│   │   ├── payslipRoutes.js         # /api/payslips/*
│   │   ├── dashboardRoutes.js       # /api/dashboard
│   │   ├── payrollAdminRoutes.js    # /api/payroll-admin/* (Overview, simulator, compliance, bulk actions)
│   │   ├── notificationRoutes.js    # /api/notifications/* (User notification feed, read, delete)
│   │   └── index.js                 # Root router aggregator & /api/health
│   ├── app.js                       # Express app configuration (CORS, Helmet, RateLimiter, CookieParser)
│   └── server.js                    # Server startup & DB connection listener
├── test/
│   └── auth.test.js                 # Complete automated test suite (31 automated integration tests)
├── .env.example
├── .env
├── package.json
└── API_ENDPOINTS.md                 # Complete REST API reference documentation
```

---

## 3. Database Schema (Normalized 3NF)

The database consists of **27 interconnected normalized tables**:

1. `roles` — System role identifiers (`ADMIN`, `HR_PAYROLL_ADMIN`, `HR_PAYROLL_USER`, `HR_MANAGER`, `EMPLOYEE`).
2. `permissions` — Fine-grained system action codes in `MODULE.ACTION` format.
3. `role_permissions` — Normalized M:N mapping.
4. `departments` — Organization business units.
5. `working_schedules` — Working schedules (e.g. 40h Standard).
6. `working_schedule_days` — Daily time patterns with start/end/break times and calculated work hours.
7. `salary_structures` — Container collections for salary rules (e.g. Regular Salary Structure).
8. `salary_rules` — Computation rules categorized into `BASIC`, `ALLOWANCE`, `GROSS`, `DEDUCTION`, `NET`.
9. `salary_structure_rules` — Ordered execution sequence of rules inside a structure.
10. `employees` — Central HR master hub records.
11. `employee_bank_details` — Bank account data (masked in public responses).
12. `contracts` — Historical and active period-specific employment contracts.
13. `attendance` — Check-in, check-out, worked hours, schedule expectation matching, and manual corrections.
14. `face_enrollments` — Biometric template hashes and liveness scores.
15. `face_verification_logs` — Biometric verification attempts audit log.
16. `time_off_types` — Leave policies and allocation requirements.
17. `time_off_allocations` — Employee annual leave balance allocations (allocated, taken, remaining).
18. `time_off_requests` — Leave requests and manager approval workflows.
19. `payruns` — Payroll processing batches with lifecycle transitions (`DRAFT` → `COMPUTED` → `VALIDATED` → `PAID`).
20. `payslips` — Computed employee payslips with worked days proration.
21. `payslip_lines` — Individual computed salary rule amounts per payslip.
22. `users` — Authentication credentials, role mapping, and employee binding.
23. `refresh_tokens` — Hashed JWT refresh tokens with expiration and revocation.
24. `password_reset_tokens` — Hashed single-use password reset tokens.
25. `email_verification_tokens` — Single-use account activation tokens.
26. `audit_logs` — Compliance and security audit trail for all critical operations.
27. `notifications` — In-app notification messages for employees.

---

## 4. Role & Permission Authorization Matrix

| Functional Area | Admin | HR Payroll Admin | HR Payroll User | HR Manager | Employee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Users & Roles** | Full CRUD | ❌ No | ❌ No | ❌ No | ❌ No |
| **Employee Master** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Read Own (`/me`) |
| **Attendance Tracking** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Punch / Read Own |
| **Manual Attendance Correction** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Time Off Requests** | Full CRUD | Full CRUD | Full CRUD | Approve / Refuse | Submit / Read Own |
| **Contracts** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | ❌ No |
| **Working Schedules** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | ❌ No |
| **Salary Structures & Rules** | Full CRUD | Full CRUD | Read Only | ❌ No | ❌ No |
| **Payrun Management** | Full CRUD | Full CRUD / Pay | Create / Update | ❌ No | ❌ No |
| **Payslips & PDF** | Full CRUD | Full CRUD / Send | Create / Update / Send | ❌ No | View Own Payslip |
| **Biometric Face Attendance** | Manage | Manage | Manage | Manage | Self-Enroll / Verify |
| **Dashboard Analytics** | Full Access | Full Access | Full Access | HR View | ❌ No |

---

## 5. Seed Demo Accounts

| Role | Email | Default Password | Linked Employee Code |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@peoplepay360.com` | `Admin@123` | `EMP-001` (System Administrator) |
| **HR Payroll Admin** | `payrolladmin@peoplepay360.com` | `Password@123` | `EMP-002` (Marcus Vance) |
| **HR Payroll User** | `payrolluser@peoplepay360.com` | `Password@123` | `EMP-003` (Elena Rostova) |
| **HR Manager** | `hrmanager@peoplepay360.com` | `Password@123` | `EMP-004` (Sarah Jenkins) |
| **Employee** | `employee@peoplepay360.com` | `Password@123` | `EMP-005` (Dhruvil Patel) |

---

## 6. Installation & Quickstart

### Prerequisites
- Node.js (v18+ or v22+)
- MySQL Server 8.0+ running on `127.0.0.1:3306`

### Setup Steps
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Initialize & seed MySQL database
npm run db:init

# 4. Start development server with hot-reload
npm run dev
```

### Running Automated Test Suite
```bash
npm run test:auth
```
*Executes all 31 end-to-end test scenarios across all 5 user roles, RBAC boundaries, employee ownership isolation, leave approvals, payroll computations, and PDF generation.*

---

## 7. Business Logic Highlights

1. **Period-Specific Contract Resolution**:
   During payroll calculation, the system does not simply take the latest contract. It resolves the exact active contract valid for the specific payroll period (`start_date <= periodEnd AND (end_date IS NULL OR end_date >= periodStart)`).
2. **Sequential Salary Rule Engine**:
   Salary components are computed dynamically using ordered rules (`BASIC` → `HRA` → `SA` → `GROSS` → `PF` → `PT` → `TDS` → `TOTAL_DED` → `NET`).
3. **Payrun Setup Wizard (2-Step Flow)**:
   - *Step 1*: Defines scope (Salary Structure & Period).
   - *Step 2*: Validates eligible employees, highlighting warnings (missing bank details, duplicate payslips) before final batch creation.
4. **Biometric Face Attendance**:
   Provides 1:1 identity verification and active liveness checking, recording timestamped punches into `attendance` and detailed logs into `face_verification_logs`.
5. **Atomic Time Off Approval**:
   Approving a leave request automatically and atomically decrements the employee's `remaining_days` and increments `taken_days` inside a database transaction.
