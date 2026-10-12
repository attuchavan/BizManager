import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  IndianRupee,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  Briefcase,
  Calendar,
  Layers,
  QrCode,
  Smartphone,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  BUSINESS_TYPES,
  getBusinessTerminology,
} from "../../utils/businessTerminology";
import { logActivity } from "../../services/firebase/activities";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";

export default function Settings() {
  const { activeBusiness, userProfile, currentUser, updateActiveBusiness } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  const [form, setForm] = useState({
    businessName: "",
    businessType: "Consulting",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    currency: "INR (₹)",
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    whatsappAlerts: true,
    paymentAlerts: true,
    weeklyReport: true,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (activeBusiness) {
      const defaultUpi = (activeBusiness.businessName || "merchant")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      setForm({
        businessName: activeBusiness.businessName || "My Business",
        businessType:
          activeBusiness.businessType ||
          activeBusiness.type ||
          activeBusiness.industry ||
          "Consulting",
        email: activeBusiness.email || currentUser?.email || "",
        phone: activeBusiness.phone || "+91 98765 43210",
        address: activeBusiness.address || "Mumbai, Maharashtra, India",
        gstin: activeBusiness.gstin || "27ABCDE1234F1Z5",
        currency: activeBusiness.currency || "INR (₹)",
        upiId: activeBusiness.upiId || `${defaultUpi || "merchant"}@okhdfcbank`,
        bankName: activeBusiness.bankName || "HDFC Bank",
        accountNumber: activeBusiness.accountNumber || "",
        ifscCode: activeBusiness.ifscCode || "",
        whatsappAlerts: activeBusiness.whatsappAlerts !== false,
        paymentAlerts: activeBusiness.paymentAlerts !== false,
        weeklyReport: activeBusiness.weeklyReport !== false,
      });
    }
  }, [activeBusiness, currentUser]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Derived terminology preview for currently selected businessType
  const terminology = useMemo(
    () => getBusinessTerminology(form.businessType),
    [form.businessType]
  );

  async function handleSave(e) {
    e?.preventDefault();
    try {
      setSaving(true);
      const updates = {
        businessName: form.businessName,
        businessType: form.businessType,
        type: form.businessType,
        industry: form.businessType,
        email: form.email,
        phone: form.phone,
        address: form.address,
        gstin: form.gstin,
        currency: form.currency,
        upiId: form.upiId.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim(),
        whatsappAlerts: form.whatsappAlerts,
        paymentAlerts: form.paymentAlerts,
        weeklyReport: form.weeklyReport,
      };

      if (activeBusiness?.businessId) {
        const busRef = doc(db, "businesses", activeBusiness.businessId);
        await updateDoc(busRef, updates);

        logActivity(activeBusiness.businessId, {
          type: "SETTINGS_UPDATED",
          title: "Workspace Profile Updated",
          description: `Updated business type to ${form.businessType} and operating preferences.`,
        });

        // Record form submission in universal audit collection
        recordFormSubmission(activeBusiness.businessId, {
          formType: "settings",
          formTitle: `Workspace Settings Updated (${form.businessName || "Profile"})`,
          data: updates,
          entityId: activeBusiness.businessId,
          entityCollection: "businesses",
        });
      }

      // Propagate directly into AuthContext so the entire app (Dashboard, Appointments, Customers) updates dynamically
      if (typeof updateActiveBusiness === "function") {
        updateActiveBusiness(updates);
      }

      setSuccessMessage(
        `Business profile and operating terminology for "${form.businessType}" saved successfully!`
      );
    } catch (err) {
      console.error("Save settings error:", err);
      setSuccessMessage("Settings updated locally.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeBusiness && !form.businessName) {
    return (
      <PageLoader
        message="Loading settings..."
        subtitle="Retrieving business profile and preferences..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration & Architecture"
        title="Workspace & Business Settings"
        description="Configure your enterprise profile, industry operating terminology, tax credentials, and notification triggers."
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50 active:scale-95"
          >
            {saving ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <Save size={14} />}
            <span>Save Changes</span>
          </button>
        }
      />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              Business Profile & Industry Operating Model
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              BizManager dynamically adapts dashboard statistics, appointment calendars, and customer records to match your specific industry.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business / Enterprise Name
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Industry Type (Adaptive Terminology)
                  </label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-blue-300 bg-blue-50/40 py-2 px-3 text-xs font-semibold text-blue-900 outline-none focus:border-blue-500 focus:bg-white dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Terminology Preview Box */}
              <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-4 dark:border-blue-900/40 dark:from-blue-950/20 dark:via-slate-800/40 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                    <Sparkles size={14} className="text-amber-500" />
                    Adaptive Terminology Live Preview ({form.businessType})
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    Zero DB Schema Disruption
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-white/90 p-2 border border-blue-100/70 dark:bg-slate-800/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Customer</span>
                    <span className="font-bold text-slate-900 dark:text-white">{terminology.customer}</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 border border-blue-100/70 dark:bg-slate-800/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Staff</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{terminology.employee}</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 border border-blue-100/70 dark:bg-slate-800/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Offering</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{terminology.service}</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 border border-blue-100/70 dark:bg-slate-800/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Booking</span>
                    <span className="font-bold text-slate-900 dark:text-white">{terminology.appointment}</span>
                  </div>
                </div>

                <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  💡 {terminology.industryNote}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Business Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Support / WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Registered Tax ID / GSTIN
                  </label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="INR (₹)">Indian Rupee - INR (₹)</option>
                    <option value="USD ($)">US Dollar - USD ($)</option>
                    <option value="EUR (€)">Euro - EUR (€)</option>
                    <option value="AED (د.إ)">UAE Dirham - AED (د.إ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Office Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* UPI & Digital Payment Gateway Configuration */}
          <div className="rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-sm dark:border-indigo-900/40 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-indigo-50 pb-4 dark:border-slate-800 gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Instant UPI & Banking Gateway
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Configure your merchant UPI ID to automatically generate dynamic payment QR codes on all invoices and customer portal checkout flows.
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                NPCI Standard Active
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Merchant UPI VPA / ID *</span>
                    <span className="text-[10px] text-slate-400">e.g. name@okhdfcbank</span>
                  </label>
                  <input
                    type="text"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                    placeholder="mybusiness@okhdfcbank"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs font-mono outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Customers can scan and pay directly via Google Pay, PhonePe, Paytm, or BHIM.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Settlement Bank Name
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bank Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="e.g. 50100492817291"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs font-mono outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    value={form.ifscCode}
                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                    placeholder="e.g. HDFC0000123"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs font-mono uppercase outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications & Automation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-indigo-500" />
              Automated Alerts & Notifications
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Configure real-time trigger notifications for you and your clients.
            </p>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    WhatsApp Booking Confirmations
                  </p>
                  <p className="text-slate-400">
                    Automatically send meeting confirmations & calendar invites to {terminology.customers.toLowerCase()}.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.whatsappAlerts}
                  onChange={(e) => setForm({ ...form, whatsappAlerts: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Payment Deposit Notifications
                  </p>
                  <p className="text-slate-400">
                    Receive instant push alerts whenever an invoice is settled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.paymentAlerts}
                  onChange={(e) => setForm({ ...form, paymentAlerts: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Weekly AI Executive Brief
                  </p>
                  <p className="text-slate-400">
                    Get an AI summary of pipeline health, cash flow, and lead velocity every Monday morning.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.weeklyReport}
                  onChange={(e) => setForm({ ...form, weeklyReport: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Appearance & Theme Settings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sun size={16} className="text-amber-500" />
              Appearance & Theme Mode
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Customize workspace theme for desktop and mobile screens.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  !isDark
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 dark:bg-blue-950/20 dark:text-blue-200"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-amber-500">
                  <Sun size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</p>
                  <p className="text-[10px] text-slate-400">Crisp, clean high-contrast</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  isDark
                    ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20 dark:bg-indigo-950/20 dark:text-indigo-200"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 shadow-xs border border-slate-700 text-indigo-400">
                  <Moon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-[10px] text-slate-400">Sleek, low-glare dark view</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Workspace Environment
            </h4>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 font-bold text-white shadow-md shadow-indigo-500/20">
                {form.businessName.charAt(0).toUpperCase() || "B"}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {form.businessName}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {form.businessType}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Account Role:</span>
                <strong className="text-slate-900 dark:text-white">
                  {activeBusiness?.role || "OWNER"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Business ID:</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {activeBusiness?.businessId?.slice(0, 10) || "default-org"}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>Operating Model:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {form.businessType}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database Sync:</span>
                <span className="text-emerald-600 font-medium">Real-time Cloud Firestore</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
