import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export async function createNotification(businessId, notificationData) {
  try {
    const notifsRef = collection(db, "businesses", businessId, "notifications");
    const docRef = await addDoc(notifsRef, {
      ...notificationData,
      recipientEmail: (notificationData.recipientEmail || "").toLowerCase(),
      read: false,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...notificationData, read: false };
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function getCustomerNotifications(businessId, customerEmail) {
  try {
    const notifsRef = collection(db, "businesses", businessId, "notifications");
    const q = query(notifsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const email = (customerEmail || "").toLowerCase();
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((n) => {
        if (!email) return true;
        const target = (n.recipientEmail || "").toLowerCase();
        return !target || target === email || target === "all";
      });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(businessId, notificationId) {
  try {
    const notifRef = doc(db, "businesses", businessId, "notifications", notificationId);
    await updateDoc(notifRef, { read: true, readAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllNotificationsAsRead(businessId, notificationIds = []) {
  try {
    await Promise.all(
      notificationIds.map((id) =>
        updateDoc(doc(db, "businesses", businessId, "notifications", id), {
          read: true,
          readAt: serverTimestamp(),
        })
      )
    );
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}
