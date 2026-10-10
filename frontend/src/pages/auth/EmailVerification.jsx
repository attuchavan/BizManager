import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle2, ArrowRight, Loader2, RotateCw, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { resendVerificationEmail, reloadCurrentUser } from "../../services/firebase/auth";
import AuthLayout from "../../components/auth/AuthLayout";

export default function EmailVerification() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = currentUser?.email || "your registered email";
  const role = searchParams.get("role") || userProfile?.accountType || "business";

  async function handleCheckStatus() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const user = await reloadCurrentUser();

      if (user && user.emailVerified) {
        setMessage("Email verified successfully! Redirecting...");
        setTimeout(() => {
          if (role === "customer" || userProfile?.accountType === "customer") {
            navigate("/customer/portal");
          } else {
            navigate("/app");
          }
        }, 1200);
      } else {
        setError(
          "We haven't detected your verification yet. Please click the link in your email and try again."
        );
      }
    } catch (err) {
      console.error(err);
      setError("Unable to verify status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setMessage("");

    try {
      await resendVerificationEmail();
      setMessage("A fresh verification email has been sent to your inbox.");
    } catch (err) {
      console.error(err);
      setError("Unable to resend email right now. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  }

  function handleSkip() {
    if (role === "customer" || userProfile?.accountType === "customer") {
      navigate("/customer/portal");
    } else {
      navigate("/app");
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to activate your account."
    >
      {message && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 animate-in fade-in">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="text-center py-2 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
          <Mail size={26} />
        </div>

        <div>
          <p className="text-xs text-slate-500">Sent verification email to:</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{email}</p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Checking status...</span>
              </>
            ) : (
              <>
                <span>I've Verified My Email</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-[0.99] disabled:opacity-60"
          >
            <RotateCw size={13} className={resending ? "animate-spin" : ""} />
            <span>{resending ? "Sending..." : "Resend Verification Email"}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={handleSkip}
            className="hover:text-slate-900 transition-colors"
          >
            Skip for now &rarr;
          </button>

          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
