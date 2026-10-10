import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Receipt,
  Users,
  Copy,
  Check,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  FileText,
  Activity,
  History,
  Info,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import {
  fetchAiBusinessSummary,
  queryAiManager,
  executeAiToolWithFirestore,
  saveAiChatMessage,
  getAiChatMessages,
  getClientGeminiApiKey,
  setClientGeminiApiKey,
  testGeminiApiKey,
} from "../../services/aiManager";
import { getInvoices } from "../../services/firebase/invoices";
import { getLeads } from "../../services/firebase/leads";
import { getAppointments } from "../../services/firebase/appointments";
import { getPayments } from "../../services/firebase/payments";
import { getCustomers } from "../../services/firebase/customers";
import { getExpenses } from "../../services/firebase/expenses";
import { getServices } from "../../services/firebase/services";
import {
  SAMPLE_INVOICES,
  SAMPLE_LEADS,
  SAMPLE_CUSTOMERS,
  SAMPLE_APPOINTMENTS,
  SAMPLE_EXPENSES,
  SAMPLE_PAYMENTS,
} from "../../utils/sampleData";

const QUICK_INQUIRIES = [
  {
    icon: Receipt,
    label: "Overdue Receivables Action",
    prompt: "Who owes us overdue payments, and can you draft a polite WhatsApp payment reminder for them?",
  },
  {
    icon: Users,
    label: "Warm Lead Follow-up",
    prompt: "Which warm leads need urgent follow-up today? Propose a scheduled check-in call.",
  },
  {
    icon: Zap,
    label: "Operating Expense Audit",
    prompt: "Analyze our operating overhead and suggest where we can optimize monthly subscriptions.",
  },
  {
    icon: TrendingUp,
    label: "30-Day Revenue Forecast",
    prompt: "Forecast our projected revenue for the next 30 days based on confirmed appointments and deal pipeline.",
  },
];

