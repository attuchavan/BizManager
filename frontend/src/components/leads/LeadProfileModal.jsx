import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Tag,
  IndianRupee,
  FileText,
  Clock,
  Calendar,
  MessageSquare,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  Activity,
  CalendarDays,
  Pencil,
  Trash2,
  UserCheck,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getLeadActivities,
  addLeadActivity,
  getLeadNotes,
  addLeadNote,
  updateLead,
} from "../../services/firebase/leads";

export default function LeadProfileModal({
  isOpen,
  onClose,
  lead,
  businessId,
  employees = [],
  onEditLead,
  onConvertToCustomer,
}) {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'notes' | 'activity'
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingSubdata, setLoadingSubdata] = useState(true);

  // New Note state
  const [newNoteText, setNewNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Activity state
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Quick assignee and status update
  const [currentStatus, setCurrentStatus] = useState(lead.status || "New");
  const [currentAssignee, setCurrentAssignee] = useState(lead.assignedTo || "Unassigned");

  useEffect(() => {
    setCurrentStatus(lead.status || "New");
    setCurrentAssignee(lead.assignedTo || "Unassigned");
  }, [lead]);

  useEffect(() => {
    async function loadSubdata() {
      if (!businessId || !lead.id) {
        setNotes([
          {
            id: "n-1",
            text: lead.notes || "Inquired via landing page. High intent for enterprise package.",
            author: "System / Inbound",
            createdAt: new Date(),
          },
        ]);
        setActivities([
          {
            id: "act-1",
            title: "Lead Captured",
            description: `Prospect captured from ${lead.source || "Website"}.`,
            createdAt: new Date(),
          },
        ]);
        setLoadingSubdata(false);
        return;
      }

      try {
        setLoadingSubdata(true);
        const [fetchedNotes, fetchedActivities] = await Promise.all([
          getLeadNotes(businessId, lead.id),
          getLeadActivities(businessId, lead.id),
        ]);

        if (fetchedNotes && fetchedNotes.length > 0) {
          setNotes(fetchedNotes);
        } else if (lead.notes) {
          setNotes([
            {
              id: "n-init",
              text: lead.notes,
              author: "Initial Note",
              createdAt: lead.createdAt || new Date(),
            },
          ]);
        } else {
          setNotes([]);
        }

        if (fetchedActivities && fetchedActivities.length > 0) {
          setActivities(fetchedActivities);
        } else {
          setActivities([
            {
              id: "act-init",
              title: "Lead Registered",
              description: `Added to pipeline stage: ${lead.status || "New"}.`,
              createdAt: lead.createdAt || new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load lead subdata:", err);
      } finally {
        setLoadingSubdata(false);
      }
    }

    loadSubdata();
  }, [businessId, lead.id]);

  async function handleStatusChange(newStatus) {
    setCurrentStatus(newStatus);
    if (businessId && !lead.id.startsWith("sample-")) {
      try {
        await updateLead(businessId, lead.id, { status: newStatus });
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            title: "Pipeline Stage Changed",
            description: `Moved stage from ${currentStatus} to ${newStatus}.`,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Error updating stage:", err);
      }
    }
  }

  async function handleAssigneeChange(newAssignee) {
    setCurrentAssignee(newAssignee);
    if (businessId && !lead.id.startsWith("sample-")) {
      try {
        await updateLead(businessId, lead.id, { assignedTo: newAssignee });
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            title: "Assignee Updated",
            description: `Assigned deal owner to ${newAssignee}.`,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Error updating assignee:", err);
      }
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setSubmittingNote(true);
      const notePayload = {
        text: newNoteText.trim(),
        author: currentAssignee !== "Unassigned" ? currentAssignee : "Sales Rep",
      };

      if (businessId && !lead.id.startsWith("sample-")) {
        const created = await addLeadNote(businessId, lead.id, notePayload);
        setNotes((prev) => [created, ...prev]);
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            title: "Note Added",
            description: notePayload.text,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      } else {
        setNotes((prev) => [
          { id: `note-${Date.now()}`, ...notePayload, createdAt: new Date() },
          ...prev,
        ]);
      }

      setNewNoteText("");
    } catch (err) {
      console.error("Add lead note error:", err);
    } finally {
      setSubmittingNote(false);
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    try {
      setSubmittingActivity(true);
      const actPayload = {
        title: newActivityTitle.trim(),
        description: "Logged manually by sales rep.",
        type: "custom",
      };

      if (businessId && !lead.id.startsWith("sample-")) {
        const created = await addLeadActivity(businessId, lead.id, actPayload);
        setActivities((prev) => [created, ...prev]);
      } else {
        setActivities((prev) => [
          { id: `act-${Date.now()}`, ...actPayload, createdAt: new Date() },
          ...prev,
        ]);
      }

      setNewActivityTitle("");
      setShowAddActivity(false);
    } catch (err) {
      console.error("Add activity error:", err);
    } finally {
      setSubmittingActivity(false);
    }
  }

  const cleanPhone = lead.phone?.replace(/[^0-9]/g, "") || "";
  const isWon = currentStatus === "Won";

  // Check if follow-up is overdue
  const isOverdue =
    lead.followUpDate &&
    new Date(lead.followUpDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
    !isWon &&
    currentStatus !== "Lost";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Card */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-transparent p-6 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 font-extrabold text-xl text-white shadow-lg shadow-amber-500/25">
                {lead.name?.charAt(0).toUpperCase() || "L"}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lead.name}
                  </h2>

                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lead.company || "Independent Prospect"} • Source:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {lead.source || "Website"}
                  </strong>
                </p>
              </div>
            </div>

            {/* Estimated Value Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80 sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Potential Deal Size
              </span>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                ₹{Number(lead.estimatedValue || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Overdue Alert */}
          {isOverdue && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <AlertCircle size={14} className="shrink-0" />
              <span>
                Follow-up was scheduled for {lead.followUpDate} and is currently overdue!
              </span>
            </div>
          )}

          {/* Quick Action Ribbon */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello ${lead.name}, greetings from our team! Reaching out regarding your inquiry.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
              >
                <MessageSquare size={13} />
                WhatsApp Lead
              </a>
            )}

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                <Mail size={13} />
                Send Email
              </a>
            )}

            {!isWon && (
              <button
                onClick={() => {
                  onClose();
                  onConvertToCustomer(lead);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
              >
                <UserCheck size={13} />
                Convert to Customer
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEditLead(lead);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition ml-auto"
            >
              <Pencil size={13} />
              Edit Deal
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <User size={14} />
            Deal Overview
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "notes"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <FileText size={14} />
            Notes ({notes.length})
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "activity"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Activity size={14} />
            Activity Log ({activities.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Owner
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <select
                      value={currentAssignee}
                      onChange={(e) => handleAssigneeChange(e.target.value)}
                      className="font-semibold text-slate-900 dark:text-white bg-transparent outline-none cursor-pointer"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                      {employees.length === 0 && (
                        <>
                          <option value="Atharv Chavan">Atharv Chavan</option>
                          <option value="Neha Sharma">Neha Sharma</option>
                          <option value="Rohan Varma">Rohan Varma</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Scheduled Follow-Up
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{lead.followUpDate || "No date set"}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {lead.email || "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phone / WhatsApp
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {lead.phone || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Requirements & Notes Preview */}
              {lead.notes && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lead Inquiry Details & Notes
                  </span>
                  <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Append a note about conversation or quotation..."
                  className="flex-1 rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {submittingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Note
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5">
                {notes.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No notes recorded yet. Add your first note above.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {note.text}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{note.author || "Sales Team"}</span>
                        <span>
                          {note.createdAt?.toDate
                            ? note.createdAt.toDate().toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deal Progress Timeline
                </span>
                <button
                  onClick={() => setShowAddActivity(!showAddActivity)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <Plus size={12} />
                  Log Outreach / Call
                </button>
              </div>

              {showAddActivity && (
                <form
                  onSubmit={handleAddActivity}
                  className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20 space-y-2"
                >
                  <input
                    type="text"
                    required
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    placeholder="e.g. Completed initial pricing discovery call"
                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddActivity(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingActivity}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      Log Activity
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline Items */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900" />
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {act.title}
                      </p>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {act.description}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {act.createdAt?.toDate
                          ? act.createdAt.toDate().toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
