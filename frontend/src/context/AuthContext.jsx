import React, { createContext, useContext, useState } from 'react';
import { getUsers } from '../data/users';

const AuthContext = createContext(null);
const AUTH_KEY = 'peoplepay360_current_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default admin user
    return {
      id: 'usr-1',
      name: 'Admin User',
      email: 'admin@peoplepay360.com',
      role: 'Admin',
      employeeId: 'emp-1',
      employeeName: 'Amelia Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    };
  });

  const login = (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (found && (password === 'admin123' || password === 'password')) {
      const userObj = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        employeeId: found.employeeId || 'emp-1',
        employeeName: found.employeeName || found.name,
        avatar:
          found.avatar ||
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      };
      setCurrentUser(userObj);
      localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
      return userObj;
    }

    // Default mock user
    if (trimmedEmail === 'admin@peoplepay360.com' && password === 'admin123') {
      const userObj = {
        id: 'usr-1',
        name: 'Admin User',
        email: 'admin@peoplepay360.com',
        role: 'Admin',
        employeeId: 'emp-1',
        employeeName: 'Amelia Johnson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      };
      setCurrentUser(userObj);
      localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
      return userObj;
    }

    if (password === 'admin123') {
      const userObj = {
        id: `usr-${Date.now()}`,
        name: trimmedEmail.split('@')[0].replace('.', ' ').replace(/^\w/, (c) => c.toUpperCase()),
        email: trimmedEmail,
        role: 'Admin',
        employeeId: 'emp-1',
        employeeName: 'Amelia Johnson',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
      setCurrentUser(userObj);
      localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
      return userObj;
    }

    throw new Error('Invalid email or password. Use admin@peoplepay360.com / admin123');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  // Quick switcher for seamless role testing in pairs or reviews
  const switchRole = (newRole) => {
    if (!currentUser) return;
    let employeeId = currentUser.employeeId;
    let employeeName = currentUser.employeeName;

    if (newRole === 'Employee') {
      employeeId = 'emp-1';
      employeeName = 'Amelia Johnson';
    } else if (newRole === 'HR Manager') {
      employeeId = 'emp-2';
      employeeName = 'Ethan Williams';
    }

    const updated = {
      ...currentUser,
      role: newRole,
      employeeId,
      employeeName
    };
    setCurrentUser(updated);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
  };

  // Role-based permissions
  const role = currentUser?.role || 'Admin';
  const isHRorAdmin =
    role === 'Admin' ||
    role === 'HR Manager' ||
    role === 'HR Payroll User' ||
    role === 'HR Payroll Manager';
  const isEmployeeOnly = role === 'Employee';
  const canApproveTimeOff = isHRorAdmin;
  const canManageAllocations = isHRorAdmin;
  const canManageTimeOffTypes = isHRorAdmin;

  // Payroll Configuration permissions
  const canViewPayrollConfig =
    role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';
  const canManagePayrollConfig =
    role === 'Admin' || role === 'HR Payroll Manager';
  const canAccessDashboard = role === 'Admin' || role === 'HR Payroll Manager';
  const canAccessReports = role === 'Admin' || role === 'HR Payroll Manager';
  const canManageUsers = role === 'Admin';
  const canRegisterFace = role !== 'Employee';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
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
        canRegisterFace
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