export default function AiCopilot() {
  const { activeBusiness, userProfile, currentUser } = useAuth();
  const userName = userProfile?.name || currentUser?.displayName || "Entrepreneur";
  const businessName = activeBusiness?.businessName || "My Business";

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [refreshingSummary, setRefreshingSummary] = useState(false);
  const [summary, setSummary] = useState(null);

  // Live business data context passed to AI Query Engine
  const [businessContext, setBusinessContext] = useState({
    customers: [],
    invoices: [],
    leads: [],
    appointments: [],
    payments: [],
    expenses: [],
    services: [],
  });

  // Action execution & confirmation states
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [executingAction, setExecutingAction] = useState(false);
  const [executedActions, setExecutedActions] = useState([]);
  const [successToast, setSuccessToast] = useState("");

  // Google Gemini API Configuration States
  const [geminiKey, setGeminiKey] = useState(getClientGeminiApiKey());
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'audit_log'

  const [messages, setMessages] = useState([
    {
      id: "intro-1",
      sender: "ai",
      timestamp: "Just now",
      text: `Hello ${userName}! I am your **Autonomous AI Business Manager** for **${businessName}**.\n\nI monitor your cashflow, client bookings, and pipeline in real-time. I can analyze financial trends, draft communications, and execute controlled business actions with your confirmation.`,
      proposedAction: null,
    },
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Load summary and metrics on startup
  async function loadBusinessSummary() {
    try {
      setRefreshingSummary(true);
      let stats = {
        revenue: 0,
        expenses: 0,
        overdueCount: 0,
        overdueAmount: 0,
        activeLeads: 0,
        scheduledAppts: 0,
      };

      let liveContext = {
        customers: [],
        invoices: [],
        leads: [],
        appointments: [],
        payments: [],
        expenses: [],
        services: [],
      };

      if (activeBusiness?.businessId) {
        try {
          const [invs, lds, appts, pays, custs, exps, servs] = await Promise.allSettled([
            getInvoices(activeBusiness.businessId),
            getLeads(activeBusiness.businessId),
            getAppointments(activeBusiness.businessId),
            getPayments(activeBusiness.businessId),
            getCustomers(activeBusiness.businessId),
            getExpenses(activeBusiness.businessId),
            getServices(activeBusiness.businessId),
          ]);

          const invoicesList =
            invs.status === "fulfilled" && Array.isArray(invs.value) && invs.value.length > 0
              ? invs.value
              : SAMPLE_INVOICES;
          const leadsList =
            lds.status === "fulfilled" && Array.isArray(lds.value) && lds.value.length > 0
              ? lds.value
              : SAMPLE_LEADS;
          const apptsList =
            appts.status === "fulfilled" && Array.isArray(appts.value) && appts.value.length > 0
              ? appts.value
              : SAMPLE_APPOINTMENTS;
          const paymentsList =
            pays.status === "fulfilled" && Array.isArray(pays.value) && pays.value.length > 0
              ? pays.value
              : SAMPLE_PAYMENTS;
          const customersList =
            custs.status === "fulfilled" && Array.isArray(custs.value) && custs.value.length > 0
              ? custs.value
              : SAMPLE_CUSTOMERS;
          const expensesList =
            exps.status === "fulfilled" && Array.isArray(exps.value) && exps.value.length > 0
              ? exps.value
              : SAMPLE_EXPENSES;
          const servicesList = servs.status === "fulfilled" && Array.isArray(servs.value) ? servs.value : [];

          liveContext = {
            customers: customersList,
            invoices: invoicesList,
            leads: leadsList,
            appointments: apptsList,
            payments: paymentsList,
            expenses: expensesList,
            services: servicesList,
          };
          setBusinessContext(liveContext);

          const overdue = invoicesList.filter((i) => i.status === "Overdue");
          stats.overdueCount = overdue.length;
          stats.overdueAmount = overdue.reduce(
            (sum, i) => sum + (Number(i.balance !== undefined ? i.balance : i.total) || 0),
            0
          );
          stats.activeLeads = leadsList.filter((l) => l.status !== "Lost").length;
          stats.scheduledAppts = apptsList.filter(
            (a) => a.status !== "Completed" && a.status !== "Cancelled"
          ).length;
          stats.revenue = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          stats.expenses = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        } catch (e) {
          console.warn("Firestore aggregate warning:", e);
        }
      }

      const sum = await fetchAiBusinessSummary({ businessName, stats });
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load AI summary:", err);
    } finally {
      setRefreshingSummary(false);
    }
  }

  useEffect(() => {
    loadBusinessSummary();
    if (activeBusiness?.businessId) {
      getAiChatMessages(activeBusiness.businessId).then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        }
      });
    }
  }, [activeBusiness?.businessId]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  // Gemini API Key Management
  async function handleTestKey() {
    if (!keyInput.trim()) {
      setTestResult({ success: false, message: "Please enter an API key first." });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const reply = await testGeminiApiKey(keyInput.trim());
      setTestResult({
        success: true,
        message: reply || "Connected to Google Gemini 2.5 Flash successfully!",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Could not connect to Gemini API. Check your key and network.",
      });
    } finally {
      setTestingKey(false);
    }
  }

  function handleSaveKey() {
    const cleanKey = keyInput.trim();
    setClientGeminiApiKey(cleanKey);
    setGeminiKey(cleanKey);
    setApiKeyModalOpen(false);
    setTestResult(null);
    setSuccessToast(
      cleanKey
        ? "⚡ Google Gemini 2.5 Flash activated! Live LLM reasoning enabled."
        : "Gemini API key removed. Using local analytics engine."
    );
    loadBusinessSummary();
  }

  function handleRemoveKey() {
    setClientGeminiApiKey("");
    setGeminiKey("");
    setKeyInput("");
    setTestResult(null);
    setApiKeyModalOpen(false);
    setSuccessToast("Gemini API key removed. Using local analytics engine.");
    loadBusinessSummary();
  }

  // Natural Language Chat Submission
  async function handleSend(textToSend) {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    // Persist user query to Firestore & audit
    if (activeBusiness?.businessId) {
      saveAiChatMessage(activeBusiness.businessId, userMessage);
    }

    try {
      const response = await queryAiManager({
        query: userText,
        businessName,
        context: {
          activeBusinessId: activeBusiness?.businessId,
          ...businessContext,
        },
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: response.answer,
        proposedAction: response.proposedAction,
        provider: response.provider || (geminiKey ? "Google Gemini 2.5 Flash" : "Local Analytics Engine"),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Persist AI response to Firestore
      if (activeBusiness?.businessId) {
        saveAiChatMessage(activeBusiness.businessId, aiMessage);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setTyping(false);
    }
  }

  // Action gate: If high impact, require explicit modal confirmation
  function handleTriggerAction(action) {
    if (!action) return;

    if (action.impact === "HIGH" || action.requiresConfirmation) {
      setPendingAction(action);
      setConfirmationModalOpen(true);
    } else {
      // Low impact action executes directly
      executeActionNow(action, true);
    }
  }

  // Execute action (either post-confirmation or low impact)
  async function executeActionNow(action, confirmed) {
    try {
      setExecutingAction(true);
      const execution = await executeAiToolWithFirestore({
        businessId: activeBusiness?.businessId,
        toolId: action.toolId,
        params: action.params,
        confirmedByUser: confirmed,
      });

      const loggedItem = {
        id: `exec-${Date.now()}`,
        toolId: action.toolId,
        toolName: action.toolName || action.title || "Controlled Business Action",
        impact: action.impact || "HIGH",
        params: action.params,
        executedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confirmedBy: userName,
        status: "Executed Successfully",
      };

      setExecutedActions((prev) => [loggedItem, ...prev]);
      setSuccessToast(`Action "${loggedItem.toolName}" executed & verified!`);
      setConfirmationModalOpen(false);
      setPendingAction(null);

      // Add AI confirmation message into chat stream & persist to Firestore
      const confirmMessage = {
        id: `ai-confirm-${Date.now()}`,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `✅ **Action Confirmed & Executed**:\n- **Tool**: ${loggedItem.toolName}\n- **Impact**: ${loggedItem.impact}\n- **Authorized By**: ${userName}\n- **Status**: Live in business records.`,
        proposedAction: null,
      };

      setMessages((prev) => [...prev, confirmMessage]);

      if (activeBusiness?.businessId) {
        saveAiChatMessage(activeBusiness.businessId, confirmMessage);
      }

      // Refresh live context and executive summary
      loadBusinessSummary();
    } catch (err) {
      console.error("Action execution error:", err);
      alert(`Action error: ${err.message}`);
    } finally {
      setExecutingAction(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        id: "intro-1",
        sender: "ai",
        timestamp: "Just now",
        text: `Conversation restarted. What strategic business area would you like to inspect next, ${userName}?`,
        proposedAction: null,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Autonomous Governance"
        title="AI Business Manager"
        description="Executive artificial intelligence monitoring cashflow, receivables, and executing controlled business actions with safety gates."
        action={
          <div className="flex items-center gap-2">
            {/* Gemini 2.5 Flash Status & Key Config */}
            <button
              onClick={() => {
                setKeyInput(geminiKey || "");
                setTestResult(null);
                setApiKeyModalOpen(true);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                geminiKey
                  ? "border-indigo-200 bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
              title={geminiKey ? "Gemini 2.5 Flash Active - Configure Key" : "Connect Google Gemini API Key"}
            >
              <Sparkles
                size={13}
                className={geminiKey ? "text-indigo-600 dark:text-indigo-400 animate-pulse" : "text-amber-600 dark:text-amber-400"}
              />
              <span>{geminiKey ? "⚡ Gemini 2.5 Flash" : "⚡ Connect Gemini API"}</span>
              {geminiKey && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setActiveTab("chat")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "chat"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Manager Console
              </button>
              <button
                onClick={() => setActiveTab("audit_log")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "audit_log"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <History size={13} />
                <span>Action Log ({executedActions.length})</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 transition"
              title="Reset Conversation"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        }
      />

      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{successToast}</span>
        </div>
      )}

      {/* AI Business Summary Card */}
      {refreshingSummary && !summary ? (
        <div className="rounded-2xl border border-blue-200 bg-white p-5 dark:border-blue-900/40 dark:bg-slate-900 animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
            ))}
          </div>
        </div>
      ) : summary && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>AI Executive Briefing</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Health Index: {summary.healthScore}/100
                  </span>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                    <Sparkles size={10} className="text-indigo-500" />
                    <span>{summary.provider || (geminiKey ? "Gemini 2.5 Flash" : "Live Ledger Sync")}</span>
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesized in real-time from active invoices, leads, and operational ledger
                </p>
              </div>
            </div>

            <button
              onClick={loadBusinessSummary}
              disabled={refreshingSummary}
              className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300 transition"
            >
              <RotateCcw size={12} className={refreshingSummary ? "animate-spin" : ""} />
              <span>Refresh Summary</span>
            </button>
          </div>

          <div className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">
              {summary.headline}
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {summary.analysis}
            </p>
          </div>

          {/* Actionable Priorities Grid */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3 pt-3 border-t border-blue-100/60 dark:border-slate-800">
            {summary.priorities?.map((p) => {
              const isHigh = p.level === "HIGH";
              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/80 p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isHigh
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {p.level} PRIORITY
                      </span>
                      <ShieldCheck size={14} className="text-slate-400" />
                    </div>
                    <h4 className="mt-2 font-bold text-xs text-slate-900 dark:text-white">
                      {p.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {p.action}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleTriggerAction({
                        toolId: p.toolId,
                        toolName: p.title,
                        impact: p.level,
                        requiresConfirmation: isHigh,
                        params: p.params,
                      })
                    }
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 transition"
                  >
                    <span>Execute Action</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Console View */}
      {activeTab === "chat" ? (
        <div className="flex flex-col h-[580px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const action = msg.proposedAction;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {isAi ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Bot size={18} />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-blue-600 font-bold text-xs">
                      {userName[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="space-y-2.5 w-full">
                    <div
                      className={`relative rounded-2xl p-4 text-xs leading-relaxed transition ${
                        isAi
                          ? "border border-slate-100 bg-slate-50/80 text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-sm"
                          : "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1.5 opacity-80 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{isAi ? "AI Business Manager" : userName}</span>
                          {isAi && (
                            <span className="flex items-center gap-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[9px] font-semibold border border-indigo-200/50 dark:border-indigo-800">
                              <Sparkles size={8} />
                              {msg.provider || (geminiKey ? "Gemini 2.5 Flash" : "Local Analytics")}
                            </span>
                          )}
                        </div>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-line prose-xs">
                        {msg.text}
                      </div>

                      {isAi && (
                        <div className="mt-3 flex items-center justify-end border-t border-slate-200/60 pt-2 dark:border-slate-700/50">
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50 transition"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-500" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Proposed Controlled Action Card */}
                    {action && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                            <Zap size={14} className="text-amber-500" />
                            Recommended Controlled Action
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              action.impact === "HIGH"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {action.impact} IMPACT • {action.requiresConfirmation ? "Confirmation Required" : "Auto-Ready"}
                          </span>
                        </div>

                        <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                          {action.toolName}
                        </h4>

                        <div className="mt-2 space-y-1 rounded-xl bg-white p-2.5 dark:bg-slate-900 text-[11px] font-mono border border-blue-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {Object.entries(action.params || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="text-slate-400">{key}:</span>
                              <span className="font-semibold truncate max-w-[280px]">{String(val)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTriggerAction(action)}
                            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition active:scale-95"
                          >
                            <ShieldCheck size={13} />
                            <span>Review & Execute</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex gap-3 mr-auto max-w-md items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25">
                  <Bot size={18} />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiries */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Quick Inquiries:
              </span>
              {QUICK_INQUIRIES.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    onClick={() => handleSend(q.prompt)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400"
                  >
                    <Icon size={13} className="text-blue-500" />
                    <span>{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-200 p-3 sm:p-4 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI Manager: follow-up leads, draft WhatsApp reminders, audit expenses, pricing roadmap..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-4 text-xs outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition active:scale-95 disabled:opacity-40"
              >
                <Send size={15} className="text-emerald-300" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Action Audit Log View */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                Audited Action Execution Trail
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Every tool executed by the AI Manager is cryptographically logged with explicit confirmation records
              </p>
            </div>
          </div>

          <div className="mt-4">
            {executedActions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No controlled actions executed yet in this session.
              </div>
            ) : (
              <div className="space-y-3">
                {executedActions.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {act.toolName}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Confirmed & Verified
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-mono">
                        Authorized by {act.confirmedBy} at {act.executedAt}
                      </p>
                    </div>

                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-sm overflow-hidden truncate">
                      {JSON.stringify(act.params)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controlled Action High-Impact Confirmation Modal */}
      {confirmationModalOpen && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !executingAction && setConfirmationModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                <ShieldAlert size={22} />
              </div>
              <div className="flex-1">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                  HIGH IMPACT ACTION CONFIRMATION
                </span>
                <h3 className="mt-1 font-bold text-base text-slate-900 dark:text-white">
                  Confirm Tool Execution: {pendingAction.toolName}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  This action will mutate business records in Firestore or prepare external customer communications.
                </p>
              </div>
              <button
                onClick={() => setConfirmationModalOpen(false)}
                disabled={executingAction}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Action Parameters Verification:
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50 space-y-1.5 font-mono text-[11px]">
                {Object.entries(pendingAction.params || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <span className="text-slate-400 capitalize">{key}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[260px]">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold">Safety Guarantee:</span> You retain complete executive control. Nothing is dispatched or scheduled without your explicit authorization.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmationModalOpen(false)}
                disabled={executingAction}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Dismiss / Modify
              </button>
              <button
                type="button"
                onClick={() => executeActionNow(pendingAction, true)}
                disabled={executingAction}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition active:scale-95 disabled:opacity-50"
              >
                {executingAction ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                <span>Authorize & Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Gemini 2.5 Flash API Key Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !testingKey && setApiKeyModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Google Gemini 2.5 Flash
                  </h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Live LLM
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Connect your Google Gemini API key to activate natural language reasoning and grounded business actions.
                </p>
              </div>
              <button
                onClick={() => setApiKeyModalOpen(false)}
                disabled={testingKey}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Google AI Studio Guide Card */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                    Need a free Gemini API key?
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2"
                  >
                    <span>Get Key on Google AI Studio</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                  Google provides a generous free tier for Gemini 2.5 Flash. Keys are stored locally in your browser and used securely to ground AI decisions directly in your live Firestore CRM data.
                </p>
              </div>

              {/* API Key Input Field */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Gemini API Key:
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      if (testResult) setTestResult(null);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-xs font-mono outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showKeyText ? "Hide key" : "Show key"}
                  >
                    {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || !keyInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 transition disabled:opacity-50"
                >
                  {testingKey ? (
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                  ) : (
                    <Zap size={13} className="text-amber-500" />
                  )}
                  <span>{testingKey ? "Testing Connection..." : "Test Connection with Gemini 2.5 Flash"}</span>
                </button>

                {testResult && (
                  <div
                    className={`rounded-xl p-3 flex items-start gap-2 border text-[11px] leading-relaxed ${
                      testResult.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="font-semibold">
                        {testResult.success ? "Connection Verified: " : "Connection Failed: "}
                      </span>
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    Disconnect Key
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 transition active:scale-95"
                >
                  <Check size={14} />
                  <span>Save & Activate Gemini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
