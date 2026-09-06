# 💻 PeoplePay360: Frontend Application Documentation

<div align="center">

![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)
![Lucide Icons](https://img.shields.io/badge/Icons-Lucide_React-F56565?style=for-the-badge)

**Next-Generation Single Page Application (SPA) for Enterprise HR & Payroll**

</div>

---

## 🏗 Frontend Architecture Overview

The PeoplePay360 frontend is built on **React 18** and bundled with **Vite** for sub-second hot module replacement (HMR) and optimized production bundles.

```
frontend/src/
├── components/           # Reusable UI & Domain Components
│   ├── common/           # Shared modals, loaders, badges, buttons
│   ├── dashboard/        # Live MetricCards, Charts, Attendance & Leave panels
│   ├── layout/           # AppShell, Sidebar, Header (with Notification Bell), Breadcrumbs
│   └── payroll/          # Simulation panels, payslip modals, wizards
├── context/              # Global React Contexts (AuthContext, Theme)
├── hooks/                # Custom React hooks (useAuth, useNotifications)
├── pages/                # Route Views / Page Components
│   ├── admin/            # User Management, Roles & System Settings
│   ├── attendance/       # Biometric Face Check-In, Attendance Records
│   ├── contracts/        # Contract Form & Listing
│   ├── dashboard/        # Executive & Operational Live Dashboard
│   ├── employees/        # Employee Directory & Detail View
│   ├── payroll/          # Payroll Admin Panel, Payruns, Payslips, Rules
│   ├── schedules/        # Working Shifts & Schedule Management
│   └── timeOff/          # Leave Requests & Allocations
├── services/             # Axios API Client & Service Abstractions
│   ├── api.js            # Axios instance with JWT interceptors & token refresh
│   ├── authService.js    # Authentication API calls
│   ├── dashboardService.js # Dashboard aggregation metrics
│   ├── notificationService.js # In-app user notifications
│   ├── payrollAdminService.js # Payroll admin command center & simulator
│   └── ...
└── utils/                # Utility helpers (formatCurrency INR, permissions, dates)
```

---

## 🎨 Design System & Visual Tokens

The user interface adheres to clean, modern SaaS design aesthetics:
- **Typography**: Inter / System UI with clear typographic hierarchy and bold stat figures.
- **Color Palette**:
  - `Primary / Brand`: Slate 900 & Indigo 950 gradients paired with Blue 600 accents.
  - `Success / Healthy`: Emerald 50 / 600 for approved leaves, paid payruns, and on-time attendance.
  - `Warning / Attention`: Amber 50 / 600 for computed payruns and compliance warnings.
  - `Danger / Alert`: Rose 50 / 600 for rejected requests, missing contracts, and unread counts.
- **Currency Standard**: Strict Indian Rupee (`INR` / `₹`) formatting with standard thousand/lakh separators (`₹95,000`, `₹7,25,800`).
- **Micro-Interactions**: Hover lifts, smooth transitions, subtle drop shadows (`shadow-2xs`), and responsive drawer popovers.

---

## 🔐 Authentication & Session Flow

The frontend handles JWT sessions seamlessly via Axios interceptors in `services/api.js`:
1. **Access Token Storage**: Stored in memory / local session for fast authorization headers.
2. **Silent Token Refresh**: When an API returns `401 TOKEN_EXPIRED`, an interceptor automatically pauses pending requests, calls `POST /api/auth/refresh`, updates the token, and replays the original requests.
3. **Role Enforcement**: Protected routes redirect users based on their assigned enterprise role (`Admin`, `HR Manager`, `HR Payroll Admin`, `HR Payroll User`, `Employee`).

---

## 🔔 Live In-App Notification Center

Connected directly to the backend database:
- **Header Bell Icon**: Displays dynamic red badge when unread notifications exist.
- **Interactive Popover**: Renders schedule updates, leave notifications, and payrun batch alerts.
- **Actions**: Mark single as read, mark all as read, delete, and direct module navigation.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Running on http://localhost:5173

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📄 License
Developed for the **Odoo Hackathon 2026 Grand Finale**.
