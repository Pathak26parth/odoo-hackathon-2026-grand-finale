# PeoplePay360 REST API Reference

Base URL: `http://localhost:5000/api`

---

## 1. System & Health

### `GET /api/health`
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "PeoplePay360 API is running",
  "timestamp": "2026-09-05T07:20:00.000Z",
  "database": "connected"
}
```

---

## 2. Authentication & Account Lifecycle (`/api/auth`)

### `POST /api/auth/login`
- **Auth**: None (Rate Limited)
- **Request Body**:
```json
{
  "email": "admin@peoplepay360.com",
  "password": "Admin@123"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "admin@peoplepay360.com",
      "role": "ADMIN",
      "roleDisplayName": "Admin",
      "employeeId": 1,
      "employeeCode": "EMP-001",
      "name": "System Administrator",
      "permissions": ["employees.read", "payruns.create", "..."]
    }
  }
}
```

### `POST /api/auth/refresh`
- **Auth**: None
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOi..."
  }
}
```

### `GET /api/auth/me`
- **Auth**: Bearer JWT
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 5,
    "email": "employee@peoplepay360.com",
    "role": "EMPLOYEE",
    "employee": {
      "id": 5,
      "employeeCode": "EMP-005",
      "fullName": "Dhruvil Patel",
      "jobPosition": "Senior Software Engineer",
      "departmentName": "Engineering & Technology",
      "faceEnrollmentStatus": "ACTIVE"
    },
    "permissions": ["employees.read_own", "attendance.create_own", "timeoff.create_own"]
  }
}
```

### `POST /api/auth/activate-account`
- **Auth**: None (Token in email)
- **Request Body**:
```json
{
  "token": "64_char_crypto_activation_token",
  "email": "new.employee@peoplepay360.com",
  "newPassword": "SecurePassword@123"
}
```

### `POST /api/auth/change-password`
- **Auth**: Bearer JWT
- **Request Body**:
```json
{
  "currentPassword": "Password@123",
  "newPassword": "NewSecurePassword@123"
}
```

---

## 3. User & Role Management (`/api/users`)

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `users.read` (Admin) | List all system users with search, role, and status filters |
| `GET` | `/api/users/:id` | `users.read` (Admin) | Get specific user profile with linked employee details |
| `POST` | `/api/users` | `users.create` (Admin) | Create any type of user account (`ADMIN`, `HR_MANAGER`, `HR_PAYROLL_ADMIN`, `HR_PAYROLL_USER`, `EMPLOYEE`) |
| `PATCH` | `/api/users/:id/role` | `roles.manage` (Admin) | Change user role with safety checks against demoting last active admin |
| `PUT` | `/api/users/:id` | `users.update` (Admin) | Update user profile, password, or active status |
| `DELETE` | `/api/users/:id` | `users.delete` (Admin) | Deactivate / delete user account (safety lock on last admin) |
| `GET` | `/api/users/roles` | `users.read` | Get list of all 5 system roles with assigned permissions |
| `GET` | `/api/users/permissions`| `users.read` | Get all system permissions grouped by module |
| `PUT` | `/api/users/roles/:id/permissions` | `roles.manage` (Admin) | Update permissions assigned to a role |

### `POST /api/users` — Admin Creates User Account
- **Auth**: `users.create` (`ADMIN` role only)
- **Request Body**:
```json
{
  "email": "new.hrmanager@peoplepay360.com",
  "password": "TemporaryPassword@123", // Optional: If omitted, auto-generates secure temp password
  "role": "HR_MANAGER", // ADMIN | HR_MANAGER | HR_PAYROLL_ADMIN | HR_PAYROLL_USER | EMPLOYEE
  "firstName": "Ananya",
  "lastName": "Sharma",
  "jobPosition": "Senior HR Manager",
  "departmentId": 1,
  "phone": "+91 98765 43210",
  "createEmployeeRecord": true, // Automatically links/creates employee profile & leave allocations
  "sendInvitation": true // Sends onboarding invitation email with 24-hr activation token
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "User account created successfully with role \"HR Manager\".",
  "data": {
    "userId": 7,
    "email": "new.hrmanager@peoplepay360.com",
    "role": "HR_MANAGER",
    "roleDisplayName": "HR Manager",
    "roleId": 4,
    "employeeId": 7,
    "employeeCode": "EMP-007",
    "tempPassword": null,
    "activationToken": "64_character_hex_token"
  }
}
```

### `PATCH /api/users/:id/role` — Admin Changes User Role
- **Auth**: `roles.manage` (`ADMIN` role only)
- **Request Body**:
```json
{
  "role": "HR_PAYROLL_ADMIN" // Or numeric roleId: 2
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User role changed to \"HR Payroll Admin\".",
  "data": {
    "userId": 7,
    "roleId": 2,
    "role": "HR_PAYROLL_ADMIN",
    "roleDisplayName": "HR Payroll Admin"
  }
}
```

---

## 4. Employee Master Management (`/api/employees`)

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees/me` | Logged-in Employee | Get current employee's own full profile |
| `GET` | `/api/employees` | `employees.read` | Get all employee profiles with search & filters |
| `GET` | `/api/employees/:id`| `employees.read` / Self | Get employee record by ID with smart button metric counts |
| `POST` | `/api/employees` | `employees.create` | Onboard employee + user account + bank details + initial contract + leave allocations |
| `PUT` | `/api/employees/:id`| `employees.update` | Update employee profile & bank details |
| `DELETE` | `/api/employees/:id`| `employees.delete` | Terminate employee and deactivate access |
| `GET` | `/api/employees/:id/contracts` | `contracts.read` | Get employee's contract history |
| `GET` | `/api/employees/:id/attendance`| `attendance.read` / Self | Get employee's attendance records |
| `GET` | `/api/employees/:id/time-off` | `timeoff.read` / Self | Get employee's leave requests & allocations |
| `GET` | `/api/employees/:id/payslips` | `payslips.read` / Self | Get employee's generated payslips |

