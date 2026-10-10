import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  UserCog,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Trash2,
  X,
  Loader2,
  Building2,
  Pencil,
  Calendar,
  Clock,
  Eye,
  Check,
  Briefcase,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/firebase/employees";
import { getAppointments } from "../../services/firebase/appointments";

const DEFAULT_PERMISSIONS_BY_ROLE = {
  Owner: {
    canManageAppointments: true,
    canManageInvoices: true,
    canManageCustomers: true,
    canViewFinancials: true,
  },
  Admin: {
    canManageAppointments: true,
    canManageInvoices: true,
    canManageCustomers: true,
    canViewFinancials: true,
  },
  Manager: {
    canManageAppointments: true,
    canManageInvoices: true,
    canManageCustomers: true,
    canViewFinancials: false,
  },
  Staff: {
    canManageAppointments: true,
    canManageInvoices: false,
    canManageCustomers: true,
    canViewFinancials: false,
  },
};

const SAMPLE_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Atharv Chavan",
    role: "Owner",
    department: "Executive",
    email: "atharv@example.com",
    phone: "+91 98200 45678",
    status: "Active",
    permissions: {
      canManageAppointments: true,
      canManageInvoices: true,
      canManageCustomers: true,
      canViewFinancials: true,
    },
  },
  {
    id: "emp-2",
    name: "Neha Sharma",
    role: "Manager",
    department: "Operations",
    email: "neha@example.com",
    phone: "+91 98211 23456",
    status: "Active",
    permissions: {
      canManageAppointments: true,
      canManageInvoices: true,
      canManageCustomers: true,
      canViewFinancials: false,
    },
  },
  {
    id: "emp-3",
    name: "Rohan Varma",
    role: "Staff",
    department: "Sales & CRM",
    email: "rohan@example.com",
    phone: "+91 98322 34567",
    status: "Active",
    permissions: {
      canManageAppointments: true,
      canManageInvoices: false,
      canManageCustomers: true,
      canViewFinancials: false,
    },
  },
];

