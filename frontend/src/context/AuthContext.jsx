import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";

import { getUserProfile } from "../services/firebase/users";

import {
  getUserMemberships,
} from "../services/firebase/memberships";

import { createBusiness } from "../services/firebase/businesses";
import { logoutUser } from "../services/firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [firestoreError, setFirestoreError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            setCurrentUser(null);
            setUserProfile(null);
            setMemberships([]);
            setActiveBusiness(null);
            setFirestoreError(null);
            return;
          }

          setCurrentUser(firebaseUser);
          setFirestoreError(null);

          let profile = null;
          try {
            profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (pErr) {
            console.warn("Could not fetch user profile from Firestore:", pErr);
            if (pErr?.code === "permission-denied") {
              setFirestoreError("Firestore permission denied. Check your Firebase security rules.");
            }
          }

          let userMemberships = [];
          try {
            userMemberships = await getUserMemberships(firebaseUser.uid);
          } catch (mErr) {
            console.warn("Could not fetch user memberships from Firestore:", mErr);
            if (mErr?.code === "permission-denied") {
              setFirestoreError("Firestore permission denied. Check your Firebase security rules.");
            }
          }

          // If no memberships found and user is a business owner or admin, auto-provision a default workspace
          const isClientOnly =
            profile?.accountType === "client" || profile?.accountType === "customer";

          if (!isClientOnly && (!userMemberships || userMemberships.length === 0)) {
            const defaultBizName = profile?.name ? `${profile.name}'s Business` : "My Business";
            let defaultBizId = `biz_${firebaseUser.uid.slice(0, 12)}`;

            try {
              const created = await createBusiness({
                ownerId: firebaseUser.uid,
                businessName: defaultBizName,
                businessType: "Clinic & Healthcare",
              });
              if (created?.businessId) {
                defaultBizId = created.businessId;
              }
            } catch (createBizErr) {
              console.warn("Auto-provisioning business in Firestore skipped/failed:", createBizErr);
            }

            const initialMembership = {
              businessId: defaultBizId,
              businessName: defaultBizName,
              role: "OWNER",
              status: "active",
            };
            userMemberships = [initialMembership];
          }

          setMemberships(userMemberships || []);

          if (userMemberships.length > 0) {
            const savedBusinessId = localStorage.getItem("activeBusinessId");
            const savedBusiness = userMemberships.find(
              (membership) => membership.businessId === savedBusinessId
            );

            const chosen = savedBusiness || userMemberships[0];
            setActiveBusiness(chosen);
            if (chosen?.businessId) {
              localStorage.setItem("activeBusinessId", chosen.businessId);
            }
          }
        } catch (error) {
          console.error("Auth state error:", error);
          if (error?.code === "permission-denied") {
            setFirestoreError("Firestore permission denied. Update rules in Firebase Console.");
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  async function logout() {
    localStorage.removeItem("activeBusinessId");
    await logoutUser();
  }

  function switchBusiness(businessId) {
    const business = memberships.find(
      (membership) => membership.businessId === businessId
    );

    if (!business) {
      return;
    }

    setActiveBusiness(business);
    localStorage.setItem("activeBusinessId", business.businessId);
  }

  function updateActiveBusiness(updatedFields) {
    setActiveBusiness((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      setMemberships((currentMemberships) =>
        currentMemberships.map((m) =>
          m.businessId === updated.businessId ? { ...m, ...updatedFields } : m
        )
      );
      return updated;
    });
  }

  function ensureBusinessId() {
    return (
      activeBusiness?.businessId ||
      localStorage.getItem("activeBusinessId") ||
      (currentUser ? `biz_${currentUser.uid.slice(0, 12)}` : "default_business")
    );
  }

  const value = {
    currentUser,
    userProfile,
    memberships,
    activeBusiness,
    firestoreError,
    ensureBusinessId,
    switchBusiness,
    updateActiveBusiness,
    loading,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}