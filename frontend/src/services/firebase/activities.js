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
} from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Standard Activity Event Types:
 * - CUSTOMER_CREATED
 * - LEAD_CREATED
 * - LEAD_CONVERTED
 * - APPOINTMENT_BOOKED
 * - APPOINTMENT_COMPLETED
 * - INVOICE_CREATED
 * - PAYMENT_RECEIVED
 * - EXPENSE_ADDED
 * - EMPLOYEE_ADDED
 * - FOLLOW_UP_CREATED
 */

export async function logActivity(businessId, activityData) {
  if (!businessId) return null;
  try {
    const activitiesRef = collection(db, "businesses", businessId, "activities");
    const payload = {
      type: activityData.type || "GENERAL",
      title: activityData.title || "Business Activity",
      description: activityData.description || "",
      entityId: activityData.entityId || "",
      entityType: activityData.entityType || "",
      amount: activityData.amount !== undefined ? Number(activityData.amount) : null,
      metadata: activityData.metadata || {},
      performedBy: activityData.performedBy || "System",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(activitiesRef, payload);
    return { id: docRef.id, ...payload, createdAt: new Date() };
  } catch (error) {
    console.warn("Failed to log activity event to Firestore:", error);
    return null;
  }
}

export async function getActivities(businessId, maxResults = 25) {
  if (!businessId) return [];
  try {
    const activitiesRef = collection(db, "businesses", businessId, "activities");
    const q = query(
      activitiesRef,
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      };
    });
  } catch (error) {
    console.error("Error retrieving activities:", error);
    return [];
  }
}

export async function deleteActivity(businessId, activityId) {
  if (!businessId || !activityId) return;
  const activityRef = doc(db, "businesses", businessId, "activities", activityId);
  await deleteDoc(activityRef);
}
