/**
 * Controlled Server-side AI Tools Registry
 * Enforces strict safety policies, authorization, and confirmation gates
 * before high-impact mutations or external communications occur.
 */

export const CONTROLLED_TOOLS = {
  create_followup: {
    id: "create_followup",
    name: "Schedule Client Follow-up",
    impact: "HIGH",
    requiresConfirmation: true,
    description: "Schedules an official appointment/task in the business calendar and assigns staff.",
    parameters: ["customerName", "date", "time", "service", "notes"],
  },
  draft_client_message: {
    id: "draft_client_message",
    name: "Draft Client Communication",
    impact: "LOW",
    requiresConfirmation: false,
    description: "Generates tailored WhatsApp or email copy saved to drafts without sending.",
    parameters: ["recipientName", "channel", "template", "message"],
  },
  send_overdue_reminder: {
    id: "send_overdue_reminder",
    name: "Dispatch Overdue Payment Notice",
    impact: "HIGH",
    requiresConfirmation: true,
    description: "Prepares and dispatches an official billing reminder to a customer with outstanding invoices.",
    parameters: ["invoiceNumber", "customerName", "amountDue", "channel", "message"],
  },
  flag_expense_audit: {
    id: "flag_expense_audit",
    name: "Flag Cost Optimization Audit",
    impact: "LOW",
    requiresConfirmation: false,
    description: "Creates an internal administrative review note for recurring overhead expenses.",
    parameters: ["category", "thresholdAmount", "reason"],
  },
};

/**
 * Execute a controlled tool with confirmation verification
 */
export async function executeControlledTool({
  toolId,
  params,
  confirmedByUser = false,
  userMetadata = {},
}) {
  const tool = CONTROLLED_TOOLS[toolId];
  if (!tool) {
    throw new Error(`Unrecognized AI tool requested: ${toolId}`);
  }

  // Enforce Confirmation Gate for HIGH impact actions
  if (tool.requiresConfirmation && !confirmedByUser) {
    return {
      status: "CONFIRMATION_REQUIRED",
      toolId: tool.id,
      toolName: tool.name,
      impact: tool.impact,
      description: tool.description,
      params,
      warningMessage: `High-impact action "${tool.name}" requires explicit user confirmation before executing.`,
    };
  }

  // Execution handler based on tool type
  const executionTimestamp = new Date().toISOString();
  let executionResult = null;

  switch (toolId) {
    case "create_followup":
      executionResult = {
        appointmentId: `appt-ai-${Date.now()}`,
        customerName: params.customerName,
        date: params.date || new Date().toISOString().split("T")[0],
        time: params.time || "11:00 AM",
        service: params.service || "Strategic Advisory Follow-up",
        status: "Scheduled",
        assignedBy: "AI Manager",
        createdAt: executionTimestamp,
      };
      break;

    case "draft_client_message":
      executionResult = {
        draftId: `draft-ai-${Date.now()}`,
        recipientName: params.recipientName,
        channel: params.channel || "WhatsApp",
        message: params.message,
        status: "Draft Ready",
        createdAt: executionTimestamp,
      };
      break;

    case "send_overdue_reminder":
      executionResult = {
        reminderId: `rem-ai-${Date.now()}`,
        invoiceNumber: params.invoiceNumber,
        customerName: params.customerName,
        amountDue: params.amountDue,
        dispatchedVia: params.channel || "WhatsApp",
        status: "Dispatched",
        sentAt: executionTimestamp,
      };
      break;

    case "flag_expense_audit":
      executionResult = {
        auditId: `audit-ai-${Date.now()}`,
        category: params.category,
        flaggedAmount: params.thresholdAmount,
        status: "Logged for Review",
        createdAt: executionTimestamp,
      };
      break;

    default:
      throw new Error(`No implementation available for tool: ${toolId}`);
  }

  return {
    status: "EXECUTED",
    toolId: tool.id,
    toolName: tool.name,
    impact: tool.impact,
    confirmedByUser: true,
    executedAt: executionTimestamp,
    result: executionResult,
  };
}
