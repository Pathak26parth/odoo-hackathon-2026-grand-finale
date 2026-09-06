# 🚀 PeoplePay360: Enterprise HR & Payroll Platform

<div align="center">

![PeoplePay360 Banner](https://img.shields.io/badge/Platform-PeoplePay360-blue?style=for-the-badge&logo=shield)
![Odoo Hackathon](https://img.shields.io/badge/Odoo_Hackathon_2026-Grand_Finale-purple?style=for-the-badge&logo=odoo)
![License](https://img.shields.io/badge/License-Proprietary-emerald?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)

**An Integrated Human Resource, Biometric AI Face Attendance, and Dynamic Payroll Operations Platform**

*Crafted for the Odoo Hackathon 2026 Grand Finale*

---

### 🌐 System Capabilities At A Glance
[Architecture](#-system-architecture) •
[Quick Start](#-quick-start-guide) •
[Default Credentials](#-enterprise-role-based-access-control-rbac) •
[Features & Modules](#-core-feature-modules) •
[Salary Calculation Engine](#-salary-rules--computation-engine) •
[Database Schema](#-database-architecture-27-tables) •
[REST API Reference](#-rest-api-summary) •
[Testing Suite](#-automated-testing--verification)

</div>

---

## 🌟 Executive Summary

**PeoplePay360** is a modern, enterprise-grade Human Resource Management and Payroll Computation Platform engineered from first principles. Built to resolve the complexities of modern workforce management, PeoplePay360 bridges biometric attendance logging, flexible contract lifecycle tracking, statutory tax compliance, dynamic salary rules sequencing, and batch payrun disbursements into a unified, high-performance web platform.

### Key Innovations & Highlights
- **100% Dynamic Engine**: Zero mock, hardcoded, or synthetic business data. Every metric, chart, dropdown, and payrun batch is calculated live from MySQL aggregations.
- **Pure SQL Architecture**: Powered exclusively by raw, parameterized MySQL queries (`mysql2/promise`) with strict transaction isolation and zero ORM overhead for maximum execution speed and auditing clarity.
- **AI Face Biometric Verification**: Integrated dual-resilience face check-in powered by MediaPipe and ArcFace 512-dimensional vector cosine similarity with anti-spoofing protection.
- **Ordered Salary Rules Engine**: Fully sequential computational DAG evaluating allowances, deductions, gross liabilities, and take-home pay with tokenized formula evaluation and proration.
- **Pre-Flight Payroll Compliance Audits**: Automated detection of blocking errors (missing active contracts, unverified bank accounts/IFSC, duplicate payrun attempts) before batch disbursement.
- **One-Click Itemized PDF & Email Delivery**: Server-side branded PDF payslip generation and automated dispatch to employee mailboxes via Nodemailer.
- **Live In-App Notification Center**: Full database-backed notification system with unread count badges, popover drawers, and mark-as-read workflows.

---

## 📐 System Architecture

PeoplePay360 follows an asynchronous, decoupled three-tier micro-modular architecture:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                 React 18 SPA Frontend                  │
                                  │      Vite + Tailwind CSS + Lucide + HTML5 Camera       │
                                  │                (http://localhost:5173)                 │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │ REST (JSON / Bearer JWT)
                                                              ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │               Node.js / Express Backend                │
                                  │  Pure Raw SQL (mysql2/promise) • Zero ORM Architecture │
                                  │  JWT Auth • RBAC • PDFKit Engine • Nodemailer Delivery │
                                  │                (http://localhost:5000)                 │
                                  └─────────────┬────────────────────────────┬─────────────┘
                                                │                            │
                     Parameterized SQL Queries  │                            │ Biometric Verification
                     & ACID Transactions        ▼                            ▼ (Cosine Similarity REST)
                   ┌─────────────────────────────────────────┐   ┌───────────────────────────────────┐
                   │             MySQL 8.x Database          │   │ Python Biometrics Microservice    │
                   │      27 Normalized Relational Tables    │   │ InsightFace / ArcFace / MediaPipe │
                   │         `peoplepay360` Database         │   │      (http://localhost:8000)      │
                   └─────────────────────────────────────────┘   └───────────────────────────────────┘
```

### Architectural Tenets
1. **Zero ORM Policy**: Eliminates hidden queries, memory leaks, and N+1 query overhead. All operations execute via finely tuned raw SQL queries and atomic transactions.
2. **Dual Biometric Resilience**: If the Python biometric server is offline, the backend gracefully falls back to database-level template vector matching without disrupting employee attendance.
3. **Stateless JWT Security**: Short-lived 15-minute access tokens paired with rotating 7-day refresh tokens, validated by cryptographic signatures and DB revocation checks.

---

## 🔑 Enterprise Role-Based Access Control (RBAC)

The system comes pre-seeded with 5 granular roles and authoritative credentials:

| Role Name | Email Address | Password | Permissions & System Scope |
|---|---|---|---|
| **System Administrator** | `admin@peoplepay360.com` | `Admin@123` | Full enterprise control: User administration, role delegation, security audit trails, database health, all operational modules. |
| **HR Manager** | `hr.manager@peoplepay360.com` | `HrManager@123` | Workforce management: Employee onboarding, employment contracts, working schedule rosters, leave approvals, attendance auditing. |
| **HR Payroll Admin** | `payroll.admin@peoplepay360.com` | `PayrollAdmin@123` | Compensation control: Salary structure definition, salary rules formula engine, payrun batch lifecycle, disbursement approvals, simulator. |
| **HR Payroll User** | `payroll.user@peoplepay360.com` | `PayrollUser@123` | Execution officer: Payrun computation wizard, draft inspection, itemized payslip review. (Locked from modifying salary rules/structures). |
| **Employee (Self-Service)** | `alex.rivera@peoplepay360.com` | `Employee@123` | Self-service portal: Personal profile, biometric face check-in/out, time-off requests, personal leave balances, PDF payslip downloads. |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL Server**: 8.0 or higher (running on `localhost:3306`)
- **Python** (Optional for AI Microservice): v3.10+

---

### Step 1: Database Initialization
1. Ensure your MySQL server is running locally on port `3306`.
2. Open terminal and run the automated database setup script:

```bash
cd backend
npm install
npm run db:init
```

> **Note**: `npm run db:init` executes `src/database/initDb.js`, which provisions the `peoplepay360` database, creates all 27 tables with relational foreign keys, and seeds users, roles, departments, employees, contracts, schedules, salary rules, and payruns.

---

### Step 2: Configure Environment Variables

#### Backend Configuration (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=peoplepay360
DB_CONNECTION_LIMIT=20

# Authentication & Cryptography
JWT_ACCESS_SECRET=peoplepay360_super_secret_access_jwt_key_2026
JWT_REFRESH_SECRET=peoplepay360_super_secret_refresh_jwt_key_2026
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Face AI Biometrics
FACE_AI_SERVICE_URL=http://localhost:8000
FACE_SIMILARITY_THRESHOLD=0.60

# Email Delivery (SMTP / Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=PeoplePay360 <noreply@peoplepay360.com>
```

#### Frontend Configuration (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 3: Start the Backend Server
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000` with active database connection.*

---

### Step 4: Start the Python Face AI Service *(Optional / Dual Resilience)*
```bash
cd AI
pip install -r requirements.txt
python server.py
```
*AI Biometrics microservice runs on `http://localhost:8000`.*

---

### Step 5: Start the React Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend application launches on `http://localhost:5173`.*

---

## 📦 Core Feature Modules

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                 PEOPLEPAY360 PLATFORM                   │
                                  └────────────────────────────┬────────────────────────────┘
         ┌───────────────────┬───────────────────┼────────────────────┬────────────────────┐
         ▼                   ▼                   ▼                    ▼                    ▼
   Workforce & HR    Face Biometrics      Payroll Command      Payrun Wizard       Notification
     Lifecycle          Attendance             Center          & PDF Payslips         Center
   • Onboarding       • Webcam AI         • Rule Simulator     • 4-Step Batch      • Live DB alerts
   • Contracts        • 512-D Vectors     • Pre-Flight Audit   • Email Dispatch    • Unread Badges
   • Time Off Quotas  • Spoof Detection   • Batch Actions      • Itemized PDF      • Popover Drawer
   • Schedules        • Overtime Calc     • Audit Logs         • Proration Math    • Navigation Links
```

### 1. Unified Employee Lifecycle Management
- **360° Profile Overview**: Complete professional record containing personal identity, emergency contacts, organizational alignment, and job positions.
- **Automated Provisioning**: Onboarding an employee automatically prompts creation of an active contract, links working shift schedules, and seeds default leave quotas.
- **PII Data Protection**: Sensitive bank credentials (account numbers, IFSC codes) are masked across API responses.

### 2. Biometric Face Attendance System
- **Real-Time Webcam Capture**: Integrated browser video stream capturing employee facial features for check-in and check-out.
- **512-Dimensional Vector Embeddings**: Cosine similarity matching against enrolled biometric templates with strict threshold enforcement (`>= 0.60`).
- **Shift & Worked Hours Analytics**: Tracks actual working duration, calculates standard hours vs overtime, and flags late arrivals.
- **Resilient Fallback**: Automatic dual-path fallback guarantees uninterrupted attendance logging even during external service outages.

### 3. Time Off & Leave Quota Management
- **Category Quotas**: Configurable leave allowances (Annual, Sick, Casual, Maternity, Paternity, Unpaid).
- **Two-Tier Approval Workflow**: Staff submit requests with dates and reasons; HR Managers review with one-click Approve / Refuse triggers.
- **Live Balance Deductions**: Approved days automatically deduct from the employee's active allocation balance and feed directly into payroll proration.

### 4. Executive & Operational Analytics Dashboard
- **Period & Department Reactivity**: Global filters (`Period`, `Department`, `Employee Type`) dynamically recalculate all cards, charts, and tables in real time.
- **5 Core KPI Cards**:
  - `Total Net Salary Paid`: Total disbursed earnings with month-over-month percentage growth badges.
  - `Payslips Generated`: Total itemized statements produced for the period.
  - `Average Salary`: Net disbursement per payslip or contract wage baseline.
  - `Approved Time Off`: Total approved leave days utilized across the organization.
  - `Attendance Health Score`: Percentage of on-time biometric check-ins with health indicator tags (`Healthy`, `Attention Needed`).
- **Department Expense Distribution**: Proportional salary expenditure breakdown by department.
- **Monthly Trajectory Trend**: Multi-month net salary cost trajectory visualization.
- **Compliance & Operational Alerts**: Live detection of active staff without active contracts or missing bank details.

### 5. Payroll Administration Command Center
- **Interactive Rule Engine & Simulator**: Test and simulate salary calculations for any base wage against any structure before publishing.
- **Pre-Flight Compliance Audits**: Verifies contract validity, bank account assignments, and duplicate payslip checks prior to payrun calculation.
- **Batch Actions Hub**: One-click bulk computation, validation, and marking batches as paid.
- **Audit History**: Chronological trail logging every administrative payroll change.

### 6. Interactive Notification Center
- **Live Header Bell**: Unread counter badge showing real-time notifications stored in MySQL.
- **Interactive Popover**: Detailed cards showing schedule updates, payroll batches, and compliance alerts with relative timestamps (`2m ago`, `1h ago`).
- **Direct Navigation**: Clicking a notification with an embedded link navigates directly to the target module and marks the notification as read.
- **Full Notification Lifecycle**: Mark single notification as read, mark all as read, or delete notifications.

---

## 🧮 Salary Rules & Computation Engine

PeoplePay360 utilizes an ordered Computational Directed Acyclic Graph (DAG) to calculate employee earnings, statutory deductions, and net disbursements.

### Sequence of Rule Evaluation

```
  [ Contract Wage ] ──(Proration Factor: workedDays / totalDays)
         │
         ▼
 1. BASIC Salary       = contract.wage * 0.50 * prorationFactor
         │
         ├──────────────────────────────────────────┐
         ▼                                          ▼
 2. House Rent Allowance (HRA)             3. Special Allowance (SA)
    = BASIC * 0.50                            = contract.wage - (BASIC + HRA)
         │                                          │
         └────────────────────┬─────────────────────┘
                              ▼
                      4. GROSS Earnings
                         = BASIC + HRA + SA
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
 5. Provident Fund (PF)  6. Prof. Tax (PT)    7. Tax Deducted at Source (TDS)
    = BASIC * 0.12          = Fixed ₹200         = GROSS * 0.10
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                      8. TOTAL DEDUCTIONS (TD)
                         = PF + PT + TDS
                              │
                              ▼
                      9. NET SALARY
                         = GROSS - TOTAL_DEDUCTIONS
```

### Indian Statutory Compliance Built-In
- **Provident Fund (PF)**: 12% contribution assessed on Basic Salary.
- **Professional Tax (PT)**: Fixed statutory ₹200/month deduction for monthly wages exceeding ₹12,000.
- **Tax Deducted at Source (TDS)**: Income tax withholding computed against gross taxable earnings.
- **Deduction Isolation Guarantee**: Total deductions rule (`TOTAL_DED` / `TD`) computes strictly the sum of statutory deductions without double-counting individual components.

---

## 🗄 Database Architecture (27 Tables)

The database schema is strictly normalized in Third Normal Form (3NF) with foreign key constraints, cascading rules, and composite indexes:

```
                            ┌────────────────────────┐
                            │         users          │
                            └───────────┬────────────┘
                                        │ 1:1
                                        ▼
                            ┌────────────────────────┐
                 ┌──────────┤       employees        ├──────────┐
                 │          └───────────┬────────────┘          │
                 │ 1:N                  │ 1:N                   │ 1:N
                 ▼                      ▼                       ▼
      ┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
      │      contracts       ││      attendance      ││  time_off_requests   │
      └──────────┬───────────┘└──────────────────────┘└──────────────────────┘
                 │ N:1
                 ▼
      ┌──────────────────────┐
      │  salary_structures   │
      └──────────┬───────────┘
                 │ 1:N
                 ▼
      ┌──────────────────────┐
      │salary_structure_rules│
      └──────────┬───────────┘
                 │ N:1
                 ▼
      ┌──────────────────────┐
      │     salary_rules     │
      └──────────────────────┘
```

### Complete Table Inventory
| # | Table Name | Description | Key Relationships |
|---|---|---|---|
| 1 | `roles` | System roles (Admin, HR Manager, etc.) | Referenced by `users`, `role_permissions` |
| 2 | `permissions` | Atomic permissions (`employees.create`, etc.) | Referenced by `role_permissions` |
| 3 | `role_permissions` | Role-to-permission mapping table | FK to `roles`, `permissions` |
| 4 | `departments` | Organizational departments | Referenced by `employees`, `contracts` |
| 5 | `working_schedules` | Working shift profiles (40h, Flexible) | Referenced by `working_schedule_days`, `contracts` |
| 6 | `working_schedule_days` | Day-by-day shift hours (Mon-Sun) | FK to `working_schedules` |
| 7 | `employees` | Core personnel master records | FK to `departments`, `working_schedules` |
| 8 | `employee_bank_details` | Bank accounts & IFSC details | FK to `employees` |
| 9 | `users` | User credentials & authentication records | FK to `roles`, `employees` |
| 10 | `contracts` | Employment contracts with base wage | FK to `employees`, `salary_structures` |
| 11 | `salary_structures` | Salary structure categories | Referenced by `contracts`, `payruns` |
| 12 | `salary_rules` | Formula & percentage salary rules | Referenced by `salary_structure_rules` |
| 13 | `salary_structure_rules`| Ordered rule sequence per structure | FK to `salary_structures`, `salary_rules` |
| 14 | `attendance` | Biometric & manual check-in/out logs | FK to `employees` |
| 15 | `face_enrollments` | Biometric facial vector embeddings | FK to `employees` |
| 16 | `face_verification_logs` | Facial verification attempt history | FK to `employees` |
| 17 | `time_off_types` | Leave categories (Annual, Sick, etc.) | Referenced by allocations, requests |
| 18 | `time_off_allocations` | Allocated leave days per employee | FK to `employees`, `time_off_types` |
| 19 | `time_off_requests` | Leave requests with approval status | FK to `employees`, `time_off_types` |
| 20 | `payruns` | Payroll batch headers (`DRAFT` to `PAID`) | FK to `salary_structures` |
| 21 | `payslips` | Individual calculated employee payslips | FK to `payruns`, `employees`, `contracts` |
| 22 | `payslip_lines` | Itemized rule breakdown per payslip | FK to `payslips`, `salary_rules` |
| 23 | `notifications` | In-app user notifications & alerts | FK to `users` |
| 24 | `refresh_tokens` | Rotating JWT refresh tokens | FK to `users` |
| 25 | `password_reset_tokens` | Ephemeral password reset tokens | FK to `users` |
| 26 | `email_verification_tokens` | Account onboarding tokens | FK to `users` |
| 27 | `audit_logs` | Immutable audit trail of operations | FK to `users`, `employees` |

---

## 📡 REST API Summary

All endpoints (except login and public health) require a `Bearer <token>` HTTP header:

### Authentication & Self-Service
- `POST /api/auth/login` — Authenticate and receive JWT tokens.
- `POST /api/auth/refresh` — Refresh expired access token.
- `GET /api/auth/me` — Retrieve active user profile, employee details, and permissions.
- `POST /api/auth/logout` — Invalidate refresh token and end session.

### Dashboard & Analytics
- `GET /api/dashboard` — Live aggregated dashboard KPIs, payrun statuses, trends, and alerts. Query params: `period`, `departmentId`, `type`.

### Payroll Administration & Simulation
- `GET /api/payroll-admin/overview` — Administrative pipeline metrics, batch payruns, and contract wage liabilities.
- `GET /api/payroll-admin/compliance-check` — Automated pre-flight payroll compliance audit.
- `POST /api/payroll-admin/simulate` — Interactive rule engine simulator evaluating any wage against a selected structure.
- `POST /api/payroll-admin/bulk-action` — Batch payrun status transition (`COMPUTE`, `VALIDATE`, `PAY`).
- `GET /api/payroll-admin/audit-logs` — Payroll administrative audit trail.

### Payruns & Payslips
- `GET /api/payruns` — List all payrun batches.
- `POST /api/payruns` — Create a new payrun cycle wizard.
- `POST /api/payruns/:id/compute` — Compute payslips for all eligible staff.
- `POST /api/payruns/:id/validate` — Validate batch earnings.
- `POST /api/payruns/:id/pay` — Finalize and mark payrun as disbursed.
- `GET /api/payslips/:id` — View itemized payslip breakdown.
- `GET /api/payslips/:id/pdf` — Stream generated PDF payslip document.
- `POST /api/payslips/:id/send-email` — Dispatch payslip via email to employee.

### In-App Notification Center
- `GET /api/notifications` — Fetch user's notification feed and unread count.
- `PATCH /api/notifications/:id/read` — Mark notification as read.
- `POST /api/notifications/mark-all-read` — Mark all unread notifications as read.
- `DELETE /api/notifications/:id` — Delete a notification.

### Biometrics & Attendance
- `POST /api/attendance/check-in` — Biometric or manual check-in.
- `POST /api/attendance/check-out` — Biometric or manual check-out.
- `GET /api/attendance/records` — Historical attendance log query.
- `POST /api/attendance/face-enroll` — Register employee face biometric template.

---

## 🧪 Automated Testing & Verification

The backend includes an automated test suite verifying role authorization, token lifecycles, salary computations, and edge cases:

```bash
cd backend
npm run test:auth
```

### Coverage Scope
- [x] Login with valid credentials across all 5 roles.
- [x] Rejection of invalid credentials and rate limiting.
- [x] Access token expiration & refresh token exchange.
- [x] Role-Based Access Control (RBAC) permission barriers.
- [x] Salary simulator rule calculations & total deductions isolation.
- [x] Pre-flight compliance checks for uncontracted employees.
- [x] Payrun lifecycle progression (`Draft` -> `Computed` -> `Validated` -> `Paid`).
- [x] Server-side PDF document generation.

---

## 🔒 Security Architecture

- **Password Hashing**: Secure salted passwords utilizing `bcryptjs` (cost factor 10).
- **SQL Injection Immunity**: 100% of SQL executions use parameterized bindings (`?`) across all controllers.
- **XSS & CORS Protection**: CORS policies restrict access to configured origins; data inputs are sanitized.
- **Audit Logging**: Sensitive operations (user creation, payrun state transitions, salary adjustments) write immutable records to the `audit_logs` table.
- **Financial Masking**: Bank account numbers and tax identifiers are masked in API serialization for non-administrative roles.

---

## 👥 Contributors & Grand Finale Credits

Developed for the **Odoo Hackathon 2026 Grand Finale** by the **PeoplePay360 Engineering Team**.

*Engineered with precision, security, and performance for the future of enterprise HR & Payroll.*