import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Users,
  Wallet,
  Receipt,
  UserPlus,
  Briefcase,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  Send,
  Trash2,
  X,
  ExternalLink,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";
import {
  getFormSubmissions,
  recordFormSubmission,
  deleteFormSubmission,
  subscribeFormSubmissions,
} from "../../services/firebase/formSubmissions";

export default function FormSubmissions() {
  const { activeBusiness, currentUser, ensureBusinessId, firestoreError } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Detail Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Quick Test Submission Form Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    formType: "customer",
    name: "Aarav Patel",
    email: "aarav.patel@example.com",
    phone: "+91 98765 43210",
    notes: "Direct test submission from Form Submissions Manager",
  });
  const [testSubmitting, setTestSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const businessId = activeBusiness?.businessId || ensureBusinessId();

  // Real-time synchronization of form audit submissions
  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const unsub = subscribeFormSubmissions(
      businessId,
      (data) => {
        // Exclude internal AI Copilot queries/prompts or AI actions
        const cleanData = (data || []).filter(
          (sub) =>
            sub.formType !== "ai_prompt" &&
            sub.formType !== "ai_action_executed" &&
            !sub.formType?.startsWith("ai_") &&
            !sub.formTitle?.toLowerCase().includes("ai copilot")
        );
        setSubmissions(cleanData);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.warn("subscribeFormSubmissions error:", err);
        setErrorMessage(
          err?.code === "permission-denied"
            ? "Permission Denied: Please update and publish Firestore Security Rules in Firebase Console."
            : (err.message || "Could not retrieve form submissions.")
        );
        setLoading(false);
        setRefreshing(false);
      },
      50
    );

    return () => unsub?.();
  }, [businessId]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        !search ||
        sub.formTitle?.toLowerCase().includes(search.toLowerCase()) ||
        sub.submittedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
        sub.submittedBy?.email?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(sub.formData || {}).toLowerCase().includes(search.toLowerCase());

      const matchType =
        typeFilter === "All" ||
        sub.formType === typeFilter ||
        (sub.formType && sub.formType.startsWith(typeFilter));

      return matchSearch && matchType;
    });
  }, [submissions, search, typeFilter]);

  async function handleQuickTestSubmit(e) {
    e.preventDefault();
    try {
      setTestSubmitting(true);
      setErrorMessage("");

      const submission = await recordFormSubmission(businessId, {
        formType: testForm.formType,
        formTitle: `Direct Form: ${testForm.formType.toUpperCase()}`,
        data: {
          name: testForm.name,
          email: testForm.email,
          phone: testForm.phone,
          notes: testForm.notes,
        },
      });

      setSubmissions((prev) => [submission, ...prev]);
      setStatusMessage("Form submitted and stored in Firestore successfully!");
      setTestModalOpen(false);
    } catch (err) {
      console.error("Test submission failed:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Firebase Permission Denied: Ensure Firestore rules in Firebase Console allow read/write."
          : (err.message || "Submission failed.")
      );
    } finally {
      setTestSubmitting(false);
    }
  }

  async function handleDelete(submissionId) {
    if (!window.confirm("Delete this form submission record?")) return;
    try {
      await deleteFormSubmission(businessId, submissionId);
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setStatusMessage("Submission record deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function getBadgeColor(type) {
    if (!type) return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    const t = String(type).toLowerCase();
    if (t.includes("appointment")) return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
    if (t.includes("payment")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
    if (t.includes("customer")) return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300";
    if (t.includes("invoice")) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
    if (t.includes("lead") || t.includes("inquiry")) return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
    if (t.includes("expense")) return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
    if (t.includes("marketing")) return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300";
    if (t.includes("review")) return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300";
    if (t.includes("settings") || t.includes("onboarding")) return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300";
    if (t.includes("ai")) return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300";
    if (t.includes("service") || t.includes("employee")) return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300";
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  }

  function exportToCSV() {
    if (filteredSubmissions.length === 0) {
      alert("No submissions to export in current filter view.");
      return;
    }
    const headers = ["ID", "Form Title", "Type", "Submitted By Name", "Submitted By Email", "Timestamp", "Data JSON"];
    const rows = filteredSubmissions.map((s) => [
      `"${s.id}"`,
      `"${(s.formTitle || "").replace(/"/g, '""')}"`,
      `"${s.formType || "general"}"`,
      `"${(s.submittedBy?.name || "").replace(/"/g, '""')}"`,
      `"${(s.submittedBy?.email || "").replace(/"/g, '""')}"`,
      `"${s.timestamp || ""}"`,
      `"${JSON.stringify(s.formData || {}).replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `form_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Database Audit"
        title="Form Submissions"
        description="Centralized Firestore collection capturing every filled form across appointments, payments, clients, and inquiries."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
              title="Download audit records as CSV"
            >
              <Download size={14} className="text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={() => {
                setRefreshing(true);
                loadData();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-indigo-600" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setTestModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition active:scale-95"
            >
              <Send size={14} />
              Submit Test Form
            </button>
          </div>
        }
      />

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {(errorMessage || firestoreError) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Firestore Database Connection Alert:</p>
            <p className="mt-0.5">{errorMessage || firestoreError}</p>
            <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-300/80">
              Please ensure your <code>firestore.rules</code> are published in the Firebase Console under Firestore Database &rarr; Rules.
            </p>
          </div>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Form Logs</span>
            <FileText size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {submissions.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Captured in Firestore</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Target Collection</span>
            <Layers size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
            businesses/{businessId.slice(0, 8)}.../form_submissions
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Live subcollection</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Global Collection</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            /form_submissions
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Global audit archive</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Status</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            Realtime Active
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Auto-saves on every form</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submitted data, client, or title..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            "All",
            "appointment",
            "payment",
            "customer",
            "invoice",
            "lead",
            "expense",
            "marketing",
            "review",
            "settings",
          ].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold capitalize whitespace-nowrap transition ${
                typeFilter === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Form / Action</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Submitted By</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Captured Payload</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <TableRowSkeleton />
                    </td>
                  </tr>
                ))
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No form submissions captured yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Fill and submit any form in Appointments, Payments, or Customers, or click "Submit Test Form".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const dateStr = sub.timestamp
                    ? new Date(sub.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Recently";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sub.formTitle || "Form Submission"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {sub.id.slice(0, 10)}...
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getBadgeColor(
                            sub.formType
                          )}`}
                        >
                          {sub.formType || "general"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sub.contactName ||
                            sub.formData?.clientName ||
                            sub.formData?.name ||
                            sub.formData?.customerName ||
                            sub.submittedBy?.name ||
                            "Client"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                          <span>
                            {sub.contactEmail ||
                              sub.formData?.clientEmail ||
                              sub.formData?.email ||
                              sub.formData?.customerEmail ||
                              sub.submittedBy?.email ||
                              "—"}
                          </span>
                          {(sub.contactPhone || sub.formData?.clientPhone || sub.formData?.phone) && (
                            <span className="text-slate-400">
                              • {sub.contactPhone || sub.formData?.clientPhone || sub.formData?.phone}
                            </span>
                          )}
                        </div>
                        {sub.submittedBy?.operatorName &&
                          sub.submittedBy?.operatorName !== (sub.contactName || sub.formData?.name || sub.formData?.clientName) && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                              Logged via: {sub.submittedBy.operatorName}
                            </div>
                          )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          {JSON.stringify(sub.formData || {})}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                            title="View Payload Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
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

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedSubmission.formTitle}
                </h3>
                <span className="text-xs text-slate-400">
                  Document ID: {selectedSubmission.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Form Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {selectedSubmission.formType}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Submitted At</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.timestamp ? new Date(selectedSubmission.timestamp).toLocaleString("en-IN") : "Recent"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact / Client</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.contactName ||
                      selectedSubmission.formData?.clientName ||
                      selectedSubmission.formData?.name ||
                      selectedSubmission.formData?.customerName ||
                      selectedSubmission.submittedBy?.name ||
                      "Client"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.contactEmail ||
                      selectedSubmission.formData?.clientEmail ||
                      selectedSubmission.formData?.email ||
                      selectedSubmission.formData?.customerEmail ||
                      selectedSubmission.submittedBy?.email ||
                      "—"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.contactPhone ||
                      selectedSubmission.formData?.clientPhone ||
                      selectedSubmission.formData?.phone ||
                      selectedSubmission.formData?.customerPhone ||
                      "—"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">System Operator</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.submittedBy?.operatorName || selectedSubmission.submittedBy?.name || "Client Self-Service"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Stored Form Payload (Firestore Document):
                </h4>
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-64">
                  {JSON.stringify(selectedSubmission.formData || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Submission Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Test Form
                </h3>
                <p className="text-xs text-slate-400">
                  Writes directly to the <code>form_submissions</code> Firestore collection
                </p>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickTestSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Form Type
                </label>
                <select
                  value={testForm.formType}
                  onChange={(e) => setTestForm({ ...testForm, formType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="customer">Customer Form</option>
                  <option value="appointment">Appointment Form</option>
                  <option value="payment">Payment Form</option>
                  <option value="lead">Lead Inquiry Form</option>
                  <option value="expense">Expense Form</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={testForm.name}
                  onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testForm.email}
                  onChange={(e) => setTestForm({ ...testForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={testForm.phone}
                  onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Form Notes / Description
                </label>
                <textarea
                  rows={2}
                  value={testForm.notes}
                  onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {testSubmitting ? "Writing to Firestore..." : "Store in Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
