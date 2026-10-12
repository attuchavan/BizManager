import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../config/firebase";

// ============================================================================
// Multi-Collection User Architecture:
// 1. users          - Universal identity record
// 2. admins         - Platform / System administrators with elevated permissions
// 3. business_owners- Business / Clinic / Store proprietors & workspace admins
// 4. clients        - Self-serve clients, customers, and patients
// ============================================================================

/**
 * Creates or updates user profiles across universal and role-specific collections.
 */
export async function createUserProfile({
  uid,
  name,
  email,
  accountType = "business_owner",
  role = null,
  phone = "",
  businessName = "",
  businessType = "",
  address = "",
  metadata = {},
}) {
  const timestamp = serverTimestamp();
  const normalizedAccountType =
    accountType === "admin"
      ? "admin"
      : accountType === "customer" || accountType === "client"
      ? "client"
      : "business_owner";

  const resolvedRole =
    role ||
    (normalizedAccountType === "admin"
      ? "ADMIN"
      : normalizedAccountType === "client"
      ? "CLIENT"
      : "OWNER");

  // 1. Universal "users" collection
  const userRef = doc(db, "users", uid);
  const baseUserData = {
    uid,
    name,
    email,
    phone,
    role: resolvedRole,
    accountType: normalizedAccountType,
    updatedAt: timestamp,
  };

  await setDoc(
    userRef,
    {
      ...baseUserData,
      createdAt: timestamp,
    },
    { merge: true }
  );

  // 2. Role-specific collection provisioning
  if (normalizedAccountType === "admin") {
    // Dedicated "admins" collection
    const adminRef = doc(db, "admins", uid);
    await setDoc(
      adminRef,
      {
        uid,
        name,
        email,
        phone,
        role: "ADMIN",
        accessLevel: "superadmin",
        permissions: ["manage_users", "manage_businesses", "analytics", "audit_logs", "compliance"],
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
        ...metadata,
      },
      { merge: true }
    );
  } else if (normalizedAccountType === "business_owner") {
    // Dedicated "business_owners" collection
    const ownerRef = doc(db, "business_owners", uid);
    await setDoc(
      ownerRef,
      {
        uid,
        name,
        email,
        phone,
        role: "OWNER",
        businessName: businessName || `${name}'s Business`,
        businessType: businessType || "Consulting",
        status: "active",
        subscriptionTier: "pro_trial",
        createdAt: timestamp,
        updatedAt: timestamp,
        ...metadata,
      },
      { merge: true }
    );
  } else if (normalizedAccountType === "client") {
    // Dedicated "clients" collection
    const clientRef = doc(db, "clients", uid);
    await setDoc(
      clientRef,
      {
        uid,
        name,
        email,
        phone,
        address,
        role: "CLIENT",
        status: "active",
        totalBookings: 0,
        totalSpent: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...metadata,
      },
      { merge: true }
    );
  }

  return {
    id: uid,
    uid,
    name,
    email,
    accountType: normalizedAccountType,
    role: resolvedRole,
  };
}

/**
 * Retrieves the comprehensive profile of a user, aggregating role-specific details.
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  // 1. Fetch base user document
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  let profile = snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  // 2. Check role-specific collections to enrich profile
  const roleCollections = ["admins", "business_owners", "clients"];
  for (const col of roleCollections) {
    try {
      const roleRef = doc(db, col, uid);
      const roleSnap = await getDoc(roleRef);
      if (roleSnap.exists()) {
        const roleData = roleSnap.data();
        profile = {
          ...(profile || { id: uid, uid }),
          ...roleData,
          collectionSource: col,
          accountType:
            col === "admins"
              ? "admin"
              : col === "clients"
              ? "client"
              : "business_owner",
        };
        break;
      }
    } catch (e) {
      // ignore individual collection read failure if restricted by rules
    }
  }

  return profile;
}

/**
 * Updates a user profile across both the master 'users' collection and their role collection.
 */
export async function updateUserProfile(uid, updates, targetAccountType = null) {
  if (!uid) return null;
  const timestamp = serverTimestamp();

  // 1. Update in master users collection
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      ...updates,
      updatedAt: timestamp,
    },
    { merge: true }
  );

  // 2. Resolve accountType
  const accountType =
    targetAccountType ||
    updates.accountType ||
    (await getUserProfile(uid))?.accountType;

  // 3. Update in dedicated role collection
  if (accountType === "admin") {
    const adminRef = doc(db, "admins", uid);
    await setDoc(adminRef, { ...updates, updatedAt: timestamp }, { merge: true });
  } else if (accountType === "business_owner" || accountType === "business") {
    const ownerRef = doc(db, "business_owners", uid);
    await setDoc(ownerRef, { ...updates, updatedAt: timestamp }, { merge: true });
  } else if (accountType === "client" || accountType === "customer") {
    const clientRef = doc(db, "clients", uid);
    await setDoc(clientRef, { ...updates, updatedAt: timestamp }, { merge: true });
  }

  return { id: uid, ...updates };
}

// ----------------------------------------------------------------------------
// Dedicated Collection Query Helpers
// ----------------------------------------------------------------------------

export async function getAdminProfile(uid) {
  const adminSnap = await getDoc(doc(db, "admins", uid));
  return adminSnap.exists() ? { id: adminSnap.id, ...adminSnap.data() } : null;
}

export async function getBusinessOwnerProfile(uid) {
  const ownerSnap = await getDoc(doc(db, "business_owners", uid));
  return ownerSnap.exists() ? { id: ownerSnap.id, ...ownerSnap.data() } : null;
}

export async function getClientProfile(uid) {
  const clientSnap = await getDoc(doc(db, "clients", uid));
  return clientSnap.exists() ? { id: clientSnap.id, ...clientSnap.data() } : null;
}

export async function getAllAdmins() {
  const snap = await getDocs(collection(db, "admins"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllBusinessOwners() {
  const snap = await getDocs(collection(db, "business_owners"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllClients() {
  const snap = await getDocs(collection(db, "clients"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}