import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  IndianRupee,
  Tag,
  Eye,
  MessageSquare,
  ArrowUpDown,
  Filter,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import CustomerModal from "../../components/customers/CustomerModal";
import CustomerProfileModal from "../../components/customers/CustomerProfileModal";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  subscribeCustomers,
} from "../../services/firebase/customers";
import { getBusinessTerminology } from "../../utils/businessTerminology";
import { TableRowSkeleton } from "../../components/common/SkeletonLoader";

const SAMPLE_CUSTOMERS = [
  {
    id: "sample-c1",
    name: "Rahul Sharma",
    company: "Sharma Consultancy",
    email: "rahul@sharma.in",
    phone: "+91 98765 11223",
    status: "VIP",
    totalSpent: 45000,
    tags: ["VIP", "Corporate"],
    notes: "Prefers communication over WhatsApp. Regular consulting retainer client.",
  },
  {
    id: "sample-c2",
    name: "Priya Patil",
    company: "Patil Tech Solutions",
    email: "priya@patil.com",
    phone: "+91 98222 33445",
    status: "Active",
    totalSpent: 28500,
    tags: ["Repeat Client"],
    notes: "Quarterly review required next month.",
  },
  {
    id: "sample-c3",
    name: "Amit Joshi",
    company: "Joshi Enterprises",
    email: "amit@joshi.co",
    phone: "+91 97666 44556",
    status: "Active",
    totalSpent: 18000,
    tags: ["Wholesale"],
    notes: "Bulk invoice buyer.",
  },
  {
    id: "sample-c4",
    name: "Sneha Kulkarni",
    company: "Kulkarni Design Studio",
    email: "sneha@kulkarni.in",
    phone: "+91 99112 55667",
    status: "Lead",
    totalSpent: 8000,
    tags: ["High-Spender"],
    notes: "Interested in full agency migration package.",
  },
];

