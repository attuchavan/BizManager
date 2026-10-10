import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Building2,
  Tag,
  IndianRupee,
  FileText,
  Calendar,
  UserCheck,
} from "lucide-react";

const SOURCES = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Referral",
  "Google Ads",
  "Cold Outreach",
  "Direct Visit",
  "Other",
];

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  lead = null,
  employees = [],
}) {
  const isEdit = Boolean(lead);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "Website",
    status: "New",
    estimatedValue: 0,
    assignedTo: "Unassigned",
    followUpDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        source: lead.source || "Website",
        status: lead.status || "New",
        estimatedValue: lead.estimatedValue ?? 0,
        assignedTo: lead.assignedTo || "Unassigned",
        followUpDate: lead.followUpDate || "",
        notes: lead.notes || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "Website",
        status: "New",
        estimatedValue: 0,
        assignedTo: employees[0]?.name || "Unassigned",
        followUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
        notes: "",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [lead, isOpen, employees]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Lead contact name is required.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || "Independent Prospect",
        source: form.source,
        status: form.status,
        estimatedValue: Number(form.estimatedValue) || 0,
        assignedTo: form.assignedTo || "Unassigned",
        followUpDate: form.followUpDate || "",
        notes: form.notes.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save lead error:", err);
      setSubmitError(err.message || "Failed to save lead. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Deal & Prospect" : "Capture New Lead"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit
                ? "Update deal size, assignee, status, and scheduled follow-up."
                : "Add prospective client to sales pipeline and assign to team."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {submitError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              {submitError}
            </div>
          )}

          {/* Name & Company */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Verma"
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company / Organization
              </label>
              <div className="relative mt-1">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g. Vertex Media"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.email ? "border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-[11px] text-rose-500">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone / WhatsApp Number
              </label>
              <div className="relative mt-1">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Status, Source, Deal Size */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pipeline Stage
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lead Source
              </label>
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deal Value (₹)
              </label>
              <div className="relative mt-1">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  name="estimatedValue"
                  min="0"
                  value={form.estimatedValue}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Assigned Employee & Follow-up Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck size={14} className="text-blue-500" />
                Assigned Team Member
              </label>
              <select
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                <option value="Unassigned">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.role || "Staff"})
                  </option>
                ))}
                {/* Fallback presets if employees empty */}
                {employees.length === 0 && (
                  <>
                    <option value="Atharv Chavan">Atharv Chavan</option>
                    <option value="Neha Sharma">Neha Sharma</option>
                    <option value="Rohan Varma">Rohan Varma</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-500" />
                Next Follow-Up Date
              </label>
              <input
                type="date"
                name="followUpDate"
                value={form.followUpDate}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Requirements & Notes
            </label>
            <div className="relative mt-1">
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Client inquiry details, required services, budget preferences, last touchpoint summary..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50 active:scale-95"
            >
              {loading && <Loader2 size={14} className="animate-spin text-emerald-400" />}
              {isEdit ? "Update Lead" : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
