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
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../config/firebase";
import { logActivity } from "./activities";
import { recordFormSubmission } from "./formSubmissions";

// -----------------------------------------
// Get all customers
// -----------------------------------------
export async function getCustomers(businessId) {
  try {
    const customersRef = collection(db, "businesses", businessId, "customers");
    const customersQuery = query(customersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(customersQuery);

    return snapshot.docs.map((customerDoc) => ({
      id: customerDoc.id,
      tags: [],
      ...customerDoc.data(),
    }));
  } catch (error) {
    console.error("Error getting customers:", error);
    return [];
  }
}

export function subscribeCustomers(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const customersRef = collection(db, "businesses", businessId, "customers");
    const customersQuery = query(customersRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      customersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((customerDoc) => ({
          id: customerDoc.id,
          tags: [],
          ...customerDoc.data(),
        }));
        callback(list);
      },
      (error) => {
        console.warn("Customers onSnapshot listener error:", error);
        onError?.(error);
        getCustomers(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeCustomers setup error:", err);
    getCustomers(businessId).then(callback);
    return () => {};
  }
}

// -----------------------------------------
// Get single customer
// -----------------------------------------
export async function getCustomer(businessId, customerId) {
  const customerRef = doc(db, "businesses", businessId, "customers", customerId);
  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    tags: [],
    ...snapshot.data(),
  };
}

// -----------------------------------------
// Create customer
// -----------------------------------------
export async function createCustomer(businessId, customerData) {
  const customersRef = collection(db, "businesses", businessId, "customers");
  const totalSpent = Number(customerData.totalSpent) || 0;
  const tags = Array.isArray(customerData.tags) ? customerData.tags : [];

  const customerRef = await addDoc(customersRef, {
    ...customerData,
    totalSpent,
    tags,
    status: customerData.status || "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Record form submission in universal form_submissions collection
  recordFormSubmission(businessId, {
    formType: "customer",
    formTitle: `Add Customer: ${customerData.name || "Customer"}`,
    contactName: customerData.name || "",
    contactEmail: customerData.email || "",
    contactPhone: customerData.phone || "",
    data: customerData,
    entityId: customerRef.id,
    entityCollection: "customers",
  });

  // Automatically log creation activity
  try {
    const activitiesRef = collection(
      db,
      "businesses",
      businessId,
      "customers",
      customerRef.id,
      "activities"
    );
    await addDoc(activitiesRef, {
      title: "Customer Profile Created",
      description: `Customer ${customerData.name} was added to CRM with status: ${customerData.status || "Active"}.`,
      type: "created",
      createdAt: serverTimestamp(),
    });

    // Also log to business-wide timeline
    logActivity(businessId, {
      type: "CUSTOMER_CREATED",
      title: "Customer Profile Created",
      description: `${customerData.name} added as a client (${customerData.company || "Individual"}).`,
      entityId: customerRef.id,
      entityType: "customer",
    });

    if (customerData.notes && customerData.notes.trim()) {
      const notesRef = collection(
        db,
        "businesses",
        businessId,
        "customers",
        customerRef.id,
        "notes"
      );
      await addDoc(notesRef, {
        text: customerData.notes.trim(),
        author: "System / Admin",
        createdAt: serverTimestamp(),
      });
    }
  } catch (logErr) {
    console.warn("Could not log initial activity:", logErr);
  }

  return {
    id: customerRef.id,
    ...customerData,
    totalSpent,
    tags,
  };
}

// -----------------------------------------
// Update customer
// -----------------------------------------
export async function updateCustomer(businessId, customerId, customerData) {
  const customerRef = doc(db, "businesses", businessId, "customers", customerId);

  const totalSpent =
    customerData.totalSpent !== undefined
      ? Number(customerData.totalSpent) || 0
      : undefined;

  const dataToUpdate = {
    ...customerData,
    ...(totalSpent !== undefined ? { totalSpent } : {}),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(customerRef, dataToUpdate);

  // Record form submission audit
  recordFormSubmission(businessId, {
    formType: "customer_update",
    formTitle: `Update Customer: ${customerData.name || customerId}`,
    contactName: customerData.name || "",
    contactEmail: customerData.email || "",
    contactPhone: customerData.phone || "",
    data: { customerId, ...dataToUpdate },
    entityId: customerId,
    entityCollection: "customers",
  });

  // Log activity
  try {
    const activitiesRef = collection(
      db,
      "businesses",
      businessId,
      "customers",
      customerId,
      "activities"
    );
    await addDoc(activitiesRef, {
      title: "Profile Updated",
      description: `Customer information was modified. Status: ${customerData.status || "Updated"}.`,
      type: "updated",
      createdAt: serverTimestamp(),
    });
  } catch (logErr) {
    console.warn("Could not log update activity:", logErr);
  }

  return {
    id: customerId,
    ...dataToUpdate,
  };
}

// -----------------------------------------
// Delete customer
// -----------------------------------------
export async function deleteCustomer(businessId, customerId) {
  const customerRef = doc(db, "businesses", businessId, "customers", customerId);
  await deleteDoc(customerRef);
}

// -----------------------------------------
// Customer Activities Subcollection
// -----------------------------------------
export async function getCustomerActivities(businessId, customerId) {
  try {
    const activitiesRef = collection(
      db,
      "businesses",
      businessId,
      "customers",
      customerId,
      "activities"
    );
    const q = query(activitiesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("Error getting activities:", error);
    return [];
  }
}

export async function addCustomerActivity(businessId, customerId, activityData) {
  const activitiesRef = collection(
    db,
    "businesses",
    businessId,
    "customers",
    customerId,
    "activities"
  );
  const docRef = await addDoc(activitiesRef, {
    ...activityData,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...activityData };
}

// -----------------------------------------
// Customer Notes Subcollection
// -----------------------------------------
export async function getCustomerNotes(businessId, customerId) {
  try {
    const notesRef = collection(
      db,
      "businesses",
      businessId,
      "customers",
      customerId,
      "notes"
    );
    const q = query(notesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("Error getting customer notes:", error);
    return [];
  }
}

export async function addCustomerNote(businessId, customerId, noteData) {
  const notesRef = collection(
    db,
    "businesses",
    businessId,
    "customers",
    customerId,
    "notes"
  );
  const docRef = await addDoc(notesRef, {
    ...noteData,
    createdAt: serverTimestamp(),
  });

  // Record form submission audit
  recordFormSubmission(businessId, {
    formType: "customer_note",
    formTitle: "Customer Note Added",
    data: { customerId, ...noteData },
    entityId: docRef.id,
    entityCollection: "customers",
  });

  // Also log to activities
  try {
    await addCustomerActivity(businessId, customerId, {
      title: "Note Added",
      description: noteData.text.slice(0, 100) + (noteData.text.length > 100 ? "..." : ""),
      type: "note",
    });
  } catch (e) {
    console.warn("Could not log activity for note:", e);
  }

  return { id: docRef.id, ...noteData };
}

// -----------------------------------------
// Ensure Customer Record Exists & Up-to-date
// (Syncs customer on online portal booking)
// -----------------------------------------
export async function ensureCustomerRecord(businessId, customerData) {
  if (!businessId || !customerData?.email) return null;
  const email = customerData.email.toLowerCase().trim();
  const customersRef = collection(db, "businesses", businessId, "customers");

  try {
    const q = query(customersRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      const existingData = existingDoc.data();
      const currentAppointments = Number(existingData.totalAppointments || 0);
      const updatePayload = {
        totalAppointments: currentAppointments + 1,
        lastBookingDate: customerData.date || new Date().toISOString().split("T")[0],
        updatedAt: serverTimestamp(),
      };
      if (customerData.phone && !existingData.phone) {
        updatePayload.phone = customerData.phone;
      }
      if (customerData.name && (!existingData.name || existingData.name === "Valued Client")) {
        updatePayload.name = customerData.name;
      }
      if (customerData.price) {
        updatePayload.totalSpent = (Number(existingData.totalSpent) || 0) + Number(customerData.price || 0);
      }
      await updateDoc(doc(db, "businesses", businessId, "customers", existingDoc.id), updatePayload);
      return { id: existingDoc.id, ...existingData, ...updatePayload };
    }
  } catch (err) {
    console.warn("Could not query existing customer by email, attempting creation:", err);
  }

  try {
    const newDoc = await addDoc(customersRef, {
      name: customerData.name || customerData.clientName || "Online Client",
      email: email,
      phone: customerData.phone || customerData.clientPhone || "",
      company: customerData.company || "Individual",
      status: "Active",
      totalSpent: Number(customerData.price || 0),
      totalAppointments: 1,
      source: "Online Customer Portal",
      tags: ["Online Booking", "Portal Client"],
      lastBookingDate: customerData.date || new Date().toISOString().split("T")[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: newDoc.id, email, ...customerData };
  } catch (e) {
    console.error("Error creating customer record in ensureCustomerRecord:", e);
    return null;
  }
}