import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Plus,
  Search,
  CalendarDays,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Calendar as CalendarIcon,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  XCircle,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
  List,
  UserCheck,
  MapPin,
  Filter,
  Receipt,
  X,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import AppointmentModal from "../../components/appointments/AppointmentModal";
import AppointmentDetailModal from "../../components/appointments/AppointmentDetailModal";
import {
  getAppointments,
  subscribeAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
} from "../../services/firebase/appointments";
import { getCustomers, addCustomerActivity } from "../../services/firebase/customers";
import { getServices } from "../../services/firebase/services";
import { getEmployees } from "../../services/firebase/employees";
import { getBusinessTerminology } from "../../utils/businessTerminology";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";

const SAMPLE_APPOINTMENTS = [
  {
    id: "app-1",
    clientName: "Rahul Sharma",
    phone: "+91 98765 11223",
    email: "rahul@sharma.in",
    service: "Executive Business Consultation",
    assignedEmployee: "Atharv Chavan",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: "45 mins",
    locationType: "Online (Google Meet)",
    meetingLink: "https://meet.google.com/xyz-consult",
    status: "Confirmed",
    reminderSent: true,
    notes: "Review Q3 marketing strategy and tax saving opportunities.",
  },
  {
    id: "app-2",
    clientName: "Priya Patil",
    phone: "+91 98222 33445",
    email: "priya@patil.com",
    service: "Complete Digital Setup & Onboarding",
    assignedEmployee: "Neha Sharma",
    date: new Date().toISOString().split("T")[0],
    time: "12:30",
    duration: "60 mins",
    locationType: "In-Person (Office)",
    status: "Confirmed",
    reminderSent: false,
    notes: "Product demo, payment gateway setup, and SLA sign-off.",
  },
  {
    id: "app-3",
    clientName: "Amit Joshi",
    phone: "+91 97666 44556",
    email: "amit@joshi.co",
    service: "Financial Review Session",
    assignedEmployee: "Rohan Varma",
    date: new Date().toISOString().split("T")[0],
    time: "15:00",
    duration: "30 mins",
    locationType: "Phone Call",
    status: "In Progress",
    reminderSent: true,
    notes: "Quarterly audit of balance sheet and pending receivables.",
  },
  {
    id: "app-4",
    clientName: "Sneha Kulkarni",
    phone: "+91 99112 55667",
    email: "sneha@kulkarni.in",
    service: "WhatsApp Campaign Setup",
    assignedEmployee: "Atharv Chavan",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "17:15",
    duration: "60 mins",
    locationType: "Online (Google Meet)",
    meetingLink: "https://meet.google.com/abc-agency",
    status: "Pending",
    reminderSent: false,
    notes: "Account onboarding for team of 8.",
  },
];

