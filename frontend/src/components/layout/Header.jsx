import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Shield,
  CheckCheck,
  Check,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  BellOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumb } from './Breadcrumb';
import notificationService from '../../services/notificationService';

// Relative time helper
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHrs = Math.floor(diffInMin / 60);
  if (diffInHrs < 24) return `${diffInHrs}h ago`;
  const diffInDays = Math.floor(diffInHrs / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  });
}

export const Header = ({ onToggleSidebar, breadcrumbs = [] }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const data = await notificationService.getNotifications({ limit: 25 });
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? (data.notifications?.filter((n) => !n.is_read)?.length || 0));
      }
    } catch (err) {
      console.error('[Header] Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 45000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Header] Failed to mark read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Header] Failed to mark all read:', err);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('[Header] Failed to delete notification:', err);
    }
  };

  // Handle clicking a notification with link
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Icon helper
  const renderNotifIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'WARNING':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'ALERT':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertOctagon className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left Area: Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Right Area: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dynamic Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            title="Notifications"
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) loadNotifications();
            }}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              notifOpen
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500/20'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-xs overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={notifLoading}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Refresh notifications"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${notifLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <BellOff className="w-5 h-5" />
                    </div>
                    <p className="text-slate-700 font-bold text-xs">No notifications yet</p>
                    <p className="text-slate-400 text-[11px] max-w-[200px] mx-auto">
                      When you receive payroll, time-off, or schedule updates, they'll appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-3 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                        notif.is_read
                          ? 'bg-white hover:bg-slate-50/80 text-slate-600'
                          : 'bg-blue-50/30 hover:bg-blue-50/60 text-slate-900 font-medium'
                      }`}
                    >
                      {renderNotifIcon(notif.type)}

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${notif.is_read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {notif.link && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-blue-600 group-hover:text-blue-700">
                            <span>Open link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unread indicator pill */}
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200/80 text-center text-[11px] text-slate-500 font-medium">
                  Showing {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <img
              key={currentUser?.avatar || currentUser?.profilePhotoUrl || 'header-avatar'}
              src={
                currentUser?.avatar ||
                currentUser?.profilePhotoUrl ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'Admin User'}
              </p>
              <span
                className={`text-[10px] font-medium ${
                  currentUser?.role === 'HR Manager'
                    ? 'text-emerald-700 font-bold'
                    : currentUser?.role === 'Admin'
                    ? 'text-purple-700 font-bold'
                    : 'text-slate-500'
                }`}
              >
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
                <span
                  className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                    currentUser?.role === 'HR Manager'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : currentUser?.role === 'Admin'
                      ? 'text-purple-700 bg-purple-50 border-purple-200'
                      : 'text-blue-700 bg-blue-50 border-blue-100'
                  }`}
                >
                  {currentUser?.role || 'Admin'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer"
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
