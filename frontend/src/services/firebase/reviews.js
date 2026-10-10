import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { logActivity } from "./activities";
import { recordFormSubmission } from "./formSubmissions";

export async function createReview(businessId, reviewData) {
  try {
    const reviewsRef = collection(db, "businesses", businessId, "reviews");
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      rating: Number(reviewData.rating) || 5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logActivity(businessId, {
      type: "REVIEW_SUBMITTED",
      title: "Client Review Submitted",
      description: `${reviewData.customerName || "Client"} left a ${reviewData.rating}-star review for ${reviewData.serviceName || "Service"}.`,
      entityId: docRef.id,
      entityType: "review",
    });

    // Record form submission audit
    recordFormSubmission(businessId, {
      formType: "review",
      formTitle: `Client Review (${reviewData.rating} Stars - ${reviewData.serviceName || "Service"})`,
      contactName: reviewData.customerName,
      contactEmail: reviewData.customerEmail,
      data: reviewData,
      entityId: docRef.id,
      entityCollection: "reviews",
    });

    return { id: docRef.id, ...reviewData };
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

export async function getCustomerReviews(businessId, customerEmail) {
  try {
    const reviewsRef = collection(db, "businesses", businessId, "reviews");
    const q = query(
      reviewsRef,
      where("customerEmail", "==", customerEmail.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("Error getting customer reviews with filter, fetching all reviews:", error);
    try {
      const reviewsRef = collection(db, "businesses", businessId, "reviews");
      const snapshot = await getDocs(reviewsRef);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (r) =>
            (r.customerEmail || "").toLowerCase() === customerEmail.toLowerCase()
        );
    } catch (e) {
      console.error("Fallback error getting reviews:", e);
      return [];
    }
  }
}

export async function getBusinessReviews(businessId) {
  try {
    const reviewsRef = collection(db, "businesses", businessId, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting business reviews:", error);
    return [];
  }
}
