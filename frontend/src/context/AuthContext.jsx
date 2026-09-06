import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { getStoredToken, clearStoredTokens } from '../services/api';

const AuthContext = createContext(null);
const AUTH_KEY = 'peoplepay360_current_user';

function normalizeRole(roleStr) {
  if (!roleStr) return 'Employee';
  const clean = String(roleStr).toUpperCase().replace(/\s+/g, '_');
  if (clean === 'ADMIN') return 'Admin';
  if (clean === 'HR_MANAGER') return 'HR Manager';
  if (clean === 'HR_PAYROLL_ADMIN' || clean === 'HR_PAYROLL_MANAGER') return 'HR Payroll Manager';
  if (clean === 'HR_PAYROLL_USER') return 'HR Payroll User';
  if (clean === 'EMPLOYEE') return 'Employee';
  return roleStr;
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Restore authenticated session from backend on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        const normRole = normalizeRole(userData.role);
        const userObj = {
          id: String(userData.id),
          email: userData.email,
          name: userData.employee ? `${userData.employee.firstName || ''} ${userData.employee.lastName || ''}`.trim() || userData.employee.fullName || userData.email.split('@')[0] : userData.email.split('@')[0],
          role: normRole,
          roleRaw: userData.role,
          employeeId: userData.employee?.employeeCode || (userData.employee_id ? `EMP-${String(userData.employee_id).padStart(3, '0')}` : null),
          internalEmployeeId: userData.employee?.id || userData.employee_id || null,
          employeeName: userData.employee?.fullName || null,
          department: userData.employee?.departmentName || 'General',
          position: userData.employee?.jobPosition || normRole,
          avatar: userData.employee?.profilePhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          permissions: userData.permissions || [],
          faceEnrollmentStatus: userData.employee?.faceEnrollmentStatus || 'NOT_ENROLLED'
        };

        setCurrentUser(userObj);
        localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
      } catch (err) {
        console.warn('[Auth] Session restoration failed, clearing token:', err.message);
        clearStoredTokens();
        setCurrentUser(null);
        localStorage.removeItem(AUTH_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    let isHandlingUnauthorized = false;
    const handleUnauthorized = async () => {
      if (isHandlingUnauthorized) return;
      isHandlingUnauthorized = true;
      try {
        await logout();
      } finally {
        isHandlingUnauthorized = false;
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Call real backend authentication
    const authData = await authService.login(trimmedEmail, password);
    const u = authData.user;
    const normRole = normalizeRole(u.role);

    const userObj = {
      id: String(u.id),
      email: u.email,
      name: u.name || u.email.split('@')[0],
      role: normRole,
      roleRaw: u.role,
      employeeId: u.employeeCode || (u.employeeId ? `EMP-${String(u.employeeId).padStart(3, '0')}` : null),
      internalEmployeeId: u.employeeId || null,
      employeeName: u.name || null,
      department: u.departmentName || 'General',
      position: u.jobPosition || normRole,
      avatar: u.profilePhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      permissions: u.permissions || [],
      faceEnrollmentStatus: u.faceEnrollmentStatus || 'NOT_ENROLLED'
    };

    setCurrentUser(userObj);
    localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
    return userObj;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      clearStoredTokens();
      setCurrentUser(null);
      localStorage.removeItem(AUTH_KEY);
    }
  };

  // Quick switcher for demo and review testing
  const switchRole = async (newRole) => {
    // Map role to seeded demo account
    const roleMap = {
      'Admin': { email: 'admin@peoplepay360.com', pass: 'Admin@123' },
      'HR Manager': { email: 'hrmanager@peoplepay360.com', pass: 'Password@123' },
      'HR Payroll Manager': { email: 'payrolladmin@peoplepay360.com', pass: 'Password@123' },
      'HR Payroll User': { email: 'payrolluser@peoplepay360.com', pass: 'Password@123' },
      'Employee': { email: 'employee@peoplepay360.com', pass: 'Password@123' }
    };

    const target = roleMap[newRole];
    if (target) {
      try {
        await login(target.email, target.pass);
      } catch (e) {
        console.warn('[SwitchRole] Fast switch fallback:', e.message);
      }
    }
  };

  // Dynamic Permission Checks
  const role = currentUser?.role || 'Guest';
  const permissions = currentUser?.permissions || [];

  const can = (permissionCode) => {
    if (role === 'Admin') return true;
    return permissions.includes(permissionCode);
  };

  const isHRorAdmin =
    role === 'Admin' ||
    role === 'HR Manager' ||
    role === 'HR Payroll User' ||
    role === 'HR Payroll Manager';

  const isEmployeeOnly = role === 'Employee';
  const isHRPayrollUser = role === 'HR Payroll User' || currentUser?.roleRaw === 'HR_PAYROLL_USER';
  const canApproveTimeOff = role === 'Admin' || role === 'HR Manager' || role === 'HR Payroll Manager' || isHRPayrollUser || can('timeoff.approve');
  const canManageAllocations = role === 'Admin' || role === 'HR Manager' || role === 'HR Payroll Manager' || isHRPayrollUser || can('timeoff.allocations_manage');
  const canManageTimeOffTypes = role === 'Admin' || role === 'HR Manager' || role === 'HR Payroll Manager' || isHRPayrollUser || can('timeoff.types_manage');

  // Payroll Configuration permissions
  const canViewPayrollConfig =
    role === 'Admin' || role === 'HR Payroll Manager' || isHRPayrollUser || can('payroll.read');
  const canManagePayrollConfig =
    role === 'Admin' || role === 'HR Payroll Manager' || can('salary_rules.manage');
  const canAccessDashboard = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Manager' || isHRPayrollUser || can('dashboard.read');
  const canAccessReports = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Manager' || isHRPayrollUser || can('reports.read') || can('dashboard.read');
  const canManageUsers = role === 'Admin' || can('users.manage') || can('users.create');
  const canRegisterFace = isHRorAdmin;
  const isHRManager = role === 'HR Manager' || currentUser?.roleRaw === 'HR_MANAGER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        permissions,
        can,
        isAuthenticated: !!currentUser,
        loading,
        login,
        logout,
        switchRole,
        isHRorAdmin,
        isEmployeeOnly,
        canApproveTimeOff,
        canManageAllocations,
        canManageTimeOffTypes,
        canViewPayrollConfig,
        canManagePayrollConfig,
        canAccessDashboard,
        canAccessReports,
        canManageUsers,
        canRegisterFace,
        isHRManager
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
