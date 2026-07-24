import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/db';
import {
  Search,
  Bell,
  Sun,
  Moon,
  UserCheck,
  LogOut,
  ChevronDown,
  Shield,
  ShieldCheck,
  User,
  GraduationCap,
  Sparkles,
  Check,
  X
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenMobileMenu?: () => void }> = () => {
  const { currentUser, currentRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const settings = db.getSettings();
  const notifications = currentUser ? db.getNotifications(currentUser.id) : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center space-x-1"><Shield className="w-3 h-3 mr-1" /> Super Admin</span>;
      case 'admin':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center space-x-1"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</span>;
      case 'teacher':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1"><User className="w-3 h-3 mr-1" /> Faculty</span>;
      case 'student':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center space-x-1"><GraduationCap className="w-3 h-3 mr-1" /> Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors">
      {/* Left: Branding & Search */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md shadow-blue-500/20">
            LH
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {settings.name}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Enterprise LMS & Skill Accelerator
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 w-64 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search courses, students, fees..."
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Role Switcher Button */}
        <button
          onClick={() => setShowRoleSwitcher(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Role Switcher</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                <span className="text-[10px] text-slate-500 font-semibold">{notifications.length} Total</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => db.markNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/30"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                  <div className="mt-2">{getRoleBadge(currentRole)}</div>
                </div>

                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK ROLE SWITCHER MODAL */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Demo Role Switcher</h3>
                <p className="text-xs text-slate-500">Instantly test the LMS as Super Admin, Admin, Teacher, or Student</p>
              </div>
              <button
                onClick={() => setShowRoleSwitcher(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    loginAsUser(u.id);
                    setShowRoleSwitcher(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    currentUser?.id === u.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                      <div className="mt-1">{getRoleBadge(u.role)}</div>
                    </div>
                  </div>
                  {currentUser?.id === u.id && (
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