### `POST /api/employees` — HR Manager / Admin Onboards Employee
- **Auth**: `employees.create` (`HR_MANAGER`, `HR_PAYROLL_ADMIN`, `ADMIN`)
- **Request Body**:
```json
{
  "firstName": "Vikram",
  "lastName": "Mehta",
  "email": "vikram.mehta@peoplepay360.com",
  "phone": "+91 99887 76655",
  "jobPosition": "Fullstack Software Engineer",
  "departmentId": 2,
  "managerId": 1,
  "workingScheduleId": 1,
  "gender": "MALE",
  "dateOfBirth": "1995-06-15",
  "joiningDate": "2026-09-01",
  "bankDetails": {
    "accountHolderName": "Vikram Mehta",
    "bankName": "HDFC Bank",
    "accountNumber": "50100234567890",
    "ifscCode": "HDFC0001234",
    "branchName": "Gandhinagar Infocity",
    "accountType": "SALARY"
  },
  "initialContract": {
    "wage": 75000.00,
    "salaryStructureId": 1,
    "startDate": "2026-09-01"
  }
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Employee profile, user account, bank details, and leave allocations created successfully. Invitation email sent.",
  "data": {
    "employeeId": 8,
    "employeeCode": "EMP-008",
    "userId": 8,
    "email": "vikram.mehta@peoplepay360.com",
    "role": "EMPLOYEE",
    "roleId": 5,
    "mustChangePassword": true,
    "tempPassword": "RandomSecurePass123",
    "activationToken": "64_character_hex_token"
  }
}
```

---

## 5. Attendance & Biometric Face Verification (`/api/attendance`)

### `POST /api/attendance/check-in`
- **Auth**: Bearer JWT
- **Body**: `{ "employeeId": 5 }` (Optional, defaults to logged-in user)

### `POST /api/attendance/check-out`
- **Auth**: Bearer JWT
- **Body**: `{ "employeeId": 5 }`

### `POST /api/attendance/face-check-in`
- **Auth**: Bearer JWT
- **Body**:
```json
{
  "faceInput": "live_webcam_frame_data_hash",
  "deviceInfo": "Office Entrance Kiosk #1"
}
```

### `POST /api/attendance/face-check-out`
- **Auth**: Bearer JWT
- **Body**:
```json
{
  "faceInput": "live_webcam_frame_data_hash",
  "deviceInfo": "Office Entrance Kiosk #1"
}
```

### `PATCH /api/attendance/:id/correct`
- **Auth**: `attendance.correct` (Admin / HR Manager)
- **Body**:
```json
{
  "checkIn": "2026-09-02 09:00:00",
  "checkOut": "2026-09-02 18:00:00",
  "reason": "Employee forgot to punch out due to client meeting"
}
```

---

