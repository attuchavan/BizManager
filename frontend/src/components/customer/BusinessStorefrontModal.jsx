import { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Users,
  Layers,
  HeartPulse,
  Building2,
  Share2,
} from "lucide-react";

export default function BusinessStorefrontModal({
  isOpen,
  onClose,
  business,
  onBookService,
  onBookDoctor,
}) {
  if (!isOpen || !business) return null;

  const [activeStoreTab, setActiveStoreTab] = useState("doctors");
  const [copied, setCopied] = useState(false);

  const businessName = business.name || business.businessName || "BizManager Partner";
  const businessType = business.category || business.type || "Service";
  const doctors = business.doctors || [];
  const services = business.services || [];
  const amenities = business.amenities || [];
  const rating = business.rating || 4.9;
  const reviewCount = business.reviewCount || 48;
  const address = business.address || "Main Medical Boulevard";
  const phone = business.phone || "+91 98201 12345";
  const email = business.email || "contact@provider.com";
  const workingHours = business.workingHours || "Mon - Sat: 09:00 AM - 08:00 PM";

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${businessName} ${address}`
  )}`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: businessName,
        text: `Check out ${businessName} on BizManager`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Top Cover Banner */}
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 p-6 text-white flex flex-col justify-between">
          {/* Close & Share buttons */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>Verified Provider</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition backdrop-blur-md"
                title="Share Storefront"
              >
                <Share2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition backdrop-blur-md"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick status badge */}
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Open Now
            </span>
            <span className="text-xs text-blue-100">
              {business.nextSlot ? `Next appointment: ${business.nextSlot}` : "Walk-ins & Appointments Welcome"}
            </span>
          </div>
        </div>

        {/* Business Header Info */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {businessName}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {business.tagline || business.description}
              </p>

              {/* Badges & Meta */}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{rating}</span>
                  <span className="text-slate-400 font-normal">({reviewCount} reviews)</span>
                </span>
                <span>•</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px]">
                  {businessType}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="truncate max-w-[240px]">{address}</span>
                </span>
              </div>
            </div>

            {/* Quick Direct Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                <Phone size={13} className="text-blue-600" />
                <span>Call</span>
              </a>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                <MapPin size={13} className="text-rose-500" />
                <span>Directions</span>
              </a>

              <button
                onClick={() => {
                  onClose();
                  onBookService(services[0] || null, business);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 transition active:scale-95"
              >
                <Calendar size={13} />
                <span>Book Now</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
            {[
              { id: "doctors", label: `Doctors & Specialists (${doctors.length || 0})` },
              { id: "services", label: `Services & Pricing (${services.length || 0})` },
              { id: "about", label: "About & Facilities" },
              { id: "reviews", label: "Patient Reviews" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStoreTab(tab.id)}
                className={`border-b-2 py-2.5 px-3 text-xs font-bold transition whitespace-nowrap ${
                  activeStoreTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {/* TAB 1: DOCTORS & SPECIALISTS */}
          {activeStoreTab === "doctors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Available Specialists & Medical Staff
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Book consultations directly with verified clinicians.
                  </p>
                </div>
              </div>

              {doctors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Users size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    General Specialists on Duty
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Book an appointment with any available doctor or specialist on duty.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onBookService(services[0] || null, business);
                    }}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Book General Consultation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${doc.avatarBg || "bg-blue-600"} text-white font-extrabold text-sm shadow-sm`}>
                            {doc.name.startsWith("Dr.") ? "Dr" : doc.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                              {doc.name}
                            </h5>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                              {doc.specialty}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {doc.degrees}
                            </p>
                          </div>
                        </div>

                        {/* Experience & Rating */}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {doc.experience}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-amber-500">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span>{doc.rating || "4.9"}</span>
                          </span>
                        </div>

                        {/* Available Slots Preview */}
                        {doc.availableSlots && (
                          <div className="mt-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Next Available Slots ({doc.nextSlot})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.availableSlots.map((slot, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                >
                                  {slot}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Consultation Fee</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            ₹{doc.fee?.toLocaleString("en-IN") || "500"}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onBookDoctor(doc, business);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition active:scale-95"
                        >
                          <Calendar size={13} />
                          <span>Book Doctor</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES & PRICING */}
          {activeStoreTab === "services" && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Available Treatments, Tests & Services
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any service to book a guaranteed appointment slot.
                </p>
              </div>

              <div className="space-y-2.5">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {srv.category || "Service"}
                        </span>
                        {srv.popular && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            ★ Popular
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {srv.name}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {srv.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{srv.duration || "30 mins"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        ₹{srv.price?.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onBookService(srv, business);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition active:scale-95"
                      >
                        <span>Book Service</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT & FACILITIES */}
          {activeStoreTab === "about" && (
            <div className="space-y-6">
              {/* Description */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  About {businessName}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {business.description ||
                    "Professional medical and commercial facility committed to excellence, hygiene, and patient-first care."}
                </p>
              </div>

              {/* Amenities & Infrastructure */}
              {amenities.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Clinic Facilities & Amenities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {amenities.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Working Hours & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Clock size={14} className="text-blue-600" />
                    <span>Operating Hours</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {workingHours}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-xs">
                    <MapPin size={14} className="text-rose-500" />
                    <span>Location & Address</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeStoreTab === "reviews" && (
            <div className="space-y-4">
              {/* Rating summary */}
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-center sm:text-left">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {rating}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 my-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">Based on {reviewCount} verified reviews</span>
                </div>

                <div className="flex-1 w-full border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Clinical Care & Doctors</span>
                    <span className="font-bold text-emerald-600">4.9 / 5</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Cleanliness & Hygiene</span>
                    <span className="font-bold text-emerald-600">5.0 / 5</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Waiting Time & Token Queue</span>
                    <span className="font-bold text-blue-600">4.8 / 5</span>
                  </div>
                </div>
              </div>

              {/* Sample patient reviews */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Sunil Mehta</span>
                    <span className="text-[11px] text-slate-400">2 days ago</span>
                  </div>
                  <div className="flex items-center gap-1 my-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    "Very professional consultation with Dr. Rajesh Sharma. Prescribed accurate diagnostics and explained the treatment thoroughly. Waiting time was minimal thanks to their online token system."
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Pooja Deshmukh</span>
                    <span className="text-[11px] text-slate-400">1 week ago</span>
                  </div>
                  <div className="flex items-center gap-1 my-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    "Dr. Ananya Sen is fantastic! Helped me resolve my persistent skin allergy within two weeks. Clinic is spotless and very welcoming."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Need assistance?
            </span>
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {phone}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookService(services[0] || null, business);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 transition active:scale-95"
            >
              <Calendar size={13} />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
