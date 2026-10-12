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
  Briefcase,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck,
  Star,
  CreditCard,
  QrCode,
  Zap,
  BarChart3,
  ChevronDown,
  Layers,
  Clock,
  Check,
  MessageSquare,
  Shield,
  HelpCircle,
  Phone,
  Mail,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { createLead } from "../../services/firebase/leads";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";
import { useTheme } from "../../context/ThemeContext";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  // Interactive Hero Preview Mode: 'owner' | 'client'
  const [heroPreviewMode, setHeroPreviewMode] = useState("owner");

  // Pricing Interval: 'monthly' | 'annual'
  const [billingInterval, setBillingInterval] = useState("annual");

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Landing Page Demo & Consultation Form State
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "Clinic & Healthcare",
    roleType: "business_owner",
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
        roleType: demoForm.roleType,
        source: "Landing Page Demo Request",
        status: "New",
        notes:
          demoForm.message.trim() ||
          "Requested live workspace demonstration and onboarding setup.",
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
        roleType: "business_owner",
        message: "",
      });
    } catch (err) {
      console.error("Failed demo submission:", err);
      setDemoError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmittingDemo(false);
    }
  }

  const faqs = [
    {
      q: "How does BizManager isolate data between Business Owners, Clients, and Admins?",
      a: "BizManager maintains separate Firestore collections: 'business_owners' for internal management, 'clients' for self-serve appointment and invoice viewing, 'admins' for enterprise oversight, and a unified 'users' collection for identity management. Clients cannot view internal business revenue, expenses, or staff files.",
    },
    {
      q: "Can clients book appointments without logging into my private business dashboard?",
      a: "Yes! Clients have access to their own dedicated Client Portal and public directory (/explore). They can view your available time slots, book appointments, receive confirmation SMS/WhatsApp, and view invoices without touching your private management dashboard.",
    },
    {
      q: "Does the UPI QR checkout work with all Indian payment apps?",
      a: "Yes! Our dynamic UPI QR codes and deep links support Google Pay, PhonePe, Paytm, BHIM, CRED, and all major Indian banking UPI apps with instant settlement and automated digital receipts.",
    },
    {
      q: "How does the AI Copilot help grow my business?",
      a: "The AI Copilot continuously analyzes your incoming leads, scheduled appointments, and revenue velocity. It automatically generates morning executive briefs, flags stalled client follow-ups, and drafts smart marketing promotions tailored to your industry.",
    },
    {
      q: "Is there a free trial, and can I cancel anytime?",
      a: "Yes, you can get started with our full-featured 14-day free trial. There are no setup fees, no credit card required, and you can switch plans or cancel at any time.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors">
      {/* ------------------------------------------------------------- */}
      {/* TOPBAR NAVIGATION                                             */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              AI
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                BizManager
              </p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Intelligent Workspace
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <a
              href="#features"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#portals"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Portals & Roles
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/explore"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Explore Directory
            </Link>
            <Link
              to="/customer/portal"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Client Portal
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={17} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon size={17} className="text-slate-600 dark:text-slate-300 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-block rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <motion.div className="hidden sm:block" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-500 transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 md:hidden shadow-xl"
            >
              <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Features
                </a>
                <a
                  href="#portals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Portals & Roles
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Pricing
                </a>
                <Link
                  to="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700"
                >
                  Explore Directory
                </Link>
                <Link
                  to="/customer/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Client Portal
                </Link>

                {/* Mobile View: Dedicated Dark & Light Mode Switch */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Appearance</span>
                    <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      {isDark ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                        !isDark
                          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Sun size={14} className={!isDark ? "text-amber-500" : ""} />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                        isDark
                          ? "bg-slate-800 text-white shadow-xs dark:bg-slate-700 dark:text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Moon size={14} className={isDark ? "text-indigo-400" : ""} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
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
      {/* HERO SECTION WITH DUAL-ROLE INTERACTIVE PREVIEW                */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 h-96 w-[700px] rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-emerald-500/15 blur-3xl -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle announcement badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50/90 to-emerald-50/90 dark:from-indigo-950/60 dark:to-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-6 shadow-sm">
            <Sparkles size={13} className="text-emerald-500 animate-pulse" />
            <span>AI-Powered Autonomous Business Workspace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.16]">
            Run your entire business from{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              one unified workspace.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Automate customer CRM, double-booking prevention, GST invoices, UPI QR checkout, and client self-service — with multi-role security across owners and clients.
          </p>

          {/* Dual Action CTAs */}
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
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 px-5 py-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Compass size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>Explore Live Directory</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/customer/portal"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <UserCheck size={15} className="text-blue-500" />
                <span>Client Self-Serve Portal</span>
              </Link>
            </motion.div>
          </div>

          {/* Micro Proof Trust Marks */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              Dedicated Firebase Collections
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              2-minute instant onboarding
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INTERACTIVE DUAL-ROLE LIVE PREVIEW                            */}
          {/* ------------------------------------------------------------- */}
          <div className="mt-12 text-left">
            {/* Role Tab Switcher */}
            <div className="flex items-center justify-center mb-4">
              <div className="inline-flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1.5 border border-slate-300/50 dark:border-slate-700/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setHeroPreviewMode("owner")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    heroPreviewMode === "owner"
                      ? "bg-white text-indigo-700 shadow-md dark:bg-slate-900 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Building2 size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Business Owner Command Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeroPreviewMode("client")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    heroPreviewMode === "client"
                      ? "bg-white text-emerald-700 shadow-md dark:bg-slate-900 dark:text-emerald-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Client / Patient Portal</span>
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <motion.div
              key={heroPreviewMode}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-7 shadow-2xl shadow-indigo-500/10 backdrop-blur-md"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {heroPreviewMode === "owner"
                      ? "BizManager Workspace • Dedicated 'business_owners' Collection"
                      : "BizManager Client Portal • Dedicated 'clients' Collection"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>

              {heroPreviewMode === "owner" ? (
                /* 1. BUSINESS OWNER PREVIEW */
                <div className="pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Overview
                      </p>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Good morning, Dr. Atharv Verma 👋
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Multispecialty Healthcare & Diagnostic Center • Live Operations
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Owner Role: OWNER
                      </span>
                    </div>
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
                      <p className="text-[11px] font-medium text-slate-400">Total Revenue</p>
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹84,500</p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">↑ 12.5% vs last month</span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
                      <p className="text-[11px] font-medium text-slate-400">Active Clients</p>
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">1,284</p>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Isolated in 'clients'</span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
                      <p className="text-[11px] font-medium text-slate-400">New Leads</p>
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">86</p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">↑ 18.4% qualified</span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
                      <p className="text-[11px] font-medium text-slate-400">Appointments</p>
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">142</p>
                      <span className="text-[10px] font-medium text-slate-500">Next at 10:30 AM</span>
                    </div>
                  </div>

                  {/* AI Assistant Summary Box */}
                  <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 p-4 text-white border border-indigo-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                          <Bot size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">AI Business Intelligence Briefing</p>
                          <p className="text-[10px] text-slate-400">Generated today at 09:00 AM</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400">Real-time Stream</span>
                    </div>
                    <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                      Revenue is pacing 18% above target. 8 prospective consultation inquiries are waiting for initial confirmation. Automated WhatsApp reminders reduced today's expected no-show rate to under 2%.
                    </p>
                  </div>
                </div>
              ) : (
                /* 2. CLIENT / CUSTOMER PREVIEW */
                <div className="pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Client Portal
                      </p>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Welcome, Priya Patil 🌿
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Logged in as Client • Verified Isolated Profile
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Role: CLIENT
                      </span>
                    </div>
                  </div>

                  {/* Client Upcoming Appointment Card */}
                  <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Upcoming Appointment
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            General Health Consultation with Dr. Verma
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tomorrow, 10:30 AM • Apex Multispecialty Clinic
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Confirmed
                        </span>
                        <button
                          type="button"
                          className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Invoices & Quick UPI Checkout Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Receipt size={14} className="text-indigo-600" />
                          <span>Invoice #INV-2026-089</span>
                        </span>
                        <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                          Paid
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">₹1,500</p>
                      <p className="text-[11px] text-slate-400">Settled via UPI QR • PDF Receipt available</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <QrCode size={14} className="text-indigo-600" />
                          <span>Instant UPI Payment</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">GPay, PhonePe, Paytm supported</p>
                      </div>
                      <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                        1-Click Pay
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6 CORE PILLARS GRID                                           */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-16 sm:py-24 bg-white dark:bg-slate-900/60 border-y border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3">
              <Zap size={13} className="text-indigo-500" />
              <span>Full Operational Superpowers</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Engineered for seamless business performance.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Replace multiple fragmented apps with a single, synchronized intelligence workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                <Bot size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Copilot & Smart Briefs
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Daily automated executive briefings, pipeline risk detection, and 1-click marketing content crafted specifically for your industry.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Smart Calendar & Double-Booking Shield
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Effortless consultation booking with automated staff availability checks, zero overlapping slots, and real-time reschedule notifications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                <QrCode size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                GST Invoices & Dynamic UPI QR
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Tax-compliant invoices with CGST/SGST breakdowns, instant UPI QR code generation, UTR confirmation, and downloadable PDF receipts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unified CRM & Client History
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Track lifetime spending, past visits, customer notes, VIP flags, and lead status pipeline directly from your client directory.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Role Firebase Isolation
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Dedicated Firestore collections for 'admins', 'business_owners', and 'clients' to ensure maximum security, speed, and privacy.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-6 sm:p-7 transition hover:shadow-xl hover:border-indigo-500/40 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-5 group-hover:scale-105 transition-transform">
                <Compass size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Storefronts & Doctor Directory
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Showcase your business, clinics, and doctor profiles to clients through a public directory where they can discover and book 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* WHO IT'S FOR: 3 DEDICATED ROLES & COLLECTIONS                 */}
      {/* ------------------------------------------------------------- */}
      <section id="portals" className="py-16 sm:py-24 bg-slate-50/60 dark:bg-slate-950 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Multi-Collection Role Security</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Purpose-built for every stakeholder.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Each user type operates within an isolated, dedicated database collection with personalized capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Business Owners */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Business Owners
                    </h3>
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      collection: business_owners
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Full control over appointments, team roster, client CRM, expense tracking, GST invoices, and AI automation.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Complete revenue & financial reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Employee and doctor shift management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Automated customer follow-ups & AI insights
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/register?type=business"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  <span>Start as Business Owner</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Card 2: Clients & Patients */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Clients & Patients
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      collection: clients
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  A frictionless, mobile-first self-serve portal to schedule appointments, view receipts, and make 1-click UPI payments.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> 24/7 direct doctor & service booking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Download PDF invoices & UPI receipts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Leave reviews and explore top clinics
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to="/register?type=customer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <span>Sign Up as Client</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/customer/portal"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Open Portal
                </Link>
              </div>
            </div>

            {/* Card 3: Platform Admins */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Platform Admins
                    </h3>
                    <p className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      collection: admins
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enterprise security and multi-branch governance. Audit system logs, manage tenant access, and oversee global performance.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Multi-branch cross-tenant security
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Automated compliance & audit logging
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Superadmin permissions & role controls
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to="/register?type=admin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
                >
                  <span>Register Admin</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE PRICING TIERS                                     */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-16 sm:py-24 bg-white dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3">
              <CreditCard size={13} className="text-indigo-500" />
              <span>Transparent & Scalable Pricing</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Invest in your business peace of mind.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Start free, upgrade as your team and customer base expand.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingInterval === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "annual" : "monthly")}
                className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    billingInterval === "annual" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${billingInterval === "annual" ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                  Annual Billing
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                  Save 20%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1: Starter */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-7 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Free Forever</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Perfect for solo entrepreneurs and early practitioners starting out.
                </p>
                <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Up to 100 customer records
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Basic calendar appointment booking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Manual invoicing & receipts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Self-serve Client Portal
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/register?type=business"
                  className="w-full inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Start Free Account
                </Link>
              </div>
            </div>

            {/* Plan 2: Growth Pro (Highlighted) */}
            <div className="rounded-3xl border-2 border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900 p-7 flex flex-col justify-between shadow-xl shadow-indigo-600/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-0.5 text-[11px] font-extrabold text-white uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Growth Pro
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Complete Workspace</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  For established clinics, retail stores, and service companies scaling revenue.
                </p>
                <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {billingInterval === "annual" ? "₹1,199" : "₹1,499"}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Unlimited customer records & leads
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> AI Copilot & daily intelligence briefing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Automated GST tax calculations & PDF invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Dynamic UPI QR payments & reconciliation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Verified directory storefront profile
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/register?type=business"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Plan 3: Enterprise Scale */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-7 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enterprise</span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Multi-Branch Scale</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  For multi-location hospital chains, franchise salons, and enterprise agencies.
                </p>
                <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                  <span className="text-xs text-slate-400 ml-1">/ enterprise SLA</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Multi-branch organization switcher
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Dedicated 'admins' collection governance
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> Custom WhatsApp API & SMS gateway
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" /> 24/7 priority SLA & dedicated account manager
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a
                  href="#demo-inquiry"
                  className="w-full inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Contact Enterprise Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* VERIFIED CUSTOMER REVIEWS & SOCIAL PROOF                       */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-slate-50/60 dark:bg-slate-950 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 mb-3">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>Trusted by 1,200+ Modern Enterprises</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Loved by owners, cherished by clients.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Read how businesses transformed chaotic operations into predictable, high-growth practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "Before BizManager, we had double-bookings almost every week. The automated calendar and WhatsApp confirmations reduced our patient no-show rate by 78% in month one."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  DR
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Dr. Rajesh Verma</p>
                  <p className="text-[11px] text-slate-400">Cardiologist, Apex Healthcare</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "The dynamic UPI QR code on our invoices is a game changer. Clients scan directly on their phones, and the payment is reconciled immediately. Best decision we made for our clinic."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  PK
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Priya Kulkarni</p>
                  <p className="text-[11px] text-slate-400">Managing Director, Aura Wellness & Spa</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "Having separate database collections for our internal operations and our clients gives us total security. Our clients love having their own login to view past service records."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  AJ
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Amit Joshi</p>
                  <p className="text-[11px] text-slate-400">Founder, Joshi Advisory & Tax Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)                     */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3">
              <HelpCircle size={13} className="text-indigo-500" />
              <span>Answers to Common Inquiries</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Everything you need to know about setup, permissions, billing, and security.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={17}
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE DEMO & ONBOARDING REQUEST FORM                    */}
      {/* ------------------------------------------------------------- */}
      <section id="demo-inquiry" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
              <Sparkles size={13} />
              <span>Direct Guided Consultation</span>
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
              Request a Guided Platform Demo
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Tell us about your business. We will configure an end-to-end workspace demonstration tailored to your exact industry workflows.
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
                  type="button"
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
                      placeholder="e.g. Apex Healthcare"
                      value={demoForm.businessName}
                      onChange={(e) => setDemoForm({ ...demoForm, businessName: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Role / User Type
                    </label>
                    <select
                      value={demoForm.roleType}
                      onChange={(e) => setDemoForm({ ...demoForm, roleType: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                    >
                      <option value="business_owner">Business Owner (Management Workspace)</option>
                      <option value="client">Client / Patient (Self-Serve Portal)</option>
                      <option value="admin">Platform Admin (Multi-Tenant Scale)</option>
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
                    🔒 All submissions are securely logged into Cloud Firestore.
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
      {/* BOTTOM ACTION BANNER                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Ready to streamline your business operations?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Get started with our 14-day free trial. Setup takes under 2 minutes.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/register?type=business"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500 transition"
            >
              <span>Start as Business Owner</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/customer/portal"
              className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            >
              Open Client Portal
            </Link>

            <Link
              to="/login"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              AI
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">BizManager</span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">Intelligent Business & Client Workspace</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#portals" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Portals
            </a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Pricing
            </a>
            <Link to="/explore" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Explore Directory
            </Link>
            <Link to="/customer/portal" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Client Portal
            </Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}