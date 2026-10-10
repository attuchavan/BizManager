import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  Receipt,
  Bot,
  Menu,
  X,
  CheckCircle,
  Building2,
  UserCheck,
  Compass,
  Send,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { createLead } from "../../services/firebase/leads";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Landing Page Demo & Consultation Form State
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "Clinic & Healthcare",
    message: "",
  });
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoError, setDemoError] = useState("");

  async function handleDemoSubmit(e) {
    e.preventDefault();
    if (!demoForm.name.trim() || !demoForm.email.trim()) {
      setDemoError("Please enter your name and email address.");
      return;
    }

    try {
      setSubmittingDemo(true);
      setDemoError("");

      const leadPayload = {
        name: demoForm.name.trim(),
        email: demoForm.email.trim(),
        phone: demoForm.phone.trim(),
        company: demoForm.businessName.trim() || "Prospective Client",
        businessType: demoForm.businessType,
        source: "Landing Page Demo Request",
        status: "New",
        notes: demoForm.message.trim() || "Requested platform walkthrough and onboarding consultation.",
        estimatedValue: 25000,
      };

      try {
        await createLead("default_business", leadPayload);
      } catch (leadErr) {
        console.warn("Direct lead creation error, falling back to universal audit:", leadErr);
        await recordFormSubmission("default_business", {
          formType: "landing_inquiry",
          formTitle: `Demo Request: ${demoForm.name.trim()} (${demoForm.businessName.trim() || demoForm.businessType})`,
          data: leadPayload,
          entityCollection: "leads",
        });
      }

      setDemoSubmitted(true);
      setDemoForm({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        businessType: "Clinic & Healthcare",
        message: "",
      });
    } catch (err) {
      console.error("Failed demo submission:", err);
      setDemoError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmittingDemo(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* CLEAN, COMFORTABLE TOPBAR                                     */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-8">
          {/* Brand Logo - exactly matching dashboard */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              AI
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                BizManager
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Intelligent Workspace
              </p>
            </div>
          </Link>

          {/* Simple, peaceful links (Only 2 essential links - no cluttered all-caps!) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#portals"
              className="hover:text-slate-900 transition-colors"
            >
              Who It's For
            </a>
            <Link
              to="/explore"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Explore Stores & Doctors
            </Link>
            <Link
              to="/customer/portal"
              className="hover:text-blue-600 transition-colors"
            >
              Client Portal
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-500 transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-slate-100 bg-white px-6 py-4 md:hidden"
            >
              <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600"
                >
                  Features
                </a>
                <a
                  href="#portals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600"
                >
                  Who It's For
                </a>
                <Link
                  to="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-blue-600 font-semibold hover:text-blue-700"
                >
                  Explore Stores & Doctors
                </Link>
                <Link
                  to="/customer/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600"
                >
                  Client Portal
                </Link>
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* COMFORTABLE, BREATHABLE HERO                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Soft subtle background glow */}
        <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 h-96 w-[650px] rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-emerald-500/15 blur-3xl -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle announcement badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 to-emerald-50/90 px-4 py-1.5 text-xs font-semibold text-indigo-800 mb-6 shadow-sm">
            <Sparkles size={13} className="text-emerald-500 animate-pulse" />
            <span>Intelligent Business Management</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
            Run your business smoothly from{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              one simple workspace.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Effortlessly organize customers, schedule appointments, handle GST billing, and monitor growth — without the overwhelm.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-colors"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight size={15} className="text-emerald-300" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/explore"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <Compass size={15} className="text-emerald-600" />
                <span>Explore Clinics & Stores</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <span>Sign In to Workspace</span>
              </Link>
            </motion.div>
          </div>

          {/* Micro Proof */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              2-minute instant setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              Cancel anytime
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* AUTHENTIC LIVE DASHBOARD PREVIEW                              */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/60 text-left"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="ml-2 text-xs font-semibold text-slate-500">
                  BizManager • Workspace Overview
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </div>
            </div>

            {/* Greeting */}
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Overview
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Good morning, Atharv 👋
              </h3>
              <p className="text-xs text-slate-500">
                Here's what's happening with your business today.
              </p>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">₹84,500</p>
                <span className="text-[10px] font-bold text-emerald-600">↑ 12.5% vs last month</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Active Clients</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">1,284</p>
                <span className="text-[10px] font-bold text-blue-600">↑ 8.2% growth</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
                <p className="text-[11px] font-medium text-slate-400">New Leads</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">86</p>
                <span className="text-[10px] font-bold text-emerald-600">↑ 18.4% qualified</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Appointments</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">142</p>
                <span className="text-[10px] font-medium text-slate-500">Next: 10:30 AM</span>
              </div>
            </div>

            {/* AI Assistant Summary Box (matching dashboard screenshot) */}
            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Bot size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">AI Business Summary</p>
                    <p className="text-[11px] text-slate-400">Today's intelligence briefing</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-blue-400">Auto-generated</span>
              </div>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                Your business generated ₹84,500 yesterday. 8 new consultation leads are waiting for your confirmation.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3 CORE PILLARS (CLEAN & SPACIOUS)                             */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-16 sm:py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Everything you need, nothing you don't.
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-slate-500">
              BizManager focuses on the core daily operations that keep your business running smoothly.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-7 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-5">
                <Users size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Customer CRM & History
              </h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Keep client profiles, previous visits, service notes, and contact histories organized in one place.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-7 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-5">
                <Calendar size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Calendar & Bookings
              </h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Schedule consultations and appointments seamlessly with automatic notifications that prevent no-shows.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-7 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <Receipt size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                GST Invoices & Billing
              </h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Generate compliant tax invoices with automatic CGST/SGST calculations and instant PDF receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* WHO IT'S FOR (BUSINESS OWNER vs CLIENT)                       */}
      {/* ------------------------------------------------------------- */}
      <section id="portals" className="py-16 sm:py-20 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Designed for both you and your clients.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500">
              A unified experience that keeps operations organized and clients delighted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: For Business Owners */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      For Business Owners & Teams
                    </h3>
                    <p className="text-xs text-slate-400">The internal management workspace</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Full control over your operations. Manage team members, appointments, client database, invoices, and analytics from your dedicated dashboard.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Start as Business Owner</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Card 2: For Clients */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      For Your Clients & Customers
                    </h3>
                    <p className="text-xs text-slate-400">Self-serve client portal</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A simple, stress-free portal for your clients to check appointment timings, request new service bookings, and view payment receipts.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <Link
                  to="/customer/portal"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <span>Open Client Portal</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE DEMO & ONBOARDING REQUEST FORM                    */}
      {/* ------------------------------------------------------------- */}
      <section id="demo-inquiry" className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
              <Sparkles size={13} />
              <span>Direct Onboarding & Demo</span>
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Request a Guided Platform Demo
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Tell us about your business. We will configure a live workspace demonstration tailored to your industry workflow.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
            {demoSubmitted ? (
              <div className="py-10 text-center animate-in fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  Demo Request Received!
                </h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                  Thank you! Your information has been securely stored in our CRM. An operations specialist will reach out within 2 hours.
                </p>
                <button
                  onClick={() => setDemoSubmitted(false)}
                  className="mt-6 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                {demoError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{demoError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Verma"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Work / Personal Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@clinic.com"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business / Practice Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Multispecialty Care"
                      value={demoForm.businessName}
                      onChange={(e) => setDemoForm({ ...demoForm, businessName: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Industry / Sector
                    </label>
                    <select
                      value={demoForm.businessType}
                      onChange={(e) => setDemoForm({ ...demoForm, businessType: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                    >
                      <option value="Clinic & Healthcare">Clinic & Healthcare</option>
                      <option value="Dental Care">Dental Care</option>
                      <option value="Salon & Spa">Salon & Spa</option>
                      <option value="Gym & Fitness">Gym & Fitness</option>
                      <option value="Consulting">Consulting & Advisory</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Retail & Services">Retail & Services</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    What operational bottlenecks would you like to solve?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Missed appointments, delayed invoice payments, lack of automated WhatsApp reminders..."
                    value={demoForm.message}
                    onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    🔒 All submissions are securely recorded into Cloud Firestore.
                  </span>

                  <button
                    type="submit"
                    disabled={submittingDemo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    {submittingDemo ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Submitting to Database...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Demo Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* COMFORTABLE BOTTOM BANNER                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="py-14 sm:py-16 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ready to simplify your business operations?
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Get started with our 14-day free trial. Setup takes under 2 minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <span>Get Started Free</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* MINIMALIST FOOTER                                             */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              AI
            </div>
            <span className="font-bold text-slate-800">BizManager</span>
            <span>•</span>
            <span>Intelligent Business Workspace</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-500">
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900 transition-colors">
              Create Account
            </Link>
            <Link to="/customer/portal" className="hover:text-blue-600 transition-colors">
              Client Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}