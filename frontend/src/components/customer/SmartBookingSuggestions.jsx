import { useState, useMemo } from "react";
import {
  Sparkles,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { SMART_BOOKING_SUGGESTIONS } from "../../services/firebase/businesses";

export default function SmartBookingSuggestions({
  business = null,
  services = [],
  employees = [],
  terminology = {},
  onSelectSuggestion,
  className = "",
  compact = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const businessName = business?.name || business?.businessName || "Service Provider";
  const businessType = (business?.type || business?.businessType || business?.category || "").toLowerCase();
  const businessId = business?.id || business?.businessId || "";

  // 1. Dynamically compute suggestions tailored to the current business
  const rawSuggestions = useMemo(() => {
    // A. If specific business is provided
    if (business) {
      // 1. Check if business has live custom services from Firestore or showcase
      const availableServices =
        Array.isArray(services) && services.length > 0
          ? services
          : Array.isArray(business.services) && business.services.length > 0
          ? business.services
          : [];

      if (availableServices.length > 0) {
        return availableServices.slice(0, 6).map((srv, idx) => {
          // Dynamic badge
          let badge = "⭐ Most Popular";
          let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900";

          if (srv.popular || idx === 0) {
            badge = "⭐ Most Popular";
            badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900";
          } else if (idx === 1) {
            badge = "⚡ Immediate Opening";
            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900";
          } else if (idx === 2) {
            badge = "🎯 AI Recommended";
            badgeColor = "bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 text-indigo-700 border-indigo-200/80 dark:from-indigo-950/50 dark:to-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
          } else if (idx === 3) {
            badge = "💎 Best Value";
            badgeColor = "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900";
          } else {
            badge = "✨ Verified Slot";
            badgeColor = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
          }

          // Provider assignment
          let providerName = "Verified Specialist";
          if (employees.length > 0) {
            providerName = employees[idx % employees.length]?.name || "Assigned Specialist";
          } else if (Array.isArray(business.doctors) && business.doctors.length > 0) {
            providerName = business.doctors[idx % business.doctors.length]?.name || "Attending Doctor";
          } else if (businessType.includes("clinic") || businessType.includes("doctor") || businessType.includes("health")) {
            providerName = "Doctor on Duty";
          } else if (businessType.includes("dental")) {
            providerName = "Chief Dentist";
          } else if (businessType.includes("salon") || businessType.includes("spa")) {
            providerName = "Senior Stylist";
          } else if (businessType.includes("fitness") || businessType.includes("gym")) {
            providerName = "Certified Coach";
          } else if (businessType.includes("consult") || businessType.includes("legal")) {
            providerName = "Senior Consultant";
          }

          // Next opening slot
          const slotTimes = ["Today, 04:00 PM", "Tomorrow, 10:30 AM", "Tomorrow, 02:00 PM", "Tomorrow, 05:00 PM"];
          const nextSlot = slotTimes[idx % slotTimes.length];

          return {
            id: srv.id || `dyn-srv-${idx}`,
            serviceId: srv.id || "",
            serviceName: srv.name || "Specialized Service",
            servicePrice: Number(srv.price || 0),
            serviceDuration: srv.duration || "45 mins",
            category: srv.category || terminology?.service || "General",
            subtitle:
              srv.description ||
              `Expert 1-on-1 session with guaranteed digital queue token at ${businessName}.`,
            badge,
            badgeColor,
            providerName,
            nextSlot,
            businessName,
            businessId,
          };
        });
      }

      // 2. Fallback when business has not created services yet in Firestore
      // Generate intelligent contextual suggestions for this business category
      return getCategoryContextualSuggestions(business, businessType, businessName, businessId, terminology);
    }

    // B. Global fallback across showcase businesses (e.g. for ExploreStores page)
    return SMART_BOOKING_SUGGESTIONS;
  }, [business, services, employees, terminology, businessType, businessName, businessId]);

  // 2. Dynamic Categories for filter pills
  const availableCategories = useMemo(() => {
    const set = new Set();
    rawSuggestions.forEach((s) => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return Array.from(set);
  }, [rawSuggestions]);

  // 3. Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === "all") return rawSuggestions;
    return rawSuggestions.filter(
      (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [rawSuggestions, selectedCategory]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-emerald-500/15 text-indigo-600 dark:text-emerald-400 border border-indigo-200/50 dark:border-indigo-800/50 shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {business ? `Smart Suggestions for ${businessName}` : "Smart Booking Suggestions"}
              </h3>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Match
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immediate appointment openings with guaranteed slots and transparent pricing.
            </p>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        {availableCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              All Recommended
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestion Cards Grid (Electric Indigo & Cyber Mint Theme) */}
      <div
        className={`grid gap-4 ${
          compact
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {filteredSuggestions.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-400/80 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500"
          >
            {/* Card Content Top */}
            <div>
              {/* Top Row: Dynamic Badge & Next Slot */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Clock size={12} className="text-emerald-500" />
                  <span>{item.nextSlot}</span>
                </span>
              </div>

              {/* Service Title */}
              <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {item.serviceName}
              </h4>

              {/* Clear, Spacious Subtitle / Description */}
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[34px]">
                {item.subtitle}
              </p>

              {/* Provider & Duration Info Row */}
              <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <User size={13} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{item.providerName}</span>
                </span>
                <span className="shrink-0 font-medium text-slate-400 text-[11px]">
                  {item.serviceDuration}
                </span>
              </div>
            </div>

            {/* Bottom Row: Clear Transparent Price & Electric Indigo Action Button */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                  {terminology?.service || "Service"} Fee
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ₹{item.servicePrice.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                onClick={() => onSelectSuggestion(item)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 transition active:scale-95 group/btn"
              >
                <span>Book Slot</span>
                <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-0.5 text-emerald-300" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: Category-contextual suggestions when a business has no custom services
// ---------------------------------------------------------------------------
function getCategoryContextualSuggestions(business, businessType, businessName, businessId, terminology) {
  // Dental
  if (businessType.includes("dental") || businessType.includes("dentist") || businessType.includes("teeth")) {
    return [
      {
        id: "sug-dental-clean",
        serviceId: "srv-dental-clean",
        serviceName: "Ultrasonic Painless Dental Cleaning & Polish",
        servicePrice: 900,
        serviceDuration: "30 mins",
        category: "Preventive Care",
        subtitle: "Gentle zero-pain ultrasonic plaque removal, stain polish, and gum health inspection.",
        badge: "⭐ Most Popular",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
        providerName: "Lead Dental Hygienist",
        nextSlot: "Today, 04:30 PM",
        businessName,
        businessId,
      },
      {
        id: "sug-dental-exam",
        serviceId: "srv-dental-exam",
        serviceName: "Digital Smile & Cavity Examination",
        servicePrice: 400,
        serviceDuration: "20 mins",
        category: "Consultation",
        subtitle: "High-resolution intraoral camera inspection, cavity detection, and preventive dental plan.",
        badge: "⚡ Immediate Slot",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
        providerName: "Senior Dentist",
        nextSlot: "Tomorrow, 10:00 AM",
        businessName,
        businessId,
      },
      {
        id: "sug-dental-implant",
        serviceId: "srv-dental-implant",
        serviceName: "Dental Alignment & Implant Review",
        servicePrice: 1500,
        serviceDuration: "45 mins",
        category: "Specialist Review",
        subtitle: "3D digital dental scans, orthodontic alignment roadmap, and consultation for implants.",
        badge: "💎 Best Value",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
        providerName: "Orthodontist Specialist",
        nextSlot: "Tomorrow, 03:00 PM",
        businessName,
        businessId,
      },
    ];
  }

  // Salon & Spa
  if (businessType.includes("salon") || businessType.includes("spa") || businessType.includes("beauty") || businessType.includes("hair")) {
    return [
      {
        id: "sug-salon-hair",
        serviceId: "srv-salon-hair",
        serviceName: "Signature Haircut, Wash & Blowdry",
        servicePrice: 650,
        serviceDuration: "45 mins",
        category: "Hair Styling",
        subtitle: "Custom styling tailored to face shape, clarifying scalp wash, and professional blowdry finish.",
        badge: "⭐ Most Popular",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
        providerName: "Senior Hair Stylist",
        nextSlot: "Today, 03:30 PM",
        businessName,
        businessId,
      },
      {
        id: "sug-salon-facial",
        serviceId: "srv-salon-facial",
        serviceName: "HydraGlow Facial & Skin Rejuvenation",
        servicePrice: 1400,
        serviceDuration: "60 mins",
        category: "Skin & Glow",
        subtitle: "Deep pore suction, organic botanical exfoliation, serum infusion, and relaxing facial massage.",
        badge: "⚡ Immediate Slot",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
        providerName: "Lead Aesthetician",
        nextSlot: "Tomorrow, 11:30 AM",
        businessName,
        businessId,
      },
      {
        id: "sug-spa-massage",
        serviceId: "srv-spa-massage",
        serviceName: "Swedish & Deep Tissue Aromatherapy Massage",
        servicePrice: 2200,
        serviceDuration: "60 mins",
        category: "Wellness & Spa",
        subtitle: "Warm herbal essential oils, acupressure relief for tight muscles, and complete full-body relaxation.",
        badge: "💎 Luxury Relaxation",
        badgeColor: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900",
        providerName: "Certified Spa Therapist",
        nextSlot: "Tomorrow, 04:00 PM",
        businessName,
        businessId,
      },
    ];
  }

  // Gym / Fitness / Rehabilitation
  if (businessType.includes("gym") || businessType.includes("fitness") || businessType.includes("rehab") || businessType.includes("sports")) {
    return [
      {
        id: "sug-gym-physio",
        serviceId: "srv-gym-physio",
        serviceName: "1-on-1 Physiotherapy & Posture Rehab",
        servicePrice: 900,
        serviceDuration: "45 mins",
        category: "Physiotherapy",
        subtitle: "Targeted mobilization, dry needling, and corrective exercise for back, neck, or joint stiffness.",
        badge: "⭐ Most Popular",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
        providerName: "Sports Physiotherapist",
        nextSlot: "Tomorrow, 08:00 AM",
        businessName,
        businessId,
      },
      {
        id: "sug-gym-inbody",
        serviceId: "srv-gym-inbody",
        serviceName: "Comprehensive Fitness & Macro Nutrition Plan",
        servicePrice: 1500,
        serviceDuration: "60 mins",
        category: "Fitness Assessment",
        subtitle: "InBody 570 body scan, strength benchmark, and customized 8-week nutrition roadmap.",
        badge: "⚡ Immediate Slot",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
        providerName: "Head Coach & Nutritionist",
        nextSlot: "Today, 05:00 PM",
        businessName,
        businessId,
      },
      {
        id: "sug-gym-strength",
        serviceId: "srv-gym-strength",
        serviceName: "Functional Strength & Mobility Benchmark",
        servicePrice: 600,
        serviceDuration: "45 mins",
        category: "Strength Coaching",
        subtitle: "Dynamic movement screening, injury prevention review, and customized lifting form tune-up.",
        badge: "💎 Best Value",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
        providerName: "CSCS Coach",
        nextSlot: "Tomorrow, 09:30 AM",
        businessName,
        businessId,
      },
    ];
  }

  // Legal / Consulting / Advisory
  if (businessType.includes("legal") || businessType.includes("consult") || businessType.includes("tax") || businessType.includes("advisory")) {
    return [
      {
        id: "sug-legal-contract",
        serviceId: "srv-legal-contract",
        serviceName: "1-on-1 Legal & Commercial Contract Review",
        servicePrice: 1800,
        serviceDuration: "45 mins",
        category: "Contract Advisory",
        subtitle: "In-depth review of vendor agreements, founder NDAs, employment terms, and risk indemnity clauses.",
        badge: "⭐ Most Popular",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
        providerName: "Legal Counsel",
        nextSlot: "Tomorrow, 11:30 AM",
        businessName,
        businessId,
      },
      {
        id: "sug-legal-tax",
        serviceId: "srv-legal-tax",
        serviceName: "Business Tax, GST & Compliance Consultation",
        servicePrice: 1500,
        serviceDuration: "45 mins",
        category: "Tax & Compliance",
        subtitle: "Direct and indirect tax optimization, GST audit review, and regulatory annual filings roadmap.",
        badge: "⚡ Immediate Slot",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
        providerName: "Chartered Accountant",
        nextSlot: "Today, 04:00 PM",
        businessName,
        businessId,
      },
      {
        id: "sug-legal-startup",
        serviceId: "srv-legal-startup",
        serviceName: "Startup Structuring & IP Protection Advisory",
        servicePrice: 2500,
        serviceDuration: "60 mins",
        category: "Corporate Advisory",
        subtitle: "Private Limited incorporation, shareholder agreements, cap-table advisory, and trademark filing.",
        badge: "💎 Strategic Advisory",
        badgeColor: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900",
        providerName: "Managing Partner",
        nextSlot: "Tomorrow, 03:00 PM",
        businessName,
        businessId,
      },
    ];
  }

  // Healthcare / Clinics / Medical (Default fallback)
  return [
    {
      id: "sug-clinic-general",
      serviceId: "srv-clinic-general",
      serviceName: "Comprehensive General Consultation & Vitals",
      servicePrice: 500,
      serviceDuration: "30 mins",
      category: "Consultations",
      subtitle: "Full health examination, blood pressure, oxygen check, diagnosis, and prescription advice.",
      badge: "⭐ Most Popular",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
      providerName: "General Physician",
      nextSlot: "Today, 05:00 PM",
      businessName,
      businessId,
    },
    {
      id: "sug-clinic-screening",
      serviceId: "srv-clinic-screening",
      serviceName: "Preventive Full-Body Health Screening",
      servicePrice: 1200,
      serviceDuration: "45 mins",
      category: "Diagnostics",
      subtitle: "Complete metabolic panel, lipid profile, CBC report, and doctor review of results.",
      badge: "⚡ Immediate Slot",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
      providerName: "Pathologist & Consultant",
      nextSlot: "Tomorrow, 08:30 AM",
      businessName,
      businessId,
    },
    {
      id: "sug-clinic-specialist",
      serviceId: "srv-clinic-specialist",
      serviceName: "Specialist Follow-up & Medication Review",
      servicePrice: 400,
      serviceDuration: "20 mins",
      category: "Follow-up",
      subtitle: "Post-consultation follow-up, lab report evaluation, and prescription fine-tuning.",
      badge: "💎 Best Value",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
      providerName: "Specialist on Duty",
      nextSlot: "Tomorrow, 11:00 AM",
      businessName,
      businessId,
    },
  ];
}
