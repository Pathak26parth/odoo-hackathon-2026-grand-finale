import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Authentication & Users
import { Login } from './pages/auth/Login';
import { Users } from './pages/admin/Users';
import { UserForm } from './pages/admin/UserForm';

// Employees & Contracts
import { Employees } from './pages/employees/Employees';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { Contracts } from './pages/contracts/Contracts';
import { ContractForm } from './pages/contracts/ContractForm';
import { WorkingSchedules } from './pages/schedules/WorkingSchedules';
import { ScheduleForm } from './pages/schedules/ScheduleForm';

// Attendance & Face Recognition
import { Attendance } from './pages/attendance/Attendance';
import { AttendanceDetail } from './pages/attendance/AttendanceDetail';
import { FaceCheckIn } from './pages/attendance/FaceCheckIn';
import { FaceRegistration } from './pages/attendance/FaceRegistration';
import { FaceHistory } from './pages/attendance/FaceHistory';

// Time Off
import { TimeOffRequests } from './pages/timeOff/TimeOffRequests';
import { TimeOffRequestNew } from './pages/timeOff/TimeOffRequestNew';
import { TimeOffAllocations } from './pages/timeOff/TimeOffAllocations';
import { TimeOffAllocationNew } from './pages/timeOff/TimeOffAllocationNew';
import { TimeOffTypes } from './pages/timeOff/TimeOffTypes';
import { TimeOffTypeDetail } from './pages/timeOff/TimeOffTypeDetail';

// Payroll
import { SalaryStructures } from './pages/payroll/SalaryStructures';
import { SalaryStructureDetail } from './pages/payroll/SalaryStructureDetail';
import { SalaryRules } from './pages/payroll/SalaryRules';
import { SalaryRuleDetail } from './pages/payroll/SalaryRuleDetail';
import { Payruns } from './pages/payroll/Payruns';
import { PayrunWizard } from './pages/payroll/PayrunWizard';
import { PayrunDetail } from './pages/payroll/PayrunDetail';
import { Payslips } from './pages/payroll/Payslips';
import { PayslipDetail } from './pages/payroll/PayslipDetail';

// Dashboard & Reports
import { Dashboard } from './pages/dashboard/Dashboard';
import { Reports } from './pages/reports/Reports';

// Home Landing Page
import { Home } from './pages/home/Home';

