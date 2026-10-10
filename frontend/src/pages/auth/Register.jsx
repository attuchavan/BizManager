import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Phone,
} from "lucide-react";
import { registerUser } from "../../services/firebase/auth";
import { createUserProfile } from "../../services/firebase/users";
import { createBusiness } from "../../services/firebase/businesses";
import AuthLayout from "../../components/auth/AuthLayout";

const businessTypes = [
  "Restaurant & Food",
  "Salon & Spa",
  "Gym & Fitness",
  "Clinic & Healthcare",
  "Coaching & Education",
  "Real Estate",
  "Retail & E-commerce",
  "Repair & Services",
  "Agency & Marketing",
  "Consulting",
  "Freelancer",
  "Other",
];

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: 'business' | 'customer'
  const initialMode = searchParams.get("type") === "customer" ? "customer" : "business";
  const [accountType, setAccountType] = useState(initialMode);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    businessType: "Clinic & Healthcare",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (accountType === "business" && !form.businessName.trim()) {
      setError("Please enter your business name.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const user = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (accountType === "business") {
        // Business Owner / Admin Registration
        await createUserProfile({
          uid: user.uid,
          name: form.name.trim(),
          email: form.email.trim(),
          accountType: "business_owner",
          phone: form.phone.trim(),
        });

        await createBusiness({
          ownerId: user.uid,
          businessName: form.businessName.trim(),
          businessType: form.businessType,
        });

        navigate("/verify-email?role=business");
      } else {
        // Customer / Client Registration
        await createUserProfile({
          uid: user.uid,
          name: form.name.trim(),
          email: form.email.trim(),
          accountType: "customer",
          phone: form.phone.trim(),
        });

        navigate("/customer/portal");
      }
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError("Registration failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Choose your account type to get started."
    >
      {/* Account Type Selector */}
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setAccountType("business");
            setError("");
          }}
          className={`rounded-lg py-2 text-xs font-semibold transition-all ${
            accountType === "business"
              ? "bg-white text-indigo-600 shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Business Owner
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType("customer");
            setError("");
          }}
          className={`rounded-lg py-2 text-xs font-semibold transition-all ${
            accountType === "customer"
              ? "bg-white text-indigo-600 shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Client / Customer
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Full Name
          </label>
          <div className="relative">
            <User
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="Atharv Chavan"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Business Name & Type (Only for Business Owners) */}
        {accountType === "business" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Business Name
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  type="text"
                  placeholder="e.g. Apex Consulting Care"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Business Category
              </label>
              <div className="relative">
                <Briefcase
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Phone Number (For Clients) */}
        {accountType === "customer" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+91 98765 43210"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>
                {accountType === "business"
                  ? "Create Business Account"
                  : "Create Client Account"}
              </span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors ml-1"
        >
          Sign in here
        </Link>
      </div>
    </AuthLayout>
  );
}

export default Register;