import { useState, useEffect, useMemo } from "react";
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
  Receipt,
  CheckCircle2,
  Activity,
  CalendarDays,
  Pencil,
  Trash2,
  CreditCard,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getCustomerActivities,
  addCustomerActivity,
  getCustomerNotes,
  addCustomerNote,
  updateCustomer,
} from "../../services/firebase/customers";
import { getInvoices } from "../../services/firebase/invoices";
import { getAppointments } from "../../services/firebase/appointments";
import { getPayments } from "../../services/firebase/payments";

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  businessId,
  onEditCustomer,
}) {
  if (!isOpen || !customer) return null;

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'notes' | 'activity'
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [loadingSubdata, setLoadingSubdata] = useState(true);

  // Outstanding receivables for this customer
  const outstandingAmount = useMemo(() => {
    return customerInvoices
      .filter((inv) => inv.status !== "Paid" && inv.status !== "Cancelled")
      .reduce((sum, inv) => {
        if (inv.balance !== undefined) return sum + Number(inv.balance);
        return sum + Number(inv.total || 0);
      }, 0);
  }, [customerInvoices]);

  // New Note state
  const [newNoteText, setNewNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Activity state
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Quick tag addition state
  const [newTagInput, setNewTagInput] = useState("");
  const [customerTags, setCustomerTags] = useState(
    Array.isArray(customer.tags) ? customer.tags : []
  );

  useEffect(() => {
    setCustomerTags(Array.isArray(customer.tags) ? customer.tags : []);
  }, [customer]);

  useEffect(() => {
    async function loadSubdata() {
      if (!businessId || !customer.id) {
        setNotes([
          {
            id: "n-1",
            text: customer.notes || "Client prefers WhatsApp communications. High potential for annual retainer contract.",
            author: "Account Manager",
            createdAt: new Date(),
          },
        ]);
        setActivities([
          {
            id: "act-1",
            title: "Customer Profile Created",
            description: `Registered with ${customer.status || "Active"} tier.`,
            createdAt: new Date(),
          },
          {
            id: "act-2",
            title: "Initial Consultation Held",
            description: "Discussed requirements and agreed on service SLA.",
            createdAt: new Date(Date.now() - 86400000),
          },
        ]);
        setLoadingSubdata(false);
        return;
      }

      try {
        setLoadingSubdata(true);
        const [
          fetchedNotes,
          fetchedActivities,
          allInvoicesRes,
          allAppointmentsRes,
          allPaymentsRes,
        ] = await Promise.allSettled([
          getCustomerNotes(businessId, customer.id),
          getCustomerActivities(businessId, customer.id),
          getInvoices(businessId),
          getAppointments(businessId),
          getPayments(businessId),
        ]);

        if (fetchedNotes.status === "fulfilled" && fetchedNotes.value?.length > 0) {
          setNotes(fetchedNotes.value);
        } else if (customer.notes) {
          setNotes([
            {
              id: "n-initial",
              text: customer.notes,
              author: "Profile Notes",
              createdAt: customer.createdAt || new Date(),
            },
          ]);
        } else {
          setNotes([]);
        }

        if (fetchedActivities.status === "fulfilled" && fetchedActivities.value?.length > 0) {
          setActivities(fetchedActivities.value);
        } else {
          setActivities([
            {
              id: "act-init",
              title: "Customer Profile Created",
              description: `Added to CRM database with status ${customer.status || "Active"}.`,
              createdAt: customer.createdAt || new Date(),
            },
          ]);
        }

        const custNameLower = customer.name?.toLowerCase() || "";
        if (allInvoicesRes.status === "fulfilled" && allInvoicesRes.value) {
          const matched = allInvoicesRes.value.filter(
            (inv) =>
              inv.customerId === customer.id ||
              inv.customerName?.toLowerCase() === custNameLower
          );
          setCustomerInvoices(matched);
        }

        if (allAppointmentsRes.status === "fulfilled" && allAppointmentsRes.value) {
          const matched = allAppointmentsRes.value.filter(
            (a) =>
              a.customerId === customer.id ||
              (a.clientName || a.customerName)?.toLowerCase() === custNameLower
          );
          setCustomerAppointments(matched);
        }

        if (allPaymentsRes.status === "fulfilled" && allPaymentsRes.value) {
          const matched = allPaymentsRes.value.filter(
            (p) =>
              p.customerId === customer.id ||
              p.customerName?.toLowerCase() === custNameLower
          );
          setCustomerPayments(matched);
        }
      } catch (err) {
        console.error("Failed to load customer subdata:", err);
      } finally {
        setLoadingSubdata(false);
      }
    }

    loadSubdata();
  }, [businessId, customer.id]);

  // Handle adding new note
  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setSubmittingNote(true);
      const notePayload = {
        text: newNoteText.trim(),
        author: "Owner / Team",
      };

      if (businessId && !customer.id.startsWith("sample-")) {
        const created = await addCustomerNote(businessId, customer.id, notePayload);
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
      console.error("Add note error:", err);
    } finally {
      setSubmittingNote(false);
    }
  }

  // Handle adding activity
  async function handleAddActivity(e) {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    try {
      setSubmittingActivity(true);
      const actPayload = {
        title: newActivityTitle.trim(),
        description: "Logged manually by CRM operator.",
        type: "custom",
      };

      if (businessId && !customer.id.startsWith("sample-")) {
        const created = await addCustomerActivity(businessId, customer.id, actPayload);
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

  // Handle adding a tag directly
  async function handleAddTag(e) {
    e.preventDefault();
    if (!newTagInput.trim()) return;

    const updatedTags = Array.from(new Set([...customerTags, newTagInput.trim()]));
    setCustomerTags(updatedTags);
    setNewTagInput("");

    if (businessId && !customer.id.startsWith("sample-")) {
      try {
        await updateCustomer(businessId, customer.id, { tags: updatedTags });
      } catch (err) {
        console.error("Failed to update tags:", err);
      }
    }
  }

  async function handleRemoveTag(tagToRemove) {
    const updatedTags = customerTags.filter((t) => t !== tagToRemove);
    setCustomerTags(updatedTags);

    if (businessId && !customer.id.startsWith("sample-")) {
      try {
        await updateCustomer(businessId, customer.id, { tags: updatedTags });
      } catch (err) {
        console.error("Failed to remove tag:", err);
      }
    }
  }

  const cleanPhone = customer.phone?.replace(/[^0-9]/g, "") || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Card */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-indigo-600/10 via-emerald-500/5 to-transparent p-6 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 font-extrabold text-xl text-white shadow-lg shadow-indigo-500/25">
                {customer.name?.charAt(0).toUpperCase() || "C"}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {customer.name}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      customer.status === "VIP"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                        : customer.status === "Lead"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                        : customer.status === "Inactive"
                        ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    {customer.status || "Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {customer.company || "Independent Client"}
                </p>
              </div>
            </div>

            {/* Financial Status Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:text-right">
              {outstandingAmount > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 backdrop-blur-sm dark:border-rose-900/40 dark:bg-rose-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    Outstanding
                  </span>
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                    ₹{outstandingAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lifetime Spend
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  ₹{Number(customer.totalSpent || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Tags list */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {customerTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300"
              >
                <Tag size={10} />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="+ Tag..."
                className="w-20 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </form>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
              >
                <MessageSquare size={13} />
                WhatsApp
              </a>
            )}

            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                <Mail size={13} />
                Send Email
              </a>
            )}

            <Link
              to={`/app/invoices?action=new&client=${encodeURIComponent(customer.name)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              <Receipt size={13} />
              Create Invoice
            </Link>

            <Link
              to={`/app/payments?action=new&client=${encodeURIComponent(customer.name)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 transition"
            >
              <CreditCard size={13} />
              Record Payment
            </Link>

            <Link
              to={`/app/appointments?action=new&client=${encodeURIComponent(customer.name)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              <CalendarDays size={13} />
              Book Meeting
            </Link>

            <button
              onClick={() => {
                onClose();
                onEditCustomer(customer);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition ml-auto"
            >
              <Pencil size={13} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <User size={14} />
            Contact & Info
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "invoices"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Receipt size={14} />
            Invoices ({customerInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "appointments"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <CalendarDays size={14} />
            Appointments ({customerAppointments.length})
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "notes"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <FileText size={14} />
            Notes ({notes.length})
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "activity"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
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
                    Contact Email
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {customer.email || "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contact Number
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {customer.phone || "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Company
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {customer.company || "Individual"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Client Relationship Status
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {customer.status || "Active"} Client
                  </p>
                </div>
              </div>

              {/* Initial Notes Preview */}
              {customer.notes && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account Profile Notes
                  </span>
                  <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Billing & Invoices History
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {customerInvoices.length} Invoices
                  </span>
                </div>
                <Link
                  to={`/app/invoices?action=new&client=${encodeURIComponent(customer.name)}`}
                  onClick={onClose}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <Plus size={12} />
                  New Invoice
                </Link>
              </div>

              {customerInvoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                  <Receipt size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No invoices generated yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bill this client for services or consultation sessions.
                  </p>
                  <Link
                    to={`/app/invoices?action=new&client=${encodeURIComponent(customer.name)}`}
                    onClick={onClose}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                  >
                    <Plus size={13} />
                    Create First Invoice
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerInvoices.map((inv) => {
                    const balance = inv.balance !== undefined ? Number(inv.balance) : inv.status === "Paid" ? 0 : Number(inv.total || 0);
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold text-xs">
                            INV
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                #{inv.invoiceNumber || inv.id.slice(0, 8)}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  inv.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : inv.status === "Partially Paid"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                                    : inv.status === "Overdue"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300"
                                }`}
                              >
                                {inv.status || "Pending"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Due: {inv.dueDate || "Upon Receipt"} • {Array.isArray(inv.items) ? `${inv.items.length} items` : "Services"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                            </p>
                            {balance > 0 && (
                              <p className="text-[10px] font-semibold text-rose-500">
                                Due: ₹{balance.toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>

                          {balance > 0 && (
                            <Link
                              to={`/app/payments?action=new&client=${encodeURIComponent(
                                customer.name
                              )}&inv=${encodeURIComponent(inv.invoiceNumber || "")}`}
                              onClick={onClose}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition"
                            >
                              Pay
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Appointments & Sessions
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {customerAppointments.length}
                  </span>
                </div>
                <Link
                  to={`/app/appointments?action=new&client=${encodeURIComponent(customer.name)}`}
                  onClick={onClose}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <Plus size={12} />
                  Book Session
                </Link>
              </div>

              {customerAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                  <CalendarDays size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No sessions scheduled yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Book a consultation or appointment for this client.
                  </p>
                  <Link
                    to={`/app/appointments?action=new&client=${encodeURIComponent(customer.name)}`}
                    onClick={onClose}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                  >
                    <Plus size={13} />
                    Book First Appointment
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerAppointments.map((appt) => {
                    const isCompleted = appt.status === "Completed";
                    return (
                      <div
                        key={appt.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-xs">
                            <Clock size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {appt.service || "Consultation"}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isCompleted
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    : appt.status === "Cancelled"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                }`}
                              >
                                {appt.status || "Confirmed"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {appt.date} at {appt.time} • Staff: {appt.assignedEmployee || "Staff"}
                            </p>
                          </div>
                        </div>

                        {isCompleted && (
                          <Link
                            to={`/app/invoices?action=new&client=${encodeURIComponent(
                              customer.name
                            )}&service=${encodeURIComponent(appt.service || "")}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 transition"
                          >
                            <Receipt size={12} />
                            Invoice Session
                          </Link>
                        )}
                      </div>
                    );
                  })}
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
                  placeholder="Append a quick note about this client..."
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
                        <span>{note.author || "Admin"}</span>
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
                  Chronological CRM Events
                </span>
                <button
                  onClick={() => setShowAddActivity(!showAddActivity)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <Plus size={12} />
                  Log Activity
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
                    placeholder="e.g. Conducted Quarterly Review Call"
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
                      Log
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
