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
import { logActivity } from "./activities";
import { recordFormSubmission } from "./formSubmissions";
import { CURATED_SHOWCASE_BUSINESSES } from "./businesses";

export function getDefaultEmployeesForBusiness(businessId = "default_business", businessType = "General") {
  const normalizedType = String(businessType || "").toLowerCase();

  if (
    normalizedType.includes("health") ||
    normalizedType.includes("clinic") ||
    normalizedType.includes("medic") ||
    normalizedType.includes("doctor")
  ) {
    return [
      {
        id: `emp-${businessId}-doc-1`,
        name: "Dr. Rajesh Sharma",
        role: "Senior Consultant Physician",
        specialty: "General Medicine & Diabetology",
        department: "General Medicine",
        experience: "16+ Years Experience",
        fee: 600,
        status: "Active",
        availableSlots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:00 PM", "05:30 PM"],
        avatarBg: "bg-blue-600",
      },
      {
        id: `emp-${businessId}-doc-2`,
        name: "Dr. Ananya Sen",
        role: "Consultant Specialist",
        specialty: "Clinical Specialist & Diagnostics",
        department: "Diagnostics",
        experience: "11+ Years Experience",
        fee: 800,
        status: "Active",
        availableSlots: ["10:00 AM", "12:15 PM", "03:30 PM", "05:00 PM"],
        avatarBg: "bg-emerald-600",
      },
    ];
  }

  return [
    {
      id: `emp-${businessId}-spec-1`,
      name: "Senior Lead Specialist",
      role: "Lead Specialist",
      specialty: "Primary Consultations & Services",
      department: "General",
      experience: "10+ Years Experience",
      fee: 500,
      status: "Active",
      availableSlots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:00 PM", "05:30 PM"],
      avatarBg: "bg-indigo-600",
    },
    {
      id: `emp-${businessId}-spec-2`,
      name: "Associate Consultant",
      role: "Consultant Associate",
      specialty: "Follow-Up & Express Sessions",
      department: "General",
      experience: "6+ Years Experience",
      fee: 400,
      status: "Active",
      availableSlots: ["10:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"],
      avatarBg: "bg-violet-600",
    },
  ];
}

export async function getEmployees(businessId, businessType = null) {
  if (!businessId) return getDefaultEmployeesForBusiness("default_business", businessType);

  // 1. Query remote Firestore
  try {
    const employeesRef = collection(db, "businesses", businessId, "employees");
    const q = query(employeesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (error) {
    console.warn("Could not query employees from Firestore, checking cache & templates:", error);
  }

  // 2. Check local storage
  try {
    const local = JSON.parse(localStorage.getItem(`local_employees_${businessId}`) || "[]");
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback to showcase doctors / specialists
  const showcase = CURATED_SHOWCASE_BUSINESSES.find((b) => b.id === businessId);
  if (showcase && Array.isArray(showcase.doctors) && showcase.doctors.length > 0) {
    return showcase.doctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      role: doc.title,
      specialty: doc.specialty,
      degrees: doc.degrees,
      department: doc.specialty,
      experience: doc.experience,
      fee: doc.fee,
      rating: doc.rating,
      avatarBg: doc.avatarBg,
      status: "Active",
      availableSlots: doc.availableSlots,
    }));
  }

  // 4. Default starter team
  const defaults = getDefaultEmployeesForBusiness(businessId, businessType || showcase?.type || showcase?.businessType);
  try {
    localStorage.setItem(`local_employees_${businessId}`, JSON.stringify(defaults));
  } catch (e) {
    // ignore
  }

  return defaults;
}

export async function createEmployee(businessId, employeeData) {
  let docId = null;
  try {
    const employeesRef = collection(db, "businesses", businessId, "employees");
    const docRef = await addDoc(employeesRef, {
      ...employeeData,
      status: employeeData.status || "Active",
      createdAt: serverTimestamp(),
    });
    docId = docRef.id;
  } catch (err) {
    console.warn("Firestore addDoc failed in createEmployee, saving locally:", err);
    docId = `emp_${Date.now()}`;
  }

  const newEmp = { id: docId, ...employeeData, status: "Active" };

  try {
    const key = `local_employees_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([newEmp, ...existing.filter((x) => x.id !== docId)]));
  } catch (e) {
    // ignore
  }

  try {
    logActivity(businessId, {
      type: "EMPLOYEE_ADDED",
      title: "Employee Added",
      description: `${employeeData.name || "Employee"} added to team.`,
      entityId: docId,
      entityType: "employee",
    });
  } catch (e) {
    // ignore
  }

  try {
    recordFormSubmission(businessId, {
      formType: "employee",
      formTitle: "Add Employee",
      data: employeeData,
      entityId: docId,
      entityCollection: "employees",
    });
  } catch (e) {
    // ignore
  }

  return newEmp;
}

export async function updateEmployee(businessId, employeeId, employeeData) {
  const dataToUpdate = {
    ...employeeData,
    updatedAt: serverTimestamp(),
  };

  try {
    const employeeRef = doc(db, "businesses", businessId, "employees", employeeId);
    await updateDoc(employeeRef, dataToUpdate);
  } catch (err) {
    console.warn("Firestore updateDoc failed in updateEmployee:", err);
  }

  try {
    const key = `local_employees_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.map((x) => (x.id === employeeId ? { ...x, ...dataToUpdate } : x))));
  } catch (e) {
    // ignore
  }

  try {
    recordFormSubmission(businessId, {
      formType: "employee_update",
      formTitle: `Update Employee (${employeeData.name || employeeId})`,
      data: { employeeId, ...dataToUpdate },
      entityId: employeeId,
      entityCollection: "employees",
    });
  } catch (e) {
    // ignore
  }

  return { id: employeeId, ...dataToUpdate };
}

export async function deleteEmployee(businessId, employeeId) {
  try {
    const employeeRef = doc(db, "businesses", businessId, "employees", employeeId);
    await deleteDoc(employeeRef);
  } catch (err) {
    console.warn("Firestore deleteDoc failed in deleteEmployee:", err);
  }

  try {
    const key = `local_employees_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter((x) => x.id !== employeeId)));
  } catch (e) {
    // ignore
  }
}
