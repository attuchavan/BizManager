import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { recordFormSubmission } from "./formSubmissions";
import { CURATED_SHOWCASE_BUSINESSES } from "./businesses";

/**
 * Universal Starter Services Generator
 * Ensures every business workspace always has rich, bookable services.
 */
export function getDefaultServicesForBusiness(businessId = "default_business", businessType = "General") {
  const normalizedType = String(businessType || "").toLowerCase();

  if (
    normalizedType.includes("health") ||
    normalizedType.includes("clinic") ||
    normalizedType.includes("medic") ||
    normalizedType.includes("doctor")
  ) {
    return [
      {
        id: `srv-${businessId}-gen-consult`,
        name: "General Physician Consultation",
        category: "Consultations",
        price: 600,
        duration: "30 mins",
        description: "Comprehensive clinical evaluation, diagnosis, vital signs assessment, and prescriptions.",
        popular: true,
      },
      {
        id: `srv-${businessId}-full-checkup`,
        name: "Executive Health Checkup & Blood Panel",
        category: "Diagnostics & Labs",
        price: 1999,
        duration: "45 mins",
        description: "Complete health diagnostic panel including CBC, blood sugar, lipid profile, and vitals check.",
        popular: true,
        badge: "Comprehensive",
      },
      {
        id: `srv-${businessId}-followup`,
        name: "Prescription & Follow-up Review",
        category: "Follow-up",
        price: 350,
        duration: "20 mins",
        description: "Clinical review for existing patients, lab report discussion, and dose adjustments.",
      },
      {
        id: `srv-${businessId}-urgent-care`,
        name: "Priority Same-Day Urgent Consultation",
        category: "Priority",
        price: 900,
        duration: "30 mins",
        description: "Priority queue slot with expedited doctor examination and acute symptom management.",
      },
    ];
  }

  if (normalizedType.includes("dental") || normalizedType.includes("dentist")) {
    return [
      {
        id: `srv-${businessId}-dental-check`,
        name: "Comprehensive Dental Checkup & Digital X-Ray",
        category: "Preventative",
        price: 500,
        duration: "30 mins",
        description: "Complete oral cavity examination, cavity screening, and single-tooth digital X-ray scan.",
        popular: true,
      },
      {
        id: `srv-${businessId}-scaling`,
        name: "Ultrasonic Teeth Scaling & Polishing",
        category: "Cleaning",
        price: 1200,
        duration: "45 mins",
        description: "Deep tartar removal, stain polishing, and gum health strengthening therapy.",
        popular: true,
      },
      {
        id: `srv-${businessId}-consult`,
        name: "Specialist Orthodontic & Aligners Consultation",
        category: "Consultations",
        price: 700,
        duration: "30 mins",
        description: "3D intraoral smile assessment and custom clear aligner treatment planning.",
      },
    ];
  }

  if (normalizedType.includes("salon") || normalizedType.includes("beauty") || normalizedType.includes("spa")) {
    return [
      {
        id: `srv-${businessId}-hair-cut`,
        name: "Signature Haircut & Blowdry Styling",
        category: "Hair Care",
        price: 599,
        duration: "40 mins",
        description: "Custom consultation, clarifying wash, precision cut, and salon blowdry styling.",
        popular: true,
      },
      {
        id: `srv-${businessId}-facial`,
        name: "Hydra Glow Deep Cleansing Facial",
        category: "Skincare",
        price: 1499,
        duration: "60 mins",
        description: "Exfoliation, steam extraction, vitamin infusion mask, and radiance facial massage.",
        popular: true,
      },
      {
        id: `srv-${businessId}-hair-spa`,
        name: "Keratin Intensive Hair Spa Treatment",
        category: "Hair Care",
        price: 1899,
        duration: "75 mins",
        description: "Deep nourishing hair masque, scalp rejuvenation therapy, and steam infusion.",
      },
    ];
  }

  if (normalizedType.includes("fitness") || normalizedType.includes("gym")) {
    return [
      {
        id: `srv-${businessId}-pt-session`,
        name: "1-on-1 Personal Training Session",
        category: "Training",
        price: 700,
        duration: "45 mins",
        description: "Guided customized workout targeting strength, form correction, and endurance.",
        popular: true,
      },
      {
        id: `srv-${businessId}-nutrition`,
        name: "Body Composition & Nutrition Plan",
        category: "Assessment",
        price: 999,
        duration: "30 mins",
        description: "InBody scan, macro target calculations, and personalized weekly diet roadmap.",
      },
    ];
  }

  // Universal fallback for General, Retail, Automotive, Consulting, etc.
  return [
    {
      id: `srv-${businessId}-standard-consult`,
      name: "Standard Consultation & Assessment",
      category: "Consultations",
      price: 500,
      duration: "30 mins",
      description: "Dedicated one-on-one session with our specialist. Includes requirements analysis and recommendations.",
      popular: true,
    },
    {
      id: `srv-${businessId}-premium-service`,
      name: "Comprehensive Full-Service Package",
      category: "Full Packages",
      price: 1250,
      duration: "60 mins",
      description: "Complete in-depth service session with dedicated specialist attention, full documentation, and next steps.",
      popular: true,
      badge: "Most Popular",
    },
    {
      id: `srv-${businessId}-express-review`,
      name: "Express Follow-Up & Review",
      category: "Follow-Up",
      price: 350,
      duration: "20 mins",
      description: "Quick follow-up session to review progress, verify deliverables, or resolve immediate queries.",
    },
    {
      id: `srv-${businessId}-priority-slot`,
      name: "Priority Same-Day Expedited Service",
      category: "Priority",
      price: 850,
      duration: "30 mins",
      description: "Expedited slot with priority queue handling and immediate specialist assignment.",
    },
  ];
}

