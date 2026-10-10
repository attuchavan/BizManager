import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";

/**
 * Universal Form Submissions Service
 * Captures and stores every filled form in Firestore for audit, record-keeping, and CRM integrity.
 *
 * Supported form types:
 * - "appointment": Appointments & Bookings
 * - "payment": Payments & Transactions
 * - "customer": Customers & Clients
 * - "invoice": Invoices & Estimates
 * - "lead": Sales Leads & Pipeline
 * - "expense": Expense Claims & Outflows
 * - "service": Services & Catalog
 * - "employee": Staff & Providers
 * - "marketing": Campaigns & Broadcasts
 * - "general": Any custom or web form
 */

export async function recordFormSubmission(businessId, submissionData) {
  const effectiveBizId = businessId || "default_business";
  const currentUser = auth.currentUser;

  // Clean form data to ensure no undefined values or non-serializable objects (like serverTimestamp) are sent
  let cleanFormData = {};
  try {
    const rawData = submissionData.data || submissionData.formData || {};
    const sanitized = {};
    for (const [key, val] of Object.entries(rawData)) {
      if (
        val !== undefined &&
        typeof val !== "function" &&
        !(val && typeof val === "object" && val._methodName)
      ) {
        sanitized[key] = val;
      }
    }
    cleanFormData = JSON.parse(JSON.stringify(sanitized));
  } catch (err) {
    cleanFormData = { ...(submissionData.data || submissionData.formData || {}) };
  }

  // Determine the actual contact person for this submission (client/customer/lead)
  const contactName =
    submissionData.contactName ||
    submissionData.submittedBy?.name ||
    cleanFormData?.clientName ||
    cleanFormData?.customerName ||
    cleanFormData?.name ||
    cleanFormData?.fullName ||
    currentUser?.displayName ||
    "User";

  const contactEmail =
    submissionData.contactEmail ||
    submissionData.submittedBy?.email ||
    cleanFormData?.clientEmail ||
    cleanFormData?.customerEmail ||
    cleanFormData?.email ||
    currentUser?.email ||
    "";

  const contactPhone =
    submissionData.contactPhone ||
    submissionData.submittedBy?.phone ||
    cleanFormData?.clientPhone ||
    cleanFormData?.customerPhone ||
    cleanFormData?.phone ||
    "";

  const payload = {
    formType: submissionData.formType || "general",
    formTitle: submissionData.formTitle || "Form Submission",
    businessId: effectiveBizId,
    formData: cleanFormData,
    contactName,
    contactEmail,
    contactPhone,
    entityId: submissionData.entityId || null,
    entityCollection: submissionData.entityCollection || null,
    submittedBy: {
      uid: currentUser?.uid || "unauthenticated",
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      operatorUid: currentUser?.uid || null,
      operatorName: currentUser?.displayName || null,
      operatorEmail: currentUser?.email || null,
    },
    status: submissionData.status || "stored",
    submittedAt: serverTimestamp(),
    timestamp: new Date().toISOString(),
  };

  let savedDocId = null;

  // 1. Store in the business-specific subcollection: /businesses/{businessId}/form_submissions
  try {
    const bizSubmissionsRef = collection(db, "businesses", effectiveBizId, "form_submissions");
    const docRef = await addDoc(bizSubmissionsRef, payload);
    savedDocId = docRef.id;
  } catch (err) {
    console.warn("Failed saving to businesses subcollection form_submissions:", err);
  }

  // 2. Also record in top-level collection: /form_submissions for centralized auditing
  try {
    const globalRef = collection(db, "form_submissions");
    const globalDocRef = await addDoc(globalRef, {
      ...payload,
      subcollectionDocId: savedDocId,
    });
    if (!savedDocId) savedDocId = globalDocRef.id;
  } catch (err) {
    console.warn("Failed saving to global form_submissions collection:", err);
  }

  return {
    id: savedDocId || `sub_${Date.now()}`,
    ...payload,
    submittedAt: new Date(),
  };
}

export async function getFormSubmissions(businessId, maxResults = 50) {
  const effectiveBizId = businessId || "default_business";
  try {
    const submissionsRef = collection(db, "businesses", effectiveBizId, "form_submissions");
    const q = query(
      submissionsRef,
      orderBy("submittedAt", "desc"),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.warn("Error retrieving business form_submissions:", error);
    // Fallback to top-level if subcollection has no index/permissions
    try {
      const globalRef = collection(db, "form_submissions");
      const qGlobal = query(globalRef, orderBy("submittedAt", "desc"), limit(maxResults));
      const snap = await getDocs(qGlobal);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => !businessId || d.businessId === businessId);
    } catch {
      return [];
    }
  }
}

export async function deleteFormSubmission(businessId, submissionId) {
  if (!submissionId) return;
  const effectiveBizId = businessId || "default_business";
  try {
    const subRef = doc(db, "businesses", effectiveBizId, "form_submissions", submissionId);
    await deleteDoc(subRef);
  } catch (err) {
    console.warn("Error deleting subcollection form submission:", err);
  }
  try {
    const globalRef = doc(db, "form_submissions", submissionId);
    await deleteDoc(globalRef);
  } catch (err) {
    console.warn("Error deleting global form submission:", err);
  }
}

export function subscribeFormSubmissions(businessId, callback, onError, maxResults = 50) {
  const effectiveBizId = businessId || "default_business";
  try {
    const submissionsRef = collection(db, "businesses", effectiveBizId, "form_submissions");
    const q = query(
      submissionsRef,
      orderBy("submittedAt", "desc"),
      limit(maxResults)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(list);
      },
      (error) => {
        console.warn("Form submissions onSnapshot listener error:", error);
        onError?.(error);
        getFormSubmissions(effectiveBizId, maxResults).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeFormSubmissions setup error:", err);
    getFormSubmissions(effectiveBizId, maxResults).then(callback);
    return () => {};
  }
}
