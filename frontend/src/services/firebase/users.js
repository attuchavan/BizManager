import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../config/firebase";

export async function createUserProfile({
  uid,
  name,
  email,
  accountType = "business_owner",
  phone = "",
}) {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      uid,
      name,
      email,
      accountType,
      phone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateUserProfile(uid, updates) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { id: uid, ...updates };
}