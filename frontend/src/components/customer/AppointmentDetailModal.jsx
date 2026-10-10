import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  ExternalLink,
  Loader2,
  Share2,
} from "lucide-react";
import { cancelAppointment } from "../../services/firebase/appointments";

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  business,
  terminology,
  onReschedule,
  onBookAgain,
  onLeaveReview,
  onAppointmentUpdated,
}) {
  if (!isOpen || !appointment) return null;

  const businessId = business?.id || business?.businessId;
  const businessName = business?.name || business?.businessName || "BizManager Service";
  const businessAddress = business?.address || "Location on record";

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const isConfirmed = appointment.status === "Confirmed";
  const isCompleted = appointment.status === "Completed";
  const isCancelled = appointment.status === "Cancelled";

  async function handleCancelConfirm() {
    if (!businessId || !appointment.id) return;

    try {
      setCancelling(true);
      await cancelAppointment(businessId, appointment.id, cancelReason);
      onAppointmentUpdated?.();
      onClose();
    } catch (err) {
      console.error("Cancellation error:", err);
      alert(`Could not cancel: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${businessName}, ${businessAddress}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isConfirmed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : isCompleted
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {appointment.status || "Confirmed"}
            </span>
            <h3 className="mt-1.5 text-lg font-extrabold text-slate-900 dark:text-white">
              {appointment.service || "Scheduled Appointment"}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-slate-500">Booking #{appointment.id.slice(0, 8)}</p>
              {appointment.tokenNumber && (
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  Queue Token: #{appointment.tokenNumber}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Appointment Key Information Cards */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                <Calendar size={13} className="text-indigo-500" />
                Date
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                {appointment.date}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                <Clock size={13} className="text-indigo-500" />
                Time Slot
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                {appointment.time || "Scheduled"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                <User size={13} className="text-indigo-500" />
                {terminology?.employee || "Specialist"}
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm truncate">
                {appointment.assignedEmployee || "Assigned Specialist"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                <Building2 size={13} className="text-emerald-500" />
                Estimated Fee
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm font-mono text-emerald-600 dark:text-emerald-400">
                {appointment.amount || (appointment.price ? `₹${Number(appointment.price).toLocaleString("en-IN")}` : "Confirmed")}
              </p>
            </div>
          </div>

          {/* Quick Sync & Pass Actions */}
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `📅 *Booking Pass - ${businessName}*\n\n` +
                `• Service: ${appointment.service || "Appointment"}\n` +
                `• Date: ${appointment.date}\n` +
                `• Time: ${appointment.time || "Scheduled"}\n` +
                (appointment.tokenNumber ? `• Queue Token: #${appointment.tokenNumber}\n` : "") +
                (appointment.assignedEmployee ? `• Specialist: ${appointment.assignedEmployee}\n` : "") +
                `• Venue: ${businessAddress}\n\n` +
                `Show this token pass upon arrival.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 transition"
            >
              <Share2 size={13} />
              <span>WhatsApp Pass</span>
            </a>
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `${appointment.service || "Booking"} at ${businessName}`
              )}&details=${encodeURIComponent(
                `Appointment with ${businessName}. Specialist: ${appointment.assignedEmployee || "Staff"}. Token: #${appointment.tokenNumber || "N/A"}`
              )}&location=${encodeURIComponent(businessAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 transition"
            >
              <Calendar size={13} />
              <span>Add to Calendar</span>
            </a>
          </div>

          {/* Location & Directions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Provider Location
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {businessName}
                </p>
                <p className="text-slate-500 mt-0.5 text-[11px]">{businessAddress}</p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 shrink-0 border border-indigo-200/40 dark:border-indigo-800/30 transition"
              >
                <MapPin size={13} />
                <span>Directions</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Notes:</span>
              <p className="italic">"{appointment.notes}"</p>
            </div>
          )}

          {/* Cancellation Confirmation View */}
          {confirmCancel && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold mb-2">
                <AlertTriangle size={15} />
                <span>Confirm Appointment Cancellation?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mb-2">
                Are you sure you want to cancel this booking? This slot will be released back to the provider.
              </p>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)..."
                className="w-full rounded-xl border border-rose-200 bg-white p-2 text-xs outline-none dark:border-rose-800 dark:bg-slate-900 dark:text-white mb-3"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                >
                  {cancelling && <Loader2 size={12} className="animate-spin" />}
                  <span>Cancel Booking</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!confirmCancel && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            {isConfirmed && (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                >
                  Cancel Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReschedule?.(appointment);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm transition"
                >
                  <RotateCcw size={13} />
                  <span>Reschedule</span>
                </button>
              </>
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLeaveReview?.(appointment);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-400 transition"
              >
                <Star size={13} />
                <span>Leave Review</span>
              </button>
            )}

            {(isCompleted || isCancelled) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookAgain?.(appointment.service);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-indigo-600 transition active:scale-95"
              >
                <span>Book Again</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
