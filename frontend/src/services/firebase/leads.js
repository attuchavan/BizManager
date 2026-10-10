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
import { createCustomer } from "./customers";
import { logActivity } from "./activities";
import { recordFormSubmission } from "./formSubmissions";

// -----------------------------------------
// Get All Leads
// -----------------------------------------
export async function getLeads(businessId) {
  try {
    const leadsRef = collection(db, "businesses", businessId, "leads");
    const q = query(leadsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      assignedTo: d.data().assignedTo || "Unassigned",
      followUpDate: d.data().followUpDate || "",
      ...d.data(),
    }));
  } catch (error) {
    console.error("Error getting leads:", error);
    return [];
  }
}

export function subscribeLeads(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const leadsRef = collection(db, "businesses", businessId, "leads");
    const q = query(leadsRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          assignedTo: d.data().assignedTo || "Unassigned",
          followUpDate: d.data().followUpDate || "",
          ...d.data(),
        }));
        callback(list);
      },
      (error) => {
        console.warn("Leads onSnapshot listener error:", error);
        onError?.(error);
        getLeads(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeLeads setup error:", err);
    getLeads(businessId).then(callback);
    return () => {};
  }
}

// -----------------------------------------
// Get Single Lead
// -----------------------------------------
export async function getLead(businessId, leadId) {
  const leadRef = doc(db, "businesses", businessId, "leads", leadId);
  const snapshot = await getDoc(leadRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// -----------------------------------------
// Create Lead
// -----------------------------------------
export async function createLead(businessId, leadData) {
  const leadsRef = collection(db, "businesses", businessId, "leads");
  const estimatedValue = Number(leadData.estimatedValue) || 0;

  const docRef = await addDoc(leadsRef, {
    ...leadData,
    estimatedValue,
    status: leadData.status || "New",
    source: leadData.source || "Website",
    assignedTo: leadData.assignedTo || "Unassigned",
    followUpDate: leadData.followUpDate || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Record form submission in universal form_submissions collection
  recordFormSubmission(businessId, {
    formType: "lead",
    formTitle: `Create Lead: ${leadData.name || "New Lead"}`,
    contactName: leadData.name || "",
    contactEmail: leadData.email || "",
    contactPhone: leadData.phone || "",
    data: leadData,
    entityId: docRef.id,
    entityCollection: "leads",
  });

  // Automatically log initial activity
  try {
    const actRef = collection(db, "businesses", businessId, "leads", docRef.id, "activities");
    await addDoc(actRef, {
      title: "Lead Created",
      description: `Prospect ${leadData.name} registered from ${leadData.source || "Website"}.`,
      type: "created",
      createdAt: serverTimestamp(),
    });

    logActivity(businessId, {
      type: "LEAD_CREATED",
      title: "New Lead Captured",
      description: `${leadData.name} from ${leadData.source || "Website"} (Est. ₹${estimatedValue.toLocaleString("en-IN")}).`,
      entityId: docRef.id,
      entityType: "lead",
      amount: estimatedValue,
    });

    if (leadData.notes && leadData.notes.trim()) {
      const notesRef = collection(db, "businesses", businessId, "leads", docRef.id, "notes");
      await addDoc(notesRef, {
        text: leadData.notes.trim(),
        author: "CRM System",
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Could not log initial lead activity:", err);
  }

  return {
    id: docRef.id,
    ...leadData,
    estimatedValue,
  };
}

// -----------------------------------------
// Update Lead
// -----------------------------------------
export async function updateLead(businessId, leadId, leadData) {
  const leadRef = doc(db, "businesses", businessId, "leads", leadId);
  const estimatedValue =
    leadData.estimatedValue !== undefined
      ? Number(leadData.estimatedValue) || 0
      : undefined;

  const dataToUpdate = {
    ...leadData,
    ...(estimatedValue !== undefined ? { estimatedValue } : {}),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(leadRef, dataToUpdate);

  // Record form submission audit
  recordFormSubmission(businessId, {
    formType: "lead_update",
    formTitle: `Update Lead: ${leadData.name || leadId}`,
    contactName: leadData.name || "",
    contactEmail: leadData.email || "",
    contactPhone: leadData.phone || "",
    data: { leadId, ...dataToUpdate },
    entityId: leadId,
    entityCollection: "leads",
  });

  // Log activity
  try {
    const actRef = collection(db, "businesses", businessId, "leads", leadId, "activities");
    await addDoc(actRef, {
      title: "Lead Updated",
      description: `Lead details modified. Status: ${leadData.status || "In Pipeline"}. Assigned: ${leadData.assignedTo || "Unassigned"}.`,
      type: "updated",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not log update lead activity:", err);
  }

  return { id: leadId, ...dataToUpdate };
}

// -----------------------------------------
// Delete Lead
// -----------------------------------------
export async function deleteLead(businessId, leadId) {
  const leadRef = doc(db, "businesses", businessId, "leads", leadId);
  await deleteDoc(leadRef);
}

// -----------------------------------------
// Convert Lead to Customer
// -----------------------------------------
export async function convertLeadToCustomer(businessId, lead) {
  // 1. Create a customer profile
  const customer = await createCustomer(businessId, {
    name: lead.name,
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "Individual",
    status: "Active",
    totalSpent: Number(lead.estimatedValue) || 0,
    tags: ["Converted Lead", lead.source || "Website"],
    notes: `Converted from sales lead on ${new Date().toLocaleDateString()}. Original Notes: ${lead.notes || "None"}`,
  });

  // 2. Mark lead as Won and link customer ID
  await updateLead(businessId, lead.id, {
    status: "Won",
    convertedCustomerId: customer.id,
    convertedAt: serverTimestamp(),
  });

  // 3. Log activity on the lead
  try {
    const actRef = collection(db, "businesses", businessId, "leads", lead.id, "activities");
    await addDoc(actRef, {
      title: "Converted to Paying Customer",
      description: `Lead deal closed! Customer account ${customer.id} generated with ₹${Number(lead.estimatedValue || 0).toLocaleString("en-IN")} deal volume.`,
      type: "conversion",
      createdAt: serverTimestamp(),
    });

    logActivity(businessId, {
      type: "LEAD_CONVERTED",
      title: "Lead Converted to Customer",
      description: `${lead.name} deal closed! Converted with value of ₹${Number(lead.estimatedValue || 0).toLocaleString("en-IN")}.`,
      entityId: lead.id,
      entityType: "lead",
      amount: Number(lead.estimatedValue || 0),
    });
  } catch (err) {
    console.warn("Could not log conversion activity:", err);
  }

  return customer;
}

// -----------------------------------------
// Lead Notes Subcollection
// -----------------------------------------
export async function getLeadNotes(businessId, leadId) {
  try {
    const notesRef = collection(db, "businesses", businessId, "leads", leadId, "notes");
    const q = query(notesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting lead notes:", err);
    return [];
  }
}

export async function addLeadNote(businessId, leadId, noteData) {
  const notesRef = collection(db, "businesses", businessId, "leads", leadId, "notes");
  const docRef = await addDoc(notesRef, {
    ...noteData,
    createdAt: serverTimestamp(),
  });

  // Record form submission audit
  recordFormSubmission(businessId, {
    formType: "lead_note",
    formTitle: "Lead Note Added",
    data: { leadId, ...noteData },
    entityId: docRef.id,
    entityCollection: "leads",
  });

  // Log activity
  try {
    const actRef = collection(db, "businesses", businessId, "leads", leadId, "activities");
    await addDoc(actRef, {
      title: "Note Added",
      description: noteData.text.slice(0, 100),
      type: "note",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not log activity for lead note:", err);
  }

  return { id: docRef.id, ...noteData };
}

// -----------------------------------------
// Lead Activities Subcollection
// -----------------------------------------
export async function getLeadActivities(businessId, leadId) {
  try {
    const actRef = collection(db, "businesses", businessId, "leads", leadId, "activities");
    const q = query(actRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting lead activities:", err);
    return [];
  }
}

export async function addLeadActivity(businessId, leadId, activityData) {
  const actRef = collection(db, "businesses", businessId, "leads", leadId, "activities");
  const docRef = await addDoc(actRef, {
    ...activityData,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...activityData };
}
