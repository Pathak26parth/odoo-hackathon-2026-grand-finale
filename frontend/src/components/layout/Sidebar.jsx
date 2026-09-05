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
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout, switchRole, isEmployeeOnly } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isTimeOffActive = location.pathname.startsWith('/time-off');
  const [timeOffExpanded, setTimeOffExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Employees', path: '/employees', icon: Users, enabled: true },
    { label: 'Contracts', path: '/contracts', icon: FileText, enabled: true },
    { label: 'Attendance', path: '/attendance', icon: Clock, enabled: true },
    { label: 'Working Schedules', path: '/working-schedules', icon: Calendar, enabled: true }
  ];

  const futureItems = [
    { label: 'Payroll', path: '/payroll', icon: CreditCard, enabled: false },
    { label: 'Reports', path: '/reports', icon: BarChart3, enabled: false }
  ];

  const adminItems = [
    { label: 'Users', path: '/admin/users', icon: Users, enabled: true },
    { label: 'Roles & Permissions', path: '/admin/roles', icon: Shield, enabled: false }
  ];

  const renderNavLink = (item) => {
    const Icon = item.icon;
    if (!item.enabled) {
      return (
        <div
          key={item.label}
          title="Coming in next step"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 rounded-lg cursor-not-allowed opacity-60"
        >
          <Icon className="w-4 h-4 shrink-0 text-slate-400" />
          <span>{item.label}</span>
        </div>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.path}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

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
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-0.5">
                HR &amp; Payroll
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {/* Main Module Nav */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Modules
            </p>
            <nav className="space-y-0.5">
              {navItems.map(renderNavLink)}

              {/* Nested Time Off Navigation */}
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

                {/* Sub-routes */}
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

                    {/* Time Off Types hidden for Employee role */}
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

              {futureItems.map(renderNavLink)}
            </nav>
          </div>

          {/* Admin Nav */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin
            </p>
            <nav className="space-y-0.5">{adminItems.map(renderNavLink)}</nav>
          </div>
        </div>

        {/* Bottom User Area & Quick Role Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          {/* Quick Role Switcher */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Switch Role:
            </span>
            <div className="flex items-center gap-1">
              {['Admin', 'HR Manager', 'Employee'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    currentUser?.role === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title={`Test as ${r}`}
                >
                  {r === 'HR Manager' ? 'HR' : r === 'Employee' ? 'Emp' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <span className="inline-block text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 truncate">
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
