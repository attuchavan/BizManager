import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Wallet,
  TrendingDown,
  TrendingUp,
  Tag,
  Building2,
  Calendar,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  IndianRupee,
  Repeat,
  Pencil,
  PieChart,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  subscribeExpenses,
} from "../../services/firebase/expenses";

const CATEGORIES = [
  "Marketing & Ads",
  "Software & SaaS",
  "Office & Rent",
  "Team & Payroll",
  "Utilities",
  "Supplies",
  "Travel",
  "Miscellaneous",
];

const SAMPLE_EXPENSES = [
  {
    id: "exp-1",
    title: "Google Ads & Meta Ads Spend",
    category: "Marketing & Ads",
    amount: 14500,
    vendor: "Google India",
    date: "2026-09-27",
    paymentMethod: "Company Card",
    isRecurring: false,
    frequency: "Monthly",
    notes: "Q3 customer acquisition campaign.",
  },
  {
    id: "exp-2",
    title: "AWS & Firebase Cloud Hosting",
    category: "Software & SaaS",
    amount: 8200,
    vendor: "Amazon Web Services",
    date: "2026-09-24",
    paymentMethod: "Company Card",
    isRecurring: true,
    frequency: "Monthly",
    notes: "Production server infrastructure and database read/writes.",
  },
  {
    id: "exp-3",
    title: "Co-working Space Monthly Desk",
    category: "Office & Rent",
    amount: 12000,
    vendor: "WeWork Coworking",
    date: "2026-09-15",
    paymentMethod: "Bank Transfer",
    isRecurring: true,
    frequency: "Monthly",
    notes: "Monthly office space rental.",
  },
  {
    id: "exp-4",
    title: "High-speed Internet & Utilities",
    category: "Utilities",
    amount: 2400,
    vendor: "Airtel Broadband",
    date: "2026-09-10",
    paymentMethod: "UPI",
    isRecurring: true,
    frequency: "Monthly",
    notes: "300 Mbps fiber line.",
  },
];