export default function Appointments() {
  const { activeBusiness, ensureBusinessId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const terms = useMemo(
    () => getBusinessTerminology(activeBusiness?.type || activeBusiness?.businessType),
    [activeBusiness?.type, activeBusiness?.businessType]
  );

  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); // 'All' | 'today' | 'upcoming' | 'past'
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'

  // Calendar Date State (default to current year and month)
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewAppointment, setViewAppointment] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [completedPrompt, setCompletedPrompt] = useState(null);

  // Handle URL query ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedAppointment(null);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load appointments and related data
  async function loadData() {
    if (!activeBusiness?.businessId) {
      setAppointments(SAMPLE_APPOINTMENTS);
      setEmployees([
        { id: "e1", name: "Atharv Chavan", role: "CEO" },
        { id: "e2", name: "Neha Sharma", role: "Manager" },
        { id: "e3", name: "Rohan Varma", role: "Sales Rep" },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [appData, custData, srvData, empData] = await Promise.all([
        getAppointments(activeBusiness.businessId),
        getCustomers(activeBusiness.businessId),
        getServices(activeBusiness.businessId),
        getEmployees(activeBusiness.businessId),
      ]);

      setAppointments(appData && appData.length > 0 ? appData : SAMPLE_APPOINTMENTS);
      if (custData) setCustomers(custData);
      if (srvData) setServices(srvData);
      if (empData) setEmployees(empData);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setAppointments(SAMPLE_APPOINTMENTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setAppointments(SAMPLE_APPOINTMENTS);
      setLoading(false);
      return;
    }

    loadData();

    const unsub = subscribeAppointments(activeBusiness.businessId, (appData) => {
      if (appData && appData.length > 0) {
        setAppointments(appData);
      }
      setLoading(false);
    });

    return () => unsub?.();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const name = app.clientName || app.customerName || "";
      const srv = app.service || app.serviceName || "";
      const staff = app.assignedEmployee || "";
      const phone = app.phone || "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        srv.toLowerCase().includes(search.toLowerCase()) ||
        staff.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search);

      const matchesStatus =
        statusFilter === "All" || app.status === statusFilter;

      const matchesAssignee =
        assigneeFilter === "All" || app.assignedEmployee === assigneeFilter;

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = app.date === todayStr;
      } else if (dateFilter === "upcoming") {
        matchesDate = app.date >= todayStr;
      } else if (dateFilter === "past") {
        matchesDate = app.date < todayStr;
      }

      return matchesSearch && matchesStatus && matchesAssignee && matchesDate;
    });
  }, [appointments, search, statusFilter, assigneeFilter, dateFilter, todayStr]);

  // Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const todayCount = appointments.filter((a) => a.date === todayStr).length;
    const confirmedCount = appointments.filter((a) => a.status === "Confirmed").length;
    const completedCount = appointments.filter((a) => a.status === "Completed").length;

    return { total, todayCount, confirmedCount, completedCount };
  }, [appointments, todayStr]);

  // Status Lifecycle Update
  async function handleStatusChange(appointmentId, newStatus, reason = "") {
    try {
      const appt = appointments.find((a) => a.id === appointmentId);

      if (activeBusiness?.businessId && !appointmentId.startsWith("app-")) {
        if (newStatus === "Cancelled") {
          await cancelAppointment(activeBusiness.businessId, appointmentId, reason);
        } else {
          await updateAppointment(activeBusiness.businessId, appointmentId, {
            status: newStatus,
          });
        }
      }

      // If marked Completed, sync to customer activities and offer invoice creation
      if (newStatus === "Completed" && appt) {
        if (activeBusiness?.businessId) {
          const clientName = appt.clientName || appt.customerName;
          const matchedCust = customers.find(
            (c) =>
              c.id === appt.customerId ||
              c.name?.toLowerCase() === clientName?.toLowerCase()
          );
          if (matchedCust) {
            addCustomerActivity(activeBusiness.businessId, matchedCust.id, {
              title: "Appointment Completed",
              description: `Completed ${appt.service || "session"} on ${appt.date || "today"}.`,
              type: "appointment_completed",
            });
          }
        }
        setCompletedPrompt(appt);
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
      setSuccessMessage(`Appointment marked as ${newStatus}`);
    } catch (err) {
      console.error("Failed to update appointment status:", err);
    }
  }

  // Save from Modal (Add or Edit)
  async function handleSaveAppointment(payload) {
    try {
      setErrorMessage("");
      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();

      if (selectedAppointment && !selectedAppointment.id.startsWith("app-")) {
        const updated = await updateAppointment(
          targetBusinessId,
          selectedAppointment.id,
          payload
        );
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedAppointment.id ? { ...a, ...updated } : a))
        );
        setSuccessMessage("Appointment updated successfully in database!");
      } else {
        const created = await createAppointment(targetBusinessId, payload);
        setAppointments((prev) => [created, ...prev]);
        setSuccessMessage("New appointment confirmed & synced to database!");
      }
    } catch (err) {
      console.error("Save appointment error:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
          : `Failed saving appointment: ${err.message || "Unknown error"}`
      );
      // Fallback local memory so user does not lose view
      if (!selectedAppointment) {
        setAppointments((prev) => [{ id: `app-${Date.now()}`, ...payload }, ...prev]);
      }
    }
  }

  // Delete Appointment
  async function handleDeleteAppointment(id) {
    if (!window.confirm("Permanently remove this booking record?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("app-")) {
        await deleteAppointment(activeBusiness.businessId, id);
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setSuccessMessage("Appointment deleted.");
    } catch (err) {
      console.error("Delete appointment error:", err);
    }
  }

  function handleOpenDetails(app) {
    setViewAppointment(app);
    setDetailModalOpen(true);
  }

  // Calendar Helpers
  const currentMonthYear = calendarDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayAppointments = appointments.filter((a) => a.date === dateStr);
      days.push({ day: d, dateStr, appointments: dayAppointments });
    }
    return days;
  }, [calendarDate, appointments]);

  function handlePrevMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title={`${terms.appointments} & Scheduling`}
        description={`Manage ${terms.appointments.toLowerCase()}, assign ${terms.employees.toLowerCase()}, sync calendar dates, and send automated client reminders.`}
        action={
          <button
            onClick={() => {
              setSelectedAppointment(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition active:scale-95"
          >
            <Plus size={15} className="text-emerald-300" />
            {terms.bookAppointment}
          </button>
        }
      />

      {completedPrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Session with {completedPrompt.clientName || completedPrompt.customerName} Completed!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Service: {completedPrompt.service || "Consultation"}. Would you like to generate an invoice or record payment?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/app/invoices?action=new&client=${encodeURIComponent(
                completedPrompt.clientName || completedPrompt.customerName || ""
              )}&service=${encodeURIComponent(completedPrompt.service || "")}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Receipt size={14} />
              Create Invoice
            </Link>
            <button
              onClick={() => {
                setSelectedAppointment({
                  clientName: completedPrompt.clientName || completedPrompt.customerName,
                  phone: completedPrompt.phone || "",
                  email: completedPrompt.email || "",
                  service: `Follow-up: ${completedPrompt.service || "Review"}`,
                });
                setModalOpen(true);
                setCompletedPrompt(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 transition"
            >
              <CalendarDays size={14} />
              Schedule Follow-up
            </button>
            <button
              onClick={() => setCompletedPrompt(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Today's Schedule</span>
            <CalendarDays size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.todayCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Scheduled for today</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Confirmed Bookings</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.confirmedCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Ready to execute</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Completed Sessions</span>
            <Clock size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.completedCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Successfully concluded</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Appointments</span>
            <CalendarIcon size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">All registered sessions</p>
        </div>
      </div>

      {/* Control Bar: Search + Status + Staff + Date + View Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, service, staff..."
              className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Staff Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Staff Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>

            {/* Date Urgency Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Dates</option>
              <option value="today">Today's Schedule</option>
              <option value="upcoming">Upcoming Sessions</option>
              <option value="past">Past / Concluded</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "list"
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "calendar"
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Calendar Month View"
              >
                <CalendarIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["All", "Confirmed", "Pending", "In Progress", "Completed", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white text-indigo-600 font-semibold shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: List View or Visual Calendar */}
      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Assigned Staff</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Reminders</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRowSkeleton key={i} cols={7} />
                    ))}
                  </>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      No appointments match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => {
                    const isCompleted = app.status === "Completed";
                    const isCancelled = app.status === "Cancelled";
                    const cleanPhone = app.phone?.replace(/[^0-9]/g, "") || "";

                    return (
                      <tr
                        key={app.id}
                        className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => handleOpenDetails(app)}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {app.clientName || app.customerName}
                            </p>
                            <div
                              className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {app.phone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400 font-medium"
                                  title="WhatsApp Client"
                                >
                                  <MessageSquare size={12} />
                                  <span>{app.phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {app.service || "Consultation"}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin size={11} />
                            {app.locationType || "Online"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                          {app.assignedEmployee || "Unassigned"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <CalendarDays size={13} className="text-slate-400" />
                            <span>{app.date}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            <Clock size={12} className="text-emerald-500" />
                            <span>
                              {app.time} ({app.duration || "45m"})
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isCompleted
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                : isCancelled
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                : app.status === "In Progress"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            }`}
                          >
                            {app.status || "Confirmed"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              app.reminderSent
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                            }`}
                          >
                            {app.reminderSent ? "✓ Sent" : "Pending"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetails(app)}
                              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 transition"
                              title="View Details"
                            >
                              <Eye size={13} />
                              <span>Details</span>
                            </button>

                            {!isCompleted && !isCancelled && (
                              <button
                                onClick={() => handleStatusChange(app.id, "Completed")}
                                className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
                                title="Mark as Completed"
                              >
                                <Check size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedAppointment(app);
                                setModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteAppointment(app.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              title="Cancel / Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Calendar View */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon size={18} className="text-indigo-600" />
              {currentMonthYear}
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="mt-4 grid grid-cols-7 text-center text-xs font-bold text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-28 rounded-xl bg-slate-50/40 dark:bg-slate-800/20"
                  />
                );
              }

              const isToday = item.dateStr === todayStr;

              return (
                <div
                  key={item.dateStr}
                  className={`h-28 overflow-y-auto rounded-xl border p-2 transition flex flex-col justify-between ${
                    isToday
                      ? "border-indigo-500 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/20 shadow-xs"
                      : "border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.day}
                    </span>

                    {item.appointments.length > 0 && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {item.appointments.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments Pills on Day */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {item.appointments.slice(0, 2).map((app) => (
                      <button
                        key={app.id}
                        onClick={() => handleOpenDetails(app)}
                        className="w-full text-left truncate rounded px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-800 shadow-xs hover:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        {app.time} {app.clientName}
                      </button>
                    ))}
                    {item.appointments.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold block text-center">
                        +{item.appointments.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking / Edit Modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAppointment}
        appointment={selectedAppointment}
        customers={customers}
        services={services}
        employees={employees}
      />

      {/* Appointment Details & Reminder Action Modal */}
      <AppointmentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        appointment={viewAppointment}
        businessId={activeBusiness?.businessId}
        businessName={activeBusiness?.businessName || "AI Business Manager"}
        onEdit={(app) => {
          setSelectedAppointment(app);
          setModalOpen(true);
        }}
        onStatusUpdate={handleStatusChange}
      />
    </div>
  );
}
