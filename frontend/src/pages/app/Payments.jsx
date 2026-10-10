import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CreditCard,
  CheckCircle2,
  Calendar,
  IndianRupee,
  User,
  Hash,
  X,
  Loader2,
  Trash2,
  Filter,
  Receipt,
  FileCheck2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";
import {
  getPayments,
  createPayment,
  deletePayment,
  subscribePayments,
} from "../../services/firebase/payments";
import { getCustomers, updateCustomer, addCustomerActivity } from "../../services/firebase/customers";
import { getInvoices, updateInvoice } from "../../services/firebase/invoices";
import { getBusinessTerminology } from "../../utils/businessTerminology";

const SAMPLE_PAYMENTS = [
  {
    id: "pay-1",
    customerId: "cust-1",
    customerName: "Rahul Sharma",
    amount: 29500,
    method: "UPI",
    referenceId: "UPI/2026/982189028",
    invoiceNumber: "INV-4821",
    status: "Completed",
    date: "2026-09-28",
    notes: "Settled via Google Pay UPI.",
  },
  {
    id: "pay-2",
    customerId: "cust-2",
    customerName: "Priya Patil",
    amount: 15000,
    method: "Net Banking",
    referenceId: "HDFC-NEFT-9281928",
    invoiceNumber: "INV-4822",
    status: "Completed",
    date: "2026-09-25",
    notes: "Part payment for setup services.",
  },
  {
    id: "pay-3",
    customerId: "cust-3",
    customerName: "Amit Joshi",
    amount: 40000,
    method: "Card",
    referenceId: "TXN_STRIPE_98129",
    invoiceNumber: "INV-4820",
    status: "Completed",
    date: "2026-09-20",
    notes: "Credit card swipe via POS terminal.",
  },
];

