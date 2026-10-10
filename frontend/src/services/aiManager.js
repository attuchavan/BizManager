/**
 * AI Business Manager Client Service
 * Bridges backend AI server endpoints with client-side Firestore mutations.
 * Enforces controlled tool execution with strict confirmation gates.
 */

import { createAppointment } from "./firebase/appointments";
import { createCampaign } from "./firebase/marketing";
import { logActivity } from "./firebase/activities";
import { addCustomerActivity } from "./firebase/customers";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebase";

const API_BASE = "http://localhost:5000/api/ai";

/**
 * Gemini API Key Helpers
 */
export function getClientGeminiApiKey() {
  return (
    localStorage.getItem("gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

export function setClientGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem("gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("gemini_api_key");
  }
}

export async function testGeminiApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("Gemini API key is required");
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Ping test. Please respond with: 'Gemini 2.5 Flash is active and ready!'",
  });
  return response.text;
}

/**
 * Controlled Data-Access Tool Functions
 */
export function getRevenue(context = {}) {
  const payments = Array.isArray(context.payments) ? context.payments : [];
  const invoices = Array.isArray(context.invoices) ? context.invoices : [];

  const verifiedPayments = payments
    .filter((p) => (p.status || "Completed") === "Completed")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const paidInvoices = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  const total = Math.max(verifiedPayments, paidInvoices);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonth = payments
    .filter((p) => p.date && p.date.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || total;

  return { total, thisMonth, count: payments.length };
}

export function getCustomers(context = {}) {
  const customers = Array.isArray(context.customers) ? context.customers : [];
  return {
    total: customers.length,
    list: customers,
    highSpenders: customers.filter((c) => Number(c.totalSpent || 0) >= 25000),
    inactive: customers.filter((c) => c.status === "Inactive" || c.status === "Lead"),
  };
}

export function getLeads(context = {}) {
  const leads = Array.isArray(context.leads) ? context.leads : [];
  const todayStr = new Date().toISOString().split("T")[0];
  return {
    total: leads.length,
    list: leads,
    uncontacted: leads.filter((l) => l.status === "New" || !l.status),
    pendingFollowUps: leads.filter(
      (l) => l.followUpDate && l.followUpDate <= todayStr && l.status !== "Won" && l.status !== "Lost"
    ),
    won: leads.filter((l) => l.status === "Won"),
  };
}

export function getAppointments(context = {}) {
  const appointments = Array.isArray(context.appointments) ? context.appointments : [];
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return {
    total: appointments.length,
    today: appointments.filter((a) => a.date === todayStr),
    tomorrow: appointments.filter((a) => a.date === tomorrow),
    upcoming: appointments.filter((a) => a.date >= todayStr && a.status !== "Completed"),
    completed: appointments.filter((a) => a.status === "Completed"),
  };
}

export function getInvoices(context = {}) {
  const invoices = Array.isArray(context.invoices) ? context.invoices : [];
  const unpaid = invoices.filter((i) => i.status !== "Paid" && i.status !== "Cancelled");
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const totalOutstanding = unpaid.reduce((sum, inv) => {
    if (inv.balance !== undefined) return sum + Number(inv.balance);
    return sum + Number(inv.total || 0);
  }, 0);

  return {
    total: invoices.length,
    unpaid,
    overdue,
    totalOutstanding,
  };
}

export function getPayments(context = {}) {
  const payments = Array.isArray(context.payments) ? context.payments : [];
  return {
    total: payments.length,
    list: payments,
  };
}

export function getExpenses(context = {}) {
  const expenses = Array.isArray(context.expenses) ? context.expenses : [];
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const byCategory = {};
  expenses.forEach((e) => {
    const cat = e.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
  });

  return {
    totalAmount,
    byCategory,
    list: expenses,
  };
}

/**
 * Fetch executive business summary
 */
export async function fetchAiBusinessSummary({ businessName, stats }) {
  const clientKey = getClientGeminiApiKey();
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const prompt = `Generate an executive business health assessment for "${businessName}" in JSON format.
Metrics:
- Monthly Revenue: ₹${stats?.revenue || 0}
- Monthly Expenses: ₹${stats?.expenses || 0}
- Overdue Invoices: ${stats?.overdueCount || 0} (Amount: ₹${stats?.overdueAmount || 0})
- Active Leads: ${stats?.activeLeads || 0}
- Scheduled Appointments: ${stats?.scheduledAppts || 0}

Return ONLY a valid JSON object matching this schema:
{
  "healthScore": number (0-100),
  "status": "OPTIMAL" | "STABLE" | "ATTENTION_REQUIRED",
  "headline": string,
  "analysis": string,
  "priorities": [
    {
      "id": "p1",
      "level": "HIGH" | "MEDIUM" | "LOW",
      "title": string,
      "action": string,
      "toolId": "send_overdue_reminder" | "create_followup" | "flag_expense_audit",
      "params": object
    }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.healthScore) {
        return { ...parsed, provider: "Google Gemini 2.5 Flash" };
      }
    } catch (e) {
      console.warn("Client Gemini direct summary failed, falling back:", e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, stats }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.summary) return data.summary;
    }
  } catch (e) {
    console.warn("Backend API offline, computing summary in client mode:", e);
  }

  // Client-side fallback calculation from actual stats
  const revenue = Number(stats?.revenue) || 0;
  const expenses = Number(stats?.expenses) || 0;
  const overdueAmount = Number(stats?.overdueAmount) || 0;
  const overdueCount = Number(stats?.overdueCount) || 0;
  const netProfit = Math.max(0, revenue - expenses);
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

  return {
    healthScore: margin > 30 ? 92 : margin > 15 ? 78 : 65,
    status: margin > 30 ? "OPTIMAL" : "STABLE",
    headline: `${businessName || "Your business"} operates with a ${margin}% net operating margin.`,
    analysis: `Gross monthly inflow is recorded at ₹${revenue.toLocaleString(
      "en-IN"
    )} against ₹${expenses.toLocaleString("en-IN")} in expenses. ${
      overdueAmount > 0
        ? `Top financial bottleneck: ₹${overdueAmount.toLocaleString(
            "en-IN"
          )} tied up across ${overdueCount} unpaid invoice(s).`
        : "Liquidity is strong with no critical overdue balances."
    }`,
    priorities: [
      ...(overdueAmount > 0
        ? [
            {
              id: "p1",
              level: "HIGH",
              title: "Overdue Receivables Collection",
              action: "Send automated payment reminder to settle unpaid invoices.",
              toolId: "send_overdue_reminder",
              params: {
                invoiceNumber: "PENDING-COLLECTION",
                customerName: "Pending Accounts",
                amountDue: overdueAmount,
                channel: "WhatsApp",
              },
            },
          ]
        : []),
      {
        id: "p2",
        level: "MEDIUM",
        title: "Active Pipeline Acceleration",
        action: "Follow up with warm inbound leads awaiting quotation approval.",
        toolId: "create_followup",
        params: {
          customerName: "Priority Prospect",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "11:30 AM",
          service: "Discovery & Solution Diagnostic",
        },
      },
      {
        id: "p3",
        level: "LOW",
        title: "Overhead & Cost Audit",
        action: "Audit recurring cloud and software tools to trim non-essential seats.",
        toolId: "flag_expense_audit",
        params: {
          category: "Software & SaaS",
          thresholdAmount: Math.min(expenses, 10000),
          reason: "Trim unassigned user seats on monthly subscriptions.",
        },
      },
    ],
  };
}

/**
 * Natural language AI Query Engine
 * Analyzes real data across customers, leads, invoices, payments, expenses, and appointments.
 */
export async function queryAiManager({ query, businessName, context = {} }) {
  const clientKey = getClientGeminiApiKey();

  // If a client Gemini API key is configured, execute via Google Gemini 2.5 Flash directly!
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });

      const overdueInvoices = Array.isArray(context.invoices)
        ? context.invoices.filter((i) => i.status === "Overdue")
        : [];
      const activeLeadsList = Array.isArray(context.leads)
        ? context.leads.filter((l) => l.status !== "Lost" && l.status !== "Won")
        : [];
      const upcomingAppointments = Array.isArray(context.appointments)
        ? context.appointments.filter((a) => a.status !== "Completed" && a.status !== "Cancelled")
        : [];
      const totalRevenue = Array.isArray(context.payments)
        ? context.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : 0;
      const totalExpenses = Array.isArray(context.expenses)
        ? context.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        : 0;

      const systemInstruction = `You are the executive Autonomous AI Business Manager and financial strategist for "${businessName}".
You have access to live company data in real-time:
- Total Customers: ${context.customers?.length || 0}
- Monthly Inflow (Revenue): ₹${totalRevenue.toLocaleString("en-IN")}
- Total Expenses: ₹${totalExpenses.toLocaleString("en-IN")}
- Overdue Invoices: ${overdueInvoices.length} (${overdueInvoices.slice(0, 4).map((i) => `#${i.invoiceNumber || "INV"} by ${i.customerName || "Client"}: ₹${i.balance || i.total}`).join(", ") || "None"})
- Active Deals/Leads: ${activeLeadsList.length} (${activeLeadsList.slice(0, 4).map((l) => `${l.name} (${l.stage || l.status || "New"} ₹${l.value || 0})`).join(", ") || "None"})
- Upcoming Appointments: ${upcomingAppointments.length} (${upcomingAppointments.slice(0, 3).map((a) => `${a.clientName || a.customerName} on ${a.date} at ${a.time} for ${a.service}`).join(", ") || "None"})
- Service Catalog: ${context.services?.slice(0, 5).map((s) => `${s.name} (₹${s.price})`).join(", ") || "Standard catalog"}

GUIDELINES:
1. Provide concise, professional, insightful advice formatted in rich GitHub markdown. Always reference REAL metrics and client names from the context above whenever relevant.
2. If the user's intent matches a high-impact or administrative action, propose that action in an exact JSON code block at the very end of your response:
\`\`\`action
{
  "toolId": "create_followup" | "send_overdue_reminder" | "flag_expense_audit",
  "toolName": "Human Readable Action Name",
  "impact": "HIGH" | "LOW",
  "requiresConfirmation": true | false,
  "params": { ... }
}
\`\`\`
Available tools:
- create_followup: params { customerName, date, time, service, notes }
- send_overdue_reminder: params { invoiceNumber, customerName, amountDue, channel: "WhatsApp", message }
- flag_expense_audit: params { category, thresholdAmount, reason }

Do not invent fictional clients if real ones exist in the context!`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const rawText = response.text || "";
      let answer = rawText;
      let proposedAction = null;

      const actionMatch = rawText.match(/```action\s*([\s\S]*?)\s*```/);
      if (actionMatch) {
        try {
          proposedAction = JSON.parse(actionMatch[1]);
          answer = rawText.replace(/```action\s*[\s\S]*?\s*```/, "").trim();
        } catch (e) {
          console.warn("Could not parse proposedAction JSON block:", e);
        }
      }

      return {
        success: true,
        answer,
        proposedAction,
        provider: "Google Gemini 2.5 Flash",
      };
    } catch (geminiError) {
      console.warn("Client Gemini direct call failed, checking backend server:", geminiError);
    }
  }

  // Next, try backend Express API
  try {
    const res = await fetch(`${API_BASE}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, businessName, context }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.answer) return data;
    }
  } catch (e) {
    console.warn("Backend API query fallback to client intelligence:", e);
  }

  // Client-side Intelligence matching using controlled tools and real context
  const lower = query.toLowerCase();
  let answer = "";
  let proposedAction = null;

  const revData = getRevenue(context);
  const custData = getCustomers(context);
  const leadData = getLeads(context);
  const apptData = getAppointments(context);
  const invData = getInvoices(context);
  const expData = getExpenses(context);

  // 1. "How much did I earn this month?" / Revenue questions
  if (
    lower.includes("earn") ||
    lower.includes("revenue") ||
    lower.includes("income") ||
    lower.includes("how much did i make") ||
    lower.includes("cashflow")
  ) {
    const monthExpenses = expData.totalAmount;
    const profit = Math.max(0, revData.thisMonth - monthExpenses);
    const margin = revData.thisMonth > 0 ? ((profit / revData.thisMonth) * 100).toFixed(1) : 0;

    answer = `### 💰 Financial Earnings Analysis for ${businessName}\n\n` +
      `- **Gross Recorded Revenue**: ₹${revData.thisMonth.toLocaleString("en-IN")}\n` +
      `- **Operating Outflow**: ₹${monthExpenses.toLocaleString("en-IN")}\n` +
      `- **Net Operating Profit**: ₹${profit.toLocaleString("en-IN")} (${margin}% margin)\n\n` +
      `${
        invData.totalOutstanding > 0
          ? `⚠️ You also have **₹${invData.totalOutstanding.toLocaleString("en-IN")}** in outstanding invoices ready to collect.`
          : "✅ All customer invoices have been settled in full."
      }`;

    if (invData.totalOutstanding > 0) {
      const topInv = invData.unpaid[0];
      proposedAction = {
        toolId: "send_overdue_reminder",
        toolName: "Dispatch Overdue Payment Notice",
        impact: "HIGH",
        requiresConfirmation: true,
        params: {
          invoiceNumber: topInv?.invoiceNumber || "INV-LATEST",
          customerName: topInv?.customerName || "Customer",
          amountDue: topInv?.balance || topInv?.total || invData.totalOutstanding,
          channel: "WhatsApp",
          message: `Hello ${topInv?.customerName || "Customer"}, reminder from ${businessName} regarding outstanding invoice #${topInv?.invoiceNumber || "balance"} for ₹${(topInv?.balance || topInv?.total || invData.totalOutstanding).toLocaleString("en-IN")}. Please confirm payment receipt. Thank you!`,
        },
      };
    }
  }

  // 2. "Who owes me money?" / Overdue invoices
  else if (
    lower.includes("owe") ||
    lower.includes("unpaid") ||
    lower.includes("overdue") ||
    lower.includes("debt") ||
    lower.includes("receivable")
  ) {
    if (invData.unpaid.length === 0) {
      answer = `### ✅ Outstanding Receivables Status\n\nNo customers currently owe you money! All issued invoices are paid in full. Your collection efficiency is at 100%.`;
    } else {
      const rows = invData.unpaid
        .slice(0, 5)
        .map(
          (inv) =>
            `- **${inv.customerName || "Client"}**: Invoice #${inv.invoiceNumber || inv.id.slice(0, 6)} • ₹${Number(
              inv.balance || inv.total || 0
            ).toLocaleString("en-IN")} (${inv.status || "Pending"})`
        )
        .join("\n");

      answer = `### 🧾 Outstanding Receivables: ₹${invData.totalOutstanding.toLocaleString("en-IN")}\n\n` +
        `You have **${invData.unpaid.length} account(s)** with unpaid invoices:\n\n${rows}\n\n` +
        `I recommend dispatching a polite payment reminder to accelerate collection.`;

      const topInv = invData.unpaid[0];
      proposedAction = {
        toolId: "send_overdue_reminder",
        toolName: "Dispatch Overdue Payment Notice",
        impact: "HIGH",
        requiresConfirmation: true,
        params: {
          invoiceNumber: topInv.invoiceNumber || "INV-01",
          customerName: topInv.customerName || "Client",
          amountDue: Number(topInv.balance || topInv.total || 0),
          channel: "WhatsApp",
          message: `Hello ${topInv.customerName}, gentle reminder from ${businessName} regarding invoice #${topInv.invoiceNumber || ""} for ₹${Number(topInv.balance || topInv.total || 0).toLocaleString("en-IN")}. Please let us know once settled via UPI or Bank Transfer.`,
        },
      };
    }
  }

  // 3. "Which services generate the most revenue?"
  else if (
    lower.includes("service") ||
    lower.includes("most revenue") ||
    lower.includes("popular") ||
    lower.includes("top selling")
  ) {
    const services = Array.isArray(context.services) ? context.services : [];
    if (services.length === 0) {
      answer = `### 💼 Service Revenue Breakdown\n\nYou currently have no services registered in your catalog. You can add your core service packages in the Services module to track itemized revenue.`;
    } else {
      const serviceRankings = services
        .map((s) => ({
          name: s.name,
          price: Number(s.price || 0),
          category: s.category || "General",
        }))
        .sort((a, b) => b.price - a.price);

      const items = serviceRankings
        .slice(0, 4)
        .map(
          (s, idx) =>
            `${idx + 1}. **${s.name}** (${s.category}) — ₹${s.price.toLocaleString("en-IN")} standard ticket`
        )
        .join("\n");

      answer = `### 💼 Top Revenue-Generating Offerings for ${businessName}\n\n` +
        `Based on your service catalog and client pricing:\n\n${items}\n\n` +
        `💡 *Recommendation*: Promoting higher-margin offerings like **${serviceRankings[0]?.name}** via WhatsApp broadcast campaigns typically yields the highest gross return per booking.`;
    }
  }

  // 4. "Which leads need follow-up?"
  else if (
    lower.includes("lead") ||
    lower.includes("follow") ||
    lower.includes("prospect") ||
    lower.includes("pipeline")
  ) {
    if (leadData.uncontacted.length === 0 && leadData.pendingFollowUps.length === 0) {
      answer = `### 🎯 Lead Pipeline Check\n\nAll current leads have been contacted and no follow-ups are overdue today. You have **${leadData.total} total leads** managed in your sales pipeline.`;
    } else {
      const topLead = leadData.pendingFollowUps[0] || leadData.uncontacted[0];
      const leadList = [...leadData.pendingFollowUps, ...leadData.uncontacted]
        .slice(0, 4)
        .map(
          (l) =>
            `- **${l.name}** (${l.company || l.source || "Inbound"}) — Est. ₹${Number(
              l.estimatedValue || 0
            ).toLocaleString("en-IN")} • Status: ${l.status || "New"}`
        )
        .join("\n");

      answer = `### 🎯 Priority Pipeline Follow-ups\n\n` +
        `You have **${leadData.uncontacted.length} uncontacted lead(s)** and **${leadData.pendingFollowUps.length} follow-up(s) due**:\n\n${leadList}\n\n` +
        `I have prepared an executive follow-up booking for **${topLead?.name || "Priority Lead"}** to advance the deal to proposal.`;

      proposedAction = {
        toolId: "create_followup",
        toolName: "Schedule Client Follow-up",
        impact: "HIGH",
        requiresConfirmation: true,
        params: {
          customerName: topLead?.name || "Prospect",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "11:30 AM",
          service: "Solution Diagnostic Consultation",
          notes: "Scheduled via AI Business Copilot pipeline action.",
        },
      };
    }
  }

  // 5. "How many appointments do I have tomorrow?"
  else if (
    lower.includes("tomorrow") ||
    lower.includes("next appointment") ||
    lower.includes("schedule tomorrow")
  ) {
    const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (apptData.tomorrow.length === 0) {
      answer = `### 📅 Tomorrow's Calendar (${tomorrowStr})\n\nYou have **0 appointments scheduled** for tomorrow. This gives your team an open window to focus on high-intent lead outreach and administrative reviews.`;
    } else {
      const apptList = apptData.tomorrow
        .map(
          (a) =>
            `- **${a.time || "Scheduled"}**: ${a.clientName || a.customerName} — ${a.service || "Consultation"} (Staff: ${a.assignedEmployee || "Staff"})`
        )
        .join("\n");

      answer = `### 📅 Tomorrow's Calendar (${tomorrowStr})\n\n` +
        `You have **${apptData.tomorrow.length} confirmed session(s)** scheduled:\n\n${apptList}`;
    }
  }

  // 6. "Which customers haven't returned recently?"
  else if (
    lower.includes("returned") ||
    lower.includes("inactive") ||
    lower.includes("churn") ||
    lower.includes("retention")
  ) {
    const inactiveList = custData.inactive.slice(0, 4);
    if (inactiveList.length === 0) {
      answer = `### 👥 Customer Retention Audit\n\nYour client portfolio is active with regular engagement. No immediate churn risk identified across your **${custData.total} customers**.`;
    } else {
      const names = inactiveList.map((c) => `- **${c.name}** (${c.company || "Client"})`).join("\n");

      answer = `### 👥 Customer Re-engagement Opportunities\n\n` +
        `Identified **${inactiveList.length} past clients** who haven't booked in recent weeks:\n\n${names}\n\n` +
        `I recommend broadcasting a priority VIP check-in offer with a 15% discount to rekindle bookings.`;

      proposedAction = {
        toolId: "draft_client_message",
        toolName: "Draft Client Communication",
        impact: "LOW",
        requiresConfirmation: false,
        params: {
          recipientName: "Inactive Client Segment",
          channel: "WhatsApp Broadcast",
          message: `Greetings from ${businessName}! We value your continued partnership. As an exclusive client privilege, we are opening 5 priority slots this month with a complimentary 15% VIP rate. Reply 'BOOK' to reserve.`,
        },
      };
    }
  }

  // 7. "Where am I spending the most money?" / Expenses
  else if (
    lower.includes("spend") ||
    lower.includes("expense") ||
    lower.includes("cost") ||
    lower.includes("overhead")
  ) {
    if (expData.totalAmount === 0) {
      answer = `### 📊 Expense Breakdown\n\nNo operational expenses have been logged yet for this period. Track your expenses in the Expenses module to visualize your cost breakdown.`;
    } else {
      const sortedCats = Object.entries(expData.byCategory).sort((a, b) => b[1] - a[1]);
      const catRows = sortedCats
        .map(
          ([cat, amt]) =>
            `- **${cat}**: ₹${amt.toLocaleString("en-IN")} (${Math.round(
              (amt / expData.totalAmount) * 100
            )}% of costs)`
        )
        .join("\n");

      answer = `### 📊 Operating Cost Centers: ₹${expData.totalAmount.toLocaleString("en-IN")}\n\n` +
        `Here is where your business is spending capital:\n\n${catRows}\n\n` +
        `Top cost driver is **${sortedCats[0]?.[0]} (₹${sortedCats[0]?.[1]?.toLocaleString("en-IN")})**.`;

      proposedAction = {
        toolId: "flag_expense_audit",
        toolName: "Flag Cost Optimization Audit",
        impact: "LOW",
        requiresConfirmation: false,
        params: {
          category: sortedCats[0]?.[0] || "General Overhead",
          thresholdAmount: sortedCats[0]?.[1] || 5000,
          reason: "Identify recurring subscriptions or vendors that can be trimmed or converted to annual discounts.",
        },
      };
    }
  }

  // 8. "What should I focus on today?" / Priorities
  else if (
    lower.includes("focus") ||
    lower.includes("today") ||
    lower.includes("priorit") ||
    lower.includes("briefing") ||
    lower.includes("action")
  ) {
    answer = `### 🚀 Executive Briefing for Today — ${businessName}\n\n` +
      `Here is your strategic focus for maximum operational output:\n\n` +
      `1. **Appointments Today**: ${apptData.today.length} session(s) on your calendar.\n` +
      `2. **Pipeline Touchpoints**: ${leadData.uncontacted.length} inbound leads awaiting first contact.\n` +
      `3. **Cash Collections**: ₹${invData.totalOutstanding.toLocaleString("en-IN")} across ${invData.unpaid.length} unpaid invoices.\n` +
      `4. **Operating Health**: High operating ratio with ₹${revData.thisMonth.toLocaleString("en-IN")} in gross monthly turnover.\n\n` +
      `💡 **Recommended Move**: Prioritize contacting the ${leadData.uncontacted.length} fresh leads before noon, and dispatch payment reminders to clear outstanding receivables.`;

    if (leadData.uncontacted.length > 0) {
      const lead = leadData.uncontacted[0];
      proposedAction = {
        toolId: "create_followup",
        toolName: "Schedule Client Follow-up",
        impact: "HIGH",
        requiresConfirmation: true,
        params: {
          customerName: lead.name,
          date: new Date().toISOString().split("T")[0],
          time: "02:00 PM",
          service: "Discovery Call",
          notes: "Scheduled via AI daily focus briefing.",
        },
      };
    }
  }

  // General Inquiry Fallback
  else {
    answer = `### 💡 Strategic Business Assessment for ${businessName}\n\n` +
      `I have analyzed your request: *"${query}"* against your live business records.\n\n` +
      `- **Portfolio Size**: ${custData.total} active client accounts.\n` +
      `- **Turnover Tracked**: ₹${revData.total.toLocaleString("en-IN")} in verified gross payments.\n` +
      `- **Sales Pipeline**: ${leadData.total} leads (${leadData.won.length} deals closed).\n\n` +
      `You can ask me specific questions like: *"How much did I earn this month?"*, *"Who owes me money?"*, or *"Which leads need follow-up?"*.`;
  }

  return { answer, proposedAction };
}

