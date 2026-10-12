import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Receipt,
  User,
  LogOut,
  Bell,
  Sparkles,
  Phone,
  Clock,
  Building2,
  ChevronDown,
  Check,
  Calendar,
  Layers,
  Star,
  Activity,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerHeader({
  activeTab,
  setActiveTab,
  business,
  terminology,
  unreadCount = 0,
  onOpenNotifications,
  onOpenBooking,
  onOpenContact,
  businesses = [],
  onSwitchBusiness,
  loading = false,
}) {
  const { currentUser, userProfile, logout, memberships } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const busDropdownRef = useRef(null);

  const displayName = userProfile?.name || currentUser?.displayName || "Valued Client";
  const userEmail = currentUser?.email || "";
  const firstLetter = displayName.charAt(0).toUpperCase();

  const businessName = business?.name || business?.businessName || "BizManager Service";
  const businessType = business?.type || business?.businessType || "Business";

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (busDropdownRef.current && !busDropdownRef.current.contains(event.target)) {
        setBusinessDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  const navItems = [
    { id: "home", label: "Overview" },
    { id: "explore", label: "Explore Stores" },
    { id: "services", label: terminology?.services || "Services" },
    { id: "appointments", label: terminology?.appointments || "Bookings" },
    { id: "invoices", label: "Billing" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      {/* Top subtle indeterminate progress bar during loading */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden z-50 bg-indigo-100/50 dark:bg-indigo-950/50">
          <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-600 animate-indeterminate" />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Brand / Business Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 font-bold text-white shadow-md shadow-indigo-500/25 text-sm ring-2 ring-indigo-500/20">
            {businessName.charAt(0).toUpperCase()}
          </div>

          <div className="relative" ref={busDropdownRef}>
            <div
              onClick={() => businesses.length > 1 && setBusinessDropdownOpen(!businessDropdownOpen)}
              className={`flex items-center gap-1.5 ${
                businesses.length > 1 ? "cursor-pointer group" : ""
              }`}
            >
              <div>
                <h1
                  className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight leading-tight max-w-[170px] sm:max-w-[210px] md:max-w-[240px] truncate flex items-center gap-1.5"
                  title={businessName}
                >
                  <span className="truncate">{businessName}</span>
                  {businesses.length > 1 && (
                    <ChevronDown
                      size={13}
                      className="text-slate-400 group-hover:text-indigo-600 shrink-0 transition"
                    />
                  )}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="rounded-full bg-indigo-50 border border-indigo-200/50 px-2 py-0.2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/40 dark:text-indigo-300">
                    {businessType}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">• Client Portal</span>
                </div>
              </div>
            </div>

            {/* Multi-business switcher popup */}
            {businessDropdownOpen && businesses.length > 1 && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Service Provider
                </div>
                <div className="space-y-1">
                  {businesses.map((b) => {
                    const isCurrent = b.id === business?.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSwitchBusiness?.(b.id);
                          setBusinessDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                          isCurrent
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="text-left truncate">
                          <p className="truncate">{b.name || b.businessName}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{b.type || b.industry}</span>
                        </div>
                        {isCurrent && <Check size={14} className="text-emerald-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Bar - Comfortable, single-line tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm shadow-indigo-500/10 dark:bg-slate-900 dark:text-indigo-400 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Notifications & Profile Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Book Now Primary Button */}
          <button
            onClick={onOpenBooking}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600 transition active:scale-95 whitespace-nowrap"
          >
            <Calendar size={13} />
            <span>{terminology?.bookAppointment || "Book Appointment"}</span>
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun size={15} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon size={15} className="text-slate-600 dark:text-slate-300 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-extrabold text-white animate-pulse shadow-xs shadow-emerald-500/40">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 font-bold text-xs text-white shadow-sm shadow-indigo-500/20">
                {firstLetter}
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 z-50">
                <div className="border-b border-slate-100 p-2.5 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                </div>

                <div className="mt-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <User size={14} className="text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("activity");
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Activity size={14} className="text-slate-400" />
                    <span>Activity History</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("reviews");
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Star size={14} className="text-amber-500" />
                    <span>My Reviews</span>
                  </button>

                  {/* Dark/Light mode toggle in profile menu */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
                      <span>Theme Mode</span>
                    </div>
                    <span className="text-[10px] rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>

                  {/* If user is business owner/staff, show jump back to management */}
                  {memberships?.length > 0 && (
                    <Link
                      to="/app"
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 font-semibold"
                    >
                      <ArrowLeft size={14} />
                      <span>Workspace Admin</span>
                    </Link>
                  )}
                </div>

                <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
