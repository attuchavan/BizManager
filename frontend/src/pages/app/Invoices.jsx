import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  Pencil,
  Trash2,
  Check,
  IndianRupee,
  Calendar,
  Send,
  MessageSquare,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import InvoiceModal from "../../components/invoices/InvoiceModal";
import InvoiceViewModal from "../../components/invoices/InvoiceViewModal";
import {
  getInvoices,
  subscribeInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../../services/firebase/invoices";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";

const SAMPLE_INVOICES = [
  {
    id: "inv-101",
    invoiceNumber: "INV-4821",
    customerName: "Rahul Sharma",
    customerEmail: "rahul@sharma.in",
    customerPhone: "+91 98765 11223",
    issueDate: "2026-09-18",
    dueDate: "2026-10-02",
    subtotal: 25000,
    taxPercent: 18,
    taxAmount: 4500,
    discount: 0,
    total: 29500,
    status: "Paid",
    items: [
      { description: "Enterprise Consulting Package", quantity: 1, rate: 25000 },
    ],
    notes: "Payment received via UPI. Thank you!",
  },
  {
    id: "inv-102",
    invoiceNumber: "INV-4822",
    customerName: "Priya Patil",
    customerEmail: "priya@patil.com",
    customerPhone: "+91 98222 33445",
    issueDate: "2026-09-22",
    dueDate: "2026-10-06",
    subtotal: 18000,
    taxPercent: 18,
    taxAmount: 3240,
    discount: 1000,
    total: 20240,
    status: "Pending",
    items: [
      { description: "Custom Software Integration & Setup", quantity: 1, rate: 18000 },
    ],
    notes: "Please transfer to HDFC A/c No. 501004928172.",
  },
  {
    id: "inv-103",
    invoiceNumber: "INV-4823",
    customerName: "Karan Singhania",
    customerEmail: "karan@singhania.co",
    customerPhone: "+91 98111 22334",
    issueDate: "2026-09-10",
    dueDate: "2026-09-24",
    subtotal: 35000,
    taxPercent: 18,
    taxAmount: 6300,
    discount: 0,
    total: 41300,
    status: "Overdue",
    items: [
      { description: "Annual Business Maintenance Retainer", quantity: 1, rate: 35000 },
    ],
    notes: "Overdue by 7 days. Automated reminder dispatched.",
  },
];

export default function Invoices() {
  const { activeBusiness, ensureBusinessId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedInvoice(null);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Real-time synchronization of invoices
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setInvoices(SAMPLE_INVOICES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeInvoices(
      activeBusiness.businessId,
      (data) => {
        if (data && data.length > 0) {
          setInvoices(data);
        } else {
          setInvoices(SAMPLE_INVOICES);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Invoices listener error:", err);
        setInvoices(SAMPLE_INVOICES);
        setLoading(false);
      }
    );

    return () => unsub?.();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const paidAmount = invoices
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const pendingAmount = invoices
      .filter((i) => i.status === "Pending")
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const overdueAmount = invoices
      .filter((i) => i.status === "Overdue")
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return { totalInvoiced, paidAmount, pendingAmount, overdueAmount };
  }, [invoices]);

  async function handleMarkAsPaid(invoice) {
    try {
      if (activeBusiness?.businessId && !invoice.id.startsWith("inv-")) {
        await updateInvoice(activeBusiness.businessId, invoice.id, {
          status: "Paid",
        });
      }
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoice.id ? { ...i, status: "Paid" } : i))
      );
      setSuccessMessage(`Invoice ${invoice.invoiceNumber} marked as Paid!`);
    } catch (err) {
      console.error("Mark paid error:", err);
    }
  }

  async function handleSaveInvoice(payload) {
    try {
      setErrorMessage("");
      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();

      if (selectedInvoice && !selectedInvoice.id.startsWith("inv-")) {
        const updated = await updateInvoice(
          targetBusinessId,
          selectedInvoice.id,
          payload
        );
        setInvoices((prev) =>
          prev.map((i) => (i.id === selectedInvoice.id ? { ...i, ...updated } : i))
        );
        setSuccessMessage("Invoice updated successfully in database!");
      } else {
        const created = await createInvoice(targetBusinessId, payload);
        setInvoices((prev) => [created, ...prev]);
        setSuccessMessage("Invoice created & stored to database successfully!");
      }
    } catch (err) {
      console.error("Save invoice error:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
          : `Failed saving invoice: ${err.message || "Unknown error"}`
      );
      if (!selectedInvoice) {
        setInvoices((prev) => [{ id: `inv-${Date.now()}`, ...payload }, ...prev]);
      }
    }
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("inv-")) {
        await deleteInvoice(activeBusiness.businessId, id);
      }
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      setSuccessMessage("Invoice removed.");
    } catch (err) {
      console.error("Delete invoice error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Invoicing & Billing"
        description="Create commercial invoices, monitor payment statuses, and collect receivables faster."
        action={
          <button
            onClick={() => {
              setSelectedInvoice(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Create Invoice
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Invoiced</span>
            <Receipt size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.totalInvoiced.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total generated billing</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Paid (Collected)</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.paidAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Deposited into account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Pending Payments</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.pendingAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Awaiting client payment</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Overdue Invoices</span>
            <AlertCircle size={18} className="text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.overdueAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Past due date</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or invoice #..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice #</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Total Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))}
                </>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No invoices match your search.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "Paid";
                  const isOverdue = inv.status === "Overdue";

                  return (
                    <tr
                      key={inv.id}
                      className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {inv.customerName}
                        </p>
                        {inv.customerPhone && (
                          <a
                            href={`https://wa.me/${inv.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Hello ${inv.customerName}, your invoice ${inv.invoiceNumber} for ₹${Number(inv.total).toLocaleString("en-IN")} is due on ${inv.dueDate}. Please let us know once paid.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600 hover:underline dark:text-emerald-400"
                            title="Send WhatsApp Payment Request"
                          >
                            <MessageSquare size={12} />
                            <span>WhatsApp Bill</span>
                          </a>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {inv.dueDate}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPreviewInvoice(inv);
                              setPreviewOpen(true);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300 transition"
                            title="View & Print Invoice"
                          >
                            <Printer size={13} />
                            <span>Preview</span>
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => handleMarkAsPaid(inv)}
                              className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
                              title="Mark as Paid"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
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

      <InvoiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveInvoice}
        invoice={selectedInvoice}
      />

      <InvoiceViewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoice={previewInvoice}
        business={activeBusiness}
        businessName={activeBusiness?.businessName || "AI Business Manager"}
      />
    </div>
  );
}
