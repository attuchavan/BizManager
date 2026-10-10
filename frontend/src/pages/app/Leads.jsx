import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  UserRoundPlus,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Building2,
  IndianRupee,
  UserCheck,
  Columns3,
  List,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Calendar,
  AlertCircle,
  Eye,
  ChevronRight,
  ChevronLeft,
  User,
  Clock,
  Filter,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";
import LeadModal from "../../components/leads/LeadModal";
import LeadProfileModal from "../../components/leads/LeadProfileModal";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToCustomer,
  subscribeLeads,
} from "../../services/firebase/leads";
import { getEmployees } from "../../services/firebase/employees";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const SOURCES = [
  "All Sources",
  "Website",
  "WhatsApp",
  "Instagram",
  "Referral",
  "Google Ads",
  "Cold Outreach",
  "Direct Visit",
];

const SAMPLE_LEADS = [
  {
    id: "sample-1",
    name: "Vikram Malhotra",
    company: "Apex Tech Labs",
    email: "vikram@apextech.in",
    phone: "+91 98200 11223",
    source: "Website",
    status: "New",
    estimatedValue: 45000,
    assignedTo: "Atharv Chavan",
    followUpDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // overdue yesterday
    notes: "Interested in full business management consultation and website package.",
  },
  {
    id: "sample-2",
    name: "Sunita Deshmukh",
    company: "Deshmukh Retailers",
    email: "sunita@deshmukh.com",
    phone: "+91 97654 32109",
    source: "WhatsApp",
    status: "Contacted",
    estimatedValue: 28000,
    assignedTo: "Neha Sharma",
    followUpDate: new Date().toISOString().split("T")[0], // due today
    notes: "Followed up on pricing quote. Waiting for board approval.",
  },
  {
    id: "sample-3",
    name: "Karan Singhania",
    company: "Singhania Logistics",
    email: "karan@singhania.co",
    phone: "+91 98111 22334",
    source: "Referral",
    status: "Qualified",
    estimatedValue: 75000,
    assignedTo: "Rohan Varma",
    followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    notes: "High intent client. Needs enterprise invoicing and multi-seat access.",
  },
  {
    id: "sample-4",
    name: "Ananya Iyer",
    company: "Iyer Organic Foods",
    email: "ananya@organicfoods.in",
    phone: "+91 99887 76655",
    source: "Instagram",
    status: "Proposal",
    estimatedValue: 35000,
    assignedTo: "Atharv Chavan",
    followUpDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    notes: "Proposal shared on Tuesday. Requested 5% discount.",
  },
];