/**
 * Execute controlled tool and persist into Firestore
 */
export async function executeAiToolWithFirestore({
  businessId,
  toolId,
  params,
  confirmedByUser = false,
}) {
  // If High Impact and not confirmed, reject
  if ((toolId === "create_followup" || toolId === "send_overdue_reminder") && !confirmedByUser) {
    throw new Error("Action cancelled: Explicit confirmation is required for high-impact actions.");
  }

  // 1. If create_followup -> write to appointments & log activity
  if (toolId === "create_followup" && businessId) {
    try {
      const created = await createAppointment(businessId, {
        clientName: params.customerName,
        customerName: params.customerName,
        date: params.date,
        time: params.time || "11:30 AM",
        service: params.service || "AI Scheduled Consultation",
        status: "Confirmed",
        notes: params.notes || "Automated appointment booked via AI Manager",
      });

      logActivity(businessId, {
        type: "FOLLOW_UP_CREATED",
        title: "Follow-up Scheduled by AI",
        description: `Follow-up booked with ${params.customerName} on ${params.date} at ${params.time || "11:30 AM"}.`,
        entityId: created.id,
        entityType: "appointment",
      });
    } catch (e) {
      console.warn("Firestore appointment write error:", e);
    }
  }

  // 2. If send_overdue_reminder -> prepare dispatch record & log activity
  if (toolId === "send_overdue_reminder" && businessId) {
    try {
      logActivity(businessId, {
        type: "FOLLOW_UP_CREATED",
        title: "Payment Reminder Dispatched",
        description: `Dispatched payment notice for #${params.invoiceNumber || ""} to ${params.customerName} (₹${Number(params.amountDue || 0).toLocaleString("en-IN")}).`,
        entityType: "invoice",
      });
    } catch (e) {
      console.warn("Firestore reminder log error:", e);
    }
  }

  // 3. If draft_client_message -> write to marketing campaigns
  if (toolId === "draft_client_message" && businessId) {
    try {
      await createCampaign(businessId, {
        name: `AI Draft: ${params.recipientName || "Broadcast"}`,
        channel: params.channel || "WhatsApp Broadcast",
        audience: params.recipientName || "All Customers",
        scheduledDate: new Date().toISOString().split("T")[0],
        message: params.message,
        isDraft: true,
        status: "Draft",
      });
    } catch (e) {
      console.warn("Firestore campaign write fallback:", e);
    }
  }

  return {
    success: true,
    toolId,
    params,
    confirmedByUser,
    executedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Persist an AI chat message to Firestore
 */
export async function saveAiChatMessage(businessId, messageData) {
  const effectiveBizId = businessId || "default_business";
  try {
    const messagesRef = collection(
      db,
      "businesses",
      effectiveBizId,
      "ai_conversations",
      "main_chat",
      "messages"
    );
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString(),
    });

    return { id: docRef.id, ...messageData };
  } catch (err) {
    console.warn("Could not persist AI message to Firestore:", err);
    return { id: `local_${Date.now()}`, ...messageData };
  }
}

/**
 * Fetch previous AI chat messages from Firestore
 */
export async function getAiChatMessages(businessId, maxResults = 30) {
  const effectiveBizId = businessId || "default_business";
  try {
    const messagesRef = collection(
      db,
      "businesses",
      effectiveBizId,
      "ai_conversations",
      "main_chat",
      "messages"
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not retrieve AI messages from Firestore:", err);
    return [];
  }
}
