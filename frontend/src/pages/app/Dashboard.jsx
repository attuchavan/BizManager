import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Users,
  UserRoundPlus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  Bot,
  Activity,
  ChevronRight,
  Calendar,
  Wallet,
  IndianRupee,
  CheckSquare,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Phone,
  FileCheck2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { getCustomers } from "../../services/firebase/customers";
import { getLeads, subscribeLeads } from "../../services/firebase/leads";
import { getAppointments, updateAppointment, subscribeAppointments } from "../../services/firebase/appointments";
import { getInvoices, subscribeInvoices } from "../../services/firebase/invoices";
import { getPayments, subscribePayments } from "../../services/firebase/payments";
import { getExpenses, subscribeExpenses } from "../../services/firebase/expenses";
import { getActivities } from "../../services/firebase/activities";
import { getBusinessTerminology } from "../../utils/businessTerminology";
import { DashboardSkeleton } from "../../components/common/SkeletonLoader";

export default function Dashboard() {
  const { userProfile, currentUser, activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("30days"); // '7days' | '30days' | '7months'
  const [loading, setLoading] = useState(true);

  // Firestore raw data collections
  const [customersData, setCustomersData] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);

  // Business terminology adaptation
  const terms = useMemo(
    () => getBusinessTerminology(activeBusiness?.type || activeBusiness?.businessType),
    [activeBusiness?.type, activeBusiness?.businessType]
  );

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName =
    userProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Business Owner";

  // Load all real business data from Firestore with Real-time Listeners
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial fetch for non-realtime metadata
    getCustomers(activeBusiness.businessId).then(setCustomersData).catch(console.warn);
    getActivities(activeBusiness.businessId, 15).then(setActivitiesData).catch(console.warn);

    // Real-time multi-device listeners (live auto-sync)
    const unsubAppts = subscribeAppointments(activeBusiness.businessId, (data) => {
      setAppointmentsData(data);
      setLoading(false);
    });

    const unsubInvs = subscribeInvoices(activeBusiness.businessId, (data) => {
      setInvoicesData(data);
    });

    const unsubPays = subscribePayments(activeBusiness.businessId, (data) => {
      setPaymentsData(data);
    });

    const unsubLeads = subscribeLeads(activeBusiness.businessId, (data) => {
      setLeadsData(data);
    });

    const unsubExps = subscribeExpenses(activeBusiness.businessId, (data) => {
      setExpensesData(data);
    });

    return () => {
      unsubAppts?.();
      unsubInvs?.();
      unsubPays?.();
      unsubLeads?.();
      unsubExps?.();
    };
  }, [activeBusiness?.businessId]);

  // Aggregate Real Business Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthStr = todayStr.slice(0, 7);

    // Verified collected revenue from payments
    const verifiedPaymentRevenue = paymentsData
      .filter((p) => (p.status || "Completed") === "Completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Revenue from paid invoices
    const paidInvoiceRevenue = invoicesData
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    // Total Revenue is verified payments or paid invoices (whichever is recorded)
    const totalRevenue = Math.max(verifiedPaymentRevenue, paidInvoiceRevenue);

    // Revenue today
    const revenueToday = paymentsData
      .filter((p) => p.date === todayStr && (p.status || "Completed") === "Completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Revenue this month
    const revenueThisMonth = paymentsData
      .filter(
        (p) =>
          p.date &&
          p.date.startsWith(currentMonthStr) &&
          (p.status || "Completed") === "Completed"
      )
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || totalRevenue;

    // Outstanding Payments
    const outstandingInvoices = invoicesData.filter(
      (inv) => inv.status !== "Paid" && inv.status !== "Cancelled"
    );
    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => {
      if (inv.balance !== undefined) return sum + Number(inv.balance);
      return sum + Number(inv.total || 0);
    }, 0);
    const pendingInvoicesCount = outstandingInvoices.length;

    // Expenses
    const monthExpenses = expensesData
      .filter((exp) => exp.date && exp.date.startsWith(currentMonthStr))
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalExpenses = expensesData.reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0
    );

    // Estimated Profit
    const estimatedProfitMonth = Math.max(0, revenueThisMonth - monthExpenses);
    const netMargin =
      revenueThisMonth > 0
        ? Math.round((estimatedProfitMonth / revenueThisMonth) * 100)
        : 0;

    // Leads & Pipeline
    const totalLeads = leadsData.length;
    const uncontactedLeads = leadsData.filter(
      (l) => l.status === "New" || !l.status
    );
    const pendingFollowUps = leadsData.filter(
      (l) =>
        l.followUpDate &&
        l.followUpDate <= todayStr &&
        l.status !== "Won" &&
        l.status !== "Lost"
    );
    const wonLeads = leadsData.filter((l) => l.status === "Won").length;
    const leadConversionRate =
      totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // Appointments
    const todaysAppointments = appointmentsData.filter((a) => a.date === todayStr);
    const upcomingAppointments = appointmentsData.filter(
      (a) => a.date >= todayStr && a.status !== "Completed" && a.status !== "Cancelled"
    );
    const completedAppointments = appointmentsData.filter(
      (a) => a.status === "Completed"
    );
    const appointmentCompletionRate =
      appointmentsData.length > 0
        ? Math.round((completedAppointments.length / appointmentsData.length) * 100)
        : 0;

    // Customers
    const totalCustomers = customersData.length;

    return {
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      outstandingAmount,
      pendingInvoicesCount,
      totalExpenses,
      monthExpenses,
      estimatedProfitMonth,
      netMargin,
      totalLeads,
      uncontactedLeads,
      pendingFollowUps,
      leadConversionRate,
      todaysAppointments,
      upcomingAppointments,
      completedAppointments,
      appointmentCompletionRate,
      totalCustomers,
    };
  }, [customersData, leadsData, appointmentsData, invoicesData, paymentsData, expensesData]);

  // Handle appointment status quick toggle
  async function handleToggleStatus(appointment) {
    if (!activeBusiness?.businessId || !appointment.id) return;
    const newStatus = appointment.status === "Completed" ? "Confirmed" : "Completed";
    try {
      await updateAppointment(activeBusiness.businessId, appointment.id, {
        status: newStatus,
      });
      setAppointmentsData((prev) =>
        prev.map((a) => (a.id === appointment.id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

  // Real Dynamic Revenue Chart Calculation based on Firestore Payments & Invoices
  const chartConfig = useMemo(() => {
    const today = new Date();

    if (period === "7days") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = days[d.getDay()];

        const dayRevenue = paymentsData
          .filter((p) => p.date === dateStr && (p.status || "Completed") === "Completed")
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        last7Days.push({
          label: dayLabel,
          dateStr,
          rawAmount: dayRevenue,
          amount: `₹${dayRevenue.toLocaleString("en-IN")}`,
        });
      }

      const maxRev = Math.max(...last7Days.map((d) => d.rawAmount), 1000);
      const data = last7Days.map((d) => ({
        ...d,
        value: d.rawAmount > 0 ? Math.max(12, Math.round((d.rawAmount / maxRev) * 100)) : 4,
      }));

      return {
        label: "Daily receipts over the past 7 days",
        data,
      };
    }

    if (period === "30days") {
      const weeks = [
        { label: "W1", daysAgoStart: 28, daysAgoEnd: 21 },
        { label: "W2", daysAgoStart: 21, daysAgoEnd: 14 },
        { label: "W3", daysAgoStart: 14, daysAgoEnd: 7 },
        { label: "W4", daysAgoStart: 7, daysAgoEnd: 0 },
      ];

      const weekData = weeks.map((w) => {
        const start = new Date(today);
        start.setDate(today.getDate() - w.daysAgoStart);
        const end = new Date(today);
        end.setDate(today.getDate() - w.daysAgoEnd);
        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        const wRevenue = paymentsData
          .filter(
            (p) =>
              p.date &&
              p.date >= startStr &&
              p.date <= endStr &&
              (p.status || "Completed") === "Completed"
          )
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        return {
          label: w.label,
          rawAmount: wRevenue,
          amount: `₹${wRevenue.toLocaleString("en-IN")}`,
        };
      });

      const maxRev = Math.max(...weekData.map((w) => w.rawAmount), 5000);
      const data = weekData.map((w) => ({
        ...w,
        value: w.rawAmount > 0 ? Math.max(12, Math.round((w.rawAmount / maxRev) * 100)) : 4,
      }));

      return {
        label: "Weekly revenue performance over the past 30 days",
        data,
      };
    }

    // 7 Months View
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mLabel = monthNames[d.getMonth()];

      const mRevenue = paymentsData
        .filter((p) => p.date && p.date.startsWith(mStr) && (p.status || "Completed") === "Completed")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      monthsData.push({
        label: mLabel,
        rawAmount: mRevenue,
        amount: `₹${mRevenue.toLocaleString("en-IN")}`,
      });
    }

    const maxRev = Math.max(...monthsData.map((m) => m.rawAmount), 10000);
    const data = monthsData.map((m) => ({
      ...m,
      value: m.rawAmount > 0 ? Math.max(12, Math.round((m.rawAmount / maxRev) * 100)) : 4,
    }));

    return {
      label: "Monthly turnover over the past 7 months",
      data,
    };
  }, [period, paymentsData]);

  // "Needs Your Attention" Real-time Actionable Alerts
  const attentionItems = useMemo(() => {
    const items = [];

    if (metrics.uncontactedLeads.length > 0) {
      items.push({
        id: "attn-leads",
        title: `${metrics.uncontactedLeads.length} leads haven't been contacted`,
        description: "New inbound prospects awaiting initial touchpoint to maximize conversion.",
        actionLabel: "Contact Leads",
        link: "/app/leads",
        badge: "High Priority",
        color: "amber",
        icon: UserRoundPlus,
      });
    }

    if (metrics.outstandingAmount > 0) {
      items.push({
        id: "attn-invoices",
        title: `₹${metrics.outstandingAmount.toLocaleString("en-IN")} in unpaid invoices`,
        description: `${metrics.pendingInvoicesCount} accounts receivable pending collection.`,
        actionLabel: "View Unpaid Invoices",
        link: "/app/invoices",
        badge: "Cash Flow",
        color: "rose",
        icon: Receipt,
      });
    }

    if (metrics.pendingFollowUps.length > 0) {
      items.push({
        id: "attn-followups",
        title: `${metrics.pendingFollowUps.length} follow-ups due or overdue`,
        description: "Scheduled client checkpoints and proposal follow-ups requiring action.",
        actionLabel: "View Follow-ups",
        link: "/app/leads",
        badge: "Due Today",
        color: "blue",
        icon: CheckSquare,
      });
    }

    if (metrics.todaysAppointments.length > 0) {
      items.push({
        id: "attn-appointments",
        title: `${metrics.todaysAppointments.length} ${terms.appointments.toLowerCase()} scheduled today`,
        description: "Active bookings requiring team execution and post-session invoicing.",
        actionLabel: "View Schedule",
        link: "/app/appointments",
        badge: "Today",
        color: "emerald",
        icon: CalendarDays,
      });
    }
    return items;
  }, [metrics, terms]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Adaptive Industry Context */}
      <PageHeader
        eyebrow={`${activeBusiness?.type || activeBusiness?.businessType || "Business Operating System"}`}
        title={`${greeting}, ${userName} 👋`}
        description={`Here is your real-time command center for ${activeBusiness?.name || "your business"}.`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/app/analytics"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Activity size={14} className="text-blue-500" />
              Full Analytics
            </Link>
            <Link
              to="/app/ai"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-indigo-600"
            >
              <Sparkles size={14} className="text-emerald-300" />
              AI Copilot
            </Link>
          </div>
        }
      />

      {/* Quick Launchpad Ribbon (Adapted with business terminology) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          to="/app/customers?action=new"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {terms.newCustomer}
            </p>
            <p className="text-[11px] text-slate-400">Add to portfolio</p>
          </div>
        </Link>

        <Link
          to="/app/leads?action=new"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400">
            <UserRoundPlus size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Capture Lead</p>
            <p className="text-[11px] text-slate-400">Track prospect</p>
          </div>
        </Link>

        <Link
          to="/app/appointments?action=new"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-indigo-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400">
            <CalendarDays size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {terms.bookAppointment}
            </p>
            <p className="text-[11px] text-slate-400">Schedule session</p>
          </div>
        </Link>

        <Link
          to="/app/invoices?action=new"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-amber-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-500/10 dark:text-amber-400">
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Create Invoice</p>
            <p className="text-[11px] text-slate-400">Bill client account</p>
          </div>
        </Link>
      </div>

      {/* "NEEDS YOUR ATTENTION" Actionable Operational Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Needs Your Attention
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {attentionItems.length} Priorities
          </span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
            <p className="font-semibold">
              All caught up! No urgent bottlenecks or overdue payments requiring immediate attention.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.color === "rose"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                            : item.color === "amber"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                            : item.color === "emerald"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                      <Icon size={15} className="text-slate-400" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <Link
                    to={item.link}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition"
                  >
                    {item.actionLabel}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main KPI Stats (Calculated directly from real Firestore collections) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue This Month */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <CircleDollarSign size={21} />
            </div>
            <Link
              to="/app/payments"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="View Payments"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">Revenue (Total Verified)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{metrics.totalRevenue.toLocaleString("en-IN")}
            </h2>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              <TrendingUp size={13} />
              Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            ₹{metrics.revenueToday.toLocaleString("en-IN")} recorded today
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Receipt size={21} />
            </div>
            <Link
              to="/app/invoices"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="View Invoices"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding Payments</p>
          <div className="mt-1 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{metrics.outstandingAmount.toLocaleString("en-IN")}
            </h2>
            {metrics.outstandingAmount > 0 ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-rose-600">
                <AlertTriangle size={13} />
                Pending
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={13} />
                Clear
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {metrics.pendingInvoicesCount} invoices awaiting settlement
          </p>
        </div>

        {/* Pipeline Leads */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <UserRoundPlus size={21} />
            </div>
            <Link
              to="/app/leads"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="View Leads"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">Sales Pipeline</p>
          <div className="mt-1 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalLeads} Leads
            </h2>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              {metrics.leadConversionRate}% won
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {metrics.uncontactedLeads.length} awaiting contact • {metrics.pendingFollowUps.length} follow-ups due
          </p>
        </div>

        {/* Operating Expenses & Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Wallet size={21} />
            </div>
            <Link
              to="/app/expenses"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="View Expenses"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">Estimated Profit (Month)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{metrics.estimatedProfitMonth.toLocaleString("en-IN")}
            </h2>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              {metrics.netMargin}% margin
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Outflow: ₹{metrics.monthExpenses.toLocaleString("en-IN")} this month
          </p>
        </div>
      </div>

      {/* Main Grid: Real Bar Chart + AI Intelligence Feed */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Real Revenue & Cashflow Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Revenue & Inflow Trend
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {chartConfig.label}
              </p>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setPeriod("7days")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  period === "7days"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setPeriod("30days")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  period === "30days"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setPeriod("7months")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  period === "7months"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                7 Months
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-8 flex h-64 items-end gap-3 pt-6">
            {chartConfig.data.map((bar) => (
              <div
                key={bar.label}
                className="group relative flex flex-1 flex-col items-center justify-end gap-2 h-full"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 z-10 hidden rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block dark:bg-white dark:text-slate-950 whitespace-nowrap">
                  {bar.amount}
                </div>

                <div className="relative w-full max-w-14 h-full flex items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-500 opacity-85 transition-all duration-300 group-hover:opacity-100 group-hover:scale-y-[1.02]"
                    style={{ height: `${bar.value}%` }}
                  />
                </div>

                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span>Real Customer Payments Recorded</span>
            </div>
            <Link
              to="/app/analytics"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Full Financial Report
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* AI Business Assistant Intelligence Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl flex flex-col justify-between">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300 backdrop-blur-md">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Business Intelligence</h3>
                  <p className="text-xs text-blue-200">Autonomous Copilot</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-blue-100">
              Your business records{" "}
              <strong className="text-white">
                ₹{metrics.totalRevenue.toLocaleString("en-IN")}
              </strong>{" "}
              in turnover and{" "}
              <strong className="text-white">{metrics.totalCustomers}</strong> {terms.customers.toLowerCase()}.
              Operating profit is currently tracking at{" "}
              <span className="text-emerald-300 font-semibold">{metrics.netMargin}%</span> margin.
            </p>

            {/* Smart Action Items */}
            <div className="mt-5 space-y-2.5">
              {metrics.uncontactedLeads.length > 0 && (
                <Link
                  to="/app/leads"
                  className="group block rounded-xl bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15"
                >
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AlertCircle size={13} className="text-amber-400" />
                      Contact High-Intent Leads
                    </span>
                    <span className="group-hover:translate-x-0.5 transition font-semibold text-white">
                      Reach Out →
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-200">
                    {metrics.uncontactedLeads.length} leads have not been touched. Call or message today to boost conversion.
                  </p>
                </Link>
              )}

              {metrics.outstandingAmount > 0 && (
                <Link
                  to="/app/invoices"
                  className="group block rounded-xl bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15"
                >
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Receipt size={13} className="text-blue-300" />
                      Recover Receivables
                    </span>
                    <span className="group-hover:translate-x-0.5 transition font-semibold text-white">
                      Collect →
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-200">
                    ₹{metrics.outstandingAmount.toLocaleString("en-IN")} across {metrics.pendingInvoicesCount} invoices pending payment.
                  </p>
                </Link>
              )}

              {metrics.uncontactedLeads.length === 0 && metrics.outstandingAmount === 0 && (
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm text-xs text-blue-100">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    Healthy Operations
                  </p>
                  <p className="mt-1 text-slate-300">
                    All accounts receivable are settled and your pipeline is up to date.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/app/ai"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-slate-900 shadow-md transition hover:bg-blue-50 active:scale-[0.99]"
          >
            Ask AI Business Manager
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Real Business Health Indicators Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-600 dark:text-blue-400" />
              Business Health Indicators
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Calculated dynamically from real transactions, customer growth, and appointment utilization.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            Operating Status: {metrics.netMargin > 30 ? "Thriving" : "Stable"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Health */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Operating Margin
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {metrics.netMargin}%
              </p>
              <span className="text-xs font-semibold text-emerald-600">Healthy</span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {metrics.monthExpenses > 0
                ? `Revenue exceeds expenses by ₹${metrics.estimatedProfitMonth.toLocaleString("en-IN")}.`
                : "Strong unit economics with low recorded overhead."}
            </p>
          </div>

          {/* Lead Conversion */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pipeline Conversion
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {metrics.leadConversionRate}%
              </p>
              <span className="text-xs font-semibold text-blue-600">
                {metrics.totalLeads} total
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {metrics.uncontactedLeads.length > 0
                ? `${metrics.uncontactedLeads.length} leads await first touch to raise conversion rate.`
                : "Pipeline is actively managed with all leads contacted."}
            </p>
          </div>

          {/* Appointment Completion */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {terms.appointment} Utilization
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {metrics.appointmentCompletionRate}%
              </p>
              <span className="text-xs font-semibold text-indigo-600">
                {metrics.completedAppointments.length} Done
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {metrics.todaysAppointments.length > 0
                ? `${metrics.todaysAppointments.length} sessions active on today's calendar.`
                : "Calendar sessions conclude with consistent completion."}
            </p>
          </div>

          {/* Liquidity Risk */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Receivables Collection
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                ₹{metrics.outstandingAmount.toLocaleString("en-IN")}
              </p>
              <span
                className={`text-xs font-semibold ${
                  metrics.outstandingAmount > 0 ? "text-rose-500" : "text-emerald-600"
                }`}
              >
                {metrics.outstandingAmount > 0 ? "Overdue" : "Settled"}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {metrics.outstandingAmount > 0
                ? `Collecting ₹${metrics.outstandingAmount.toLocaleString("en-IN")} will directly expand free cash reserves.`
                : "Zero outstanding client balances. Peak liquidity."}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Today's Appointments & Real Business Activity Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Appointments & Quick Schedule */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800 gap-3">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                  Upcoming & Today's {terms.appointments}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Manage sessions and client execution
                </p>
              </div>

              <Link
                to="/app/appointments"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Open Scheduler
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {appointmentsData.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CalendarDays size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  No appointments booked yet.
                  <Link
                    to="/app/appointments?action=new"
                    className="mt-2 block font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Schedule first session →
                  </Link>
                </div>
              ) : (
                appointmentsData.slice(0, 5).map((appt) => {
                  const isCompleted = appt.status === "Completed";
                  return (
                    <div
                      key={appt.id}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 min-w-28 text-xs font-bold text-blue-600 dark:text-blue-400">
                          <Clock size={14} className="text-slate-400" />
                          {appt.time || "10:00 AM"}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-semibold text-slate-900 dark:text-white ${
                              isCompleted ? "line-through text-slate-400" : ""
                            }`}
                          >
                            {appt.clientName || appt.customerName || "Client Meeting"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {appt.service || "Consultation"} • {appt.date || "Today"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isCompleted
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : appt.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          }`}
                        >
                          {appt.status || "Confirmed"}
                        </span>

                        <button
                          onClick={() => handleToggleStatus(appt)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        >
                          {isCompleted ? "Reopen" : "Mark Complete"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800">
            <Link
              to="/app/appointments"
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View all {appointmentsData.length} appointments →
            </Link>
          </div>
        </div>

        {/* Real Business Activity Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Business Activity Timeline
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Live audit trail of operations, payments, and client events
                </p>
              </div>

              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>

            <div className="p-6">
              {activitiesData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <FileCheck2 size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No business activities logged yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    As you add customers, create invoices, and receive payments, real-time activities will stream here.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {activitiesData.map((act) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {act.title}
                          </p>
                          {act.amount && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              ₹{act.amount.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {act.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {act.description}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {act.createdAt instanceof Date
                            ? act.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800">
            <Link
              to="/app/analytics"
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Inspect complete audit logs in Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}