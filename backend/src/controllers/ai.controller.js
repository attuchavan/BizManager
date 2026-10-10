import { GoogleGenAI } from "@google/genai";
import { CONTROLLED_TOOLS, executeControlledTool } from "../services/aiTools.service.js";

/**
 * Helper to get initialized Google Gemini Client
 */
function getGeminiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Failed initializing GoogleGenAI client:", err);
    return null;
  }
}

/**
 * AI Business Summary Controller
 */
export async function getAiBusinessSummary(req, res) {
  try {
    const { businessName = "Your Business", stats = {} } = req.body;

    const revenue = Number(stats.revenue) || 0;
    const expenses = Number(stats.expenses) || 0;
    const overdueCount = Number(stats.overdueCount) || 0;
    const overdueAmount = Number(stats.overdueAmount) || 0;
    const activeLeads = Number(stats.activeLeads) || 0;
    const scheduledAppts = Number(stats.scheduledAppts) || 0;

    const netProfit = Math.max(0, revenue - expenses);
    const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `Generate an executive business health assessment for "${businessName}" in JSON format.
Metrics:
- Monthly Revenue: ₹${revenue}
- Monthly Expenses: ₹${expenses}
- Net Operating Margin: ${margin}%
- Overdue Invoices: ${overdueCount} (Amount: ₹${overdueAmount})
- Active Leads: ${activeLeads}
- Scheduled Appointments: ${scheduledAppts}

Return ONLY a valid JSON object matching this schema:
{
  "healthScore": number (0-100),
  "status": "OPTIMAL" | "STABLE" | "ATTENTION_REQUIRED",
  "headline": string (one sentence summary),
  "analysis": string (concise 2-3 sentence analysis of cashflow and throughput),
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

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const jsonText = response.text || "{}";
        const summary = JSON.parse(jsonText);
        return res.json({ success: true, summary, provider: "gemini" });
      } catch (geminiError) {
        console.warn("Gemini summary generation failed, falling back to formulaic engine:", geminiError);
      }
    }

    // High-accuracy fallback based on actual live data metrics
    const healthScore = margin > 35 ? 92 : margin > 15 ? 80 : overdueAmount > 20000 ? 64 : 75;
    const status = healthScore >= 85 ? "OPTIMAL" : healthScore >= 70 ? "STABLE" : "ATTENTION_REQUIRED";

    const summary = {
      healthScore,
      status,
      headline: `${businessName} operates at a ${margin}% net operating margin with ₹${revenue.toLocaleString("en-IN")} in gross monthly inflow.`,
      analysis: `Operational cashflow is ${status.toLowerCase()}. You have ${scheduledAppts} scheduled appointments and ${activeLeads} active deals in your pipeline. ${
        overdueAmount > 0
          ? `Priority liquidity attention: ₹${overdueAmount.toLocaleString("en-IN")} across ${overdueCount} overdue invoice(s).`
          : "Receivables are healthy with no critical outstanding balances."
      }`,
      priorities: [
        ...(overdueAmount > 0
          ? [
              {
                id: "p1",
                level: "HIGH",
                title: "Overdue Receivables Collection",
                action: "Dispatch polite WhatsApp payment reminders to overdue accounts.",
                toolId: "send_overdue_reminder",
                params: {
                  invoiceNumber: "OVERDUE-BATCH",
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
          title: "High-Intent Inbound Lead Follow-ups",
          action: "Schedule discovery calls for warm leads pending quote approval.",
          toolId: "create_followup",
          params: {
            customerName: "Priority Lead",
            date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            time: "11:30 AM",
            service: "Discovery Session",
          },
        },
        {
          id: "p3",
          level: "LOW",
          title: "SaaS & Overhead Cost Review",
          action: "Audit recurring cloud and software tools to trim non-essential seats.",
          toolId: "flag_expense_audit",
          params: {
            category: "Software & SaaS",
            thresholdAmount: Math.min(expenses, 10000),
            reason: "Audit unassigned team seats on monthly subscriptions.",
          },
        },
      ],
    };

    res.json({ success: true, summary, provider: "native-engine" });
  } catch (error) {
    console.error("AI Business Summary Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Natural Language Query Controller powered by Google Gemini
 */
export async function processAiQuery(req, res) {
  try {
    const { query, businessName = "Your Business", context = {} } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query text is required" });
    }

    const gemini = getGeminiClient();

    // Context summarization
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

    if (gemini) {
      try {
        const systemInstruction = `You are the executive Autonomous AI Business Manager and financial strategist for "${businessName}".
You have access to live company data in real-time:
- Total Customers: ${context.customers?.length || 0}
- Monthly Inflow (Revenue): ₹${totalRevenue.toLocaleString("en-IN")}
- Total Expenses: ₹${totalExpenses.toLocaleString("en-IN")}
- Overdue Invoices: ${overdueInvoices.length} (${overdueInvoices.slice(0, 4).map((i) => `#${i.invoiceNumber || "INV"} by ${i.customerName || "Client"}: ₹${i.balance || i.total}`).join(", ") || "None"})
- Active Deals/Leads: ${activeLeadsList.length} (${activeLeadsList.slice(0, 4).map((l) => `${l.name} (${l.stage || l.status || "New"} ₹${l.value || 0})`).join(", ") || "None"})
- Upcoming Appointments: ${upcomingAppointments.length} (${upcomingAppointments.slice(0, 3).map((a) => `${a.clientName || a.customerName} on ${a.date} at ${a.time} for ${a.service}`).join(", ") || "None"})
- Service Catalog: ${context.services?.slice(0, 5).map((s) => `${s.name} (₹${s.price})`).join(", ") || "Active Services"}

GUIDELINES:
1. Provide concise, professional, insightful advice using GitHub markdown formatting. Always reference REAL metrics and names from the context above whenever relevant.
2. If the user's intent matches a high-impact or administrative action, propose that action in an exact JSON code block at the very end of your response:
\`\`\`action
{
  "toolId": "create_followup" | "send_overdue_reminder" | "flag_expense_audit",
  "toolName": "Name of action",
  "impact": "HIGH" | "LOW",
  "requiresConfirmation": true | false,
  "params": { ... }
}
\`\`\`
Available tools:
- create_followup: params { customerName, date, time, service, notes }
- send_overdue_reminder: params { invoiceNumber, customerName, amountDue, channel: "WhatsApp", message }
- flag_expense_audit: params { category, thresholdAmount, reason }

Do not invent imaginary customers if real ones exist in the context!`;

        const response = await gemini.models.generateContent({
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

        return res.json({
          success: true,
          answer,
          proposedAction,
          provider: "gemini-2.5-flash",
        });
      } catch (geminiError) {
        console.warn("Gemini query execution failed, falling back to data heuristics:", geminiError);
      }
    }

    // Context-grounded intelligent fallback (uses real live records)
    const lower = query.toLowerCase();
    let responseText = "";
    let proposedAction = null;

    if (lower.includes("overdue") || lower.includes("reminder") || lower.includes("unpaid") || lower.includes("invoice")) {
      if (overdueInvoices.length > 0) {
        const topOverdue = overdueInvoices[0];
        const dueAmt = Number(topOverdue.balance || topOverdue.total || 0);
        responseText = `### Receivables Analysis for ${businessName}\n\nYou currently have **${overdueInvoices.length} overdue invoice(s)** totaling **₹${overdueInvoices.reduce((s, i) => s + (Number(i.balance || i.total) || 0), 0).toLocaleString("en-IN")}**.\n\nThe highest priority receivable is **#${topOverdue.invoiceNumber || "INV-001"}** for **${topOverdue.customerName || "Client"}** (₹${dueAmt.toLocaleString("en-IN")}).\n\nI have generated a WhatsApp reminder draft ready for immediate dispatch.`;
        proposedAction = {
          toolId: "send_overdue_reminder",
          toolName: CONTROLLED_TOOLS.send_overdue_reminder.name,
          impact: CONTROLLED_TOOLS.send_overdue_reminder.impact,
          requiresConfirmation: true,
          params: {
            invoiceNumber: topOverdue.invoiceNumber || "INV-001",
            customerName: topOverdue.customerName || "Valued Client",
            amountDue: dueAmt,
            channel: "WhatsApp",
            message: `Hello ${topOverdue.customerName || "Customer"}, gentle reminder regarding invoice #${topOverdue.invoiceNumber} for ₹${dueAmt.toLocaleString("en-IN")} from ${businessName}. Please let us know once settled via UPI or Bank Transfer. Thank you!`,
          },
        };
      } else {
        responseText = `### Receivables Status\n\nAll invoices for **${businessName}** are fully settled or up to date! There are zero overdue balances at this moment.`;
      }
    } else if (lower.includes("follow") || lower.includes("lead") || lower.includes("call") || lower.includes("deal")) {
      if (activeLeadsList.length > 0) {
        const topLead = activeLeadsList[0];
        responseText = `### Sales Pipeline Intelligence\n\nYou have **${activeLeadsList.length} active leads** in your pipeline.\n\nLead **${topLead.name}** (${topLead.company || "Individual"}) is in the **${topLead.stage || topLead.status || "Warm"}** stage (estimated deal value: ₹${Number(topLead.value || 0).toLocaleString("en-IN")}).\n\nI recommend scheduling an executive follow-up call tomorrow to advance the deal.`;
        proposedAction = {
          toolId: "create_followup",
          toolName: CONTROLLED_TOOLS.create_followup.name,
          impact: CONTROLLED_TOOLS.create_followup.impact,
          requiresConfirmation: true,
          params: {
            customerName: topLead.name,
            date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            time: "11:30 AM",
            service: "Executive Follow-Up Call",
            notes: `Follow-up on ${topLead.stage || "deal proposal"} scheduled via AI Copilot.`,
          },
        };
      } else {
        responseText = `### Pipeline Status\n\nNo pending uncontacted leads currently require urgent follow-up. Consider launching a new marketing campaign to generate fresh inquiries.`;
      }
    } else if (lower.includes("expense") || lower.includes("cost") || lower.includes("save") || lower.includes("spend")) {
      responseText = `### Financial Expense Breakdown\n\nTotal monthly recorded outflows are **₹${totalExpenses.toLocaleString("en-IN")}** against **₹${totalRevenue.toLocaleString("en-IN")}** in verified inflow.\n\nRecommended Optimization:\n- Review recurring subscriptions and software licenses.\n- Converting monthly plans to annual billing can yield up to 15-20% in savings.`;
      proposedAction = {
        toolId: "flag_expense_audit",
        toolName: CONTROLLED_TOOLS.flag_expense_audit.name,
        impact: CONTROLLED_TOOLS.flag_expense_audit.impact,
        requiresConfirmation: false,
        params: {
          category: "Software & SaaS",
          thresholdAmount: Math.min(totalExpenses, 8000),
          reason: "Periodic subscription audit to eliminate inactive seats.",
        },
      };
    } else {
      responseText = `### Strategic Business Assessment for ${businessName}\n\nAnalyzing query: *"${query}"*\n\n- **Inflow / Revenue**: ₹${totalRevenue.toLocaleString("en-IN")}\n- **Outflow / Expenses**: ₹${totalExpenses.toLocaleString("en-IN")}\n- **Upcoming Appointments**: ${upcomingAppointments.length} confirmed session(s)\n- **Active Deals**: ${activeLeadsList.length} leads in negotiation\n\n*Tip: Connect your Google Gemini API Key in the AI Copilot header to enable unrestricted, open-ended conversational intelligence!*`;
    }

    res.json({
      success: true,
      answer: responseText,
      proposedAction,
      provider: "live-context-engine",
    });
  } catch (error) {
    console.error("Process AI Query Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Controlled Tool Execution Controller
 */
export async function executeAiTool(req, res) {
  try {
    const { toolId, params, confirmedByUser = false } = req.body;
    if (!toolId) {
      return res.status(400).json({ success: false, message: "toolId is required" });
    }

    const execution = await executeControlledTool({
      toolId,
      params: params || {},
      confirmedByUser,
    });

    res.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error("Execute AI Tool Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
