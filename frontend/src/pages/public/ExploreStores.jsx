import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Filter,
  CheckCircle2,
  Stethoscope,
  Building2,
  Phone,
  ArrowLeft,
  X,
  Users,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAllBusinesses,
  getBusiness,
  CURATED_SHOWCASE_BUSINESSES,
} from "../../services/firebase/businesses";
import { getServices } from "../../services/firebase/services";
import { getEmployees } from "../../services/firebase/employees";

import SmartBookingSuggestions from "../../components/customer/SmartBookingSuggestions";
import BusinessStorefrontModal from "../../components/customer/BusinessStorefrontModal";
import BookingWizardModal from "../../components/customer/BookingWizardModal";

export default function ExploreStores({
  isEmbeddedInPortal = false,
  onNavigateToPortalTab,
}) {
  const { currentUser, userProfile, activeBusiness } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);
  const [filterTopRatedOnly, setFilterTopRatedOnly] = useState(false);

  // Modals
  const [selectedStorefront, setSelectedStorefront] = useState(null);
  const [storefrontModalOpen, setStorefrontModalOpen] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingBusiness, setBookingBusiness] = useState(null);
  const [bookingServices, setBookingServices] = useState([]);
  const [bookingEmployees, setBookingEmployees] = useState([]);
  const [preselectedServiceId, setPreselectedServiceId] = useState(null);

  // Load all businesses
  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true);
        const data = await getAllBusinesses();
        setBusinesses(data);
      } catch (err) {
        console.error("Error loading businesses directory:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  // Category Options
  const categories = [
    { id: "All", label: "All Businesses" },
    { id: "Clinics & Doctors", label: "🩺 Clinics & Doctors", matchType: ["Healthcare", "Clinics & Doctors"] },
    { id: "Dental Care", label: "🦷 Dental Care", matchType: ["Dental Care"] },
    { id: "Salons & Spas", label: "✨ Salons & Spas", matchType: ["Salon", "Salons & Spas"] },
    { id: "Fitness & Wellness", label: "🏋️ Fitness & Wellness", matchType: ["Fitness", "Fitness & Wellness"] },
    { id: "Consulting & Legal", label: "💼 Consulting & Advisory", matchType: ["Consulting", "Consulting & Legal"] },
  ];

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // 1. Search query match
      const query = searchQuery.toLowerCase().trim();
      const name = (b.name || b.businessName || "").toLowerCase();
      const tagline = (b.tagline || b.description || "").toLowerCase();
      const city = (b.city || b.address || "").toLowerCase();
      const category = (b.category || b.type || b.businessType || "").toLowerCase();

      // Check if query matches doctors' names or degrees
      const doctorsMatch = (b.doctors || []).some(
        (doc) =>
          doc.name?.toLowerCase().includes(query) ||
          doc.specialty?.toLowerCase().includes(query) ||
          doc.degrees?.toLowerCase().includes(query)
      );

      // Check if query matches services
      const servicesMatch = (b.services || []).some(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query)
      );

      const matchesSearch =
        !query ||
        name.includes(query) ||
        tagline.includes(query) ||
        city.includes(query) ||
        category.includes(query) ||
        doctorsMatch ||
        servicesMatch;

      // 2. Category match
      let matchesCategory = true;
      if (selectedCategory !== "All") {
        const catConfig = categories.find((c) => c.id === selectedCategory);
        if (catConfig?.matchType) {
          const bType = b.category || b.type || b.businessType || "";
          matchesCategory = catConfig.matchType.some((t) =>
            bType.toLowerCase().includes(t.toLowerCase())
          );
        }
      }

      // 3. City match
      let matchesCity = true;
      if (selectedCity !== "All") {
        matchesCity = (b.city || "").toLowerCase() === selectedCity.toLowerCase();
      }

      // 4. Quick filter toggles
      let matchesToday = true;
      if (filterTodayOnly) {
        matchesToday = (b.nextSlot || "").toLowerCase().includes("today");
      }

      let matchesTopRated = true;
      if (filterTopRatedOnly) {
        matchesTopRated = Number(b.rating || 0) >= 4.85;
      }

      return matchesSearch && matchesCategory && matchesCity && matchesToday && matchesTopRated;
    });
  }, [
    businesses,
    searchQuery,
    selectedCategory,
    selectedCity,
    filterTodayOnly,
    filterTopRatedOnly,
  ]);

  // Open Storefront Modal
  function handleOpenStorefront(business) {
    setSelectedStorefront(business);
    setStorefrontModalOpen(true);
  }

  // Handle direct booking from Storefront or Explore Card
  async function handleLaunchBooking(business, initialService = null, initialDoctor = null) {
    // If not logged in, redirect to login with return notice
    if (!currentUser && !isEmbeddedInPortal) {
      navigate("/login?redirect=/explore");
      return;
    }

    setBookingBusiness(business);
    setPreselectedServiceId(initialService?.id || null);

    // Load services & employees for this business
    try {
      const [srvList, empList] = await Promise.all([
        getServices(business.id),
        getEmployees(business.id),
      ]);
      setBookingServices(srvList.length > 0 ? srvList : business.services || []);
      setBookingEmployees(empList.length > 0 ? empList : business.doctors || []);
    } catch (err) {
      console.error("Error loading services for booking:", err);
      setBookingServices(business.services || []);
      setBookingEmployees(business.doctors || []);
    }

    setBookingModalOpen(true);
  }

  // Handle Smart Booking Suggestion Selection
  async function handleSelectSuggestion(suggestion) {
    const targetBusiness =
      businesses.find((b) => b.id === suggestion.businessId) ||
      CURATED_SHOWCASE_BUSINESSES.find((b) => b.id === suggestion.businessId);

    if (!targetBusiness) return;

    const targetService = (targetBusiness.services || []).find(
      (s) => s.id === suggestion.serviceId || s.name === suggestion.serviceName
    );

    const targetDoctor = (targetBusiness.doctors || []).find(
      (d) => d.name === suggestion.doctorName
    );

    handleLaunchBooking(targetBusiness, targetService, targetDoctor);
  }

  return (
    <div className={`w-full ${isEmbeddedInPortal ? "" : "min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans"}`}>
      {/* If standalone public page, show top header */}
      {!isEmbeddedInPortal && (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
                AI
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  BizManager
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block -mt-1">
                  Explore Directory
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-slate-600 dark:text-slate-300" />
                )}
              </button>

              {currentUser ? (
                <Link
                  to="/customer/portal"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-500 transition"
                >
                  My Customer Portal
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-500 transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 backdrop-blur-md border border-blue-400/30 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span>Verified Doctors, Clinics, Salons & Stores</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Explore Top Rated Clinics & Stores. Book Appointments in 1-Click.
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
              Find verified doctors on duty, check consultation fees, browse diagnostic packages, and reserve guaranteed appointment slots with digital token confirmation.
            </p>

            {/* Live Search Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-2 shadow-2xl dark:bg-slate-900 border border-white/20">
              <div className="relative flex-1 flex items-center">
                <Search size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctor, clinic name, dentist, skin, service..."
                  className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="rounded-xl bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                </select>

                <button
                  onClick={() => {}}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/30 hover:bg-blue-500 transition active:scale-95"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SMART BOOKING SUGGESTIONS COMPONENT                           */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <SmartBookingSuggestions onSelectSuggestion={handleSelectSuggestion} />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* EXPLORE DIRECTORY SECTION                                     */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-5">
          {/* Category Tabs & Quick Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Toggle Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterTodayOnly(!filterTodayOnly)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  filterTodayOnly
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                <Clock size={12} className={filterTodayOnly ? "text-emerald-600" : "text-slate-400"} />
                <span>⚡ Available Today</span>
              </button>

              <button
                onClick={() => setFilterTopRatedOnly(!filterTopRatedOnly)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  filterTopRatedOnly
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                <Star size={12} className={filterTopRatedOnly ? "fill-amber-500 text-amber-500" : "text-slate-400"} />
                <span>⭐ Top Rated (4.85+)</span>
              </button>
            </div>
          </div>

          {/* Directory Count Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredBusinesses.length}</strong> verified providers
            </span>
            {(searchQuery || selectedCategory !== "All" || filterTodayOnly || filterTopRatedOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedCity("All");
                  setFilterTodayOnly(false);
                  setFilterTopRatedOnly(false);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Business Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-4"
                >
                  <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                  <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                </div>
              ))}
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Building2 size={36} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No businesses found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No clinics or stores matched your current search filters. Try selecting "All Businesses" or clearing your query.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setFilterTodayOnly(false);
                  setFilterTopRatedOnly(false);
                }}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((b) => {
                const bName = b.name || b.businessName || "BizManager Service";
                const bType = b.category || b.type || b.businessType || "Business";
                const doctors = b.doctors || [];
                const services = b.services || [];
                const rating = b.rating || 4.9;
                const reviewCount = b.reviewCount || 34;

                return (
                  <div
                    key={b.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-400/80"
                  >
                    <div>
                      {/* Card Cover Gradient Header */}
                      <div className="relative h-28 w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 p-4 text-white flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md">
                            {bType}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            <ShieldCheck size={11} />
                            <span>Verified</span>
                          </span>
                        </div>

                        {/* Next slot pill */}
                        {b.nextSlot && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200">
                            <Clock size={12} className="text-emerald-300" />
                            <span>{b.nextSlot}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="p-5">
                        {/* Title & Rating */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {bName}
                          </h3>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 font-bold text-amber-500">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span>{rating}</span>
                          </span>
                          <span className="text-slate-400">({reviewCount} reviews)</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                            {b.city || "Mumbai"}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {b.tagline || b.description}
                        </p>

                        {/* Doctors / Specialists Snippet */}
                        {doctors.length > 0 && (
                          <div className="mt-3.5 rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Doctors on Duty ({doctors.length})
                            </span>
                            <div className="space-y-1.5">
                              {doctors.slice(0, 2).map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between text-xs">
                                  <div className="min-w-0 flex-1 truncate">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {doc.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block truncate">
                                      {doc.specialty}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
                                    ₹{doc.fee || 500}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Popular Services Chips */}
                        {services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {services.slice(0, 2).map((srv) => (
                              <span
                                key={srv.id}
                                className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 truncate max-w-[160px]"
                              >
                                {srv.name}
                              </span>
                            ))}
                            {services.length > 2 && (
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                                +{services.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenStorefront(b)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                      >
                        View Clinic
                      </button>

                      <button
                        onClick={() => handleLaunchBooking(b)}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition active:scale-95"
                      >
                        <Calendar size={13} className="text-emerald-300" />
                        <span>Book Slot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Storefront Full Detail Modal */}
      <BusinessStorefrontModal
        isOpen={storefrontModalOpen}
        onClose={() => setStorefrontModalOpen(false)}
        business={selectedStorefront}
        onBookService={(service, business) => handleLaunchBooking(business, service)}
        onBookDoctor={(doctor, business) => handleLaunchBooking(business, null, doctor)}
      />

      {/* Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        business={bookingBusiness}
        services={bookingServices}
        employees={bookingEmployees}
        customer={userProfile || currentUser}
        terminology={{
          bookAppointment: "Confirm Booking",
          service: "Treatment / Service",
          services: "Services",
          staff: "Doctor / Specialist",
        }}
        initialServiceId={preselectedServiceId}
        onBookingSuccess={() => {
          if (isEmbeddedInPortal && onNavigateToPortalTab) {
            onNavigateToPortalTab("appointments");
          }
        }}
      />
    </div>
  );
}
