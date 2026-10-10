import {
  collection,
  addDoc,
  getDocs,
  getDoc,
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

export async function getInvoices(businessId) {
  try {
    const invoicesRef = collection(db, "businesses", businessId, "invoices");
    const q = query(invoicesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting invoices:", error);
    return [];
  }
}

export function subscribeInvoices(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const invoicesRef = collection(db, "businesses", businessId, "invoices");
    const q = query(invoicesRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.warn("Invoices onSnapshot listener error:", error);
        onError?.(error);
        getInvoices(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeInvoices setup error:", err);
    getInvoices(businessId).then(callback);
    return () => {};
  }
}

export async function createInvoice(businessId, invoiceData) {
  const invoicesRef = collection(db, "businesses", businessId, "invoices");
  const total = Number(invoiceData.total) || 0;
  const docRef = await addDoc(invoicesRef, {
    ...invoiceData,
    total,
    status: invoiceData.status || "Pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  logActivity(businessId, {
    type: "INVOICE_CREATED",
    title: "Invoice Generated",
    description: `Invoice #${invoiceData.invoiceNumber || ""} generated for ${invoiceData.customerName || "Customer"} (₹${total.toLocaleString("en-IN")}).`,
    entityId: docRef.id,
    entityType: "invoice",
    amount: total,
  });

  // Record form submission in universal form_submissions collection
  recordFormSubmission(businessId, {
    formType: "invoice",
    formTitle: `Create Invoice #${invoiceData.invoiceNumber || ""} (${invoiceData.customerName || "Customer"})`,
    contactName: invoiceData.customerName || "",
    contactEmail: invoiceData.customerEmail || "",
    contactPhone: invoiceData.customerPhone || "",
    data: invoiceData,
    entityId: docRef.id,
    entityCollection: "invoices",
  });

  return { id: docRef.id, ...invoiceData, total };
}

export async function updateInvoice(businessId, invoiceId, invoiceData) {
  const invoiceRef = doc(db, "businesses", businessId, "invoices", invoiceId);
  const total =
    invoiceData.total !== undefined ? Number(invoiceData.total) || 0 : undefined;

  const dataToUpdate = {
    ...invoiceData,
    ...(total !== undefined ? { total } : {}),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(invoiceRef, dataToUpdate);

  recordFormSubmission(businessId, {
    formType: "invoice_update",
    formTitle: `Update Invoice #${invoiceData.invoiceNumber || invoiceId.slice(0, 8)}`,
    contactName: invoiceData.customerName || "",
    contactEmail: invoiceData.customerEmail || "",
    contactPhone: invoiceData.customerPhone || "",
    data: { invoiceId, ...dataToUpdate },
    entityId: invoiceId,
    entityCollection: "invoices",
  });

  return { id: invoiceId, ...dataToUpdate };
}

export async function deleteInvoice(businessId, invoiceId) {
  const invoiceRef = doc(db, "businesses", businessId, "invoices", invoiceId);
  await deleteDoc(invoiceRef);
}
