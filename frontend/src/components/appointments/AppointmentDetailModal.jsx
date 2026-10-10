import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Briefcase,
  UserCheck,
  MapPin,
  ExternalLink,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pencil,
  Trash2,
  Copy,
  Check,
  Receipt,
  UserPlus,
} from "lucide-react";

import { markReminderSent, cancelAppointment } from "../../services/firebase/appointments";

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  businessId,
  businessName = "AI Business Manager",
  onEdit,
  onStatusUpdate,
}) {
  if (!isOpen || !appointment) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [reminderState, setReminderState] = useState(appointment.reminderSent || false);
  const [cancelling, setCancelling] = useState(false);

  const cleanPhone = appointment.phone?.replace(/[^0-9]/g, "") || "";
  const isCompleted = appointment.status === "Completed";
  const isCancelled = appointment.status === "Cancelled";

  // Pre-formatted reminder message
  const reminderMessage = `Hello ${appointment.clientName || "Client"}, this is a confirmation for your upcoming ${appointment.service || "Consultation"} with ${businessName} on ${appointment.date} at ${appointment.time} (${appointment.duration || "45m"}).\n\n${appointment.meetingLink ? `Join online: ${appointment.meetingLink}\n\n` : ""}Looking forward to speaking with you!`;

  async function handleSendWhatsAppReminder() {
    if (cleanPhone) {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;
      window.open(url, "_blank");
    }

    if (businessId && !appointment.id.startsWith("app-")) {
      try {
        await markReminderSent(businessId, appointment.id, "WhatsApp");
        setReminderState(true);
      } catch (err) {
        console.error("Error logging reminder:", err);
      }
    } else {
      setReminderState(true);
    }
  }

  async function handleCancel() {
    const reason = window.prompt("Reason for cancellation (optional):", "Client requested reschedule");
    if (reason === null) return; // user cancelled prompt

    try {
      setCancelling(true);
      if (businessId && !appointment.id.startsWith("app-")) {
        await cancelAppointment(businessId, appointment.id, reason);
      }
      onStatusUpdate(appointment.id, "Cancelled", reason);
      onClose();
    } catch (err) {
      console.error("Cancel appointment error:", err);
    } finally {
      setCancelling(false);
    }
  }

  function handleCopyLink() {
    if (!appointment.meetingLink) return;
    navigator.clipboard.writeText(appointment.meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-transparent p-6 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-blue-500/20">
                {appointment.clientName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {appointment.clientName || appointment.customerName}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isCompleted
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        : isCancelled
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                        : appointment.status === "In Progress"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    {appointment.status || "Confirmed"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {appointment.service || "Consultation"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Date & Time Highlights */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800">
              <Calendar size={15} className="text-blue-500" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Scheduled Date</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {appointment.date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800">
              <Clock size={15} className="text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Time & Duration</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {appointment.time} ({appointment.duration || "45m"})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Contact Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Client Contact Information
            </span>

            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone size={13} className="text-slate-400" />
                <span>{appointment.phone || "No phone provided"}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail size={13} className="text-slate-400" />
                <span>{appointment.email || "No email provided"}</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff & Meeting Venue */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Team Member
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck size={14} className="text-blue-500" />
                <span>{appointment.assignedEmployee || "Unassigned"}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Location / Mode
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-500" />
                <span>{appointment.locationType || "Online"}</span>
              </p>
            </div>
          </div>

          {/* Meeting Link (if online) */}
          {appointment.meetingLink && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Video Meeting Link
                </span>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {appointment.meetingLink}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-white dark:hover:bg-slate-800"
                  title="Copy meeting link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <a
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  <ExternalLink size={12} />
                  Join
                </a>
              </div>
            </div>
          )}

          {/* Agenda & Notes */}
          {appointment.notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meeting Agenda & Notes
              </span>
              <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Automated Reminders Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-emerald-500" />
                  Client Appointment Reminders
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {reminderState
                    ? "✓ Confirmation reminder has been dispatched to client."
                    : "Send a reminder to guarantee client attendance."}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  reminderState
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}
              >
                {reminderState ? "Reminder Sent" : "Pending"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleSendWhatsAppReminder}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
              >
                <MessageSquare size={13} />
                Send WhatsApp Alert
              </button>

              {appointment.email && (
                <a
                  href={`mailto:${appointment.email}?subject=${encodeURIComponent(
                    `Appointment Confirmation: ${appointment.service}`
                  )}&body=${encodeURIComponent(reminderMessage)}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Mail size={13} />
                  Send Email Alert
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Post-Completion Billing & Follow-up Prompt */}
        {isCompleted && (
          <div className="mx-6 my-2 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Appointment Completed
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Generate an invoice to collect payment for this session.
                </p>
              </div>
            </div>
            <Link
              to={`/app/invoices?action=new&client=${encodeURIComponent(
                appointment.clientName || appointment.customerName || ""
              )}&service=${encodeURIComponent(appointment.service || "")}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Receipt size={13} />
              Create Invoice
            </Link>
          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {!isCompleted && !isCancelled && (
              <button
                onClick={() => {
                  onStatusUpdate(appointment.id, "Completed");
                }}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition"
              >
                <CheckCircle2 size={13} />
                Mark Completed
              </button>
            )}

            {!isCancelled && (
              <Link
                to={`/app/invoices?action=new&client=${encodeURIComponent(
                  appointment.clientName || appointment.customerName || ""
                )}&service=${encodeURIComponent(appointment.service || "")}`}
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 transition"
              >
                <Receipt size={13} />
                Create Invoice
              </Link>
            )}

            {!isCancelled && !isCompleted && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/20 transition"
              >
                <XCircle size={13} />
                Cancel Booking
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(appointment);
              }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              <Pencil size={13} />
              Edit Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
