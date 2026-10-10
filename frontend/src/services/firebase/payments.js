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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { logActivity } from "./activities";
import { recordFormSubmission } from "./formSubmissions";

export async function getPayments(businessId) {
  try {
    const paymentsRef = collection(db, "businesses", businessId, "payments");
    const q = query(paymentsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting payments:", error);
    return [];
  }
}

export function subscribePayments(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const paymentsRef = collection(db, "businesses", businessId, "payments");
    const q = query(paymentsRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.warn("Payments onSnapshot listener error:", error);
        onError?.(error);
        getPayments(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribePayments setup error:", err);
    getPayments(businessId).then(callback);
    return () => {};
  }
}

export async function createPayment(businessId, paymentData) {
  const paymentsRef = collection(db, "businesses", businessId, "payments");
  const amount = Number(paymentData.amount) || 0;
  const docRef = await addDoc(paymentsRef, {
    ...paymentData,
    amount,
    createdAt: serverTimestamp(),
  });

  logActivity(businessId, {
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    description: `₹${amount.toLocaleString("en-IN")} received from ${paymentData.customerName || "Customer"} via ${paymentData.method || "Direct Pay"}.`,
    entityId: docRef.id,
    entityType: "payment",
    amount,
  });

  // Record form submission in universal form_submissions collection
  recordFormSubmission(businessId, {
    formType: "payment",
    formTitle: `Record Payment: ₹${amount.toLocaleString("en-IN")} (${paymentData.customerName || "Customer"})`,
    contactName: paymentData.customerName || "",
    contactEmail: paymentData.customerEmail || "",
    data: paymentData,
    entityId: docRef.id,
    entityCollection: "payments",
  });

  return { id: docRef.id, ...paymentData, amount };
}

export async function deletePayment(businessId, paymentId) {
  const paymentRef = doc(db, "businesses", businessId, "payments", paymentId);
  await deleteDoc(paymentRef);
}