export async function getServices(businessId, businessType = null) {
  if (!businessId) return getDefaultServicesForBusiness("default_business", businessType);

  // 1. Try querying remote Firestore
  try {
    const servicesRef = collection(db, "businesses", businessId, "services");
    const q = query(servicesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (error) {
    console.warn("Could not query services from Firestore, checking cache & templates:", error);
  }

  // 2. Check locally cached services
  try {
    const local = JSON.parse(localStorage.getItem(`local_services_${businessId}`) || "[]");
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }
  } catch (e) {
    // Ignore local storage parse error
  }

  // 3. Fallback to curated showcase business services
  const showcase = CURATED_SHOWCASE_BUSINESSES.find((b) => b.id === businessId);
  if (showcase && Array.isArray(showcase.services) && showcase.services.length > 0) {
    return showcase.services;
  }

  // 4. Fallback to rich starter service catalog
  const starterServices = getDefaultServicesForBusiness(businessId, businessType || showcase?.type || showcase?.businessType);

  // Cache to localStorage
  try {
    localStorage.setItem(`local_services_${businessId}`, JSON.stringify(starterServices));
  } catch (e) {
    // Ignore storage write error
  }

  // Asynchronously seed into Firestore so future calls read directly from Firestore
  (async () => {
    try {
      const servicesRef = collection(db, "businesses", businessId, "services");
      for (const s of starterServices) {
        await addDoc(servicesRef, {
          name: s.name,
          category: s.category || "Consultations",
          price: Number(s.price) || 0,
          duration: s.duration || "30 mins",
          description: s.description || "",
          popular: !!s.popular,
          status: "Active",
          createdAt: serverTimestamp(),
        });
      }
    } catch (seedErr) {
      // Non-blocking background seed
    }
  })();

  return starterServices;
}

export async function createService(businessId, serviceData) {
  const price = Number(serviceData.price) || 0;
  let docId = null;

  try {
    const servicesRef = collection(db, "businesses", businessId, "services");
    const docRef = await addDoc(servicesRef, {
      ...serviceData,
      price,
      status: serviceData.status || "Active",
      createdAt: serverTimestamp(),
    });
    docId = docRef.id;
  } catch (err) {
    console.warn("Firestore addDoc failed in createService, caching locally:", err);
    docId = `srv_${Date.now()}`;
  }

  const newService = { id: docId, ...serviceData, price, status: "Active" };

  // Update local cache
  try {
    const key = `local_services_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([newService, ...existing.filter((x) => x.id !== docId)]));
  } catch (localErr) {
    console.warn("Failed saving service to localStorage:", localErr);
  }

  // Record form submission in universal form_submissions collection
  try {
    recordFormSubmission(businessId, {
      formType: "service",
      formTitle: "Add Service",
      data: serviceData,
      entityId: docId,
      entityCollection: "services",
    });
  } catch (subErr) {
    // Non-blocking audit record
  }

  return newService;
}

export async function updateService(businessId, serviceId, serviceData) {
  const price = serviceData.price !== undefined ? Number(serviceData.price) || 0 : undefined;
  const dataToUpdate = {
    ...serviceData,
    ...(price !== undefined ? { price } : {}),
    updatedAt: serverTimestamp(),
  };

  try {
    const serviceRef = doc(db, "businesses", businessId, "services", serviceId);
    await updateDoc(serviceRef, dataToUpdate);
  } catch (err) {
    console.warn("Firestore updateDoc failed in updateService:", err);
  }

  // Update local cache
  try {
    const key = `local_services_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = existing.map((s) => (s.id === serviceId ? { ...s, ...dataToUpdate } : s));
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (localErr) {
    // ignore
  }

  try {
    recordFormSubmission(businessId, {
      formType: "service_update",
      formTitle: `Update Service (${serviceData.name || serviceId})`,
      data: { serviceId, ...dataToUpdate },
      entityId: serviceId,
      entityCollection: "services",
    });
  } catch (subErr) {
    // ignore
  }

  return { id: serviceId, ...dataToUpdate };
}

export async function deleteService(businessId, serviceId) {
  try {
    const serviceRef = doc(db, "businesses", businessId, "services", serviceId);
    await deleteDoc(serviceRef);
  } catch (err) {
    console.warn("Firestore deleteDoc failed in deleteService:", err);
  }

  try {
    const key = `local_services_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter((s) => s.id !== serviceId)));
  } catch (localErr) {
    // ignore
  }
}