export default function Expenses() {
  const { activeBusiness, ensureBusinessId } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [recurringOnly, setRecurringOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Marketing & Ads",
    amount: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Company Card",
    isRecurring: false,
    frequency: "Monthly",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Real-time synchronization of business expenses
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setExpenses(SAMPLE_EXPENSES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeExpenses(
      activeBusiness.businessId,
      (data) => {
        if (data && data.length > 0) {
          setExpenses(data);
        } else {
          setExpenses(SAMPLE_EXPENSES);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("subscribeExpenses listener error:", err);
        setExpenses(SAMPLE_EXPENSES);
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

  useEffect(() => {
    if (selectedExpense) {
      setForm({
        title: selectedExpense.title || "",
        category: selectedExpense.category || "Marketing & Ads",
        amount: selectedExpense.amount ?? "",
        vendor: selectedExpense.vendor || "",
        date: selectedExpense.date || new Date().toISOString().split("T")[0],
        paymentMethod: selectedExpense.paymentMethod || "Company Card",
        isRecurring: Boolean(selectedExpense.isRecurring),
        frequency: selectedExpense.frequency || "Monthly",
        notes: selectedExpense.notes || "",
      });
    } else {
      setForm({
        title: "",
        category: "Marketing & Ads",
        amount: "",
        vendor: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Company Card",
        isRecurring: false,
        frequency: "Monthly",
        notes: "",
      });
    }
  }, [selectedExpense, modalOpen]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.vendor?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || e.category === categoryFilter;

      const matchesRecurring = !recurringOnly || Boolean(e.isRecurring);

      return matchesSearch && matchesCategory && matchesRecurring;
    });
  }, [expenses, search, categoryFilter, recurringOnly]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const recurringTotal = expenses
      .filter((e) => e.isRecurring)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Category breakdown
    const catMap = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
    });

    let topCat = "None";
    let maxSpend = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > maxSpend) {
        maxSpend = val;
        topCat = cat;
      }
    });

    const breakdown = Object.entries(catMap)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const netEstimatedProfit = Math.max(0, 84500 - total);

    return { total, recurringTotal, topCat, maxSpend, netEstimatedProfit, breakdown, count: expenses.length };
  }, [expenses]);

  async function handleSaveExpense(e) {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        amount: Number(form.amount) || 0,
        isRecurring: Boolean(form.isRecurring),
      };

      setErrorMessage("");
      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();

      if (selectedExpense && !selectedExpense.id.startsWith("exp-")) {
        const updated = await updateExpense(
          targetBusinessId,
          selectedExpense.id,
          payload
        );
        setExpenses((prev) =>
          prev.map((e) => (e.id === selectedExpense.id ? { ...e, ...updated } : e))
        );
        setSuccessMessage("Expense updated successfully in database!");
      } else {
        const created = await createExpense(targetBusinessId, payload);
        setExpenses((prev) => [created, ...prev]);
        setSuccessMessage("Expense logged & saved to database successfully!");
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Save expense error:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
          : `Failed saving expense: ${err.message || "Unknown error"}`
      );
      if (!selectedExpense) {
        setExpenses((prev) => [{ id: `exp-${Date.now()}`, ...payload }, ...prev]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("exp-")) {
        await deleteExpense(activeBusiness.businessId, id);
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setSuccessMessage("Expense removed.");
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Expense Tracker"
        description="Track operational expenditure, recurring software costs, payroll, and analyze category summaries."
        action={
          <button
            onClick={() => {
              setSelectedExpense(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Log Expense
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
            <span className="text-xs font-medium">Total Outflow</span>
            <Wallet size={18} className="text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.total.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{stats.count} recorded expenses</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Recurring Commitments</span>
            <Repeat size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.recurringTotal.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Monthly auto-renewals</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Largest Cost Category</span>
            <Tag size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white truncate">
            {stats.topCat}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            ₹{stats.maxSpend.toLocaleString("en-IN")} allocated
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Estimated Net Margin</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{stats.netEstimatedProfit.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Net operating balance</p>
        </div>
      </div>

      {/* Expense Summaries: Category Breakdown Bar */}
      {stats.breakdown.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-blue-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Expense Category Summaries
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {stats.breakdown.length} active categories
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.breakdown.map((item) => (
              <div
                key={item.category}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {item.category}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.percent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ₹{item.amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense title or vendor..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recurring Filter Toggle */}
          <button
            onClick={() => setRecurringOnly(!recurringOnly)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              recurringOnly
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Repeat size={13} />
            <span>Recurring Only</span>
          </button>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {["All", ...CATEGORIES.slice(0, 5)].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Expense Description</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Vendor / Payee</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Payment Mode</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={8} />
                ))
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No expense entries found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {e.title}
                      {e.notes && (
                        <p className="mt-0.5 text-[11px] font-normal text-slate-400">
                          {e.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {e.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {e.isRecurring ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          <Repeat size={11} />
                          {e.frequency || "Monthly"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">One-time</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {e.vendor || "Direct"}
                    </td>

                    <td className="px-5 py-4 font-bold text-rose-600 dark:text-rose-400">
                      ₹{Number(e.amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {e.paymentMethod}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {e.date}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedExpense(e);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                          title="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {selectedExpense ? "Edit Expense Entry" : "Record Business Expense"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Google Workspace Subscription"
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="12000"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vendor / Merchant
                  </label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    placeholder="e.g. Amazon Web Services"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Mode
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Company Card">Company Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              {/* Recurring Expense Support */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Repeat size={13} className="text-blue-500" />
                    Recurring Expense (Subscription / Retainer)
                  </span>
                </label>

                {form.isRecurring && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Billing Frequency
                    </label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expense Date
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Receipt number, tax deductions, or project tag..."
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
                  {selectedExpense ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
