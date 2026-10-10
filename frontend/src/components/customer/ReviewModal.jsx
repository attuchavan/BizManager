import { useState } from "react";
import { X, Star, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { createReview } from "../../services/firebase/reviews";

export default function ReviewModal({
  isOpen,
  onClose,
  appointment,
  business,
  customer,
  onReviewSubmitted,
}) {
  if (!isOpen || !appointment) return null;

  const businessId = business?.id || business?.businessId;
  const businessName = business?.name || business?.businessName || "BizManager Service";
  const customerName = customer?.name || customer?.displayName || appointment.clientName || "Valued Client";
  const customerEmail = customer?.email || appointment.clientEmail || appointment.customerEmail || "";

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    if (!businessId) {
      setError("Business ID missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const reviewRecord = {
        appointmentId: appointment.id,
        serviceName: appointment.service || "Completed Service",
        rating,
        feedback: feedback.trim(),
        customerName,
        customerEmail,
        customerId: customer?.uid || "",
        date: new Date().toISOString().split("T")[0],
      };

      await createReview(businessId, reviewRecord);

      setSuccess(true);
      onReviewSubmitted?.(reviewRecord);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFeedback("");
      }, 1800);
    } catch (err) {
      console.error("Review submission error:", err);
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rate Your Experience
            </h3>
            <p className="text-[11px] text-slate-500">{appointment.service} • {businessName}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center animate-in fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Your review has been recorded and shared with {businessName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="mt-4 space-y-4 text-xs">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="text-center py-2">
              <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                Overall Satisfaction:
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="block text-xs font-bold text-amber-600 mt-2">
                {rating === 5 && "Outstanding Experience! 🌟"}
                {rating === 4 && "Very Good Service 👍"}
                {rating === 3 && "Satisfactory ⚖️"}
                {rating === 2 && "Needs Improvement ⚠️"}
                {rating === 1 && "Disappointed ❌"}
              </span>
            </div>

            {/* Feedback text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Review & Comments
              </label>
              <textarea
                rows={3}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you liked about your visit and what we can do better..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                <span>Submit Review</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
