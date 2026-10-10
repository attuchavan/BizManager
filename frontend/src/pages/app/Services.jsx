import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  IndianRupee,
  Pencil,
  Trash2,
  Tag,
  X,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../services/firebase/services";

const SAMPLE_SERVICES = [
  {
    id: "srv-1",
    name: "Executive Business Consultation",
    category: "Consulting",
    price: 15000,
    duration: "60 mins",
    status: "Active",
    description: "One-on-one strategic advisory, growth roadmap, and profit optimization.",
  },
  {
    id: "srv-2",
    name: "Complete Digital Setup & Onboarding",
    category: "Implementation",
    price: 35000,
    duration: "3 days",
    status: "Active",
    description: "End-to-end CRM configuration, payment gateway integration, and workflow automation.",
  },
  {
    id: "srv-3",
    name: "Monthly Retainer & Account Maintenance",
    category: "Maintenance",
    price: 25000,
    duration: "Monthly",
    status: "Active",
    description: "Ongoing technical support, invoice management, and weekly performance reviews.",
  },
  {
    id: "srv-4",
    name: "WhatsApp Marketing Broadcast Setup",
    category: "Marketing",
    price: 12000,
    duration: "24 hrs",
    status: "Active",
    description: "Campaign copywriting, customer segmentation, and broadcast scheduling.",
  },
];

export default function Services() {
  const { activeBusiness } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Consulting",
    price: "",
    duration: "60 mins",
    status: "Active",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadServices() {
    if (!activeBusiness?.businessId) {
      setServices(SAMPLE_SERVICES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getServices(activeBusiness.businessId);
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(SAMPLE_SERVICES);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
      setServices(SAMPLE_SERVICES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (selectedService) {
      setForm({
        name: selectedService.name || "",
        category: selectedService.category || "Consulting",
        price: selectedService.price ?? "",
        duration: selectedService.duration || "60 mins",
        status: selectedService.status || "Active",
        description: selectedService.description || "",
      });
    } else {
      setForm({
        name: "",
        category: "Consulting",
        price: "",
        duration: "60 mins",
        status: "Active",
        description: "",
      });
    }
  }, [selectedService, modalOpen]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || s.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, categoryFilter]);

  const stats = useMemo(() => {
    const total = services.length;
    const activeCount = services.filter((s) => s.status === "Active").length;
    const avgPrice =
      total > 0
        ? Math.round(
            services.reduce((sum, s) => sum + (Number(s.price) || 0), 0) / total
          )
        : 0;

    return { total, activeCount, avgPrice };
  }, [services]);

  async function handleSaveService(e) {
    e.preventDefault();
    if (!form.name || !form.price) return;

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        price: Number(form.price) || 0,
      };

      if (!activeBusiness?.businessId) {
        if (selectedService) {
          setServices((prev) =>
            prev.map((s) =>
              s.id === selectedService.id ? { ...s, ...payload } : s
            )
          );
        } else {
          setServices((prev) => [
            { id: `srv-${Date.now()}`, ...payload },
            ...prev,
          ]);
        }
        setSuccessMessage("Service saved successfully!");
        setModalOpen(false);
        return;
      }

      if (selectedService && !selectedService.id.startsWith("srv-")) {
        const updated = await updateService(
          activeBusiness.businessId,
          selectedService.id,
          payload
        );
        setServices((prev) =>
          prev.map((s) => (s.id === selectedService.id ? { ...s, ...updated } : s))
        );
        setSuccessMessage("Service updated successfully!");
      } else {
        const created = await createService(activeBusiness.businessId, payload);
        setServices((prev) => [created, ...prev]);
        setSuccessMessage("New service added to catalog!");
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Save service error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this service from catalog?")) return;
    try {
      if (activeBusiness?.businessId && !id.startsWith("srv-")) {
        await deleteService(activeBusiness.businessId, id);
      }
      setServices((prev) => prev.filter((s) => s.id !== id));
      setSuccessMessage("Service removed.");
    } catch (err) {
      console.error("Delete service error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portfolio"
        title="Services & Catalog"
        description="Manage your product offerings, service pricing packages, and booking durations."
        action={
          <button
            onClick={() => {
              setSelectedService(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            Add Service
          </button>
        }
      />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Offerings</span>
            <BriefcaseBusiness size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Services in catalog</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Services</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Available for client booking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Average Deal Size</span>
            <IndianRupee size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.avgPrice.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Average package price</p>
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
            placeholder="Search services..."
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["All", "Consulting", "Implementation", "Maintenance", "Marketing"].map((cat) => (
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

      {/* Service Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-5 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex justify-between items-center">
                <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-14 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No services found matching your filters.
          </div>
        ) : (
          filteredServices.map((service) => (
          <div
            key={service.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300">
                  {service.category}
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    service.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              <h3 className="mt-3 font-bold text-sm text-slate-900 dark:text-white">
                {service.name}
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {service.description}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    ₹{Number(service.price || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">
                    / {service.duration || "session"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedService(service);
                      setModalOpen(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {selectedService ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Premium Business Consulting"
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
                    <option value="Consulting">Consulting</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="15000"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration / Term
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="60 mins / Monthly"
                    className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is included in this service package..."
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
