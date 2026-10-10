import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { resetPassword } from "../../services/firebase/auth";
import AuthLayout from "../../components/auth/AuthLayout";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      await resetPassword(email);

      setMessage(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error(err);

      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to send reset email. Please verify your address and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a password reset link."
    >
      {message && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 animate-in fade-in">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sending instructions...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
        Remember your password?{" "}
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-1"
        >
          <ArrowLeft size={12} />
          <span>Back to sign in</span>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;