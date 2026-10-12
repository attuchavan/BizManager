import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Check,
  Sun,
  Moon,
  Plus,
  UserPlus,
  Calendar,
  FileText,
  Sparkles,
  CheckCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

const sampleNotifications = [
  {
    id: 1,
    title: "New appointment booked",
    desc: "Rahul Sharma scheduled Business Consultation for 10:00 AM",
    time: "10m ago",
    unread: true,
  },
  {
    id: 2,
    title: "Payment received",
    desc: "Received ₹4,500 from Priya Patil via UPI",
    time: "45m ago",
    unread: true,
  },
  {
    id: 3,
    title: "AI insight available",
    desc: "8 prospective leads are waiting for first response",
    time: "2h ago",
    unread: false,
  },
];

function Topbar({ onMenuClick }) {
  const {
    currentUser,
    userProfile,
    memberships,
    activeBusiness,
    switchBusiness,
    logout,
  } = useAuth();

  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const quickAddRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) {
        setQuickAddOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const displayName = userProfile?.name || currentUser?.displayName || "Entrepreneur";
  const email = currentUser?.email || "";
  const role = activeBusiness?.role || "OWNER";
  const businessName = activeBusiness?.businessName || "My Business";
  const firstLetter = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-md transition-colors sm:px-6 dark:border-slate-800/80 dark:bg-slate-950/80">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-900"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            placeholder="Search customers, invoices, metrics..."
            className="w-64 lg:w-80 rounded-xl border border-slate-200/80 bg-slate-100/60 py-2 pl-9 pr-14 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        <div className="sm:hidden font-bold tracking-tight text-slate-900 dark:text-white">
          BizManager
        </div>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Quick Add Action */}
        <div className="relative" ref={quickAddRef}>
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-500 active:scale-95"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Create</span>
          </button>

          {quickAddOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
              <Link
                to="/app/customers?action=new"
                onClick={() => setQuickAddOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <UserPlus size={15} className="text-blue-500" />
                <span>Add Customer</span>
              </Link>
              <Link
                to="/app/appointments"
                onClick={() => setQuickAddOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <Calendar size={15} className="text-emerald-500" />
                <span>Book Appointment</span>
              </Link>
              <Link
                to="/app/invoices"
                onClick={() => setQuickAddOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <FileText size={15} className="text-amber-500" />
                <span>Generate Invoice</span>
              </Link>
              <Link
                to="/app/ai"
                onClick={() => setQuickAddOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <Sparkles size={15} className="text-indigo-500" />
                <span>Ask AI Copilot</span>
              </Link>
            </div>
          )}
        </div>

        {/* Business Selector Dropdown */}
        {memberships.length > 0 && (
          <div className="relative hidden md:block">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-left transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800">
                <Building2 size={15} className="text-blue-500" />

                <div className="max-w-28 lg:max-w-36">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {businessName}
                  </p>
                  <p className="text-[10px] text-slate-400">{role}</p>
                </div>

                <ChevronDown
                  size={14}
                  className="text-slate-400 transition-transform group-open:rotate-180"
                />
              </summary>

              <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="px-3 py-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </p>
                </div>

                {memberships.map((membership) => (
                  <button
                    key={membership.businessId}
                    onClick={() => switchBusiness(membership.businessId)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Building2 size={14} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                          {membership.businessName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {membership.role}
                        </p>
                      </div>
                    </div>

                    {activeBusiness?.businessId === membership.businessId && (
                      <Check size={15} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon size={18} className="text-slate-600 dark:text-slate-300 transition-transform -rotate-12 hover:rotate-0" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      n.unread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile Popover */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="User account"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-xs font-bold text-white shadow-md shadow-indigo-600/25">
              {firstLetter}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-28 truncate text-xs font-bold text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400">{role}</p>
            </div>

            <ChevronDown
              size={14}
              className={`hidden text-slate-400 transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
                    {firstLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{email}</p>
                  </div>
                </div>
                <div className="mt-2.5 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {role} Workspace
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                <Link
                  to="/app/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <User size={15} />
                  <span>Profile & Preferences</span>
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun size={15} className="text-amber-400" />
                    ) : (
                      <Moon size={15} className="text-indigo-500" />
                    )}
                    <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                  </div>
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
