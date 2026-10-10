import { useState } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createLead } from "../../services/firebase/leads";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";

export default function CustomerContactModal({
  isOpen,
  onClose,
  business,
  customer,
  onOpenBooking,
}) {
  if (!isOpen) return null;

  const businessId = business?.id || business?.businessId || "";
  const businessName = business?.name || business?.businessName || "BizManager Service";
  const businessType = business?.type || business?.businessType || "Service Provider";
  const businessAddress = business?.address || "Mumbai, Maharashtra, India";
  const businessPhone = business?.phone || "+91 98765 43210";
  const businessEmail = business?.email || "support@bizmanager.com";
  const rawPhoneClean = businessPhone.replace(/[^0-9]/g, "");

  const customerName = customer?.displayName || customer?.name || "Valued Client";
  const customerEmail = customer?.email || "";
  const customerPhone = customer?.phone || customer?.phoneNumber || "";

  const [senderName, setSenderName] = useState(customer?.displayName || customer?.name || "");
  const [senderEmail, setSenderEmail] = useState(customer?.email || "");
  const [senderPhone, setSenderPhone] = useState(customer?.phone || customer?.phoneNumber || "");

  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'message'
  const [inquiryText, setInquiryText] = useState("");
  const [inquirySubject, setInquirySubject] = useState("General Inquiry");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${businessName}, ${businessAddress}`
  )}`;

  const whatsappUrl = `https://wa.me/${rawPhoneClean}?text=${encodeURIComponent(
    `Hello ${businessName}, I am contacting you through the Client Portal regarding your services.`
  )}`;

  async function handleSendInquiry(e) {
    e.preventDefault();
    if (!inquiryText.trim()) {
      setSendError("Please enter your message or question.");
      return;
    }
    if (!businessId) {
      setSendError("Business identifier missing.");
      return;
    }

    const finalSenderName = senderName.trim() || customerName;
    const finalSenderEmail = senderEmail.trim() || customerEmail;
    const finalSenderPhone = senderPhone.trim() || customerPhone;

    try {
      setSending(true);
      setSendError("");

      // Store inquiry as a real lead in Cloud Firestore
      await createLead(businessId, {
        name: finalSenderName,
        email: finalSenderEmail,
        phone: finalSenderPhone,
        company: "Customer Portal User",
        status: "New",
        source: "Customer Portal Inquiry",
        notes: `[${inquirySubject}] ${inquiryText.trim()}`,
        estimatedValue: 0,
      });

      // Record in form submissions collection for audit
      try {
        await recordFormSubmission(businessId, {
          formType: "customer_inquiry",
          formTitle: `Client Inquiry: ${inquirySubject}`,
          contactName: finalSenderName,
          contactEmail: finalSenderEmail,
          contactPhone: finalSenderPhone,
          data: {
            name: finalSenderName,
            email: finalSenderEmail,
            phone: finalSenderPhone,
            subject: inquirySubject,
            message: inquiryText.trim(),
          },
        });
      } catch (logErr) {
        console.warn("Could not log form submission for inquiry:", logErr);
      }

      setSentSuccess(true);
      setInquiryText("");
      setTimeout(() => {
        setSentSuccess(false);
        setActiveTab("info");
      }, 2500);
    } catch (err) {
      console.error("Failed to send inquiry:", err);
      setSendError(err.message || "Failed to submit message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-white text-base shadow-md shadow-blue-500/25">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {businessName}
              </h3>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {businessType}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle: Info vs Send Message */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              activeTab === "info"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Contact Details
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              activeTab === "message"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Send Online Message
          </button>
        </div>

        {/* TAB 1: Contact Details */}
        {activeTab === "info" && (
          <div className="mt-4 space-y-3.5 text-xs animate-in fade-in">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${businessPhone}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                <Phone size={15} className="text-blue-600" />
                <span>Call Provider</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
              >
                <MessageSquare size={15} className="text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Location & Directions */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <MapPin size={14} className="text-rose-500" />
                  Physical Address
                </span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  <span>Open in Maps</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {businessAddress}
              </p>
            </div>

            {/* Email Support */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-indigo-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Support Email
                  </span>
                  <span className="text-slate-500">{businessEmail}</span>
                </div>
              </div>
              <a
                href={`mailto:${businessEmail}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Email Us
              </a>
            </div>

            {/* Operating Hours */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                <Clock size={14} className="text-amber-500" />
                Operating Hours
              </span>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Monday – Saturday:</span>
                <span className="font-bold text-slate-900 dark:text-white">09:00 AM – 08:00 PM</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Sunday:</span>
                <span className="font-bold text-slate-900 dark:text-white">10:00 AM – 04:00 PM</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Send Message Form */}
        {activeTab === "message" && (
          <form onSubmit={handleSendInquiry} className="mt-4 space-y-3.5 animate-in fade-in">
            {sentSuccess ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="mt-3 font-bold text-slate-900 dark:text-white">
                  Message Sent to {businessName}!
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your inquiry has been stored securely. The provider will reach back to you shortly.
                </p>
              </div>
            ) : (
              <>
                {sendError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <AlertCircle size={14} />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Topic
                  </label>
                  <select
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
                  >
                    <option value="General Inquiry">General Service Inquiry</option>
                    <option value="Pricing & Insurance">Pricing / Packages / Insurance</option>
                    <option value="Appointment Request">Custom Time Slot Request</option>
                    <option value="Feedback / Question">Feedback or Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="Type your message, questions, or requirements here..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 p-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 disabled:opacity-50 transition active:scale-95"
                >
                  {sending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending to Provider...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        )}

        {/* Modal Bottom Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBooking?.();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
          >
            <Calendar size={13} />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
