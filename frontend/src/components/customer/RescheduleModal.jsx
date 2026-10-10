import { useState } from "react";
import { X, Calendar, Clock, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { rescheduleAppointment } from "../../services/firebase/appointments";
import { createNotification } from "../../services/firebase/notifications";

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
  "06:30 PM",
];

export default function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  business,
  customer,
  onRescheduleSuccess,
}) {
  if (!isOpen || !appointment) return null;

  const businessId = business?.id || business?.businessId;
  const minDate = new Date().toISOString().split("T")[0];

  const [newDate, setNewDate] = useState(
    appointment.date || new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [newTime, setNewTime] = useState(appointment.time || "10:00 AM");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleRescheduleSubmit(e) {
    e.preventDefault();
    if (!newDate || !newTime) {
      setError("Please choose a new date and time.");
      return;
    }
    if (!businessId || !appointment.id) return;

    try {
      setSaving(true);
      setError("");

      await rescheduleAppointment(businessId, appointment.id, {
        date: newDate,
        time: newTime,
        reason: reason.trim(),
      });

      // Send notification
      const userEmail = customer?.email || appointment.clientEmail || appointment.customerEmail;
      if (userEmail) {
        await createNotification(businessId, {
          recipientEmail: userEmail,
          title: "Appointment Rescheduled",
          message: `Your booking for ${appointment.service} has been rescheduled to ${newDate} at ${newTime}.`,
          type: "appointment",
          entityId: appointment.id,
        });
      }

      onRescheduleSuccess?.();
      onClose();
    } catch (err) {
      console.error("Reschedule error:", err);
      setError(err.message || "Failed to reschedule appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reschedule Booking
              </h3>
              <p className="text-[11px] text-slate-400">
                {appointment.service}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <span className="font-semibold block text-slate-400 uppercase text-[10px]">
              Current Slot:
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {appointment.date} at {appointment.time}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select New Date *
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select New Time Slot *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewTime(t)}
                  className={`rounded-xl py-2 px-1 text-center font-semibold text-[11px] border transition ${
                    newTime === t
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Note (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, work commitment..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              <span>Confirm New Slot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
