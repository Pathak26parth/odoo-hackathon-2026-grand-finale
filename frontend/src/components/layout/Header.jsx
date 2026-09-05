import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumb } from './Breadcrumb';

export const Header = ({ onToggleSidebar, breadcrumbs = [] }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left Area: Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Right Area: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          title="Notifications"
          className="relative p-2 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'Admin User'}
              </p>
              <span className={`text-[10px] font-medium ${
                currentUser?.role === 'HR Manager'
                  ? 'text-emerald-700 font-bold'
                  : currentUser?.role === 'Admin'
                  ? 'text-purple-700 font-bold'
                  : 'text-slate-500'
              }`}>
                {currentUser?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser?.name || 'Admin User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'admin@peoplepay360.com'}</p>
                <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                  currentUser?.role === 'HR Manager'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : currentUser?.role === 'Admin'
                    ? 'text-purple-700 bg-purple-50 border-purple-200'
                    : 'text-blue-700 bg-blue-50 border-blue-100'
                }`}>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