export default function Leads() {
  const { activeBusiness, ensureBusinessId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [selectedAssignee, setSelectedAssignee] = useState("All Assignees");
  const [followUpFilter, setFollowUpFilter] = useState("All"); // 'All' | 'overdue' | 'today'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pipeline'

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewLead, setViewLead] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle URL query ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedLead(null);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Real-time synchronization of leads and employees
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setLeads(SAMPLE_LEADS);
      setEmployees([
        { id: "e1", name: "Atharv Chavan", role: "CEO" },
        { id: "e2", name: "Neha Sharma", role: "Manager" },
        { id: "e3", name: "Rohan Varma", role: "Sales Rep" },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeLeads(
      activeBusiness.businessId,
      (remoteLeads) => {
        if (remoteLeads && remoteLeads.length > 0) {
          setLeads(remoteLeads);
        } else {
          setLeads(SAMPLE_LEADS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("subscribeLeads fallback:", err);
        setLeads(SAMPLE_LEADS);
        setLoading(false);
      }
    );

    getEmployees(activeBusiness.businessId)
      .then((emps) => {
        if (emps && emps.length > 0) {
          setEmployees(emps);
        } else {
          setEmployees([
            { id: "e1", name: "Atharv Chavan", role: "CEO" },
            { id: "e2", name: "Neha Sharma", role: "Manager" },
            { id: "e3", name: "Rohan Varma", role: "Sales Rep" },
          ]);
        }
      })
      .catch((err) => console.error("Error loading employees for leads:", err));

    return () => unsubscribe?.();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return leads.filter((lead) => {
      const matchesSearch =
        lead.name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search) ||
        lead.assignedTo?.toLowerCase().includes(search.toLowerCase());

      const matchesStage =
        selectedStage === "All" || lead.status === selectedStage;

      const matchesSource =
        selectedSource === "All Sources" || lead.source === selectedSource;

      const matchesAssignee =
        selectedAssignee === "All Assignees" ||
        lead.assignedTo === selectedAssignee;

      let matchesFollowUp = true;
      if (followUpFilter === "overdue") {
        matchesFollowUp =
          lead.followUpDate &&
          lead.followUpDate < todayStr &&
          lead.status !== "Won" &&
          lead.status !== "Lost";
      } else if (followUpFilter === "today") {
        matchesFollowUp = lead.followUpDate === todayStr;
      }

      return matchesSearch && matchesStage && matchesSource && matchesAssignee && matchesFollowUp;
    });
  }, [leads, search, selectedStage, selectedSource, selectedAssignee, followUpFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const pipelineValue = leads.reduce(
      (sum, l) => sum + (Number(l.estimatedValue) || 0),
      0
    );
    const wonCount = leads.filter((l) => l.status === "Won").length;
    const winRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const overdueCount = leads.filter(
      (l) =>
        l.followUpDate &&
        l.followUpDate < todayStr &&
        l.status !== "Won" &&
        l.status !== "Lost"
    ).length;

    return { total, pipelineValue, winRate, overdueCount };
  }, [leads]);

  // Handle stage change directly
  async function handleStageChange(leadId, newStage) {
    try {
      if (activeBusiness?.businessId && !leadId.startsWith("sample-")) {
        await updateLead(activeBusiness.businessId, leadId, { status: newStage });
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStage } : l))
      );
      setSuccessMessage(`Stage updated to: ${newStage}`);
    } catch (err) {
      console.error("Update stage error:", err);
    }
  }

  // Shift stage forward / backward in pipeline
  async function handleShiftStage(lead, direction) {
    const currentIndex = STAGES.indexOf(lead.status || "New");
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= STAGES.length) return;
    const newStage = STAGES[nextIndex];
    await handleStageChange(lead.id, newStage);
  }

  // 1-Click Convert Lead to Customer
  async function handleConvertToCustomer(lead) {
    try {
      if (activeBusiness?.businessId && !lead.id.startsWith("sample-")) {
        await convertLeadToCustomer(activeBusiness.businessId, lead);
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: "Won" } : l))
      );
      setSuccessMessage(`🎉 ${lead.name} converted to Customer & Deal closed!`);
    } catch (err) {
      console.error("Convert error:", err);
    }
  }

  // Save Lead from Modal
  async function handleSaveLead(payload) {
    try {
      setErrorMessage("");
      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();

      if (selectedLead && !selectedLead.id.startsWith("sample-")) {
        const updated = await updateLead(
          targetBusinessId,
          selectedLead.id,
          payload
        );
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l))
        );
        setSuccessMessage("Lead details updated in database!");
      } else {
        const created = await createLead(targetBusinessId, payload);
        setLeads((prev) => [created, ...prev]);
        setSuccessMessage("New lead captured & saved to database!");
      }
    } catch (err) {
      console.error("Save lead error:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
          : `Failed saving lead: ${err.message || "Unknown error"}`
      );
      if (!selectedLead) {
        setLeads((prev) => [{ id: `lead-${Date.now()}`, ...payload }, ...prev]);
      }
    }
  }

  // Delete Lead
  async function handleDeleteLead(leadId) {
    if (!window.confirm("Are you sure you want to remove this lead?")) return;
    try {
      if (activeBusiness?.businessId && !leadId.startsWith("sample-")) {
        await deleteLead(activeBusiness.businessId, leadId);
      }
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSuccessMessage("Lead removed.");
    } catch (err) {
      console.error("Delete lead error:", err);
    }
  }

  function handleOpenLeadProfile(lead) {
    setViewLead(lead);
    setProfileModalOpen(true);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales & Growth"
        title="Leads & Sales Pipeline"
        description="Capture prospective deals, assign sales reps, track scheduled follow-ups, and convert warm leads into paying clients."
        action={
          <button
            onClick={() => {
              setSelectedLead(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Capture Lead
          </button>
        }
      />

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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Pipeline Leads</span>
            <UserRoundPlus size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total tracked opportunities</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Pipeline Value</span>
            <IndianRupee size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.pipelineValue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Gross deal volume</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Overdue Follow-ups</span>
            <AlertCircle size={18} className="text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.overdueCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Requires urgent touchpoint</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Win Conversion Rate</span>
            <UserCheck size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.winRate}%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Deals converted to customer</p>
        </div>
      </div>

      {/* Control Bar: Search + Stage Filter + Source + Assignee + Follow-up + View Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, company, assignee..."
              className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Right Action Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Source Dropdown */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>

            {/* Assignee Dropdown */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All Assignees">All Team Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>

            {/* Follow-up Urgency Filter */}
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Follow-ups</option>
              <option value="overdue">Overdue Alerts</option>
              <option value="today">Due Today</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("pipeline")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "pipeline"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Kanban Pipeline View"
              >
                <Columns3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["All", ...STAGES].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                selectedStage === stage
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Main View: Table View */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Lead Contact</th>
                  <th className="px-5 py-3 font-semibold">Pipeline Stage</th>
                  <th className="px-5 py-3 font-semibold">Assigned Rep</th>
                  <th className="px-5 py-3 font-semibold">Follow-Up Date</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Deal Value</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      No leads match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isWon = lead.status === "Won";
                    const isOverdue =
                      lead.followUpDate &&
                      lead.followUpDate < todayStr &&
                      !isWon &&
                      lead.status !== "Lost";

                    return (
                      <tr
                        key={lead.id}
                        className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => handleOpenLeadProfile(lead)}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {lead.company || "Independent"}
                            </p>
                            <div
                              className="mt-1 flex items-center gap-3 text-[11px] text-slate-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="flex items-center gap-1 hover:text-blue-500"
                                >
                                  <Mail size={12} />
                                  <span>{lead.email}</span>
                                </a>
                              )}
                              {lead.phone && (
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                    `Hello ${lead.name}, thank you for connecting with ${activeBusiness?.name || "our team"}! We're following up on your inquiry. How can we best assist you today?`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400 font-medium"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare size={12} />
                                  <span>{lead.phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || "New"}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs font-semibold outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                          {lead.assignedTo || "Unassigned"}
                        </td>

                        <td className="px-5 py-4">
                          {lead.followUpDate ? (
                            <span
                              className={`flex items-center gap-1 font-semibold ${
                                isOverdue
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <Calendar size={12} />
                              {lead.followUpDate}
                              {isOverdue && <span className="text-[10px] font-bold uppercase">(Overdue)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {lead.source || "Website"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          ₹{Number(lead.estimatedValue || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenLeadProfile(lead)}
                              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 transition"
                              title="View Details"
                            >
                              <Eye size={13} />
                              <span>Details</span>
                            </button>

                            {!isWon && (
                              <button
                                onClick={() => handleConvertToCustomer(lead)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
                                title="Convert Lead into active Customer"
                              >
                                <UserCheck size={13} />
                                <span>Convert</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              title="Delete"
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
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            const stageTotal = stageLeads.reduce(
              (sum, l) => sum + (Number(l.estimatedValue) || 0),
              0
            );

            return (
              <div
                key={stage}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60 min-w-56"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {stage}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                    {stageLeads.length}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-400">
                  ₹{stageTotal.toLocaleString("en-IN")}
                </p>

                <div className="mt-3 flex-1 space-y-2.5">
                  {stageLeads.map((lead) => {
                    const isOverdue =
                      lead.followUpDate &&
                      lead.followUpDate < todayStr &&
                      stage !== "Won" &&
                      stage !== "Lost";

                    return (
                      <div
                        key={lead.id}
                        className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800 cursor-pointer"
                        onClick={() => handleOpenLeadProfile(lead)}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {lead.name}
                          </p>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{Number(lead.estimatedValue || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {lead.company || "Independent"}
                        </p>

                        {/* Assignee & Follow-up tags */}
                        <div className="mt-2 flex flex-col gap-1 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            👤 {lead.assignedTo || "Unassigned"}
                          </span>

                          {lead.followUpDate && (
                            <span
                              className={`flex items-center gap-1 font-semibold ${
                                isOverdue
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-400"
                              }`}
                            >
                              <Calendar size={10} />
                              {lead.followUpDate}
                              {isOverdue && "(Overdue)"}
                            </span>
                          )}
                        </div>

                        {/* Card Footer with Quick Move Buttons */}
                        <div
                          className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] dark:border-slate-700/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-slate-400">{lead.source}</span>

                          <div className="flex items-center gap-1">
                            {/* Move Back */}
                            <button
                              disabled={STAGES.indexOf(stage) === 0}
                              onClick={() => handleShiftStage(lead, -1)}
                              className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move back"
                            >
                              <ChevronLeft size={13} />
                            </button>

                            {/* Move Forward */}
                            <button
                              disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                              onClick={() => handleShiftStage(lead, 1)}
                              className="rounded p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                              title="Advance stage"
                            >
                              <ChevronRight size={13} />
                            </button>

                            {stage !== "Won" && (
                              <button
                                onClick={() => handleConvertToCustomer(lead)}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                title="Convert to Customer"
                              >
                                <UserCheck size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Capture / Edit Lead Modal */}
      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveLead}
        lead={selectedLead}
        employees={employees}
      />

      {/* Lead Profile Details, Notes & Activity Timeline Modal */}
      <LeadProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        lead={viewLead}
        businessId={activeBusiness?.businessId}
        employees={employees}
        onEditLead={(l) => {
          setSelectedLead(l);
          setModalOpen(true);
        }}
        onConvertToCustomer={(l) => handleConvertToCustomer(l)}
      />
    </div>
  );
}
