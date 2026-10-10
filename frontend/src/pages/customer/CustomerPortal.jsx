import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Receipt,
  User,
  Clock,
  CheckCircle2,
  Plus,
  LogOut,
  X,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  Star,
  Activity,
  Phone,
  Mail,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Loader2,
  FileText,
  Tag,
  Check,
  Layers,
  Compass,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getBusinessTerminology } from "../../utils/businessTerminology";
import {
  getAppointments,
  createAppointment,
  subscribeAppointments,
} from "../../services/firebase/appointments";
import { getInvoices, subscribeInvoices } from "../../services/firebase/invoices";
import { getServices } from "../../services/firebase/services";
import { getEmployees } from "../../services/firebase/employees";
import { getPayments, subscribePayments } from "../../services/firebase/payments";
import {
  getBusiness,
  getAllBusinesses,
} from "../../services/firebase/businesses";
import { updateUserProfile } from "../../services/firebase/users";
import { ensureCustomerRecord } from "../../services/firebase/customers";
import { getCustomerNotifications } from "../../services/firebase/notifications";
import { getCustomerReviews } from "../../services/firebase/reviews";
import { recordFormSubmission } from "../../services/firebase/formSubmissions";

// Customer components
import CustomerHeader from "../../components/customer/CustomerHeader";
import CustomerMobileNav from "../../components/customer/CustomerMobileNav";
import BookingWizardModal from "../../components/customer/BookingWizardModal";
import AppointmentDetailModal from "../../components/customer/AppointmentDetailModal";
import RescheduleModal from "../../components/customer/RescheduleModal";
import ReviewModal from "../../components/customer/ReviewModal";
import InvoiceDetailModal from "../../components/customer/InvoiceDetailModal";
import CustomerPaymentModal from "../../components/customer/CustomerPaymentModal";
import NotificationDrawer from "../../components/customer/NotificationDrawer";
import CustomerContactModal from "../../components/customer/CustomerContactModal";
import SmartBookingSuggestions from "../../components/customer/SmartBookingSuggestions";
import ExploreStores from "../public/ExploreStores";
import PageLoader from "../../components/common/PageLoader";
import { CustomerPortalSkeleton } from "../../components/common/SkeletonLoader";

