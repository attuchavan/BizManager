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

// -----------------------------------------
// Get All Appointments
// -----------------------------------------
export async function getAppointments(businessId) {
  let remoteAppointments = [];
  try {
    const appointmentsRef = collection(db, "businesses", businessId, "appointments");
    const q = query(appointmentsRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    remoteAppointments = snapshot.docs.map((d) => ({
      id: d.id,
      assignedEmployee: d.data().assignedEmployee || "Unassigned",
      service: d.data().service || "Consultation",
      status: d.data().status || "Confirmed",
      ...d.data(),
    }));
  } catch (error) {
    console.warn("Could not query appointments from Firestore, relying on local cache:", error);
  }

  // Merge with locally stored appointments if available
  try {
    const local = JSON.parse(localStorage.getItem(`local_appointments_${businessId}`) || "[]");
    const existingIds = new Set(remoteAppointments.map((a) => a.id));
    const extra = local.filter((a) => !existingIds.has(a.id));
    return [...remoteAppointments, ...extra];
  } catch (e) {
    return remoteAppointments;
  }
}

// -----------------------------------------
// Real-time Subscriptions (Multi-Device Sync)
// -----------------------------------------
export function subscribeAppointments(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const appointmentsRef = collection(db, "businesses", businessId, "appointments");
    const q = query(appointmentsRef, orderBy("date", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const remoteAppointments = snapshot.docs.map((d) => ({
          id: d.id,
          assignedEmployee: d.data().assignedEmployee || "Unassigned",
          service: d.data().service || "Consultation",
          status: d.data().status || "Confirmed",
          ...d.data(),
        }));
        try {
          const local = JSON.parse(localStorage.getItem(`local_appointments_${businessId}`) || "[]");
          const existingIds = new Set(remoteAppointments.map((a) => a.id));
          const extra = local.filter((a) => !existingIds.has(a.id));
          callback([...remoteAppointments, ...extra]);
        } catch {
          callback(remoteAppointments);
        }
      },
      (error) => {
        console.warn("Appointments onSnapshot error:", error);
        onError?.(error);
        getAppointments(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeAppointments setup error:", err);
    getAppointments(businessId).then(callback);
    return () => {};
  }
}

// -----------------------------------------
// Get Single Appointment
// -----------------------------------------
export async function getAppointment(businessId, appointmentId) {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  const snapshot = await getDoc(appointmentRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// -----------------------------------------
// Create Appointment
// -----------------------------------------
export async function createAppointment(businessId, appointmentData) {
  let docId = null;

  try {
    const appointmentsRef = collection(db, "businesses", businessId, "appointments");
    const docRef = await addDoc(appointmentsRef, {
      ...appointmentData,
      status: appointmentData.status || "Confirmed",
      reminderSent: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    docId = docRef.id;
  } catch (err) {
    console.warn("Firestore addDoc failed in createAppointment, using local resilient fallback:", err);
    docId = `apt_${Date.now()}`;
  }

  // Preserve in localStorage for instantaneous UI updates and offline resilience
  try {
    const localKey = `local_appointments_${businessId}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    const newEntry = {
      id: docId,
      ...appointmentData,
      status: appointmentData.status || "Confirmed",
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(localKey, JSON.stringify([newEntry, ...existing.filter((x) => x.id !== docId)]));
  } catch (localErr) {
    console.warn("Failed caching appointment to localStorage:", localErr);
  }

  // Log activity
  try {
    logActivity(businessId, {
      type: "APPOINTMENT_BOOKED",
      title: "Appointment Booked",
      description: `Session with ${appointmentData.clientName || appointmentData.customerName || "Client"} for ${appointmentData.service || "Service"} on ${appointmentData.date} at ${appointmentData.time}.`,
      entityId: docId,
      entityType: "appointment",
    });
  } catch (actErr) {
    // Activity logging is non-blocking
  }

  // Record form submission in universal form_submissions collection
  try {
    const apptClientName = appointmentData.clientName || appointmentData.customerName || "";
    const apptClientEmail = appointmentData.clientEmail || appointmentData.customerEmail || appointmentData.email || "";
    const apptClientPhone = appointmentData.clientPhone || appointmentData.phone || "";

    recordFormSubmission(businessId, {
      formType: "appointment",
      formTitle: `Book Appointment: ${appointmentData.service || "Service"} (${apptClientName || "Client"})`,
      contactName: apptClientName,
      contactEmail: apptClientEmail,
      contactPhone: apptClientPhone,
      data: appointmentData,
      entityId: docId,
      entityCollection: "appointments",
    });
  } catch (subErr) {
    // Submission logging is non-blocking
  }

  return { id: docId, ...appointmentData, reminderSent: false };
}

// -----------------------------------------
// Update Appointment
// -----------------------------------------
export async function updateAppointment(businessId, appointmentId, appointmentData) {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  const dataToUpdate = {
    ...appointmentData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(appointmentRef, dataToUpdate);

  // Record form submission audit
  recordFormSubmission(businessId, {
    formType: "appointment_update",
    formTitle: `Update Appointment #${appointmentId.slice(0, 6)}`,
    data: { appointmentId, ...dataToUpdate },
    entityId: appointmentId,
    entityCollection: "appointments",
  });

  if (appointmentData.status === "Completed") {
    logActivity(businessId, {
      type: "APPOINTMENT_COMPLETED",
      title: "Appointment Completed",
      description: `Completed session with ${appointmentData.clientName || appointmentData.customerName || "Client"}.`,
      entityId: appointmentId,
      entityType: "appointment",
    });
  }

  return { id: appointmentId, ...dataToUpdate };
}

// -----------------------------------------
// Cancel Appointment
// -----------------------------------------
export async function cancelAppointment(businessId, appointmentId, reason = "") {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  const dataToUpdate = {
    status: "Cancelled",
    cancelledAt: serverTimestamp(),
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(appointmentRef, dataToUpdate);

  recordFormSubmission(businessId, {
    formType: "appointment_cancel",
    formTitle: `Cancel Appointment #${appointmentId.slice(0, 6)}`,
    data: { appointmentId, ...dataToUpdate },
    entityId: appointmentId,
    entityCollection: "appointments",
  });

  logActivity(businessId, {
    type: "APPOINTMENT_CANCELLED",
    title: "Appointment Cancelled",
    description: `Appointment #${appointmentId.slice(0, 6)} cancelled.${reason ? ` Reason: ${reason}` : ""}`,
    entityId: appointmentId,
    entityType: "appointment",
  });

  return { id: appointmentId, ...dataToUpdate };
}

// -----------------------------------------
// Reschedule Appointment
// -----------------------------------------
export async function rescheduleAppointment(businessId, appointmentId, { date, time, reason = "" }) {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  const dataToUpdate = {
    date,
    time,
    status: "Confirmed",
    rescheduledAt: serverTimestamp(),
    rescheduleReason: reason,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(appointmentRef, dataToUpdate);

  recordFormSubmission(businessId, {
    formType: "appointment_reschedule",
    formTitle: `Reschedule Appointment #${appointmentId.slice(0, 6)}`,
    data: { appointmentId, date, time, reason },
    entityId: appointmentId,
    entityCollection: "appointments",
  });

  logActivity(businessId, {
    type: "APPOINTMENT_RESCHEDULED",
    title: "Appointment Rescheduled",
    description: `Appointment rescheduled to ${date} at ${time}.${reason ? ` Note: ${reason}` : ""}`,
    entityId: appointmentId,
    entityType: "appointment",
  });

  return { id: appointmentId, ...dataToUpdate };
}

// -----------------------------------------
// Mark Reminder Sent
// -----------------------------------------
export async function markReminderSent(businessId, appointmentId, method = "WhatsApp") {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  const dataToUpdate = {
    reminderSent: true,
    reminderSentAt: serverTimestamp(),
    reminderMethod: method,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(appointmentRef, dataToUpdate);
  return { id: appointmentId, ...dataToUpdate };
}

// -----------------------------------------
// Delete Appointment
// -----------------------------------------
export async function deleteAppointment(businessId, appointmentId) {
  const appointmentRef = doc(db, "businesses", businessId, "appointments", appointmentId);
  await deleteDoc(appointmentRef);
}
