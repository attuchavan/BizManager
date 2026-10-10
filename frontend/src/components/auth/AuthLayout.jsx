import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 selection:bg-indigo-600 selection:text-white flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle soft ambient glow matching landing page & dashboard */}
      <div className="pointer-events-none absolute left-1/2 -top-24 -translate-x-1/2 h-96 w-[700px] rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-emerald-500/15 blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-auto"
      >
        {/* Centered Brand Logo directly above the form card */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center justify-center group">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-xl shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105 mb-2.5">
              AI
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              BizManager
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
              Intelligent Workspace
            </p>
          </Link>
        </div>

        {/* Center Auth Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {/* Centered Home Button below the form */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} BizManager • Secure Business Workspace
          </p>
        </div>
      </motion.div>
    </div>
  );
}
