import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserRoundPlus,
  CalendarDays,
  BriefcaseBusiness,
  Receipt,
  CreditCard,
  Wallet,
  UserCog,
  Megaphone,
  Bot,
  BarChart3,
  Settings,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        name: "Analytics",
        path: "/app/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        name: "Customers",
        path: "/app/customers",
        icon: Users,
      },
      {
        name: "Leads",
        path: "/app/leads",
        icon: UserRoundPlus,
        badge: "8",
      },
      {
        name: "Appointments",
        path: "/app/appointments",
        icon: CalendarDays,
        badge: "4",
      },
      {
        name: "Services",
        path: "/app/services",
        icon: BriefcaseBusiness,
      },
      {
        name: "Form Submissions",
        path: "/app/forms",
        icon: FileText,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        name: "Invoices",
        path: "/app/invoices",
        icon: Receipt,
      },
      {
        name: "Payments",
        path: "/app/payments",
        icon: CreditCard,
      },
      {
        name: "Expenses",
        path: "/app/expenses",
        icon: Wallet,
      },
    ],
  },
  {
    label: "Growth & AI",
    items: [
      {
        name: "Employees",
        path: "/app/employees",
        icon: UserCog,
      },
      {
        name: "Marketing",
        path: "/app/marketing",
        icon: Megaphone,
      },
      {
        name: "AI Copilot",
        path: "/app/ai",
        icon: Bot,
        highlight: true,
      },
    ],
  },
];

function Sidebar({ mobileOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { activeBusiness } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const businessName = activeBusiness?.businessName || "My Business";
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MB";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-full overflow-hidden
          border-r border-slate-200/80 bg-white/95 backdrop-blur-md
          transition-all duration-300 ease-in-out
          dark:border-slate-800/80 dark:bg-slate-950/95
          lg:static lg:translate-x-0
          ${isCollapsed ? "lg:w-20" : "lg:w-68"}
          ${mobileOpen ? "w-72 translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo and Brand Header - Fixed at top */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800/70">
          <NavLink
            to="/app"
            className="flex items-center gap-3 overflow-hidden group"
            onClick={onClose}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              AI
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  BizManager
                </p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Intelligent Workspace
                </p>
              </div>
            )}
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Collapse toggle (Desktop) */}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>

            {/* Close button (Mobile) */}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Business Selector Badge - Fixed at top */}
        {!isCollapsed && (
          <div className="shrink-0 border-b border-slate-100 p-3.5 dark:border-slate-800/70">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100/90 font-bold text-xs text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {businessName}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Active Business</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items - Independently Scrollable */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6 sidebar-scrollbar">
          {navigation.map((section) => (
            <div key={section.label}>
              {!isCollapsed && (
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/90 dark:text-slate-500">
                  {section.label}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.exact}
                      onClick={onClose}
                      title={isCollapsed ? item.name : undefined}
                      className={({ isActive }) => `
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                        ${isCollapsed ? "justify-center px-0 py-2.5" : ""}
                        ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold dark:bg-indigo-600"
                            : item.highlight
                            ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 text-indigo-700 hover:from-indigo-500/20 hover:to-emerald-500/20 dark:text-indigo-300"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/90 dark:hover:text-slate-100"
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={19}
                            className={`shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? "text-white" : item.highlight ? "text-indigo-600 dark:text-indigo-400" : ""
                            }`}
                          />

                          {!isCollapsed && (
                            <span className="flex-1 truncate">{item.name}</span>
                          )}

                          {!isCollapsed && item.badge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {!isCollapsed && item.highlight && !isActive && (
                            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Workspace Card, Theme Toggle & Settings - Fixed at bottom */}
        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800/70 space-y-2">
          {/* Theme Option in Sidebar (Highlighted for mobile view and desktop) */}
          {!isCollapsed ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Appearance</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                    !isDark
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                  aria-label="Light mode"
                >
                  <Sun size={14} className={!isDark ? "text-amber-500" : ""} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "bg-slate-800 text-white shadow-xs dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                  aria-label="Dark mode"
                >
                  <Moon size={14} className={isDark ? "text-indigo-400" : ""} />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-full items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
          )}

          <NavLink
            to="/app/settings"
            onClick={onClose}
            title={isCollapsed ? "Settings" : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition
              ${isCollapsed ? "justify-center px-0" : ""}
              ${
                isActive
                  ? "bg-slate-200/80 font-semibold text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              }
            `}
          >
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>

          {!isCollapsed && (
            <div className="rounded-xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-3 text-white shadow-sm border border-indigo-500/20">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Bot size={14} />
                </div>
                <span className="text-xs font-bold tracking-wide">AI Assistant Ready</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">
                Automate customer follow-ups and schedule reviews with 1 click.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;