export default function Employees() {
  const { activeBusiness } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    role: "Staff",
    department: "Sales & CRM",
    email: "",
    phone: "",
    status: "Active",
    permissions: DEFAULT_PERMISSIONS_BY_ROLE["Staff"],
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    if (!activeBusiness?.businessId) {
      setEmployees(SAMPLE_EMPLOYEES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [empData, apptData] = await Promise.all([
        getEmployees(activeBusiness.businessId),
        getAppointments(activeBusiness.businessId),
      ]);

      if (empData && empData.length > 0) {
        setEmployees(empData);
      } else {
        setEmployees(SAMPLE_EMPLOYEES);
      }

      if (apptData) {
        setAppointments(apptData);
      }
    } catch (err) {
      console.error("Failed to load employees data:", err);
      setEmployees(SAMPLE_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (editingEmployee) {
      setForm({
        name: editingEmployee.name || "",
        role: editingEmployee.role || "Staff",
        department: editingEmployee.department || "Sales & CRM",
        email: editingEmployee.email || "",
        phone: editingEmployee.phone || "",
        status: editingEmployee.status || "Active",
        permissions: editingEmployee.permissions || DEFAULT_PERMISSIONS_BY_ROLE[editingEmployee.role || "Staff"] || DEFAULT_PERMISSIONS_BY_ROLE["Staff"],
      });
    } else {
      setForm({
        name: "",
        role: "Staff",
        department: "Sales & CRM",
        email: "",
        phone: "",
        status: "Active",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE["Staff"],
      });
    }
  }, [editingEmployee, modalOpen]);

  // Handle role change with default permissions auto-fill
  function handleRoleChange(newRole) {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      permissions: DEFAULT_PERMISSIONS_BY_ROLE[newRole] || prev.permissions,
    }));
  }

  function handlePermissionToggle(permKey) {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions?.[permKey],
      },
    }));
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.role?.toLowerCase().includes(search.toLowerCase()) ||
        e.department?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || (e.status || "Active") === statusFilter;

      const matchesDepartment =
        departmentFilter === "All" || e.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, search, statusFilter, departmentFilter]);

  // Helper to count assigned appointments for an employee
  function getAssignedAppointments(emp) {
    if (!emp) return [];
    return appointments.filter(
      (a) =>
        (a.assignedEmployee && a.assignedEmployee.toLowerCase() === emp.name.toLowerCase()) ||
        a.employeeId === emp.id
    );
  }

  async function handleSaveEmployee(e) {
    e.preventDefault();
    if (!form.name || !form.email) return;

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        updatedAt: new Date().toISOString(),
      };

      if (!activeBusiness?.businessId) {
        if (editingEmployee) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === editingEmployee.id ? { ...emp, ...payload } : emp
            )
          );
        } else {
          setEmployees((prev) => [
            { id: `emp-${Date.now()}`, ...payload },
            ...prev,
          ]);
        }
        setSuccessMessage(editingEmployee ? "Employee updated!" : "Employee added!");
        setModalOpen(false);
        return;
      }

      if (editingEmployee && !editingEmployee.id.startsWith("emp-")) {
        const updated = await updateEmployee(
          activeBusiness.businessId,
          editingEmployee.id,
          payload
        );
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? { ...emp, ...updated } : emp))
        );
        setSuccessMessage("Employee updated successfully!");
      } else {
        const created = await createEmployee(activeBusiness.businessId, payload);
        setEmployees((prev) => [created, ...prev]);
        setSuccessMessage("Team member added successfully!");
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Error creating/updating employee:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this team member?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("emp-")) {
        await deleteEmployee(activeBusiness.businessId, id);
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setSuccessMessage("Team member removed.");
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Team & Employees"
        description="Manage organizational staff, roles, permissions, contact records, and track assigned customer appointments."
        action={
          <button
            onClick={() => {
              setEditingEmployee(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Add Team Member
          </button>
        }
      />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Team Size</span>
            <Users size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {employees.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Active personnel directory</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Staff</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {employees.filter((e) => (e.status || "Active") === "Active").length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Available on active duty</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Assigned Tasks</span>
            <Calendar size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {appointments.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Customer sessions scheduled</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, email..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {["All", "Active", "On Leave", "Inactive"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-1.5 px-3 text-xs outline-none bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All Departments</option>
            <option value="Executive">Executive</option>
            <option value="Operations">Operations</option>
            <option value="Sales & CRM">Sales & CRM</option>
            <option value="Finance">Finance</option>
            <option value="Technology">Technology</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="h-3 w-40 rounded bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex justify-between items-center">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-14 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No team members found matching your search.
          </div>
        ) : (
          filteredEmployees.map((emp) => {
          const empAppointments = getAssignedAppointments(emp);
          const status = emp.status || "Active";

          return (
            <div
              key={emp.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {emp.department}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      status === "Active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : status === "On Leave"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-blue-600 font-bold text-sm">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {emp.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Shield size={12} className="text-blue-500" />
                      {emp.role}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    <Calendar size={13} className="shrink-0" />
                    <span>{empAppointments.length} assigned session(s)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={() => {
                    setViewingEmployee(emp);
                    setProfileModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <Eye size={13} />
                  <span>View Profile</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingEmployee(emp);
                      setModalOpen(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    title="Edit profile & permissions"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Remove member"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {editingEmployee ? "Edit Employee Profile" : "Add Team Member"}
                </h3>
                <p className="text-xs text-slate-400">Configure role, contact info & access permissions</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kadam"
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Role & Architecture Level
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ramesh@company.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Employment Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Permissions Matrix */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2.5">
                  <Shield size={14} className="text-blue-600" />
                  Role Permissions Matrix
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(form.permissions?.canManageAppointments)}
                      onChange={() => handlePermissionToggle("canManageAppointments")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Manage customer bookings & appointments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(form.permissions?.canManageInvoices)}
                      onChange={() => handlePermissionToggle("canManageInvoices")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Create invoices, billing & record payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(form.permissions?.canManageCustomers)}
                      onChange={() => handlePermissionToggle("canManageCustomers")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Access & edit CRM customer & lead profiles</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(form.permissions?.canViewFinancials)}
                      onChange={() => handlePermissionToggle("canViewFinancials")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>View expenses, profit margins & financial analytics</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingEmployee ? "Update Profile" : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile & Assigned Appointments Modal */}
      {profileModalOpen && viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setProfileModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg">
                  {viewingEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {viewingEmployee.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{viewingEmployee.role}</span>
                    <span>•</span>
                    <span>{viewingEmployee.department}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Contact & Status Card */}
              <div className="grid gap-3 sm:grid-cols-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingEmployee.email}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewingEmployee.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {viewingEmployee.status || "Active"}
                  </p>
                </div>
              </div>

              {/* Permissions List */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  System Permissions
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {[
                    { key: "canManageAppointments", label: "Appointments & Bookings" },
                    { key: "canManageInvoices", label: "Invoices & Payments" },
                    { key: "canManageCustomers", label: "CRM Customers & Leads" },
                    { key: "canViewFinancials", label: "Financials & Analytics" },
                  ].map((p) => {
                    const hasPerm = Boolean(viewingEmployee.permissions?.[p.key]);
                    return (
                      <div
                        key={p.key}
                        className={`flex items-center gap-2 rounded-lg p-2.5 border ${
                          hasPerm
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-50/50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/20"
                        }`}
                      >
                        {hasPerm ? <Check size={14} className="text-emerald-600" /> : <X size={14} />}
                        <span className="font-medium">{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Appointments / Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Assigned Appointments & Tasks
                  </h4>
                  <span className="text-xs text-slate-400">
                    {getAssignedAppointments(viewingEmployee).length} assigned
                  </span>
                </div>

                {getAssignedAppointments(viewingEmployee).length === 0 ? (
                  <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                    No active appointments currently assigned to {viewingEmployee.name}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAssignedAppointments(viewingEmployee).map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {appt.customerName || appt.customer}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {appt.service || "General Session"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {appt.date} {appt.time ? `• ${appt.time}` : ""}
                          </p>
                          <span className="inline-block mt-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            {appt.status || "Scheduled"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