export default function Customers() {
  const { activeBusiness, ensureBusinessId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const terminology = useMemo(
    () =>
      getBusinessTerminology(
        activeBusiness?.businessType || activeBusiness?.type || activeBusiness?.industry
      ),
    [activeBusiness]
  );

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent"); // 'recent' | 'spend' | 'name'

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle auto-open on ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelectedCustomer(null);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Real-time synchronization of customers
  useEffect(() => {
    if (!activeBusiness?.businessId) {
      setCustomers(SAMPLE_CUSTOMERS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeCustomers(
      activeBusiness.businessId,
      (data) => {
        if (data && data.length > 0) {
          setCustomers(data);
        } else {
          setCustomers(SAMPLE_CUSTOMERS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("subscribeCustomers listener error:", err);
        setCustomers(SAMPLE_CUSTOMERS);
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

  // Extract all unique tags across customers
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set();
    customers.forEach((c) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [customers]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    const s = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const matchesSearch =
          !s ||
          customer.name?.toLowerCase().includes(s) ||
          customer.email?.toLowerCase().includes(s) ||
          customer.phone?.includes(s) ||
          customer.company?.toLowerCase().includes(s) ||
          (customer.tags && customer.tags.some((t) => t.toLowerCase().includes(s)));

        const matchesStatus =
          statusFilter === "All" || customer.status === statusFilter;

        const matchesTag =
          tagFilter === "All" ||
          (Array.isArray(customer.tags) && customer.tags.includes(tagFilter));

        return matchesSearch && matchesStatus && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "spend") {
          return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
        }
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "");
        }
        return 0; // recent (default firestore order)
      });
  }, [customers, search, statusFilter, tagFilter, sortBy]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(
      (c) => c.status === "Active" || c.status === "VIP"
    ).length;
    const totalRevenue = customers.reduce(
      (sum, c) => sum + (Number(c.totalSpent) || 0),
      0
    );
    const avgSpend = total > 0 ? Math.round(totalRevenue / total) : 0;

    return { total, active, totalRevenue, avgSpend };
  }, [customers]);

  // Save Customer (Add or Edit)
  async function handleSaveCustomer(payload) {
    try {
      setErrorMessage("");
      const targetBusinessId = activeBusiness?.businessId || ensureBusinessId();

      if (selectedCustomer && !selectedCustomer.id.startsWith("sample-")) {
        const updated = await updateCustomer(
          targetBusinessId,
          selectedCustomer.id,
          payload
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...updated } : c))
        );
        setSuccessMessage(`Updated profile for ${payload.name} in database.`);
      } else {
        const created = await createCustomer(targetBusinessId, payload);
        setCustomers((prev) => [created, ...prev]);
        setSuccessMessage(`New customer ${payload.name} saved to database!`);
      }
    } catch (err) {
      console.error("Save customer error:", err);
      setErrorMessage(
        err?.code === "permission-denied"
          ? "Database Permission Error: Please update and publish Firestore Security Rules in Firebase Console."
          : `Failed saving customer: ${err.message || "Unknown error"}`
      );
      if (!selectedCustomer) {
        setCustomers((prev) => [{ id: `c-${Date.now()}`, ...payload }, ...prev]);
      }
    }
  }

  // Delete Customer
  async function handleDeleteCustomer(customer) {
    if (!window.confirm(`Are you sure you want to delete "${customer.name}"?`)) return;

    try {
      if (activeBusiness?.businessId && !customer.id.startsWith("sample-")) {
        await deleteCustomer(activeBusiness.businessId, customer.id);
      }
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      setSuccessMessage(`Removed customer "${customer.name}".`);
    } catch (err) {
      console.error("Delete customer error:", err);
    }
  }

  function handleOpenProfile(customer) {
    setViewCustomer(customer);
    setProfileModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationship Management"
        title={`${terminology.customers} Directory`}
        description={`Manage active profiles, total spend history, and relationship tracking for ${terminology.customers.toLowerCase()}.`}
        action={
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            {terminology.newCustomer}
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

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total {terminology.customer} Accounts</span>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total in database</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active & VIP {terminology.customers}</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.active}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Currently engaging</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Lifetime Inflow</span>
            <IndianRupee size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Gross receipts collected</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Average {terminology.customer} LTV</span>
            <Tag size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.avgSpend.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Mean spend per account</p>
        </div>
      </div>

      {/* Search, Status Filter, Tag Filter, and Sort */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, tag..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {["All", "Active", "VIP", "Lead", "Inactive"].map((status) => (
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

          {/* Tags Dropdown Filter */}
          {allUniqueTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Tags</option>
              {allUniqueTags.map((t) => (
                <option key={t} value={t}>
                  Tag: {t}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="spend">Sort: Highest Spending</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer & Company</th>
                <th className="px-5 py-3 font-semibold">Contact Info</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Tags</th>
                <th className="px-5 py-3 font-semibold">Total Spent</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No customers found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const cleanPhone = c.phone?.replace(/[^0-9]/g, "") || "";

                  return (
                    <tr
                      key={c.id}
                      className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => handleOpenProfile(c)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold text-xs ring-1 ring-indigo-500/20">
                            {c.name?.charAt(0).toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {c.company || "Individual"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition"
                            >
                              <Mail size={12} className="text-slate-400" />
                              <span>{c.email}</span>
                            </a>
                          )}
                          {c.phone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${c.name}, greetings from ${activeBusiness?.name || "our team"}! We appreciate your trust in us. How can we assist you today?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-emerald-600 hover:underline dark:text-emerald-400 font-medium"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={12} />
                              <span>{c.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            c.status === "VIP"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                              : c.status === "Lead"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                              : c.status === "Inactive"
                              ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                          }`}
                        >
                          {c.status || "Active"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(c.tags) && c.tags.length > 0 ? (
                            c.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                          {c.tags?.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{c.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        ₹{Number(c.totalSpent || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProfile(c)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300 transition"
                            title="View Profile & Notes"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            title="Edit Customer"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteCustomer(c)}
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

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
      />

      {/* Customer Profile Details, Notes & Activity Modal */}
      <CustomerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        customer={viewCustomer}
        businessId={activeBusiness?.businessId}
        onEditCustomer={(cust) => {
          setSelectedCustomer(cust);
          setModalOpen(true);
        }}
      />
    </div>
  );
}