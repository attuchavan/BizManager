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

export async function getExpenses(businessId) {
  try {
    const expensesRef = collection(db, "businesses", businessId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
}

export function subscribeExpenses(businessId, callback, onError) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const expensesRef = collection(db, "businesses", businessId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      },
      (error) => {
        console.warn("Expenses onSnapshot listener error:", error);
        onError?.(error);
        getExpenses(businessId).then(callback);
      }
    );
  } catch (err) {
    console.warn("subscribeExpenses setup error:", err);
    getExpenses(businessId).then(callback);
    return () => {};
  }
}

export async function createExpense(businessId, expenseData) {
  const expensesRef = collection(db, "businesses", businessId, "expenses");
  const amount = Number(expenseData.amount) || 0;
  const docRef = await addDoc(expensesRef, {
    ...expenseData,
    amount,
    createdAt: serverTimestamp(),
  });

  logActivity(businessId, {
    type: "EXPENSE_ADDED",
    title: "Expense Logged",
    description: `₹${amount.toLocaleString("en-IN")} logged for ${expenseData.category || "General"}: ${expenseData.title || expenseData.description || "Operational Cost"}.`,
    entityId: docRef.id,
    entityType: "expense",
    amount,
  });

  // Record form submission in universal form_submissions collection
  recordFormSubmission(businessId, {
    formType: "expense",
    formTitle: "Log Expense",
    data: expenseData,
    entityId: docRef.id,
    entityCollection: "expenses",
  });

  return { id: docRef.id, ...expenseData, amount };
}

export async function updateExpense(businessId, expenseId, expenseData) {
  const expenseRef = doc(db, "businesses", businessId, "expenses", expenseId);
  const amount =
    expenseData.amount !== undefined ? Number(expenseData.amount) || 0 : undefined;
  const dataToUpdate = {
    ...expenseData,
    ...(amount !== undefined ? { amount } : {}),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(expenseRef, dataToUpdate);

  recordFormSubmission(businessId, {
    formType: "expense_update",
    formTitle: `Update Expense (${expenseData.title || expenseData.category || expenseId})`,
    data: { expenseId, ...dataToUpdate },
    entityId: expenseId,
    entityCollection: "expenses",
  });

  return { id: expenseId, ...dataToUpdate };
}

export async function deleteExpense(businessId, expenseId) {
  const expenseRef = doc(db, "businesses", businessId, "expenses", expenseId);
  await deleteDoc(expenseRef);
}
