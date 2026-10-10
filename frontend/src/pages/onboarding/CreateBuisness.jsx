import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createBusiness } from "../../services/firebase/businesses";
import { createService } from "../../services/firebase/services";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";
import { BUSINESS_TYPES } from "../../utils/businessTerminology";

export default function CreateBuisness() {
  const navigate = useNavigate();
  const { currentUser, switchBusiness } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    businessType: "Clinic & Healthcare",
    tagline: "Dedicated to excellence in patient care and wellness.",
    phone: "+91 98765 43210",
    email: currentUser?.email || "",
    city: "Mumbai",
    address: "Bandra West, Mumbai, Maharashtra",
    gstin: "",
    currency: "INR (₹)",
    workingHours: "Mon - Sat: 09:00 AM - 08:00 PM",
  });

  const [initialServices, setInitialServices] = useState([
    { name: "Initial Consultation", price: 1000, duration: "30 mins", category: "Consultation" },
    { name: "Comprehensive Treatment", price: 3500, duration: "60 mins", category: "Standard" },
  ]);

  function handleServiceChange(index, field, value) {
    setInitialServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addServiceRow() {
    setInitialServices((prev) => [
      ...prev,
      { name: "", price: 1500, duration: "45 mins", category: "General" },
    ]);
  }

  function removeServiceRow(index) {
    if (initialServices.length <= 1) return;
    setInitialServices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitWorkspace(e) {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError("Please provide a business name.");
      setStep(1);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const ownerId = currentUser?.uid || "unauthenticated_owner";
      const createdBusiness = await createBusiness({
        ownerId,
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        tagline: form.tagline.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        gstin: form.gstin.trim(),
        currency: form.currency,
        workingHours: form.workingHours,
      });

      const bizId = createdBusiness.businessId || createdBusiness.id;

      // Add default starter services
      const validServices = initialServices.filter((s) => s.name.trim());
      for (const s of validServices) {
        try {
          await createService(bizId, {
            name: s.name.trim(),
            price: Number(s.price) || 0,
            duration: s.duration || "45 mins",
            category: s.category || "General",
            status: "Active",
          });
        } catch (sErr) {
          console.warn("Could not seed starter service:", sErr);
        }
      }

      // Record comprehensive onboarding form submission
      await recordFormSubmission(bizId, {
        formType: "onboarding",
        formTitle: `Business Workspace Onboarded: ${form.businessName.trim()}`,
        data: {
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          contact: { phone: form.phone, email: form.email, address: form.address },
          seededServicesCount: validServices.length,
          timestamp: new Date().toISOString(),
        },
        entityId: bizId,
        entityCollection: "businesses",
      });

      if (typeof switchBusiness === "function") {
        switchBusiness(bizId);
      }

      navigate("/app");
    } catch (err) {
      console.error("Failed to create business workspace:", err);
      setError(err.message || "Failed to complete business setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white text-sm shadow-md shadow-blue-500/25">
              AI
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base">BizManager</span>
              <span className="ml-2 text-xs text-blue-400 font-semibold">• Workspace Setup</span>
            </div>
          </Link>

          <Link
            to="/app"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Cancel & Return</span>
          </Link>
        </div>
      </header>

      {/* Main Setup Container */}
      <main className="mx-auto my-8 w-full max-w-3xl px-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Steps Indicator */}
          <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
                Step {step} of 2
              </span>
              <h1 className="mt-1 text-2xl font-extrabold text-white">
                {step === 1 ? "Configure Workspace Profile" : "Catalog Starter Services"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                1
              </span>
              <span className="h-0.5 w-6 bg-slate-800" />
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                2
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmitWorkspace}>
            {/* STEP 1: Basic Business Profile */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Business / Practice Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health & Dental Clinic"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business Type / Industry *
                    </label>
                    <select
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    >
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      City / Region *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Operating Support Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={form.workingHours}
                      onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      GSTIN / Tax ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="27ABCDE1234F1Z5"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition"
                  >
                    <span>Continue to Services</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Starter Services Catalog */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <p className="text-xs text-slate-400">
                  Add 1 or more initial services for your business catalog. Clients can book these directly through the online portal.
                </p>

                <div className="space-y-3">
                  {initialServices.map((svc, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <input
                        type="text"
                        placeholder="Service name (e.g. Consultation)"
                        value={svc.name}
                        onChange={(e) => handleServiceChange(idx, "name", e.target.value)}
                        className="flex-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-28">
                          <span className="absolute left-2.5 top-2 text-slate-500 text-xs">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={svc.price}
                            onChange={(e) => handleServiceChange(idx, "price", e.target.value)}
                            className="w-full pl-6 rounded-xl border border-slate-800 bg-slate-900 py-2 pr-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Duration"
                          value={svc.duration}
                          onChange={(e) => handleServiceChange(idx, "duration", e.target.value)}
                          className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-white outline-none focus:border-blue-500 text-center"
                        />
                        {initialServices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeServiceRow(idx)}
                            className="p-2 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addServiceRow}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
                >
                  <Plus size={13} />
                  <span>Add Another Service</span>
                </button>

                <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back to Profile
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Launch Business Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        All workspace data and catalog settings are saved directly to Cloud Firestore.
      </footer>
    </div>
  );
}
