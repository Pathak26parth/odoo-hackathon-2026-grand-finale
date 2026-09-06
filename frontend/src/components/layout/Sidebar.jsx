// components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  Calendar,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Sliders,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const {
    currentUser,
    role,
    logout,
    switchRole,
    isEmployeeOnly,
    canAccessDashboard,
    canAccessReports,
    canManageUsers,
    canViewPayrollConfig,
    isHRorAdmin,
    canRegisterFace,
    isHRManager
  } = useAuth();

  const isPayrollAdmin =
    role === 'HR Payroll Manager' ||
    role === 'HR Payroll Admin' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

  const isAdmin = role === 'Admin';

  const location = useLocation();
  const navigate = useNavigate();

  // Accordion states
  const isAttendanceActive = location.pathname.startsWith('/attendance');
  const [attendanceExpanded, setAttendanceExpanded] = useState(true);

  const isTimeOffActive = location.pathname.startsWith('/time-off');
  const [timeOffExpanded, setTimeOffExpanded] = useState(true);

  const isPayrollActive = location.pathname.startsWith('/payroll');
  const [payrollExpanded, setPayrollExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSingleLink = (label, path, Icon) => (
    <NavLink
      key={label}
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0 text-slate-500" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-base shadow-xs">
              P
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
                People<span className="text-blue-600">Pay</span>360
              </span>
              {isHRManager ? (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-emerald-600" /> HR Operations Hub
                </span>
              ) : isPayrollAdmin ? (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-blue-600" /> Payroll Admin Hub
                </span>
              ) : (
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-0.5">
                  HR &amp; Payroll
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {/* Dashboard & Core Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Overview</span>
              {isHRManager && (
                <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                  HR Panel
                </span>
              )}
              {isPayrollAdmin && (
                <span className="text-[9px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                  Payroll Admin
                </span>
              )}
            </p>
            <nav className="space-y-0.5">
              {/* Dedicated Payroll Admin Panel Link (Primary for Payroll Admin, also accessible to System Admin) */}
              {(isPayrollAdmin || isAdmin) &&
                renderSingleLink('Payroll Admin Panel', '/payroll/admin-panel', Sliders)}

              {/* Dashboard Link (HR Manager, HR Payroll Manager & Admin) */}
              {canAccessDashboard && renderSingleLink('Dashboard', '/dashboard', LayoutDashboard)}

              {/* Employees (All can view; Employee views self) */}
              {renderSingleLink(
                isEmployeeOnly ? 'My Profile' : 'Employees',
                isEmployeeOnly
                  ? `/employees/${currentUser?.employeeId || currentUser?.internalEmployeeId || currentUser?.id || ''}`
                  : '/employees',
                Users
              )}

              {/* Contracts (My Contract for Employee, Contracts for HR/Admin) */}
              {renderSingleLink(isEmployeeOnly ? 'My Contract' : 'Contracts', '/contracts', FileText)}

              {/* Working Schedules (Hidden for Employee) */}
              {!isEmployeeOnly && renderSingleLink('Working Schedules', '/working-schedules', Calendar)}
            </nav>
          </div>

          {/* ATTENDANCE SECTION WITH SUB-ITEMS */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Time &amp; Attendance
            </p>
            <nav className="space-y-0.5">
              {/* Nested Attendance Accordion (For all non-employee roles: Admin, HR Manager, HR Payroll) */}
              {!isEmployeeOnly && (
                <div>
                  <button
                    type="button"
                    onClick={() => setAttendanceExpanded(!attendanceExpanded)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isAttendanceActive
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>Attendance</span>
                    </div>
                    {attendanceExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {attendanceExpanded && (
                    <div className="pl-9 pr-1 py-1 space-y-0.5 border-l border-slate-100 ml-5 my-0.5">
                      <NavLink
                        to="/attendance"
                        end
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Attendance Records</span>
                      </NavLink>

                      <NavLink
                        to="/attendance/face-check-in"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>Face Check-In</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* For Employee-only portal, provide Face Check-In and My Attendance links */}
              {isEmployeeOnly && (
                <div className="space-y-0.5">
                  <NavLink
                    to="/attendance/face-check-in"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>Face Check-In</span>
                  </NavLink>

                  <NavLink
                    to="/attendance"
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Clock className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>My Attendance</span>
                  </NavLink>
                </div>
              )}

              {/* Nested Time Off Accordion */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setTimeOffExpanded(!timeOffExpanded)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isTimeOffActive
                      ? 'bg-blue-50/70 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>Time Off</span>
                  </div>
                  {timeOffExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {timeOffExpanded && (
                  <div className="pl-9 pr-1 py-1 space-y-0.5 border-l border-slate-100 ml-5 my-0.5">
                    <NavLink
                      to="/time-off/requests"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <span>Requests</span>
                    </NavLink>

                    <NavLink
                      to="/time-off/allocations"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <span>Allocations</span>
                    </NavLink>

                    {!isEmployeeOnly && (
                      <NavLink
                        to="/time-off/types"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Time Off Types</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* PAYROLL MODULE WITH SUB-ITEMS (Hidden for HR Manager & Employee) */}
          {canViewPayrollConfig && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payroll Management
              </p>
              <nav className="space-y-0.5">
                <div>
                  <button
                    type="button"
                    onClick={() => setPayrollExpanded(!payrollExpanded)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isPayrollActive
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>Payroll</span>
                    </div>
                    {payrollExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {payrollExpanded && (
                    <div className="pl-9 pr-1 py-1 space-y-0.5 border-l border-slate-100 ml-5 my-0.5">
                      {(isPayrollAdmin || isAdmin) && (
                        <NavLink
                          to="/payroll/admin-panel"
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`
                          }
                        >
                          <Sliders className="w-3.5 h-3.5 text-blue-500" />
                          <span>Admin Command Center</span>
                        </NavLink>
                      )}

                      <NavLink
                        to="/payroll/payruns"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Payruns</span>
                      </NavLink>

                      <NavLink
                        to="/payroll/payslips"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Payslips</span>
                      </NavLink>

                      <NavLink
                        to="/payroll/salary-structures"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Salary Structures</span>
                      </NavLink>

                      <NavLink
                        to="/payroll/salary-rules"
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <span>Salary Rules</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}

          {/* REPORTS (HR Payroll Manager & Admin only) */}
          {canAccessReports && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Analytics
              </p>
              <nav className="space-y-0.5">
                {renderSingleLink('Reports', '/reports', BarChart3)}
              </nav>
            </div>
          )}

          {/* ADMIN NAVIGATION (Admin only) */}
          {canManageUsers && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </p>
              <nav className="space-y-0.5">
                {renderSingleLink('Users', '/admin/users', Users)}
                <div
                  title="Role policies enforced via system matrix"
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 rounded-lg cursor-not-allowed opacity-60"
                >
                  <Shield className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Roles &amp; Permissions</span>
                </div>
              </nav>
            </div>
          )}
        </div>

        {/* Bottom User Profile Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                key={currentUser?.avatar || currentUser?.profilePhotoUrl || 'sidebar-avatar'}
                src={
                  currentUser?.avatar ||
                  currentUser?.profilePhotoUrl ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border truncate ${
                  currentUser?.role === 'HR Manager'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold'
                    : currentUser?.role === 'Admin'
                    ? 'text-purple-700 bg-purple-50 border-purple-200 font-bold'
                    : currentUser?.role === 'HR Payroll Manager' || currentUser?.role === 'HR Payroll User'
                    ? 'text-blue-700 bg-blue-50 border-blue-200 font-bold'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
