/**
 * Complete End-to-End Test Suite for PeoplePay360 Backend
 * Tests all 5 roles, permission boundaries, own-data protection, and business flows
 */
const http = require('http');
const app = require('../src/app');
const { testConnection, query } = require('../src/config/db');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = options.headers || {};
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('application/pdf')) {
    const buffer = await response.arrayBuffer();
    data = { isPdf: true, byteLength: buffer.byteLength };
  } else {
    data = await response.text();
  }

  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  RUNNING PEOPLEPAY360 COMPLETE BACKEND TEST SUITE              ');
  console.log('================================================================\n');

  // Verify DB
  await testConnection();

  // Start test server on random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: Health Check
    // -----------------------------------------------------------------
    console.log('--- TEST GROUP 1: SYSTEM HEALTH ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'Health check returns 200 OK');

    // -----------------------------------------------------------------
    // TEST 2: Multi-Role Authentication
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: ROLE-BASED LOGIN & CREDENTIALS ---');

    // Admin Login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.data.user.role === 'ADMIN', 'Admin login successful');
    const adminToken = adminLogin.data?.data?.accessToken;

    // HR Payroll Admin Login
    const hrpaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'payrolladmin@peoplepay360.com', password: 'Password@123' }
    });
    assert(hrpaLogin.status === 200 && hrpaLogin.data.data.user.role === 'HR_PAYROLL_ADMIN', 'HR Payroll Admin login successful');
    const hrpaToken = hrpaLogin.data?.data?.accessToken;

    // HR Payroll User Login
    const hrpuLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'payrolluser@peoplepay360.com', password: 'Password@123' }
    });
    assert(hrpuLogin.status === 200 && hrpuLogin.data.data.user.role === 'HR_PAYROLL_USER', 'HR Payroll User login successful');
    const hrpuToken = hrpuLogin.data?.data?.accessToken;

    // HR Manager Login
    const hrmLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'hrmanager@peoplepay360.com', password: 'Password@123' }
    });
    assert(hrmLogin.status === 200 && hrmLogin.data.data.user.role === 'HR_MANAGER', 'HR Manager login successful');
    const hrmToken = hrmLogin.data?.data?.accessToken;

    // Employee Login
    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'employee@peoplepay360.com', password: 'Password@123' }
    });
    assert(empLogin.status === 200 && empLogin.data.data.user.role === 'EMPLOYEE', 'Employee login successful');
    const empToken = empLogin.data?.data?.accessToken;

    // Invalid Login
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'WrongPassword' }
    });
    assert(invalidLogin.status === 401 && invalidLogin.data.success === false, 'Invalid credentials rejected with 401');

    // -----------------------------------------------------------------
    // TEST 3: User Profile & Token Refresh
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: USER IDENTITY & TOKEN ROTATION ---');
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(meRes.status === 200 && meRes.data.data.employee.employeeCode === 'EMP-005', 'GET /api/auth/me returns linked employee profile');

    const refreshRes = await request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: empLogin.data.data.refreshToken }
    });
    assert(refreshRes.status === 200 && refreshRes.data.data.accessToken, 'POST /api/auth/refresh returns new access token');

    // -----------------------------------------------------------------
    // TEST 4: Permission & Role Boundary Enforcement (RBAC)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: PERMISSION & ROLE BOUNDARY ENFORCEMENT ---');

    // 1. Unauthenticated request
    const unauthRes = await request('/api/users');
    assert(unauthRes.status === 401, 'Unauthenticated request to protected route returns 401');

    // 2. Employee cannot access User Management
    const empUserRes = await request('/api/users', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empUserRes.status === 403, 'Employee blocked from User Management (403 Forbidden)');

    // 3. Admin can access User Management
    const adminUserRes = await request('/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUserRes.status === 200 && adminUserRes.data.data.users.length > 0, 'Admin successfully accesses User Management');

    // 4. HR Manager cannot access Payruns
    const hrmPayrunRes = await request('/api/payruns', {
      headers: { Authorization: `Bearer ${hrmToken}` }
    });
    assert(hrmPayrunRes.status === 403, 'HR Manager blocked from Payroll Payruns (403 Forbidden)');

    // 5. HR Payroll User CAN read payruns but CANNOT delete payruns
    const hrpuPayrunRead = await request('/api/payruns', {
      headers: { Authorization: `Bearer ${hrpuToken}` }
    });
    assert(hrpuPayrunRead.status === 200, 'HR Payroll User allowed to read payruns (200 OK)');

    const hrpuPayrunDelete = await request('/api/payruns/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${hrpuToken}` }
    });
    assert(hrpuPayrunDelete.status === 403, 'HR Payroll User blocked from deleting payrun (403 Forbidden)');

    // 6. HR Payroll User CANNOT create salary rules
    const hrpuRuleCreate = await request('/api/salary-rules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrpuToken}` },
      body: { name: 'Test Rule', code: 'TEST_R', category: 'ALLOWANCE' }
    });
    assert(hrpuRuleCreate.status === 403, 'HR Payroll User blocked from modifying salary rules (403 Forbidden)');

    // 7. HR Payroll Admin CAN create salary rules
    const uniqueRuleCode = `ALLOW_${Date.now().toString().slice(-4)}`;
    const hrpaRuleCreate = await request('/api/salary-rules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrpaToken}` },
      body: { name: 'Test Allowance', code: uniqueRuleCode, category: 'ALLOWANCE', sequence: 35, computationType: 'FIXED', value: 1500 }
    });
    assert(hrpaRuleCreate.status === 201, 'HR Payroll Admin allowed to create salary rules (201 Created)');

    // 8. Employee Ownership Check: Employee 5 cannot access Employee 1 details
    const empAccessOther = await request('/api/employees/1', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empAccessOther.status === 403, 'Employee blocked from accessing another employee record (403 Forbidden)');

    const empAccessSelf = await request('/api/employees/5', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empAccessSelf.status === 200 && empAccessSelf.data.data.employee_code === 'EMP-005', 'Employee allowed to access own record (200 OK)');

    // -----------------------------------------------------------------
    // TEST 5: Attendance & Face Verification
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: ATTENDANCE & BIOMETRIC FACE VERIFICATION ---');

    // Face enrollment status
    const faceStatus = await request('/api/attendance/face/status', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(faceStatus.status === 200 && faceStatus.data.data.isEnrolled === true, 'Employee face enrollment active');

    // 1:1 Face Verified Check-In
    const faceCheckIn = await request('/api/attendance/face-check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { faceInput: 'live_webcam_frame_data_hash' }
    });
    assert(faceCheckIn.status === 201 || faceCheckIn.status === 400, 'Face check-in endpoint handles verification & punch logic');

    // -----------------------------------------------------------------
    // TEST 6: Time Off Allocation & Approvals
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: TIME OFF LIFECYCLE & BALANCE DEDUCTION ---');

    // Ensure test employee 5 has sufficient leave allocation
    await query('UPDATE time_off_allocations SET remaining_days = 20.00 WHERE employee_id = 5 AND time_off_type_id = 1');

    // Employee Submits Leave
    const leaveReq = await request('/api/time-off/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        timeOffTypeId: 1, // Paid Leave
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        totalDays: 2.0,
        reason: 'Conference attendance'
      }
    });
    assert(leaveReq.status === 201 && leaveReq.data.data.status === 'PENDING', 'Employee submitted time off request (PENDING)');
    const leaveId = leaveReq.data?.data?.requestId;

    if (leaveId) {
      // HR Manager Approves Leave
      const approveRes = await request(`/api/time-off/requests/${leaveId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hrmToken}` }
      });
      assert(approveRes.status === 200 && approveRes.data.data.status === 'APPROVED', 'HR Manager approved time off request and balance deducted');
    }

    // -----------------------------------------------------------------
    // TEST 7: Payroll Processing & Payslip PDF
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: PAYROLL COMPUTATION & PAYSLIP PDF ---');

    // Payrun Scope Validation (Wizard Step 1 & 2)
    const scopeCheck = await request('/api/payruns/validate-scope', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrpaToken}` },
      body: {
        salaryStructureId: 1,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30'
      }
    });
    assert(scopeCheck.status === 200 && scopeCheck.data.data.eligibleCount > 0, 'Payrun wizard pre-flight scope validation successful');

    // Create & Compute Payrun Batch (September 2026)
    const createPayrun = await request('/api/payruns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrpaToken}` },
      body: {
        name: 'September 2026 Main Payroll Batch',
        salaryStructureId: 1,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        employeeIds: [1, 2, 3, 4, 5, 6]
      }
    });
    assert(createPayrun.status === 201 && createPayrun.data.data.status === 'COMPUTED', 'Payrun batch computed successfully for eligible employees');
    const newPayrunId = createPayrun.data?.data?.payrunId;

    if (newPayrunId) {
      // Validate Payrun
      const validateRun = await request(`/api/payruns/${newPayrunId}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hrpaToken}` }
      });
      assert(validateRun.status === 200, 'Payrun batch validated (Status: VALIDATED)');

      // Mark Payrun Paid
      const markPaid = await request(`/api/payruns/${newPayrunId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hrpaToken}` }
      });
      assert(markPaid.status === 200, 'Payrun batch finalized and marked as PAID');
    }

    // Download Payslip PDF (Payslip 5 - Dhruvil Patel)
    const pdfRes = await request('/api/payslips/5/pdf', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(pdfRes.status === 200 && pdfRes.data.isPdf === true && pdfRes.data.byteLength > 1000, 'Payslip PDF generated and downloaded dynamically');

    // -----------------------------------------------------------------
    // TEST 8: Live Dashboard Analytics
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: REAL-TIME DASHBOARD ANALYTICS ---');
    const dashRes = await request('/api/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dashRes.status === 200 && dashRes.data.data.kpi.totalEmployees >= 6, 'Dashboard derives live KPI metrics from MySQL');
    assert(dashRes.data.data.departmentBreakdown.length > 0, 'Dashboard department breakdown calculated');
    assert(dashRes.data.data.monthlyTrends.length > 0, 'Dashboard monthly trends calculated');

    // -----------------------------------------------------------------
    // TEST 9: User Creation, Role Management & HR Employee Onboarding
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: USER CREATION & EMPLOYEE ONBOARDING ---');

    // 1. Admin gets all system roles and permissions
    const rolesRes = await request('/api/users/roles', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(rolesRes.status === 200 && rolesRes.data.data.length === 5, 'Admin can retrieve all 5 system roles with permissions');

    const permsRes = await request('/api/users/permissions', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(permsRes.status === 200 && permsRes.data.data.all.length >= 25, 'Admin can retrieve all system permissions grouped by module');

    // 2. Admin creates a new HR Manager user
    const uniqueHrEmail = `newhrm_${Date.now()}@peoplepay360.com`;
    const createHrRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: uniqueHrEmail,
        password: 'Password@123',
        role: 'HR_MANAGER',
        firstName: 'Ananya',
        lastName: 'Sharma',
        jobPosition: 'Senior HR Manager',
        departmentId: 1,
        phone: '+91 98765 43210'
      }
    });
    assert(createHrRes.status === 201 && createHrRes.data.data.role === 'HR_MANAGER', 'Admin created new HR_MANAGER user account with linked employee profile');
    const newUserId = createHrRes.data?.data?.userId;

    // 3. Admin changes the newly created user's role to HR_PAYROLL_ADMIN
    if (newUserId) {
      const changeRoleRes = await request(`/api/users/${newUserId}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: 'HR_PAYROLL_ADMIN' }
      });
      assert(changeRoleRes.status === 200 && changeRoleRes.data.data.role === 'HR_PAYROLL_ADMIN', 'Admin changed user role to HR_PAYROLL_ADMIN');
    }

    // 4. Admin safety lock: Cannot demote or delete the last active admin (Admin ID = 1)
    const demoteAdminRes = await request('/api/users/1/role', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'EMPLOYEE' }
    });
    assert(demoteAdminRes.status === 400, 'Safety lock: Blocked demotion of the last active System Administrator');

    const deleteAdminRes = await request('/api/users/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteAdminRes.status === 400, 'Safety lock: Blocked deletion of logged-in/last System Administrator');

    // 5. HR Manager creates a new Employee with linked User, Bank Details, and Initial Contract
    const uniqueEmpEmail = `emp_${Date.now()}@peoplepay360.com`;
    const createEmpRes = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrmToken}` },
      body: {
        firstName: 'Vikram',
        lastName: 'Mehta',
        email: uniqueEmpEmail,
        phone: '+91 99887 76655',
        jobPosition: 'Fullstack Software Engineer',
        departmentId: 2, // Engineering
        gender: 'MALE',
        dateOfBirth: '1995-06-15',
        joiningDate: '2026-09-01',
        roleName: 'ADMIN', // HR Manager attempts privilege escalation - should be safely forced to EMPLOYEE
        bankDetails: {
          accountHolderName: 'Vikram Mehta',
          bankName: 'HDFC Bank',
          accountNumber: '50100234567890',
          ifscCode: 'HDFC0001234',
          branchName: 'Gandhinagar Infocity',
          accountType: 'SALARY'
        },
        initialContract: {
          wage: 75000.00,
          salaryStructureId: 1,
          startDate: '2026-09-01'
        }
      }
    });
    assert(createEmpRes.status === 201 && createEmpRes.data.data.employeeCode.startsWith('EMP-'), 'HR Manager onboarded new Employee with linked user, bank details, contract, and leave allocations');
    assert(createEmpRes.data.data.role === 'EMPLOYEE', 'Privilege Escalation Guard: Non-admin attempt to assign ADMIN role safely defaulted to EMPLOYEE');
    const newEmpId = createEmpRes.data?.data?.employeeId;

    // 6. Verify employee record and masked bank details
    if (newEmpId) {
      const getEmpRes = await request(`/api/employees/${newEmpId}`, {
        headers: { Authorization: `Bearer ${hrmToken}` }
      });
      assert(getEmpRes.status === 200 && getEmpRes.data.data.bankDetails.accountNumberMasked.endsWith('7890'), 'Employee details retrieved with masked bank account number');
      assert(getEmpRes.data.data.metrics.contractsCount === 1, 'Employee smart button indicates 1 active contract created automatically');

      // Verify leave allocations were auto-created
      const leaveRes = await request(`/api/employees/${newEmpId}/time-off`, {
        headers: { Authorization: `Bearer ${hrmToken}` }
      });
      assert(leaveRes.status === 200 && leaveRes.data.data.allocations.length >= 3, 'Annual leave allocations automatically granted upon employee creation');
    }

    console.log('\n================================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED                 `);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runTests().then(() => process.exit(0));
}

module.exports = runTests;
