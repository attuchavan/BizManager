import { useState, useMemo, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  Loader2,
  Tag,
  Building2,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  Plus,
  QrCode,
  Smartphone,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { createAppointment } from "../../services/firebase/appointments";
import { createNotification } from "../../services/firebase/notifications";
import { createPayment } from "../../services/firebase/payments";
import { ensureCustomerRecord } from "../../services/firebase/customers";
import { getDefaultServicesForBusiness } from "../../services/firebase/services";
import { getDefaultEmployeesForBusiness } from "../../services/firebase/employees";
import { formatInr, getEffectiveBusinessUpi, generateUpiUri } from "../../utils/upiPayments";
import UpiQrCheckout from "../common/UpiQrCheckout";

const TIME_SLOTS = [
  { time: "09:00 AM", period: "Morning" },
  { time: "10:00 AM", period: "Morning" },
  { time: "11:30 AM", period: "Morning" },
  { time: "01:00 PM", period: "Afternoon" },
  { time: "02:30 PM", period: "Afternoon" },
  { time: "04:00 PM", period: "Afternoon" },
  { time: "05:30 PM", period: "Evening" },
  { time: "06:30 PM", period: "Evening" },
];

export default function BookingWizardModal({
  isOpen,
  onClose,
  business,
  services = [],
  employees = [],
  existingAppointments = [],
  customer,
  terminology,
  initialServiceId = null,
  onBookingSuccess,
}) {
  if (!isOpen) return null;

  const businessId = business?.id || business?.businessId || "default_business";
  const businessName = business?.name || business?.businessName || "BizManager Service";

  const initialName = customer?.name || customer?.displayName || "";
  const initialEmail = customer?.email || "";
  const initialPhone = customer?.phone || customer?.clientPhone || "";

  // Guaranteed fallback services and employees so no workspace is ever empty
  const effectiveServices = useMemo(() => {
    if (Array.isArray(services) && services.length > 0) return services;
    return getDefaultServicesForBusiness(businessId, business?.type || business?.businessType);
  }, [services, businessId, business]);

  const effectiveEmployees = useMemo(() => {
    if (Array.isArray(employees) && employees.length > 0) return employees;
    return getDefaultEmployeesForBusiness(businessId, business?.type || business?.businessType);
  }, [employees, businessId, business]);

  // Find initial service if provided
  const preselectedService = useMemo(() => {
    if (!initialServiceId) return null;
    if (typeof initialServiceId === "object") return initialServiceId;
    return (
      effectiveServices.find(
        (s) =>
          s.id === initialServiceId ||
          s.name?.toLowerCase() === String(initialServiceId).toLowerCase()
      ) || null
    );
  }, [initialServiceId, effectiveServices]);

  const [step, setStep] = useState(preselectedService ? 2 : 1);
  const [selectedService, setSelectedService] = useState(preselectedService || null);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // null = "Any Available"
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [clientNotes, setClientNotes] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Client contact details state
  const [contactName, setContactName] = useState(initialName);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState(initialPhone);

  // Inline custom service addition state
  const [showCustomServiceForm, setShowCustomServiceForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("500");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState("");
  const [error, setError] = useState("");
  const [paymentChoice, setPaymentChoice] = useState("counter"); // 'counter' | 'upi'
  const [showUpiCheckout, setShowUpiCheckout] = useState(false);

  // Sync state whenever modal opens or initialServiceId changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedService) {
        setSelectedService(preselectedService);
        setStep(2);
      } else if (initialServiceId && typeof initialServiceId === "string") {
        const matched = effectiveServices.find(
          (s) =>
            s.id === initialServiceId ||
            s.name?.toLowerCase() === initialServiceId.toLowerCase()
        );
        if (matched) {
          setSelectedService(matched);
          setStep(2);
        }
      } else {
        setStep(1);
        setSelectedService(null);
      }
      setSelectedEmployee(null);
      setClientNotes("");
      setError("");
      setShowCustomServiceForm(false);
      setContactName(customer?.name || customer?.displayName || "");
      setContactEmail(customer?.email || "");
      setContactPhone(customer?.phone || customer?.clientPhone || "");
    }
  }, [isOpen, initialServiceId, preselectedService, effectiveServices, customer]);

  const minDate = new Date().toISOString().split("T")[0];

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(["All"]);
    effectiveServices.forEach((s) => s.category && set.add(s.category));
    return Array.from(set);
  }, [effectiveServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return effectiveServices.filter((s) => {
      const matchCat = categoryFilter === "All" || s.category === categoryFilter;
      const matchSearch =
        !serviceSearch ||
        s.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description?.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [effectiveServices, categoryFilter, serviceSearch]);

  // Active providers / staff
  const activeEmployees = useMemo(() => {
    return effectiveEmployees.filter((e) => (e.status || "Active") === "Active");
  }, [effectiveEmployees]);

  // Check booked time slots for the chosen date & provider
  const bookedSlots = useMemo(() => {
    return existingAppointments
      .filter((a) => {
        const matchDate = a.date === selectedDate;
        const matchStatus = a.status !== "Cancelled";
        const matchStaff = !selectedEmployee || a.assignedEmployee === selectedEmployee.name;
        return matchDate && matchStatus && matchStaff;
      })
      .map((a) => a.time);
  }, [existingAppointments, selectedDate, selectedEmployee]);

  async function handleConfirmBooking() {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Please complete all booking selections.");
      return;
    }
    if (!businessId) {
      setError("Business workspace identifier missing. Please try again.");
      return;
    }

    const finalName = contactName.trim() || customer?.name || customer?.displayName || "Valued Client";
    const finalEmail = contactEmail.trim() || customer?.email || "";
    const finalPhone = contactPhone.trim() || customer?.phone || customer?.clientPhone || "";

    if (!finalName || finalName === "Valued Client") {
      setError("Please provide your full name for the booking record.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const price = Number(selectedService.price || 0);
      const generatedToken = `TK-${Math.floor(100 + Math.random() * 900)}`;

      const appointmentRecord = {
        clientName: finalName,
        customerName: finalName,
        clientEmail: finalEmail,
        customerEmail: finalEmail,
        customerId: customer?.uid || customer?.id || "",
        clientPhone: finalPhone,
        phone: finalPhone,
        service: selectedService.name,
        serviceId: selectedService.id || "",
        duration: selectedService.duration || "45 mins",
        price,
        amount: `₹${price.toLocaleString("en-IN")}`,
        date: selectedDate,
        time: selectedTime,
        assignedEmployee: selectedEmployee?.name || "Assigned Specialist",
        employeeId: selectedEmployee?.id || "",
        notes: clientNotes.trim() || "Booked online via Customer Portal",
        status: "Confirmed",
        paymentStatus: paymentChoice === "upi" ? "Paid (UPI)" : "Due at Counter",
        paymentMethod: paymentChoice === "upi" ? "UPI (Online)" : "Counter / Visit",
        provider: businessName,
        tokenNumber: generatedToken,
        checkInStatus: "Pending",
        department: selectedEmployee?.department || selectedEmployee?.specialty || selectedService.category || "General",
        appointmentType: "In-Clinic / Store Visit",
      };

      const created = await createAppointment(businessId, appointmentRecord);

      if (paymentChoice === "upi") {
        try {
          await createPayment(businessId, {
            appointmentId: created.id,
            customerName: finalName,
            customerEmail: finalEmail,
            amount: price,
            method: "UPI (GooglePay / PhonePe)",
            date: selectedDate,
            status: "Completed",
            transactionRef: `UPI-APPT-${generatedToken}`,
            notes: `Advance online UPI payment for booking #${generatedToken}`,
          });
        } catch (payErr) {
          console.warn("Could not record payment for appointment:", payErr);
        }
      }

      // Persist / update customer record in Firestore CRM collection
      try {
        await ensureCustomerRecord(businessId, {
          name: finalName,
          clientName: finalName,
          email: finalEmail,
          clientEmail: finalEmail,
          phone: finalPhone,
          clientPhone: finalPhone,
          date: selectedDate,
          price: price,
        });
      } catch (crmErr) {
        console.warn("Could not upsert customer record in CRM:", crmErr);
      }

      // Create confirmation notification
      await createNotification(businessId, {
        recipientEmail: finalEmail || customerEmail,
        recipientId: customer?.uid || "",
        title: "Appointment Confirmed",
        message: `Your booking for ${selectedService.name} on ${selectedDate} at ${selectedTime} is confirmed. Digital Queue Token: #${generatedToken}`,
        type: "appointment",
        entityId: created.id,
        metadata: {
          clientName: finalName,
          clientPhone: finalPhone,
          clientEmail: finalEmail,
          tokenNumber: generatedToken,
        },
      });

      setConfirmedToken(generatedToken);
      setSuccess(true);
      onBookingSuccess?.(created);
    } catch (err) {
      console.error("Booking submission error:", err);
      if (err?.code === "permission-denied" || err?.message?.toLowerCase().includes("permission")) {
        setError("Firebase Security Rule restriction: Please publish the updated firestore.rules in your Firebase Console Rules tab.");
      } else {
        setError(err.message || "Failed to schedule appointment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinishBooking() {
    setSuccess(false);
    setConfirmedToken("");
    onClose();
    setStep(1);
    setSelectedService(null);
    setSelectedEmployee(null);
    setClientNotes("");
    setPaymentChoice("counter");
    setShowUpiCheckout(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800/50 dark:text-indigo-300">
                Step {step} of 5
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {step === 1 && `Select ${terminology?.service || "Service"}`}
                {step === 2 && `Select ${terminology?.employee || "Specialist"}`}
                {step === 3 && "Select Preferred Date"}
                {step === 4 && "Select Available Time"}
                {step === 5 && "Review & Confirm"}
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              Book with {businessName}
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-400 h-1 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS SCREEN WITH DIGITAL QUEUE PASS */}
          {success ? (
            <div className="py-6 px-1 text-center animate-in fade-in zoom-in-95 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shadow-md shadow-emerald-500/20">
                <CheckCircle2 size={30} />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Booking Confirmed!
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Your appointment with <strong>{businessName}</strong> has been secured.
                </p>
              </div>

              {/* Digital Pass Ticket */}
              <div className="max-w-md mx-auto rounded-3xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 p-5 dark:border-indigo-800 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 shadow-sm text-left space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Digital Queue Token
                    </span>
                    <div className="font-mono text-2xl font-black tracking-wide text-indigo-700 dark:text-indigo-300">
                      #{confirmedToken}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      paymentChoice === "upi"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {paymentChoice === "upi" ? "PAID VIA UPI" : "DUE AT COUNTER"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Service</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {selectedService?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Schedule</span>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {selectedDate} • {selectedTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Specialist</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {selectedEmployee?.name || "Assigned Specialist"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Fee</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹{Number(selectedService?.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share via WhatsApp & Calendar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*Booking Confirmed at ${businessName}*\n\nService: ${selectedService?.name}\nToken: #${confirmedToken}\nDate: ${selectedDate} at ${selectedTime}\nSpecialist: ${selectedEmployee?.name || "Assigned Specialist"}\n\nSee you soon!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>Send to WhatsApp</span>
                </a>

                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    `${selectedService?.name || "Appointment"} - ${businessName}`
                  )}&dates=${selectedDate.replace(/-/g, "")}T090000Z/${selectedDate.replace(/-/g, "")}T100000Z&details=${encodeURIComponent(
                    `Token: #${confirmedToken}\nSpecialist: ${selectedEmployee?.name || "Assigned Specialist"}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                >
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Add to Google Calendar</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishBooking}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md transition active:scale-95"
                >
                  Done • View in Appointments
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: SERVICE SELECTION */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Search and Category Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder={`Search ${terminology?.services?.toLowerCase() || "services"}...`}
                        className="w-full rounded-xl border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {categories.length > 2 && (
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                              categoryFilter === cat
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredServices.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                      <p>
                        {serviceSearch
                          ? `No services match "${serviceSearch}".`
                          : "No pre-listed services found for this provider."}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {serviceSearch && (
                          <button
                            type="button"
                            onClick={() => setServiceSearch("")}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-700 dark:text-indigo-400"
                          >
                            Clear Search
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowCustomServiceForm(true)}
                          className="rounded-xl bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300 hover:bg-indigo-100"
                        >
                          + Specify Custom Consultation
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredServices.map((s) => {
                        const isSelected = selectedService?.id === s.id;
                        return (
                          <div
                            key={s.id || s.name}
                            onClick={() => setSelectedService(s)}
                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-950/30"
                                : "border-slate-200 hover:border-indigo-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {s.name}
                                </h4>
                                {s.category && (
                                  <span className="mt-0.5 inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {s.category}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                ₹{Number(s.price || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {s.description && (
                              <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                                {s.description}
                              </p>
                            )}

                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {s.duration || "45 mins"}
                              </span>
                              {isSelected && (
                                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                  Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Custom Service Option */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {!showCustomServiceForm ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomServiceForm(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 transition"
                      >
                        <Plus size={13} />
                        <span>Need a different procedure? Add custom consultation</span>
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 dark:bg-indigo-950/30 dark:border-indigo-800/50 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            Custom Service / Session
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCustomServiceForm(false)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Consultation name (e.g. Routine Checkup)"
                            className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              placeholder="Fee"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!customName.trim()}
                          onClick={() => {
                            const newCustom = {
                              id: `srv_custom_${Date.now()}`,
                              name: customName.trim(),
                              price: Number(customPrice) || 500,
                              category: "Custom Consultation",
                              duration: "30 mins",
                              description: "Custom consultation session scheduled by client.",
                            };
                            setSelectedService(newCustom);
                            setShowCustomServiceForm(false);
                          }}
                          className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-50"
                        >
                          Select & Proceed with This Service
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: PROVIDER / SPECIALIST SELECTION */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Choose your preferred {terminology?.employee?.toLowerCase() || "specialist"} or select first available:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* First Available Card */}
                    <div
                      onClick={() => setSelectedEmployee(null)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        selectedEmployee === null
                          ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-950/30"
                          : "border-slate-200 hover:border-indigo-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            First Available Specialist
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Fastest booking confirmation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Named Employees */}
                    {activeEmployees.map((emp) => {
                      const isSelected = selectedEmployee?.id === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-950/30"
                              : "border-slate-200 hover:border-indigo-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-200 text-xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                {emp.name}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {emp.role || emp.department || "Staff Specialist"}
                              </p>
                              {emp.degrees && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                                  {emp.degrees}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: DATE SELECTION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedDate(new Date().toISOString().split("T")[0])
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        selectedDate === new Date().toISOString().split("T")[0]
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() =>
                        setSelectedDate(
                          new Date(Date.now() + 86400000).toISOString().split("T")[0]
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        selectedDate ===
                        new Date(Date.now() + 86400000).toISOString().split("T")[0]
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pick Date on Calendar *
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="rounded-2xl bg-indigo-50/70 p-4 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300">
                    <p className="font-bold flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                      Selected:{" "}
                      {new Date(selectedDate).toLocaleDateString([], {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: TIME SLOT SELECTION */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Select an available slot for{" "}
                    <strong>
                      {new Date(selectedDate).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    :
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = bookedSlots.includes(slot.time);
                      const isSelected = selectedTime === slot.time;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`rounded-2xl p-3 text-xs font-bold border transition ${
                            isBooked
                              ? "opacity-35 bg-slate-100 border-slate-200 line-through cursor-not-allowed text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              : isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                              : "border-slate-200 hover:border-indigo-400 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div>{slot.time}</div>
                          <span className="text-[10px] font-normal opacity-70 block mt-0.5">
                            {isBooked ? "Booked" : slot.period}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & CONFIRM */}
              {step === 5 && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-emerald-50/40 p-5 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {terminology?.service || "Service"}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {selectedService?.name}
                        </h4>
                      </div>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        ₹{Number(selectedService?.price || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Time</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedDate} at {selectedTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">
                          {terminology?.employee || "Specialist"}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedEmployee?.name || "First Available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer / Client Contact Information Inputs */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Client Contact Details
                      </h5>
                      <span className="text-[10px] text-slate-400">Used for booking record & notifications</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Preference Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Payment Preference
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => {
                          setPaymentChoice("counter");
                          setShowUpiCheckout(false);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          paymentChoice === "counter"
                            ? "border-indigo-600 bg-indigo-50/60 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-200 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className={paymentChoice === "counter" ? "text-indigo-600" : "text-slate-400"} />
                          <span className="text-xs">Pay at Counter / Visit</span>
                        </div>
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Reserve without paying upfront; settle at checkout.
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setPaymentChoice("upi");
                          setShowUpiCheckout(true);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          paymentChoice === "upi"
                            ? "border-indigo-600 bg-indigo-50/60 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-200 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className={paymentChoice === "upi" ? "text-indigo-600" : "text-slate-400"} />
                          <span className="text-xs">⚡ Instant UPI QR Code</span>
                        </div>
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Scan with GPay/PhonePe/Paytm for verified queue ticket.
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentChoice === "upi" && showUpiCheckout && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                      <UpiQrCheckout
                        business={business}
                        amount={Number(selectedService?.price || 0)}
                        customerName={contactName || customerName}
                        customerEmail={contactEmail || customerEmail}
                        onPaymentSuccess={() => {
                          handleConfirmBooking();
                        }}
                        isSubmitting={submitting}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Notes / Requirements (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Any specific requests or preferences for your visit..."
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/50 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                    <span>Instant confirmation. You can reschedule or cancel anytime from your portal.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!success && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 transition"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 3 && !selectedDate) ||
                  (step === 4 && !selectedTime)
                }
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition disabled:opacity-40"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/30 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <CheckCircle2 size={15} className="text-emerald-300" />}
                <span>Confirm & Reserve</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