## 6. Time Off & Leaves (`/api/time-off`)

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/time-off/types` | Authenticated | List all leave types |
| `POST` | `/api/time-off/types` | `timeoff.types_manage` | Create new leave type |
| `GET` | `/api/time-off/allocations` | `timeoff.read` | View employee annual allocations |
| `POST` | `/api/time-off/allocations` | `timeoff.allocations_manage` | Assign leave balance allocation |
| `GET` | `/api/time-off/requests` | `timeoff.read` | View leave requests |
| `POST` | `/api/time-off/requests` | Authenticated | Submit time off request |
| `POST` | `/api/time-off/requests/:id/approve` | `timeoff.approve` | Approve request (deducts allocation balance) |
| `POST` | `/api/time-off/requests/:id/refuse` | `timeoff.refuse` | Refuse request with reason |

---

## 7. Contracts & Working Schedules

### Contracts (`/api/contracts`)
- `GET /api/contracts` (Filter by `employeeId`, `status`, `departmentId`)
- `POST /api/contracts` (Create employment contract binding wage, schedule, and salary structure)
- `PUT /api/contracts/:id`
- `DELETE /api/contracts/:id`

### Working Schedules (`/api/schedules`)
- `GET /api/schedules`
- `POST /api/schedules` (Creates schedule; weekly hours calculated automatically from day patterns)
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`

---

## 8. Salary Structures & Rules

### Salary Structures (`/api/salary-structures`)
- `GET /api/salary-structures` (Lists structures with ordered rules)
- `POST /api/salary-structures` (Create structure with rule sequences)
- `PUT /api/salary-structures/:id`
- `DELETE /api/salary-structures/:id`

### Salary Rules (`/api/salary-rules`)
- `GET /api/salary-rules`
- `POST /api/salary-rules` (Categories: `BASIC`, `ALLOWANCE`, `GROSS`, `DEDUCTION`, `NET`)
- `PUT /api/salary-rules/:id`
- `DELETE /api/salary-rules/:id`

---

## 9. Payrun & Payslips

### Payrun Wizard & Operations (`/api/payruns`)
- `POST /api/payruns/validate-scope` (Wizard Step 1 & 2 pre-flight check, checks active period contracts, bank details, duplicate payslips)
- `GET /api/payruns` (List payrun batches)
- `GET /api/payruns/:id` (Get payrun batch details + summary of generated payslips)
- `POST /api/payruns` (Create and compute payrun batch for selected employees)
- `POST /api/payruns/:id/validate` (Lock calculations, status `VALIDATED`)
- `POST /api/payruns/:id/pay` (Mark as `PAID` and finalize all employee payslips)
- `POST /api/payruns/:id/send-payslips` (Send payslips via email to employees in bulk)
- `DELETE /api/payruns/:id` (Delete draft payruns)

### Payslips (`/api/payslips`)
- `GET /api/payslips` (List payslips)
- `GET /api/payslips/:id` (Get payslip with breakdown of all computed rule lines)
- `GET /api/payslips/:id/pdf` (Generate and stream binary PDF document)
- `POST /api/payslips/:id/send` (Email individual payslip to employee)

---

## 10. Real-Time Dashboard (`/api/dashboard`)

### `GET /api/dashboard`
- **Auth**: `dashboard.read` (Admin, HR Payroll Admin, HR Payroll User, HR Manager)
- **Query Params**: `?period=2026-09&departmentId=1`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Live dashboard metrics calculated",
  "data": {
    "kpi": {
      "totalEmployees": 6,
      "totalNetSalaryPaid": 502800.00,
      "payslipsGenerated": 6,
      "averageSalary": 83800.00,
      "approvedLeaveDays": 3.00,
      "attendanceHealthScore": 92.5
    },
    "attendanceOverview": {
      "totalEntries": 7,
      "presentOnTime": 6,
      "lateArrivals": 1,
      "missingCheckouts": 0,
      "manualCorrections": 0,
      "totalOvertimeHours": 1.07
    },
    "alerts": {
      "missingBankDetails": 0,
      "missingActiveContracts": 0,
      "pendingTimeOffRequests": 1
    },
    "departmentBreakdown": [
      {
        "id": 1,
        "department_name": "Engineering & Technology",
        "employee_count": 3,
        "total_salary_cost": 259700.00
      }
    ],
    "monthlyTrends": [
      {
        "month": "2026-08",
        "month_label": "Aug 2026",
        "total_net_paid": 502800.00,
        "payslips_count": 6
      }
    ]
  }
}
```
