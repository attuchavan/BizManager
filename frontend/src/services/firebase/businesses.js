import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  limit,
} from "firebase/firestore";

import { db } from "../../config/firebase";

export async function createBusiness({
  ownerId,
  businessName,
  businessType,
}) {
  const batch = writeBatch(db);

  // --------------------------------
  // Create Business
  // --------------------------------

  const businessRef = doc(collection(db, "businesses"));

  const businessId = businessRef.id;

  batch.set(businessRef, {
    name: businessName,
    type: businessType,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // --------------------------------
  // Create Business Membership
  // --------------------------------

  const businessMemberRef = doc(
    db,
    "businesses",
    businessId,
    "members",
    ownerId
  );

  batch.set(businessMemberRef, {
    userId: ownerId,
    role: "OWNER",
    status: "active",
    joinedAt: serverTimestamp(),
  });

  // --------------------------------
  // Create User Membership Index
  // --------------------------------

  const userMembershipRef = doc(
    db,
    "users",
    ownerId,
    "memberships",
    businessId
  );

  batch.set(userMembershipRef, {
    businessId,
    businessName,
    role: "OWNER",
    status: "active",
    joinedAt: serverTimestamp(),
  });

  // --------------------------------
  // Save Everything Together
  // --------------------------------

  await batch.commit();

  return {
    businessId,
  };
}

// --------------------------------
// Curated Showcase Businesses (Rich Clinics, Doctors & Stores)
// --------------------------------
export const CURATED_SHOWCASE_BUSINESSES = [
  {
    id: "biz-clinic-apex",
    name: "Apex Multi-Speciality Clinic & Diagnostic Center",
    businessName: "Apex Multi-Speciality Clinic & Diagnostic Center",
    type: "Healthcare",
    businessType: "Healthcare",
    category: "Clinics & Doctors",
    tagline: "NABH Accredited Multi-Speciality Outpatient & Diagnostics Hub",
    description: "Premier outpatient healthcare center with senior consultant physicians, dermatologists, cardiologists, and certified diagnostic lab testing.",
    rating: 4.9,
    reviewCount: 168,
    verified: true,
    address: "Suite 402, Medical Enclave, Link Road, Andheri West, Mumbai",
    city: "Mumbai",
    phone: "+91 98201 12345",
    email: "appointments@apexclinic.in",
    workingHours: "Mon - Sat: 08:30 AM - 08:30 PM | Sun: 09:00 AM - 01:00 PM",
    nextSlot: "Today at 04:30 PM",
    consultationFeeStarting: 600,
    amenities: [
      "In-House NABL Diagnostic Lab",
      "Digital X-Ray & ECG",
      "Digital Token & Live Waiting Queue",
      "Wheelchair Accessible",
      "UPI & Insurance Claim Desk",
      "Air Conditioned Waiting Lounge",
    ],
    doctors: [
      {
        id: "doc-rajesh-sharma",
        name: "Dr. Rajesh Sharma",
        title: "Senior Consultant Physician & Diabetologist",
        degrees: "MBBS, MD (Internal Medicine - AIIMS), FICP",
        specialty: "General Medicine & Diabetology",
        experience: "16+ Years Experience",
        fee: 600,
        nextSlot: "Today, 04:30 PM",
        availableSlots: ["04:30 PM", "05:15 PM", "06:00 PM", "07:30 PM"],
        avatarBg: "bg-blue-600",
        rating: 4.9,
        reviews: 94,
        status: "Active",
      },
      {
        id: "doc-ananya-sen",
        name: "Dr. Ananya Sen",
        title: "Consultant Dermatologist & Aesthetic Specialist",
        degrees: "MBBS, MD (Dermatology & Venereology) - Gold Medalist",
        specialty: "Dermatology & Skin Aesthetics",
        experience: "11+ Years Experience",
        fee: 800,
        nextSlot: "Tomorrow, 11:00 AM",
        availableSlots: ["11:00 AM", "12:15 PM", "03:30 PM", "05:00 PM"],
        avatarBg: "bg-rose-600",
        rating: 4.95,
        reviews: 78,
        status: "Active",
      },
      {
        id: "doc-vivek-kulkarni",
        name: "Dr. Vivek Kulkarni",
        title: "Senior Orthopedic & Spine Consultant",
        degrees: "MBBS, MS (Orthopedics), Fellowship in Joint Replacement",
        specialty: "Orthopedics & Joint Care",
        experience: "14+ Years Experience",
        fee: 900,
        nextSlot: "Tomorrow, 02:00 PM",
        availableSlots: ["02:00 PM", "03:30 PM", "04:45 PM"],
        avatarBg: "bg-emerald-600",
        rating: 4.85,
        reviews: 52,
        status: "Active",
      },
    ],
    services: [
      {
        id: "srv-gen-physician",
        name: "General Physician Consultation",
        category: "Consultations",
        price: 600,
        duration: "30 mins",
        description: "Comprehensive physical diagnosis, prescription, fever/infection evaluation, and blood pressure monitoring.",
        popular: true,
      },
      {
        id: "srv-exec-health-checkup",
        name: "Executive Full-Body Health Checkup & Blood Panel",
        category: "Diagnostics & Labs",
        price: 1999,
        duration: "45 mins",
        description: "64 vital parameters including Complete Blood Count (CBC), Lipid Profile, Liver & Kidney Function Tests, HbA1c, and ECG.",
        popular: true,
        badge: "Most Comprehensive",
      },
      {
        id: "srv-derma-consult",
        name: "Dermatology & Skin Care Consultation",
        category: "Consultations",
        price: 800,
        duration: "30 mins",
        description: "Clinical evaluation for acne, pigmentation, eczema, hair loss, and customized skin treatment regime.",
      },
      {
        id: "srv-ortho-consult",
        name: "Orthopedic & Joint Pain Assessment",
        category: "Consultations",
        price: 900,
        duration: "30 mins",
        description: "Clinical assessment of knee, shoulder, spine, or chronic arthritis pain with range of motion testing.",
      },
      {
        id: "srv-digital-xray",
        name: "Digital Chest / Joint X-Ray",
        category: "Diagnostics & Labs",
        price: 750,
        duration: "20 mins",
        description: "High-resolution digital radiography report reviewed by on-duty radiologist within 30 minutes.",
      },
    ],
  },
  {
    id: "biz-dental-metro",
    name: "Metro Dental Clinic & Implant Center",
    businessName: "Metro Dental Clinic & Implant Center",
    type: "Healthcare",
    businessType: "Healthcare",
    category: "Dental Care",
    tagline: "Painless Laser Dentistry, Orthodontics & Dental Implants",
    description: "Modern multispeciality dental practice featuring low-radiation digital OPG, laser dentistry, clear aligners, and painless single-sitting root canals.",
    rating: 4.88,
    reviewCount: 124,
    verified: true,
    address: "2nd Floor, Harmony Plaza, MG Road, Pune",
    city: "Pune",
    phone: "+91 97654 44321",
    email: "care@metrodental.com",
    workingHours: "Mon - Sat: 09:30 AM - 08:00 PM | Sun: Closed",
    nextSlot: "Today at 05:30 PM",
    consultationFeeStarting: 500,
    amenities: [
      "Sterilized German Autoclave Units",
      "Intra-Oral 3D Camera Scan",
      "Instant Digital X-Ray",
      "Kids Play Friendly Operatory",
      "Zero Pain Laser Setup",
    ],
    doctors: [
      {
        id: "doc-priya-patel",
        name: "Dr. Priya Patel",
        title: "Chief Orthodontist & Dental Surgeon",
        degrees: "BDS, MDS (Orthodontics & Dentofacial Orthopedics)",
        specialty: "Orthodontics & Aligners",
        experience: "10+ Years Experience",
        fee: 500,
        nextSlot: "Today, 05:30 PM",
        availableSlots: ["05:30 PM", "06:15 PM", "07:00 PM"],
        avatarBg: "bg-teal-600",
        rating: 4.9,
        reviews: 80,
        status: "Active",
      },
      {
        id: "doc-sameer-merchant",
        name: "Dr. Sameer Merchant",
        title: "Senior Implantologist & Prosthodontist",
        degrees: "BDS, Fellow of International Congress of Oral Implantologists (ICOI)",
        specialty: "Dental Implants & Smile Design",
        experience: "13+ Years Experience",
        fee: 650,
        nextSlot: "Tomorrow, 10:30 AM",
        availableSlots: ["10:30 AM", "11:30 AM", "04:00 PM"],
        avatarBg: "bg-indigo-600",
        rating: 4.85,
        reviews: 44,
        status: "Active",
      },
    ],
    services: [
      {
        id: "srv-dental-checkup",
        name: "Comprehensive Dental Consultation & Digital X-Ray",
        category: "Consultations",
        price: 500,
        duration: "30 mins",
        description: "Full mouth intraoral inspection, caries detection, bite check, and digital intra-oral X-ray.",
        popular: true,
      },
      {
        id: "srv-teeth-cleaning",
        name: "Ultrasonic Teeth Scaling & Polishing",
        category: "Preventative",
        price: 1200,
        duration: "45 mins",
        description: "Removal of calculus, tartar, and coffee/tea stains with gentle ultrasonic scaler and fluoride polish.",
        popular: true,
      },
      {
        id: "srv-laser-whitening",
        name: "In-Office Laser Teeth Whitening",
        category: "Cosmetic",
        price: 3500,
        duration: "60 mins",
        description: "Professional laser whitening lifting shade up to 4-6 tones in a single session.",
      },
      {
        id: "srv-rct",
        name: "Single-Sitting Rotary Root Canal Therapy",
        category: "Treatments",
        price: 4500,
        duration: "60 mins",
        description: "Painless computerized rotary endodontics with apex locator and biocompatible seal.",
      },
    ],
  },
  {
    id: "biz-salon-aura",
    name: "Aura Luxury Salon & Aesthetic Spa",
    businessName: "Aura Luxury Salon & Aesthetic Spa",
    type: "Salon",
    businessType: "Salon",
    category: "Salons & Spas",
    tagline: "High-Fashion Hair Styling, Organic Skin Therapies & Body Spas",
    description: "Upscale wellness and styling sanctuary with master colorists, certified skin therapists, and bespoke massage suites.",
    rating: 4.92,
    reviewCount: 215,
    verified: true,
    address: "7th Avenue, Koregaon Park, Pune",
    city: "Pune",
    phone: "+91 91234 56780",
    email: "bookings@aurasalon.com",
    workingHours: "Tue - Sun: 10:00 AM - 09:00 PM | Mon: Closed",
    nextSlot: "Today at 03:00 PM",
    consultationFeeStarting: 850,
    amenities: [
      "Private Spa Suites",
      "Organic Herbal Products",
      "Complimentary Artisan Tea / Coffee",
      "Valet Parking",
      "Stylist Consultation Lounge",
    ],
    doctors: [
      {
        id: "stylist-rohan",
        name: "Rohan Mehra",
        title: "Creative Director & Master Stylist",
        degrees: "Toni&Guy London Certified Stylist",
        specialty: "Precision Cuts & Balayage",
        experience: "9+ Years Experience",
        fee: 850,
        nextSlot: "Today, 03:00 PM",
        availableSlots: ["03:00 PM", "04:30 PM", "06:00 PM"],
        avatarBg: "bg-purple-600",
        rating: 4.95,
        reviews: 130,
        status: "Active",
      },
      {
        id: "therapist-sanya",
        name: "Sanya Kapoor",
        title: "Senior Aesthetician & Ayurveda Therapist",
        degrees: "CIDESCO International Diploma in Skin Aesthetics",
        specialty: "HydraFacial & Ayurvedic Spas",
        experience: "8+ Years Experience",
        fee: 1500,
        nextSlot: "Tomorrow, 01:00 PM",
        availableSlots: ["01:00 PM", "03:00 PM", "05:00 PM"],
        avatarBg: "bg-amber-600",
        rating: 4.9,
        reviews: 85,
        status: "Active",
      },
    ],
    services: [
      {
        id: "srv-signature-haircut",
        name: "Signature Haircut, Wash & Blowdry",
        category: "Hair Styling",
        price: 850,
        duration: "45 mins",
        description: "Personalized face-contour haircut, deep conditioning shampoo, and salon blowout styling.",
        popular: true,
      },
      {
        id: "srv-deep-tissue-spa",
        name: "Swedish & Deep Tissue Aromatherapy Massage",
        category: "Body Spa",
        price: 2200,
        duration: "60 mins",
        description: "Full body muscle tension release with warm cold-pressed organic botanical oils.",
        popular: true,
      },
      {
        id: "srv-hydra-facial",
        name: "Hydra-Glow Anti-Pollution Skin Facial",
        category: "Skin Aesthetics",
        price: 1800,
        duration: "60 mins",
        description: "Triple-step hydro-dermabrasion, hyaluronic serum infusion, and chilled cryo-globe finish.",
      },
    ],
  },
  {
    id: "biz-gym-ironcore",
    name: "IronCore Elite Fitness & Physiotherapy",
    businessName: "IronCore Elite Fitness & Physiotherapy",
    type: "Fitness",
    businessType: "Fitness",
    category: "Fitness & Wellness",
    tagline: "Science-Backed Strength, Posture Correction & Sports Rehabilitation",
    description: "Boutique training center integrating functional strength equipment with licensed physiotherapists for injury prevention and fitness.",
    rating: 4.82,
    reviewCount: 88,
    verified: true,
    address: "Plot 18, Commercial Belt, Viman Nagar, Pune",
    city: "Pune",
    phone: "+91 99887 76655",
    email: "fitness@ironcore.in",
    workingHours: "Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM",
    nextSlot: "Tomorrow at 08:00 AM",
    consultationFeeStarting: 900,
    amenities: [
      "Licensed Physiotherapy Clinic Attached",
      "InBody 570 Body Composition Analysis",
      "Locker & Shower Rooms",
      "Nutrition & Macro Bar",
    ],
    doctors: [
      {
        id: "coach-vikram",
        name: "Coach Vikram Rathore",
        title: "Head Physiotherapist & CSCS Coach",
        degrees: "BPT, Masters in Sports Physiotherapy, CSCS",
        specialty: "Sports Rehabilitation & Ergonomics",
        experience: "12+ Years Experience",
        fee: 900,
        nextSlot: "Tomorrow, 08:00 AM",
        availableSlots: ["08:00 AM", "10:00 AM", "05:00 PM"],
        avatarBg: "bg-cyan-600",
        rating: 4.85,
        reviews: 62,
        status: "Active",
      },
    ],
    services: [
      {
        id: "srv-physio-rehab",
        name: "1-on-1 Physiotherapy & Posture Rehab",
        category: "Therapy",
        price: 900,
        duration: "45 mins",
        description: "Targeted mobilization, dry needling, and corrective exercise for back, neck, or joint stiffness.",
        popular: true,
      },
      {
        id: "srv-fitness-assessment",
        name: "Comprehensive Fitness & Macro Nutrition Plan",
        category: "Fitness",
        price: 1500,
        duration: "60 mins",
        description: "InBody 570 body scan, VO2 max test, strength benchmark, and customized 8-week nutrition roadmap.",
      },
    ],
  },
  {
    id: "biz-legal-veritas",
    name: "Veritas Legal & Corporate Advisory",
    businessName: "Veritas Legal & Corporate Advisory",
    type: "Consulting",
    businessType: "Consulting",
    category: "Consulting & Legal",
    tagline: "Corporate Law, Taxation, Compliance & Contract Advisory",
    description: "Reputed legal and compliance boutique serving small businesses, founders, and professionals with contract reviews, tax filing, and IP.",
    rating: 4.9,
    reviewCount: 64,
    verified: true,
    address: "Tower 2, Cyber City, Magarpatta, Pune",
    city: "Pune",
    phone: "+91 93456 78901",
    email: "counsel@veritasadvisory.in",
    workingHours: "Mon - Fri: 09:30 AM - 06:30 PM",
    nextSlot: "Tomorrow at 11:30 AM",
    consultationFeeStarting: 1800,
    amenities: [
      "Confidential Video Conferencing",
      "Encrypted Document Portal",
      "Immediate Digital Receipting",
    ],
    doctors: [
      {
        id: "adv-meera",
        name: "Adv. Meera Nair",
        title: "Managing Partner & Corporate Legal Counsel",
        degrees: "BA LLB (Hons), LLM (Corporate Law - NLSIU)",
        specialty: "Contracts, Startup Law & Compliance",
        experience: "11+ Years Experience",
        fee: 1800,
        nextSlot: "Tomorrow, 11:30 AM",
        availableSlots: ["11:30 AM", "03:00 PM", "04:30 PM"],
        avatarBg: "bg-slate-700",
        rating: 4.9,
        reviews: 48,
        status: "Active",
      },
    ],
    services: [
      {
        id: "srv-legal-consult",
        name: "1-on-1 Legal & Commercial Contract Review",
        category: "Consultations",
        price: 1800,
        duration: "45 mins",
        description: "Detailed review of vendor contracts, client terms, NDA, or employment agreements with actionable risk redlines.",
        popular: true,
      },
      {
        id: "srv-gst-tax",
        name: "GST & Business Tax Compliance Audit",
        category: "Taxation",
        price: 2500,
        duration: "60 mins",
        description: "Quarterly and annual reconciliation, input tax credit check, and return compliance advisory.",
      },
    ],
  },
];

// --------------------------------
// Smart Booking Suggestions Data Engine
// --------------------------------
export const SMART_BOOKING_SUGGESTIONS = [
  {
    id: "sug-fever-physician",
    title: "Need a Doctor Today?",
    subtitle: "Dr. Rajesh Sharma (MD Internal Medicine) has open clinic slots this afternoon",
    doctorName: "Dr. Rajesh Sharma",
    doctorDegree: "MBBS, MD (Medicine)",
    doctorSpecialty: "Senior Physician & Diabetologist",
    businessId: "biz-clinic-apex",
    businessName: "Apex Multi-Speciality Clinic",
    businessCategory: "Clinics & Doctors",
    serviceId: "srv-gen-physician",
    serviceName: "General Physician Consultation",
    servicePrice: 600,
    serviceDuration: "30 mins",
    nextSlot: "Today, 04:30 PM",
    badge: "⚡ Open Slots Today",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    symptoms: ["Fever", "Cough & Cold", "Blood Pressure", "Diabetes Check", "Fatigue"],
    reason: "High patient recovery rate • Verified MD Physician",
  },
  {
    id: "sug-annual-health-checkup",
    title: "Recommended Preventative Care",
    subtitle: "Executive Full-Body Blood Panel with 64 essential diagnostic parameters",
    doctorName: "Apex Diagnostic Lab Team",
    doctorDegree: "NABL Certified Pathologists",
    doctorSpecialty: "Pathology & Diagnostics",
    businessId: "biz-clinic-apex",
    businessName: "Apex Diagnostic Center",
    businessCategory: "Diagnostics & Labs",
    serviceId: "srv-exec-health-checkup",
    serviceName: "Executive Full-Body Health Checkup & Blood Panel",
    servicePrice: 1999,
    serviceDuration: "45 mins",
    nextSlot: "Tomorrow, 08:30 AM",
    badge: "⭐ 25% Off Health Screening",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    symptoms: ["Annual Health Check", "Cholesterol", "CBC", "Liver/Kidney", "Blood Sugar"],
    reason: "Same-day digital reports • 12-hour fasting recommended",
  },
  {
    id: "sug-dental-clean",
    title: "Due for a Dental Checkup?",
    subtitle: "Painless Ultrasonic Teeth Cleaning & Stain Removal with Dr. Priya Patel",
    doctorName: "Dr. Priya Patel",
    doctorDegree: "BDS, MDS (Orthodontics)",
    doctorSpecialty: "Chief Dental Surgeon",
    businessId: "biz-dental-metro",
    businessName: "Metro Dental Clinic",
    businessCategory: "Dental Care",
    serviceId: "srv-teeth-cleaning",
    serviceName: "Ultrasonic Teeth Scaling & Polishing",
    servicePrice: 1200,
    serviceDuration: "45 mins",
    nextSlot: "Today, 05:30 PM",
    badge: "✨ Popular Dental Care",
    badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/30",
    symptoms: ["Toothache", "Teeth Stains", "Plaque/Tartar", "Bleeding Gums", "Bad Breath"],
    reason: "Gentle zero-pain ultrasonic technology",
  },
  {
    id: "sug-skin-glow",
    title: "Skin & Dermatology Consultation",
    subtitle: "Personalized acne, pigment, and glow treatment with Gold Medalist Dr. Ananya Sen",
    doctorName: "Dr. Ananya Sen",
    doctorDegree: "MBBS, MD (Dermatology)",
    doctorSpecialty: "Consultant Dermatologist",
    businessId: "biz-clinic-apex",
    businessName: "Apex Multi-Speciality Clinic",
    businessCategory: "Clinics & Doctors",
    serviceId: "srv-derma-consult",
    serviceName: "Dermatology & Skin Care Consultation",
    servicePrice: 800,
    serviceDuration: "30 mins",
    nextSlot: "Tomorrow, 11:00 AM",
    badge: "🌟 Top Rated Dermatologist",
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    symptoms: ["Acne & Pimples", "Dark Spots", "Skin Allergy", "Hair Fall", "Eczema"],
    reason: "4.95 ★ rated by 110+ patients",
  },
  {
    id: "sug-spa-relaxation",
    title: "Unwind & De-stress",
    subtitle: "Swedish & Deep Tissue Aromatherapy Massage at Aura Luxury Spa",
    doctorName: "Sanya Kapoor",
    doctorDegree: "CIDESCO Aesthetician",
    doctorSpecialty: "Senior Body & Skin Therapist",
    businessId: "biz-salon-aura",
    businessName: "Aura Luxury Salon & Spa",
    businessCategory: "Salons & Spas",
    serviceId: "srv-deep-tissue-spa",
    serviceName: "Swedish & Deep Tissue Aromatherapy Massage",
    servicePrice: 2200,
    serviceDuration: "60 mins",
    nextSlot: "Today, 03:00 PM",
    badge: "🌿 Luxury Relaxation",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    symptoms: ["Muscle Stiffness", "Stress Relief", "Neck & Shoulder Tension", "Weekend Self-Care"],
    reason: "Organic herbal oils • Private suite",
  },
];

export function getCuratedShowcaseBusinesses() {
  return CURATED_SHOWCASE_BUSINESSES;
}

export function getSmartBookingSuggestions() {
  return SMART_BOOKING_SUGGESTIONS;
}

// --------------------------------
// Get Single Business Details (Firestore + Fallback to Showcase)
// --------------------------------
export async function getBusiness(businessId) {
  if (!businessId) return null;

  try {
    const businessRef = doc(db, "businesses", businessId);
    const snapshot = await getDoc(businessRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (error) {
    console.error("Error reading business from Firestore:", error);
  }

  // Fallback to curated showcase businesses
  const curated = CURATED_SHOWCASE_BUSINESSES.find((b) => b.id === businessId);
  if (curated) {
    return curated;
  }

  return null;
}

// --------------------------------
// Get All Businesses (Customer Directory: Firestore + Curated)
// --------------------------------
export async function getAllBusinesses() {
  const results = [];
  const seenIds = new Set();

  try {
    const businessesRef = collection(db, "businesses");
    const q = query(businessesRef, limit(20));
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => {
      seenIds.add(d.id);
      results.push({ id: d.id, ...d.data() });
    });
  } catch (error) {
    console.error("Error getting businesses from Firestore:", error);
  }

  // Merge in curated showcase businesses that aren't already in Firestore
  for (const showcase of CURATED_SHOWCASE_BUSINESSES) {
    if (!seenIds.has(showcase.id)) {
      results.push(showcase);
      seenIds.add(showcase.id);
    }
  }

  return results;
}