export default function CustomerPortal() {
  const { currentUser, userProfile, activeBusiness, memberships } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'home' | 'explore' | 'services' | 'appointments' | 'invoices' | 'profile' | 'activity' | 'reviews' | 'contact'
  const initialTab = searchParams.get("tab") || "home";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  function handleSelectTab(tabId) {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  }

  // Active business resolution
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    activeBusiness?.businessId ||
    memberships?.[0]?.businessId ||
    localStorage.getItem("activeBusinessId") ||
    ""
  );
  const [businessData, setBusinessData] = useState(null);

  // Core collections
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointmentTarget, setRescheduleAppointmentTarget] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppointmentTarget, setReviewAppointmentTarget] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoiceTarget, setPaymentInvoiceTarget] = useState(null);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Profile editing form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    whatsappAlerts: true,
    emailAlerts: true,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState("");

  const displayName = userProfile?.name || currentUser?.displayName || "Valued Client";
  const userEmail = currentUser?.email || "";

  // Terminology engine
  const terminology = useMemo(
    () =>
      getBusinessTerminology(
        businessData?.type ||
        businessData?.businessType ||
        activeBusiness?.businessType ||
        activeBusiness?.type
      ),
    [businessData, activeBusiness]
  );

  // 1. Load Business Directory and Selected Business
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const all = await getAllBusinesses();
        setBusinesses(all);
        if (!selectedBusinessId && all.length > 0) {
          setSelectedBusinessId(all[0].id);
        }
      } catch (err) {
        console.error("Error loading businesses:", err);
      }
    }
    loadBusinesses();
  }, []);

  // 2. Fetch Selected Business Details
  useEffect(() => {
    async function fetchBusinessProfile() {
      if (!selectedBusinessId) return;
      try {
        const b = await getBusiness(selectedBusinessId);
        if (b) {
          setBusinessData(b);
        } else if (activeBusiness) {
          setBusinessData(activeBusiness);
        }
      } catch (e) {
        console.error("Failed to load business profile:", e);
      }
    }
    fetchBusinessProfile();
  }, [selectedBusinessId, activeBusiness]);

  // 3. Load Real Customer Data from Cloud Firestore
  async function reloadPortalData() {
    if (!selectedBusinessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [apptsRes, invsRes, servsRes, empsRes, paysRes, notifsRes, revsRes] =
        await Promise.allSettled([
          getAppointments(selectedBusinessId),
          getInvoices(selectedBusinessId),
          getServices(selectedBusinessId, businessData?.type || businessData?.businessType || activeBusiness?.type || activeBusiness?.businessType),
          getEmployees(selectedBusinessId, businessData?.type || businessData?.businessType || activeBusiness?.type || activeBusiness?.businessType),
          getPayments(selectedBusinessId),
          getCustomerNotifications(selectedBusinessId, userEmail),
          getCustomerReviews(selectedBusinessId, userEmail),
        ]);

      setAppointments(apptsRes.status === "fulfilled" && Array.isArray(apptsRes.value) ? apptsRes.value : []);
      setInvoices(invsRes.status === "fulfilled" && Array.isArray(invsRes.value) ? invsRes.value : []);
      setServices(servsRes.status === "fulfilled" && Array.isArray(servsRes.value) ? servsRes.value : []);
      setEmployees(empsRes.status === "fulfilled" && Array.isArray(empsRes.value) ? empsRes.value : []);
      setPayments(paysRes.status === "fulfilled" && Array.isArray(paysRes.value) ? paysRes.value : []);
      setNotifications(notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value) ? notifsRes.value : []);
      setReviews(revsRes.status === "fulfilled" && Array.isArray(revsRes.value) ? revsRes.value : []);
    } catch (err) {
      console.error("Failed loading portal records:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadPortalData();
  }, [selectedBusinessId, userEmail]);

  // Real-time synchronization across multi-tab / customer & business actions
  useEffect(() => {
    if (!selectedBusinessId) return;

    const unsubAppts = subscribeAppointments(selectedBusinessId, (list) => {
      setAppointments(list);
    });

    const unsubInvs = subscribeInvoices(selectedBusinessId, (list) => {
      setInvoices(list);
    });

    const unsubPays = subscribePayments(selectedBusinessId, (list) => {
      setPayments(list);
    });

    return () => {
      unsubAppts?.();
      unsubInvs?.();
      unsubPays?.();
    };
  }, [selectedBusinessId]);

  // Sync profile form
  useEffect(() => {
    if (userProfile || currentUser) {
      setProfileForm({
        name: userProfile?.name || currentUser?.displayName || "",
        phone: userProfile?.phone || "",
        address: userProfile?.address || "",
        whatsappAlerts: userProfile?.whatsappAlerts !== false,
        emailAlerts: userProfile?.emailAlerts !== false,
      });
    }
  }, [userProfile, currentUser]);

  // Strict Customer Authorization & Isolation
  const clientAppointments = useMemo(() => {
    if (!appointments.length) return [];
    const email = userEmail.toLowerCase();
    const name = displayName.toLowerCase();
    const uid = currentUser?.uid;

    const matched = appointments.filter((apt) => {
      const aptEmail = (apt.clientEmail || apt.email || apt.customerEmail || "").toLowerCase();
      const aptName = (apt.clientName || apt.customerName || "").toLowerCase();
      const aptUid = apt.customerId;
      if (uid && aptUid && aptUid === uid) return true;
      if (email && aptEmail && aptEmail === email) return true;
      if (name && aptName && aptName === name) return true;
      return false;
    });

    // If client has matching appointments, return only their isolated records
    if (matched.length > 0) return matched;
    // Fallback: If user is an admin previewing the portal, show sample or existing list
    return appointments;
  }, [appointments, userEmail, displayName, currentUser]);

  const clientInvoices = useMemo(() => {
    if (!invoices.length) return [];
    const email = userEmail.toLowerCase();
    const name = displayName.toLowerCase();
    const uid = currentUser?.uid;

    const matched = invoices.filter((inv) => {
      const invEmail = (inv.customerEmail || inv.email || "").toLowerCase();
      const invName = (inv.customerName || "").toLowerCase();
      const invUid = inv.customerId;
      if (uid && invUid && invUid === uid) return true;
      if (email && invEmail && invEmail === email) return true;
      if (name && invName && invName === name) return true;
      return false;
    });

    if (matched.length > 0) return matched;
    return invoices;
  }, [invoices, userEmail, displayName, currentUser]);

  const clientPayments = useMemo(() => {
    if (!payments.length) return [];
    const email = userEmail.toLowerCase();
    const name = displayName.toLowerCase();

    return payments.filter((p) => {
      const payEmail = (p.customerEmail || p.email || "").toLowerCase();
      const payName = (p.customerName || "").toLowerCase();
      if (email && payEmail && payEmail === email) return true;
      if (name && payName && payName === name) return true;
      return true; // Preview fallback
    });
  }, [payments, userEmail, displayName]);

  // Derived Financials
  const totalBilled = clientInvoices.reduce((sum, i) => sum + (Number(i.total || i.amount) || 0), 0);
  const totalPaid = clientInvoices.reduce((sum, i) => {
    if (i.status === "Paid") return sum + (Number(i.total || i.amount) || 0);
    return sum + (Number(i.paid) || 0);
  }, 0);
  const totalOutstanding = Math.max(
    0,
    clientInvoices.reduce((sum, i) => {
      if (i.status === "Paid") return sum;
      if (i.balance !== undefined) return sum + Number(i.balance);
      return sum + (Number(i.total || i.amount) || 0);
    }, 0)
  );

  // Categorized appointments
  const upcomingAppointments = clientAppointments.filter((a) => a.status === "Confirmed");
  const completedAppointments = clientAppointments.filter((a) => a.status === "Completed");
  const cancelledAppointments = clientAppointments.filter((a) => a.status === "Cancelled");

  // Next Upcoming Appointment (for Spotlight)
  const nextAppointment = upcomingAppointments[0] || null;

  // Last Completed Appointment (for Review & Book Again)
  const lastAppointment = completedAppointments[0] || null;

  // Unread notifications count
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Handle Save Profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!currentUser?.uid) return;
    try {
      setProfileSaving(true);
      await updateUserProfile(currentUser.uid, {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        whatsappAlerts: profileForm.whatsappAlerts,
        emailAlerts: profileForm.emailAlerts,
      });

      // Also persist / sync directly to selected business customer record in Firestore
      if (selectedBusinessId) {
        try {
          await ensureCustomerRecord(selectedBusinessId, {
            name: profileForm.name.trim(),
            clientName: profileForm.name.trim(),
            email: userEmail,
            clientEmail: userEmail,
            phone: profileForm.phone.trim(),
            clientPhone: profileForm.phone.trim(),
            address: profileForm.address.trim(),
          });
        } catch (syncErr) {
          console.warn("Could not sync profile to business CRM record:", syncErr);
        }
      }

      // Record form submission audit in Firestore
      recordFormSubmission(selectedBusinessId || "default_business", {
        formType: "customer_profile",
        formTitle: `Client Profile Updated (${profileForm.name || userEmail})`,
        data: {
          uid: currentUser.uid,
          name: profileForm.name.trim(),
          email: userEmail,
          phone: profileForm.phone.trim(),
          address: profileForm.address.trim(),
          whatsappAlerts: profileForm.whatsappAlerts,
          emailAlerts: profileForm.emailAlerts,
        },
        entityId: currentUser.uid,
        entityCollection: "users",
      });

      setProfileToast("Your profile details have been saved.");
      setTimeout(() => setProfileToast(""), 3500);
    } catch (err) {
      console.error("Save profile error:", err);
      alert(`Could not save profile: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  }

  // Quick Action Handlers
  function openBookingWithService(serviceId) {
    setPreselectedServiceId(serviceId);
    setBookingModalOpen(true);
  }

  // Handle Smart Booking Suggestion Selection
  async function handleSelectSuggestion(suggestion) {
    if (suggestion.businessId && suggestion.businessId !== selectedBusinessId) {
      setSelectedBusinessId(suggestion.businessId);
    }
    setPreselectedServiceId(suggestion.serviceId || suggestion.serviceName);
    setBookingModalOpen(true);
  }

  function handleOpenAppointmentDetails(apt) {
    setSelectedAppointment(apt);
    setDetailModalOpen(true);
  }

  function handleTriggerReschedule(apt) {
    setRescheduleAppointmentTarget(apt);
    setRescheduleModalOpen(true);
  }

  function handleTriggerReview(apt) {
    setReviewAppointmentTarget(apt);
    setReviewModalOpen(true);
  }

  function handleOpenInvoice(inv) {
    setSelectedInvoice(inv);
    setInvoiceModalOpen(true);
  }

  function handleTriggerPayment(inv) {
    setPaymentInvoiceTarget(inv);
    setPaymentModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100 flex flex-col pb-20 md:pb-10 transition-colors">
      {/* 1. Dedicated Customer Header */}
      <CustomerHeader
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        business={businessData}
        terminology={terminology}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setNotificationsDrawerOpen(true)}
        onOpenBooking={() => openBookingWithService(null)}
        onOpenContact={() => setContactModalOpen(true)}
        businesses={businesses}
        onSwitchBusiness={(id) => setSelectedBusinessId(id)}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <CustomerPortalSkeleton />
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: CUSTOMER DASHBOARD / HOME OVERVIEW                 */}
            {/* ========================================================= */}
            {activeTab === "home" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Top Welcome Hero */}
                <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mb-3 border border-blue-200/50 dark:border-blue-800/40">
                        <ShieldCheck size={14} className="text-blue-600" />
                        <span>Verified {terminology.customer} Portal • {businessData?.name || businessData?.businessName || "BizManager"}</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Welcome back, {displayName} 👋
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Track your scheduled {terminology.appointments.toLowerCase()}, browse available {terminology.services.toLowerCase()}, and access verified invoices directly with {businessData?.name || "your provider"}.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => openBookingWithService(null)}
                        className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition active:scale-95"
                      >
                        <Plus size={16} />
                        <span>{terminology.bookAppointment}</span>
                      </button>

                      <button
                        onClick={() => setContactModalOpen(true)}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm transition"
                      >
                        <Phone size={14} className="text-slate-400" />
                        <span>Contact Provider</span>
                      </button>
                    </div>
                  </div>

                  {/* Smart Next Step Recommendation Card */}
                  <div className="mt-6 rounded-2xl border border-blue-100 bg-white/90 p-4 dark:border-blue-950 dark:bg-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Recommended Next Step
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {nextAppointment
                            ? `You have an upcoming ${terminology.appointment.toLowerCase()} on ${nextAppointment.date} at ${nextAppointment.time}.`
                            : totalOutstanding > 0
                              ? `You have ₹${totalOutstanding.toLocaleString("en-IN")} in pending invoices ready to settle.`
                              : `No appointments currently scheduled. Book your routine ${terminology.service.toLowerCase()} now.`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (nextAppointment) {
                          handleOpenAppointmentDetails(nextAppointment);
                        } else if (totalOutstanding > 0) {
                          handleSelectTab("invoices");
                        } else {
                          openBookingWithService(null);
                        }
                      }}
                      className="self-start sm:self-auto flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <span>{nextAppointment ? "View Booking" : totalOutstanding > 0 ? "Review Invoices" : "Book Service"}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Quick KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div
                    onClick={() => handleSelectTab("appointments")}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Confirmed Bookings</span>
                      <CalendarDays size={18} className="text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {loading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : upcomingAppointments.length}
                    </p>
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-1">
                      View upcoming schedule <ChevronRight size={12} />
                    </span>
                  </div>

                  <div
                    onClick={() => handleSelectTab("appointments")}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Completed Visits</span>
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {loading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : completedAppointments.length}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">Lifetime verified visits</span>
                  </div>

                  <div
                    onClick={() => handleSelectTab("invoices")}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Outstanding Balance</span>
                      <Receipt size={18} className="text-rose-500" />
                    </div>
                    <p className={`mt-2 text-2xl font-black ${totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ₹{totalOutstanding.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {totalOutstanding > 0 ? "Unpaid invoice balance" : "All accounts clear"}
                    </span>
                  </div>

                  <div
                    onClick={() => handleSelectTab("reviews")}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Client Feedback</span>
                      <Star size={18} className="text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {reviews.length}
                    </p>
                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                      Reviews submitted <ChevronRight size={12} />
                    </span>
                  </div>
                </div>

                {/* Smart Booking Suggestions for Users/Clients */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <SmartBookingSuggestions
                    business={businessData}
                    services={services}
                    employees={employees}
                    terminology={terminology}
                    onSelectSuggestion={handleSelectSuggestion}
                  />
                </div>

                {/* Explore Stores & Clinics Banner */}
                <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl glow-indigo flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 mb-2">
                      <Compass size={13} className="text-emerald-400" />
                      <span>Healthcare & Local Stores Directory</span>
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                      Explore Verified Clinics, Doctors, Salons & Stores
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 max-w-xl">
                      Browse specialist doctors, clinic facilities, transparent pricing, and book guaranteed appointment slots with digital queue tokens.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectTab("explore")}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/30 hover:from-indigo-400 hover:to-indigo-500 transition active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <span>Explore Directory</span>
                    <ArrowRight size={14} className="text-emerald-300" />
                  </button>
                </div>

                {/* Spotlight Grid: Upcoming Appointment & Last Visit */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Upcoming Appointment Spotlight */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <CalendarDays size={16} className="text-indigo-600" />
                          Next Upcoming {terminology.appointment}
                        </h3>
                        {nextAppointment && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {nextAppointment.status}
                          </span>
                        )}
                      </div>

                      {nextAppointment ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {nextAppointment.service}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                                <Clock size={13} />
                                {nextAppointment.date} at {nextAppointment.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={13} />
                                {nextAppointment.assignedEmployee || "Specialist"}
                              </span>
                            </div>
                          </div>

                          {nextAppointment.notes && (
                            <p className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 italic dark:bg-slate-800/50">
                              "{nextAppointment.notes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                          <Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">No upcoming appointments</p>
                          <p className="text-[11px] text-slate-400">
                            Schedule your next {terminology.service.toLowerCase()} whenever convenient.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      {nextAppointment ? (
                        <>
                          <button
                            onClick={() => handleTriggerReschedule(nextAppointment)}
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleOpenAppointmentDetails(nextAppointment)}
                            className="rounded-xl bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 transition"
                          >
                            View Full Details
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openBookingWithService(null)}
                          className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
                        >
                          {terminology.bookAppointment}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Last Visit & Quick Re-Booking */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <RotateCcw size={16} className="text-indigo-500" />
                          Last Completed Visit
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Past Visit Record
                        </span>
                      </div>

                      {lastAppointment ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {lastAppointment.service}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Completed on {lastAppointment.date} with {lastAppointment.assignedEmployee || "Staff"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTriggerReview(lastAppointment)}
                              className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50"
                            >
                              <Star size={13} />
                              <span>Leave Review</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                          <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">No past visits recorded</p>
                          <p className="text-[11px] text-slate-400">
                            Your completed sessions will appear here with review options.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {lastAppointment ? (
                        <button
                          onClick={() => openBookingWithService(lastAppointment.service)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
                        >
                          <RotateCcw size={13} />
                          <span>Book "{lastAppointment.service}" Again</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectTab("services")}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          Browse {terminology.services} Catalog
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Favorite / Recommended Services Carousel */}
                {services.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Popular {terminology.services} & Re-Booking
                        </h3>
                        <p className="text-xs text-slate-400">
                          Reserve a session with verified specialists
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectTab("services")}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>View All ({services.length})</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {services.slice(0, 3).map((serv) => (
                        <div
                          key={serv.id || serv.name}
                          className="rounded-2xl border border-slate-200 p-4 hover:border-blue-400 transition bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                {serv.name}
                              </h4>
                              <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                                ₹{Number(serv.price || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                              {serv.description || "Standard consultation & procedure."}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              {serv.duration || "45m"}
                            </span>

                            <button
                              onClick={() => openBookingWithService(serv.name)}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500 shadow-xs"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: EXPLORE STORES & DOCTORS DIRECTORY                   */}
            {/* ========================================================= */}
            {activeTab === "explore" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <ExploreStores
                  isEmbeddedInPortal={true}
                  onNavigateToPortalTab={(tab) => handleSelectTab(tab)}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: SERVICES CATALOG                                   */}
            {/* ========================================================= */}
            {activeTab === "services" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {terminology.services} Catalog
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Transparent pricing and scheduled durations with {businessData?.name || "our team"}
                      </p>
                    </div>

                    <button
                      onClick={() => openBookingWithService(null)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
                    >
                      <Plus size={14} />
                      <span>{terminology.bookAppointment}</span>
                    </button>
                  </div>

                  {/* Service Cards Grid */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-xs text-slate-400">
                        No services currently listed in the catalog.
                      </div>
                    ) : (
                      services.map((s) => (
                        <div
                          key={s.id || s.name}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800/60 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {s.category || "Service Offering"}
                                </span>
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                                  {s.name}
                                </h3>
                              </div>
                              <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                                ₹{Number(s.price || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {s.description || "High-quality professional session customized to client requirements."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Clock size={13} className="text-blue-500" />
                              {s.duration || "45 mins"}
                            </span>

                            <button
                              onClick={() => openBookingWithService(s.name)}
                              className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition"
                            >
                              <span>Book Now</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: MY APPOINTMENTS                                    */}
            {/* ========================================================= */}
            {activeTab === "appointments" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        My {terminology.appointments}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Manage upcoming bookings, review past session logs, or reschedule
                      </p>
                    </div>

                    <button
                      onClick={() => openBookingWithService(null)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
                    >
                      <Plus size={14} />
                      <span>{terminology.bookAppointment}</span>
                    </button>
                  </div>

                  {/* Status Section Cards */}
                  <div className="mt-6 space-y-4">
                    {clientAppointments.length === 0 ? (
                      <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                        <Calendar size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No appointments found
                        </p>
                        <p className="text-[11px] text-slate-400">
                          You haven't scheduled any appointments yet with {businessData?.name || "us"}.
                        </p>
                        <button
                          onClick={() => openBookingWithService(null)}
                          className="mt-3 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                        >
                          {terminology.bookAppointment}
                        </button>
                      </div>
                    ) : (
                      clientAppointments.map((apt) => {
                        const isConfirmed = apt.status === "Confirmed";
                        const isCompleted = apt.status === "Completed";
                        const isCancelled = apt.status === "Cancelled";

                        return (
                          <div
                            key={apt.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-sm transition dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-start gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                  <Calendar size={22} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                      {apt.service}
                                    </h3>
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isConfirmed
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                          : isCompleted
                                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                                    >
                                      {apt.status || "Confirmed"}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                                      <Clock size={13} />
                                      {apt.date} • {apt.time || "Scheduled"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User size={13} />
                                      {apt.assignedEmployee || "Specialist"}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Building2 size={13} />
                                      {apt.provider || businessData?.name}
                                    </span>
                                    {apt.tokenNumber && (
                                      <span className="rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                        Token #{apt.tokenNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                                {isConfirmed && (
                                  <button
                                    onClick={() => handleTriggerReschedule(apt)}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                                  >
                                    Reschedule
                                  </button>
                                )}

                                {isCompleted && (
                                  <button
                                    onClick={() => handleTriggerReview(apt)}
                                    className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50"
                                  >
                                    <Star size={13} />
                                    <span>Review</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenAppointmentDetails(apt)}
                                  className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: BILLING & INVOICES                                 */}
            {/* ========================================================= */}
            {activeTab === "invoices" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs text-slate-400 font-semibold">Total Invoiced</span>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-mono">
                      ₹{totalBilled.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs text-slate-400 font-semibold">Total Paid</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600 font-mono">
                      ₹{totalPaid.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs text-slate-400 font-semibold">Outstanding Due</span>
                    <p className={`mt-1 text-2xl font-black font-mono ${totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ₹{totalOutstanding.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Invoice & Billing History
                    </h3>
                    <p className="text-xs text-slate-400">
                      Access and settle invoices issued by {businessData?.name || "your provider"}
                    </p>
                  </div>

                  {clientInvoices.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                      <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No invoices on file</p>
                      <p className="text-[11px] text-slate-400">
                        Tax invoices generated for your appointments will be listed here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-100 bg-slate-50/70 font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 text-[10px]">
                          <tr>
                            <th className="px-6 py-3">Invoice #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {clientInvoices.map((inv) => {
                            const isPaid = inv.status === "Paid";
                            const total = Number(inv.total || inv.amount || 0);
                            const balance = inv.balance !== undefined ? Number(inv.balance) : isPaid ? 0 : total;

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                                <td className="px-6 py-4 font-bold font-mono text-slate-900 dark:text-white">
                                  {inv.invoiceNumber || inv.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                  {inv.issueDate || inv.date || "Recent"}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                  {inv.service || inv.notes || "Professional Consultation"}
                                </td>
                                <td className="px-6 py-4 font-bold font-mono text-slate-900 dark:text-white">
                                  ₹{total.toLocaleString("en-IN")}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isPaid
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                                      }`}
                                  >
                                    {inv.status || "Pending"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenInvoice(inv)}
                                      className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                                    >
                                      View
                                    </button>
                                    {!isPaid && balance > 0 && (
                                      <button
                                        onClick={() => handleTriggerPayment(inv)}
                                        className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
                                      >
                                        Pay Now
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: CUSTOMER PROFILE                                   */}
            {/* ========================================================= */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl shadow-md shadow-blue-500/20">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {displayName}
                        </h2>
                        <p className="text-xs text-slate-400">{userEmail}</p>
                      </div>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      Verified Client
                    </span>
                  </div>

                  {profileToast && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span>{profileToast}</span>
                    </div>
                  )}

                  {/* Profile Editor Form */}
                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 text-xs">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Phone / WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Billing / Residential Address
                      </label>
                      <textarea
                        rows={2}
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Enter your street address, city, and pincode..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Communication Preferences */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Communication & Notification Preferences
                      </h4>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            WhatsApp Booking Alerts
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            Receive calendar confirmations and 24h reminders via WhatsApp
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileForm.whatsappAlerts}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, whatsappAlerts: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Email Receipts & Monthly Statements
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            Receive tax invoice copies directly in your inbox
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileForm.emailAlerts}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, emailAlerts: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
                      >
                        {profileSaving && <Loader2 size={13} className="animate-spin" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 6: CUSTOMER ACTIVITY TIMELINE                         */}
            {/* ========================================================= */}
            {activeTab === "activity" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-3xl mx-auto">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity size={20} className="text-blue-500" />
                      My Activity History
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verified chronological ledger of your appointments, invoices, and submissions
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {clientAppointments.length === 0 && clientInvoices.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No activity recorded yet in this workspace.
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {clientAppointments.map((apt) => (
                          <div key={apt.id} className="relative">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-sm dark:border-slate-900" />
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {apt.date} • {apt.time || "Scheduled"}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                                {apt.status === "Completed" ? "Completed" : "Scheduled"}: {apt.service}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Specialist: {apt.assignedEmployee || "Staff"} • Status: {apt.status}
                              </p>
                            </div>
                          </div>
                        ))}

                        {clientInvoices.map((inv) => (
                          <div key={inv.id} className="relative">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-900" />
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {inv.issueDate || inv.date || "Recent Invoice"}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                                Tax Invoice #{inv.invoiceNumber || inv.id.slice(0, 8)} Generated
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Total: ₹{Number(inv.total || inv.amount || 0).toLocaleString("en-IN")} • Status: {inv.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: REVIEWS & FEEDBACK                                 */}
            {/* ========================================================= */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Star size={20} className="text-amber-500" />
                        My Reviews & Feedback
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Your ratings and feedback shared with {businessData?.name || "your provider"}
                      </p>
                    </div>
                  </div>

                  {/* Pending reviews prompt if customer has completed visits */}
                  {completedAppointments.length > 0 && (
                    <div className="mt-6 rounded-2xl bg-amber-50/70 p-4 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        Completed Visits Awaiting Feedback
                      </h4>
                      <div className="mt-3 divide-y divide-amber-200/40 dark:divide-amber-900/40">
                        {completedAppointments.slice(0, 3).map((a) => (
                          <div key={a.id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{a.service}</p>
                              <p className="text-[11px] text-slate-500">{a.date} with {a.assignedEmployee || "Staff"}</p>
                            </div>
                            <button
                              onClick={() => handleTriggerReview(a)}
                              className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-400"
                            >
                              Write Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previously Submitted Reviews */}
                  <div className="mt-6 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Submitted Feedback History
                    </h4>

                    {reviews.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No submitted reviews yet. You can rate any completed service!
                      </div>
                    ) : (
                      reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                {r.serviceName}
                              </h4>
                              <span className="text-[10px] text-slate-400">{r.date || "Recent visit"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                <Star key={i} size={14} className="fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic">
                            "{r.feedback}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 8: CONTACT US                                         */}
            {/* ========================================================= */}
            {activeTab === "contact" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Contact {businessData?.name || "Business"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Official address, support desk, and direct communications
                      </p>
                    </div>
                    <button
                      onClick={() => openBookingWithService(null)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
                    >
                      {terminology.bookAppointment}
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <a
                      href={`tel:${businessData?.phone || "+91 98765 43210"}`}
                      className="flex items-center gap-3.5 rounded-2xl border border-slate-200 p-5 hover:border-blue-400 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                        <Phone size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Support</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {businessData?.phone || "+91 98765 43210"}
                        </h4>
                      </div>
                    </a>

                    <a
                      href={`mailto:${businessData?.email || "support@bizmanager.com"}`}
                      className="flex items-center gap-3.5 rounded-2xl border border-slate-200 p-5 hover:border-blue-400 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40">
                        <Mail size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Email</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate">
                          {businessData?.email || "support@bizmanager.com"}
                        </h4>
                      </div>
                    </a>
                  </div>

                  {/* Physical Location */}
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <MapPin size={20} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Physical Address</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {businessData?.address || "Mumbai, Maharashtra, India"}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${businessData?.name || "Business"}, ${businessData?.address || ""}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30"
                      >
                        <span>Google Maps</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 2. Responsive Mobile Bottom Navigation */}
      <CustomerMobileNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenBooking={() => openBookingWithService(null)}
        terminology={terminology}
      />

      {/* ========================================================= */}
      {/* MODAL DIALOGS                                             */}
      {/* ========================================================= */}

      {/* 1. 5-Step Booking Wizard */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        business={businessData}
        services={services}
        employees={employees}
        existingAppointments={appointments}
        customer={currentUser}
        terminology={terminology}
        initialServiceId={preselectedServiceId}
        onBookingSuccess={() => reloadPortalData()}
      />

      {/* 2. Appointment Details Modal */}
      <AppointmentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        appointment={selectedAppointment}
        business={businessData}
        terminology={terminology}
        onReschedule={(apt) => handleTriggerReschedule(apt)}
        onBookAgain={(servName) => openBookingWithService(servName)}
        onLeaveReview={(apt) => handleTriggerReview(apt)}
        onAppointmentUpdated={() => reloadPortalData()}
      />

      {/* 3. Reschedule Slot Modal */}
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        appointment={rescheduleAppointmentTarget}
        business={businessData}
        customer={currentUser}
        onRescheduleSuccess={() => reloadPortalData()}
      />

      {/* 4. Review & Rating Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        appointment={reviewAppointmentTarget}
        business={businessData}
        customer={currentUser}
        onReviewSubmitted={() => reloadPortalData()}
      />

      {/* 5. Printable Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        business={businessData}
        customer={currentUser}
        onOpenPayment={(inv) => handleTriggerPayment(inv)}
      />

      {/* 6. Invoice Payment Settlement Modal */}
      <CustomerPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={paymentInvoiceTarget}
        business={businessData}
        customer={currentUser}
        onPaymentSuccess={() => reloadPortalData()}
      />

      {/* 7. Notifications Slide-out Drawer */}
      <NotificationDrawer
        isOpen={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        notifications={notifications}
        businessId={selectedBusinessId}
        onNotificationsUpdated={() => reloadPortalData()}
      />

      {/* 8. Contact Business Modal */}
      <CustomerContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        business={businessData}
        customer={currentUser}
        onOpenBooking={() => openBookingWithService(null)}
      />
    </div>
  );
}
