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
  Plus,
} from "lucide-react";

const PRESET_TAGS = [
  "VIP",
  "High-Spender",
  "Corporate",
  "Wholesale",
  "Repeat Client",
  "Retail",
];

export default function CustomerModal({ isOpen, onClose, onSave, customer = null }) {
  const isEdit = Boolean(customer);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Active",
    totalSpent: 0,
    tags: [],
    notes: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company: customer.company || "",
        status: customer.status || "Active",
        totalSpent: customer.totalSpent ?? 0,
        tags: Array.isArray(customer.tags) ? customer.tags : [],
        notes: customer.notes || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "Active",
        totalSpent: 0,
        tags: ["Repeat Client"],
        notes: "",
      });
    }
    setTagInput("");
    setErrors({});
    setSubmitError("");
  }, [customer, isOpen]);

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

  function handleAddTag(tagToAdd) {
    const cleanTag = (tagToAdd || tagInput).trim();
    if (!cleanTag) return;
    if (!form.tags.includes(cleanTag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, cleanTag] }));
    }
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Customer name is required.";
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
        company: form.company.trim() || "Individual",
        status: form.status,
        totalSpent: Number(form.totalSpent) || 0,
        tags: form.tags,
        notes: form.notes.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save customer error:", err);
      setSubmitError(err.message || "Failed to save customer.");
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
              {isEdit ? "Edit Customer Profile" : "Add New Customer"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit
                ? "Update client contact info, business tier, and tags."
                : "Create a verified client entry in your business CRM."}
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
                  placeholder="e.g. Priya Sharma"
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
                  placeholder="e.g. Apex Consulting"
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
                  placeholder="priya@example.com"
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

          {/* Status & Total Spending */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                <option value="Active">Active Client</option>
                <option value="VIP">VIP Account</option>
                <option value="Lead">Prospective Lead</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Lifetime Spend (₹)
              </label>
              <div className="relative mt-1">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  name="totalSpent"
                  min="0"
                  value={form.totalSpent}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag size={13} className="text-indigo-500" />
              Customer Tags
            </label>

            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag input and preset chips */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag & press enter (e.g. Wholesale)..."
                className="flex-1 rounded-xl border border-slate-200 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Add
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-400 mr-1">Suggested:</span>
              {PRESET_TAGS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddTag(preset)}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 transition"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Account Notes & Preferences
            </label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Key requirements, client preferences, referral details..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Footer */}
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
              {isEdit ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
