import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Existing Pages
import { Login } from './pages/auth/Login';
import { Users } from './pages/admin/Users';
import { UserForm } from './pages/admin/UserForm';
import { Employees } from './pages/employees/Employees';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { Contracts } from './pages/contracts/Contracts';
import { ContractForm } from './pages/contracts/ContractForm';
import { WorkingSchedules } from './pages/schedules/WorkingSchedules';
import { ScheduleForm } from './pages/schedules/ScheduleForm';

// Module 9: Attendance
import { Attendance } from './pages/attendance/Attendance';
import { AttendanceDetail } from './pages/attendance/AttendanceDetail';

// Module 10: Time Off Requests
import { TimeOffRequests } from './pages/timeOff/TimeOffRequests';
import { TimeOffRequestNew } from './pages/timeOff/TimeOffRequestNew';

// Module 11: Time Off Allocations
import { TimeOffAllocations } from './pages/timeOff/TimeOffAllocations';
import { TimeOffAllocationNew } from './pages/timeOff/TimeOffAllocationNew';

// Module 12: Time Off Types
import { TimeOffTypes } from './pages/timeOff/TimeOffTypes';
import { TimeOffTypeDetail } from './pages/timeOff/TimeOffTypeDetail';

// App Layout with Sidebar & Header
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic breadcrumb generation based on route
  const getBreadcrumbs = () => {
    const path = location.pathname;

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

    // Module 9: Attendance
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

    // Module 10: Time Off Requests
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

    // Module 11: Time Off Allocations
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

    // Module 12: Time Off Types
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
          <Outlet />
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
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/employees' : '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
            <Route path="/" element={<IndexRedirect />} />

            {/* SCREEN 2: User Management List */}
            <Route path="/admin/users" element={<Users />} />

            {/* SCREEN 3: Create / Edit User */}
            <Route path="/admin/users/new" element={<UserForm />} />
            <Route path="/admin/users/:id" element={<UserForm />} />

            {/* SCREEN 4: Employee Management Landing */}
            <Route path="/employees" element={<Employees />} />

            {/* SCREEN 5: Employee Detail / Form */}
            <Route path="/employees/new" element={<EmployeeDetail />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />

            {/* SCREEN 6: Contracts List */}
            <Route path="/contracts" element={<Contracts />} />

            {/* SCREEN 7: Contract Create / Edit Form */}
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractForm />} />

            {/* SCREEN 8: Working Schedules */}
            <Route path="/working-schedules" element={<WorkingSchedules />} />
            <Route path="/working-schedules/new" element={<ScheduleForm />} />
            <Route path="/working-schedules/:id" element={<ScheduleForm />} />

            {/* MODULE 9: Attendance */}
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance/new" element={<AttendanceDetail />} />
            <Route path="/attendance/:id" element={<AttendanceDetail />} />

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
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<IndexRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
