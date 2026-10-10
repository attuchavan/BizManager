import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../config/firebase";


// --------------------------------------------------
// Get all memberships for a user
// --------------------------------------------------

export async function getUserMemberships(userId) {
  const membershipsRef = collection(
    db,
    "users",
    userId,
    "memberships"
  );

  const snapshot = await getDocs(membershipsRef);

  const memberships = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));


  // --------------------------------------------------
  // Existing owner migration
  // --------------------------------------------------

  if (memberships.length === 0) {

    const businessesRef = collection(
      db,
      "businesses"
    );

    const ownerQuery = query(
      businessesRef,
      where("ownerId", "==", userId)
    );

    const businessSnapshot =
      await getDocs(ownerQuery);


    if (!businessSnapshot.empty) {

      const batch = writeBatch(db);

      businessSnapshot.forEach((businessDoc) => {

        const businessId = businessDoc.id;

        const businessData =
          businessDoc.data();


        // User membership index
        const membershipRef = doc(
          db,
          "users",
          userId,
          "memberships",
          businessId
        );


        batch.set(membershipRef, {
          businessId,

          businessName:
            businessData.name || "Business",

          role: "OWNER",

          status: "active",

          joinedAt: serverTimestamp(),
        });

      });


      await batch.commit();


      // Read memberships again
      const updatedSnapshot =
        await getDocs(membershipsRef);


      return updatedSnapshot.docs.map(
        (docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })
      );

    }

  }


  return memberships;
}