// App Layout with Sidebar & Header
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic breadcrumb generation based on route
  const getBreadcrumbs = () => {
    const path = location.pathname;

    // Dashboard
    if (path === '/dashboard') {
      return [{ label: 'Dashboard' }];
    }

    // Reports
    if (path === '/reports') {
      return [{ label: 'Reports' }];
    }

    // Admin Users
    if (path.startsWith('/admin/users/new')) {
      return [
        { label: 'Admin', link: '/admin/users' },
        { label: 'Users', link: '/admin/users' },
        { label: 'New User' }
      ];
    }
    if (path.startsWith('/admin/users/') && path !== '/admin/users') {
      return [
        { label: 'Admin', link: '/admin/users' },
        { label: 'Users', link: '/admin/users' },
        { label: 'Edit User' }
      ];
    }
    if (path === '/admin/users') {
      return [
        { label: 'Admin', link: '/admin/users' },
        { label: 'Users' }
      ];
    }

    // Employees
    if (path === '/employees/new') {
      return [
        { label: 'Employees', link: '/employees' },
        { label: 'New Employee' }
      ];
    }
    if (path.startsWith('/employees/') && path !== '/employees') {
      return [
        { label: 'Employees', link: '/employees' },
        { label: 'Employee Details' }
      ];
    }
    if (path === '/employees') {
      return [{ label: 'Employees' }];
    }

    // Contracts
    if (path === '/contracts/new') {
      return [
        { label: 'Contracts', link: '/contracts' },
        { label: 'New Contract' }
      ];
    }
    if (path.startsWith('/contracts/') && path !== '/contracts') {
      return [
        { label: 'Contracts', link: '/contracts' },
        { label: 'Contract Details' }
      ];
    }
    if (path === '/contracts') {
      return [{ label: 'Contracts' }];
    }

    // Working Schedules
    if (path === '/working-schedules/new') {
      return [
        { label: 'Working Schedules', link: '/working-schedules' },
        { label: 'New Schedule' }
      ];
    }
    if (path.startsWith('/working-schedules/') && path !== '/working-schedules') {
      return [
        { label: 'Working Schedules', link: '/working-schedules' },
        { label: 'Schedule Details' }
      ];
    }
    if (path === '/working-schedules') {
      return [{ label: 'Working Schedules' }];
    }

    // Attendance & Face Recognition
    if (path === '/attendance/face-check-in') {
      return [
        { label: 'Attendance', link: '/attendance' },
        { label: 'Face Attendance' }
      ];
    }
    if (path === '/attendance/face-registration') {
      return [
        { label: 'Attendance', link: '/attendance' },
        { label: 'Face Registration' }
      ];
    }
    if (path === '/attendance/face-history') {
      return [
        { label: 'Attendance', link: '/attendance' },
        { label: 'Face History' }
      ];
    }
    if (path === '/attendance/new') {
      return [
        { label: 'Attendance', link: '/attendance' },
        { label: 'New Attendance' }
      ];
    }
    if (path.startsWith('/attendance/') && path !== '/attendance') {
      return [
        { label: 'Attendance', link: '/attendance' },
        { label: 'Attendance Details' }
      ];
    }
    if (path === '/attendance') {
      return [{ label: 'Attendance' }];
    }

    // Time Off
    if (path === '/time-off/requests/new') {
      return [
        { label: 'Time Off', link: '/time-off/requests' },
        { label: 'Requests', link: '/time-off/requests' },
        { label: 'New Request' }
      ];
    }
    if (path === '/time-off/requests') {
      return [
        { label: 'Time Off', link: '/time-off/requests' },
        { label: 'Requests' }
      ];
    }
    if (path === '/time-off/allocations/new') {
      return [
        { label: 'Time Off', link: '/time-off/allocations' },
        { label: 'Allocations', link: '/time-off/allocations' },
        { label: 'New Allocation' }
      ];
    }
    if (path === '/time-off/allocations') {
      return [
        { label: 'Time Off', link: '/time-off/allocations' },
        { label: 'Allocations' }
      ];
    }
    if (path === '/time-off/types/new') {
      return [
        { label: 'Time Off', link: '/time-off/types' },
        { label: 'Time Off Types', link: '/time-off/types' },
        { label: 'New Type' }
      ];
    }
    if (path.startsWith('/time-off/types/') && path !== '/time-off/types') {
      return [
        { label: 'Time Off', link: '/time-off/types' },
        { label: 'Time Off Types', link: '/time-off/types' },
        { label: 'Type Details' }
      ];
    }
    if (path === '/time-off/types') {
      return [
        { label: 'Time Off', link: '/time-off/types' },
        { label: 'Time Off Types' }
      ];
    }

    // Payroll: Payruns
    if (path === '/payroll/payruns/new') {
      return [
        { label: 'Payroll', link: '/payroll/payruns' },
        { label: 'Payruns', link: '/payroll/payruns' },
        { label: 'New Payrun' }
      ];
    }
    if (path.startsWith('/payroll/payruns/') && path !== '/payroll/payruns') {
      return [
        { label: 'Payroll', link: '/payroll/payruns' },
        { label: 'Payruns', link: '/payroll/payruns' },
        { label: 'Payrun Processing' }
      ];
    }
    if (path === '/payroll/payruns') {
      return [
        { label: 'Payroll', link: '/payroll/payruns' },
        { label: 'Payruns' }
      ];
    }

    // Payroll: Payslips
    if (path.startsWith('/payroll/payslips/') && path !== '/payroll/payslips') {
      return [
        { label: 'Payroll', link: '/payroll/payslips' },
        { label: 'Payslips', link: '/payroll/payslips' },
        { label: 'Payslip Detail' }
      ];
    }
    if (path === '/payroll/payslips') {
      return [
        { label: 'Payroll', link: '/payroll/payslips' },
        { label: 'Payslips' }
      ];
    }

    // Payroll: Salary Structures
    if (path === '/payroll/salary-structures/new') {
      return [
        { label: 'Payroll', link: '/payroll/salary-structures' },
        { label: 'Salary Structures', link: '/payroll/salary-structures' },
        { label: 'New Structure' }
      ];
    }
    if (path.startsWith('/payroll/salary-structures/') && path !== '/payroll/salary-structures') {
      return [
        { label: 'Payroll', link: '/payroll/salary-structures' },
        { label: 'Salary Structures', link: '/payroll/salary-structures' },
        { label: 'Structure Details' }
      ];
    }
    if (path === '/payroll/salary-structures') {
      return [
        { label: 'Payroll', link: '/payroll/salary-structures' },
        { label: 'Salary Structures' }
      ];
    }

    // Payroll: Salary Rules
    if (path === '/payroll/salary-rules/new') {
      return [
        { label: 'Payroll', link: '/payroll/salary-rules' },
        { label: 'Salary Rules', link: '/payroll/salary-rules' },
        { label: 'New Rule' }
      ];
    }
    if (path.startsWith('/payroll/salary-rules/') && path !== '/payroll/salary-rules') {
      return [
        { label: 'Payroll', link: '/payroll/salary-rules' },
        { label: 'Salary Rules', link: '/payroll/salary-rules' },
        { label: 'Rule Details' }
      ];
    }
    if (path === '/payroll/salary-rules') {
      return [
        { label: 'Payroll', link: '/payroll/salary-rules' },
        { label: 'Salary Rules' }
      ];
    }

    return [{ label: 'Dashboard' }];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={getBreadcrumbs()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

// Route protection guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Default index redirection
const IndexRedirect = () => {
  const { isAuthenticated, canAccessDashboard, isEmployeeOnly, currentUser } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isEmployeeOnly) {
    const ownId = currentUser?.employeeId || currentUser?.internalEmployeeId || currentUser?.id || '1';
    return <Navigate to={`/employees/${ownId}`} replace />;
  }
  return <Navigate to={canAccessDashboard ? '/dashboard' : '/employees'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Home Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/console" element={<IndexRedirect />} />

            {/* MODULE 23: Payroll Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* MODULE 24: Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* SCREEN 2 & 3: User Management */}
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/users/new" element={<UserForm />} />
            <Route path="/admin/users/:id" element={<UserForm />} />

            {/* SCREEN 4 & 5: Employee Management */}
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/new" element={<EmployeeDetail />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />

            {/* SCREEN 6 & 7: Contracts */}
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractForm />} />

            {/* SCREEN 8: Working Schedules */}
            <Route path="/working-schedules" element={<WorkingSchedules />} />
            <Route path="/working-schedules/new" element={<ScheduleForm />} />
            <Route path="/working-schedules/:id" element={<ScheduleForm />} />

            {/* MODULE 9: Attendance Records */}
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance/new" element={<AttendanceDetail />} />
            <Route path="/attendance/:id" element={<AttendanceDetail />} />

            {/* MODULE 15: Face Recognition Attendance */}
            <Route path="/attendance/face-check-in" element={<FaceCheckIn />} />
            <Route path="/attendance/face-registration" element={<FaceRegistration />} />
            <Route path="/attendance/face-history" element={<FaceHistory />} />

            {/* MODULE 10: Time Off Requests */}
            <Route path="/time-off/requests" element={<TimeOffRequests />} />
            <Route path="/time-off/requests/new" element={<TimeOffRequestNew />} />

            {/* MODULE 11: Time Off Allocations */}
            <Route path="/time-off/allocations" element={<TimeOffAllocations />} />
            <Route path="/time-off/allocations/new" element={<TimeOffAllocationNew />} />

            {/* MODULE 12: Time Off Types */}
            <Route path="/time-off/types" element={<TimeOffTypes />} />
            <Route path="/time-off/types/new" element={<TimeOffTypeDetail />} />
            <Route path="/time-off/types/:id" element={<TimeOffTypeDetail />} />

            {/* MODULE 13: Salary Structures */}
            <Route path="/payroll/salary-structures" element={<SalaryStructures />} />
            <Route path="/payroll/salary-structures/new" element={<SalaryStructureDetail />} />
            <Route path="/payroll/salary-structures/:id" element={<SalaryStructureDetail />} />

            {/* MODULE 14: Salary Rules */}
            <Route path="/payroll/salary-rules" element={<SalaryRules />} />
            <Route path="/payroll/salary-rules/new" element={<SalaryRuleDetail />} />
            <Route path="/payroll/salary-rules/:id" element={<SalaryRuleDetail />} />

            {/* MODULE 16 & 17 & 18: Payruns */}
            <Route path="/payroll/payruns" element={<Payruns />} />
            <Route path="/payroll/payruns/new" element={<PayrunWizard />} />
            <Route path="/payroll/payruns/:id" element={<PayrunDetail />} />

            {/* MODULE 19 & 20 & 21: Payslips */}
            <Route path="/payroll/payslips" element={<Payslips />} />
            <Route path="/payroll/payslips/:id" element={<PayslipDetail />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<IndexRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