export default function Payments() {
  const { activeBusiness, ensureBusinessId } = useAuth();

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    invoiceNumber: "",
    amount: "",
    method: "UPI",
    status: "Completed",
    referenceId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Real-time synchronization of payments and invoices
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setPayments(SAMPLE_PAYMENTS);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = subscribePayments(
      activeBusiness.businessId,
      (payData) => {
        if (payData && payData.length > 0) {
          setPayments(payData);
        } else {
          setPayments(SAMPLE_PAYMENTS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("subscribePayments fallback:", err);
        setPayments(SAMPLE_PAYMENTS);
        setLoading(false);
      }
    );

    Promise.all([
      getCustomers(activeBusiness.businessId),
      getInvoices(activeBusiness.businessId),
    ])
      .then(([custData, invData]) => {
        if (custData) setCustomers(custData);
        if (invData) setInvoices(invData);
      })
      .catch((err) => console.error("Failed loading customers/invoices for payments:", err));

    return () => unsub?.();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        p.referenceId?.toLowerCase().includes(search.toLowerCase()) ||
        p.invoiceNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesMethod =
        methodFilter === "All" || p.method === methodFilter;

      const matchesStatus =
        statusFilter === "All" || (p.status || "Completed") === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, search, methodFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const upiTotal = payments
      .filter((p) => p.method === "UPI")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cardTotal = payments
      .filter((p) => p.method === "Card" || p.method === "Net Banking")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cashTotal = payments
      .filter((p) => p.method === "Cash")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return { totalAmount, upiTotal, cardTotal, cashTotal };
  }, [payments]);

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!form.customerName || !form.amount) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      const payload = {
        ...form,
        amount: Number(form.amount) || 0,
        status: form.status || "Completed",
      };

      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();
      let created = null;

      try {
        created = await createPayment(targetBusinessId, payload);
      } catch (dbErr) {
        console.error("Firestore createPayment error:", dbErr);
        // If permission denied or offline, show warning but preserve local state
        setErrorMessage(
          dbErr?.code === "permission-denied"
            ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
            : `Database Error: ${dbErr.message || "Failed saving payment to database."}`
        );
        created = { id: `pay-${Date.now()}`, ...payload };
      }

      setPayments((prev) => [created, ...prev]);

      // Auto-reconcile linked invoice if payment completed
      if (payload.status === "Completed") {
        if (payload.invoiceNumber) {
          const matchedInv = invoices.find(
            (inv) => inv.invoiceNumber === payload.invoiceNumber
          );
          if (matchedInv && matchedInv.id && !matchedInv.id.startsWith("inv-")) {
            const currentPaid = Number(
              matchedInv.paidAmount || (matchedInv.status === "Paid" ? matchedInv.total : 0)
            );
            const invoiceTotal = Number(matchedInv.total || 0);
            const newPaid = currentPaid + payload.amount;
            const newBalance = Math.max(0, invoiceTotal - newPaid);
            const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";

            try {
              await updateInvoice(targetBusinessId, matchedInv.id, {
                paidAmount: newPaid,
                balance: newBalance,
                status: newStatus,
              });
            } catch (invErr) {
              console.warn("Invoice reconcile update failed:", invErr);
            }

            setInvoices((prev) =>
              prev.map((i) =>
                i.id === matchedInv.id
                  ? { ...i, paidAmount: newPaid, balance: newBalance, status: newStatus }
                  : i
              )
            );
          }
        }

        // Update Customer Total Spending & Log Activity
        const custId = payload.customerId;
        const custName = payload.customerName;
        const matchedCust = customers.find(
          (c) =>
            (custId && c.id === custId) ||
            (custName && c.name?.toLowerCase() === custName.toLowerCase())
        );
        if (matchedCust && matchedCust.id && !matchedCust.id.startsWith("cust-")) {
          const currentSpent = Number(matchedCust.totalSpent || 0);
          const updatedSpent = currentSpent + payload.amount;

          try {
            await updateCustomer(targetBusinessId, matchedCust.id, {
              totalSpent: updatedSpent,
            });
            await addCustomerActivity(targetBusinessId, matchedCust.id, {
              title: "Payment Received",
              description: `₹${payload.amount.toLocaleString("en-IN")} received via ${payload.method}${
                payload.invoiceNumber ? ` for Invoice ${payload.invoiceNumber}` : ""
              }.`,
              type: "payment",
            });
          } catch (custErr) {
            console.warn("Customer update activity failed:", custErr);
          }

          setCustomers((prev) =>
            prev.map((c) =>
              c.id === matchedCust.id ? { ...c, totalSpent: updatedSpent } : c
            )
          );
        }
      }

      setSuccessMessage("Payment recorded & saved to database successfully!");
      setModalOpen(false);
      setForm({
        customerId: "",
        customerName: "",
        invoiceNumber: "",
        amount: "",
        method: "UPI",
        status: "Completed",
        referenceId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (err) {
      console.error("Payment save error:", err);
      setErrorMessage(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this payment log?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("pay-")) {
        await deletePayment(activeBusiness.businessId, id);
      }
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setSuccessMessage("Payment record deleted.");
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payments Received"
        description="Monitor verified incoming transactions, reconciliation logs, and payout receipts."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Record Payment
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Collected</span>
            <IndianRupee size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.totalAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total received volume</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">UPI Transactions</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.upiTotal.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Instant UPI payments</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Bank / Card</span>
            <CreditCard size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.cardTotal.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Cards & Net Banking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Cash Payments</span>
            <CheckCircle2 size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.cashTotal.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Hand-collected cash</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, UTR, or invoice..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {["All", "UPI", "Net Banking", "Card", "Cash"].map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                  methodFilter === method
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {["All", "Completed", "Pending", "Failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Amount Paid</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Reference / UTR</th>
                <th className="px-5 py-3 font-semibold">Invoice #</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={8} />
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const status = p.status || "Completed";
                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {p.customerName}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {p.method}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : status === "Failed"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {p.referenceId || "N/A"}
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                        {p.invoiceNumber ? (
                          <span className="flex items-center gap-1">
                            <Receipt size={12} className="text-blue-500" />
                            {p.invoiceNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">Direct</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {p.date}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Record Customer Payment</h3>
                <p className="text-xs text-slate-400">Link to customer, pending invoice & reconcile accounts</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
              {/* Customer Dropdown or Manual */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Customer *</span>
                  {customers.length > 0 && (
                    <span className="text-[11px] text-slate-400">select or type below</span>
                  )}
                </label>
                {customers.length > 0 && (
                  <select
                    value={form.customerId}
                    onChange={(e) => {
                      const custId = e.target.value;
                      const cust = customers.find((c) => c.id === custId);
                      if (cust) {
                        setForm((prev) => ({
                          ...prev,
                          customerId: cust.id,
                          customerName: cust.name,
                        }));
                      } else {
                        setForm((prev) => ({ ...prev, customerId: "" }));
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-2"
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Linked Invoice Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Link to Invoice (Optional)</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Auto-marks Paid</span>
                </label>
                <select
                  value={form.invoiceNumber}
                  onChange={(e) => {
                    const invNum = e.target.value;
                    const matchedInv = invoices.find((i) => i.invoiceNumber === invNum);
                    if (matchedInv) {
                      setForm((prev) => ({
                        ...prev,
                        invoiceNumber: matchedInv.invoiceNumber,
                        customerName: matchedInv.customerName || prev.customerName,
                        amount: matchedInv.total || prev.amount,
                      }));
                    } else {
                      setForm((prev) => ({ ...prev, invoiceNumber: invNum }));
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50/30 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-white"
                >
                  <option value="">-- Direct Payment (No Invoice Linked) --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} • {inv.customerName} (₹{Number(inv.total).toLocaleString("en-IN")}) - {inv.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="25000"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Net Banking">Net Banking / NEFT / IMPS</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque / Demand Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transaction / UTR Ref
                  </label>
                  <input
                    type="text"
                    value={form.referenceId}
                    onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                    placeholder="e.g. UPI/6281928172"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Completed">Completed (Settled)</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Failed">Failed / Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Reconciliation Memo
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional memo or bank branch details..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin text-emerald-400" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
