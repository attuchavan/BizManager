import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../common/PageLoader";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PageLoader
        fullScreen
        message="Loading your workspace..."
        subtitle="Verifying credentials & business session..."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If the user registered as a customer/client and attempts to access the internal /app dashboard, route them to their customer portal
  if (
    userProfile?.accountType === "customer" &&
    location.pathname.startsWith("/app")
  ) {
    return <Navigate to="/customer/portal" replace />;
  }

  return children;
}

export default ProtectedRoute;