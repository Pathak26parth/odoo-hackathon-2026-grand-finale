# PeoplePay360: HR & Payroll Platform
> An Integrated Human Resource and Payroll Operations Platform (Odoo Hackathon 2026 Grand Finale)

---

## 🚀 Architecture Overview

**PeoplePay360** is a full-stack HR & Payroll platform integrating three primary subsystems into a single dynamic application:

```
                  ┌────────────────────────────────────────────────┐
                  │                 React Frontend                 │
                  │   Vite + Tailwind CSS + Lucide Icons + Webcam  │
                  │              (http://localhost:5173)           │
                  └──────────────────────┬─────────────────────────┘
                                         │ HTTP / REST APIs (JWT Auth)
                                         ▼
                  ┌────────────────────────────────────────────────┐
                  │           Node.js + Express Backend            │
                  │    Pure SQL Queries (mysql2) — Strictly No ORM │
                  │              (http://localhost:5000)           │
                  └──────────────┬──────────────────┬──────────────┘
                                 │                  │
                Raw SQL Queries  │                  │ HTTP Biometric REST
                                 ▼                  ▼
     ┌───────────────────────────────┐   ┌──────────────────────────────────┐
     │        MySQL Database         │   │   Python Face Biometrics Micro   │
     │      Local Database Server    │   │  InsightFace / ArcFace/MediaPipe │
     │     `peoplepay360` Database   │   │       (http://localhost:8000)    │
     └───────────────────────────────┘   └──────────────────────────────────┘
```

---

## 🔑 System Credentials & Role-Based Access Control (RBAC)

The system is pre-seeded with authoritative credentials for all 5 enterprise roles:

| Role | Email | Password | Access Rights & Modules |
|---|---|---|---|
| **System Administrator** | `admin@peoplepay360.com` | `Admin@123` | Full access to all modules, User Management, Roles, Permissions, Database Config |
| **HR Manager** | `hr.manager@peoplepay360.com` | `HrManager@123` | Employee lifecycle, Contracts, Schedules, Time Off approval, Attendance management |
| **HR Payroll Admin** | `payroll.admin@peoplepay360.com` | `PayrollAdmin@123` | Salary structure definition, Salary rules engine, Payrun execution, Disbursal |
| **HR Payroll User** | `payroll.user@peoplepay360.com` | `PayrollUser@123` | Payrun computation, Payslip inspection, Draft review (Locked from rule modification) |
| **Employee (Self-Service)** | `alex.rivera@peoplepay360.com` | `Employee@123` | Personal profile, Face Check-in/Check-out, Time off requests, Personal payslips |

---

## ⚡ Quick Start: Running the Full Application

### 1. Database Setup (MySQL)

Make sure MySQL server is running locally on port `3306`:

```bash
cd backend
npm run db:init
```

### 2. Start the Backend API Server

```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Start the Python Face Verification Microservice (Optional / Dual Resilience)

```bash
pip install -r requirements.txt
python AI/server.py
# Running on http://localhost:8000
```

*(Note: If the Python service is offline, the backend seamlessly falls back to resilient database-level biometric verification and template matching).*

### 4. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Automated Testing

To run the complete 42-test backend verification suite covering all roles, token rotation, permissions, biometric face check-in, payroll computation, and safety locks:

```bash
cd backend
npm run test:auth
```

---

## 📦 Core Feature Modules

### 1. Unified Employee Lifecycle
- Employee profiles, smart action buttons, and organizational hierarchy.
- Automatic contract, working schedule, and leave allocation initialization on onboarding.
- Masked bank details and strict PII protection.

### 2. Biometric Face Attendance
- Integrated webcam capture with simulated and live AI face detection frames.
- 512-dimensional ArcFace cosine similarity matching with MediaPipe anti-spoof protection.
- Daily check-in/check-out tracking, worked hours calculation, and exception reporting.

### 3. Time Off Management
- Leave balance quotas and category management (Annual, Sick, Casual, Maternity, Unpaid).
- Two-step manager review and approval workflows with real-time allocation balance deductions.

### 4. Salary Rules & Computation Engine
- Configurable salary structures and ordered rule hierarchies (`BASIC`, `ALW`, `GROSS`, `DED`, `NET`).
- Dynamic formula evaluation, percentage bases, fixed stipends, and statutory contributions (PF, PT).

### 5. Payrun Batch Processing & PDF Payslips
- Step-by-step Payrun creation wizard with automated contract eligibility verification.
- Batch computation, pre-flight validation, and payment locking (`Draft` → `Computed` → `Validated` → `Paid`).
- One-click server-side PDF generation and itemized email dispatching (`pdfkit` & `nodemailer`).

---

## 📜 License
Developed for the **Odoo Hackathon 2026 Grand Finale**.