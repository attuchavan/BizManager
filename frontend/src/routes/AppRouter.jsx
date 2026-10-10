import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/public/Landing";
import ExploreStores from "../pages/public/ExploreStores";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import EmailVerification from "../pages/auth/EmailVerification";
import CustomerPortal from "../pages/customer/CustomerPortal";
import CreateBuisness from "../pages/onboarding/CreateBuisness";

import Dashboard from "../pages/app/Dashboard";
import Customers from "../pages/app/Customers";
import Leads from "../pages/app/Leads";
import Appointments from "../pages/app/Appointments";
import Invoices from "../pages/app/Invoices";
import Payments from "../pages/app/Payments";
import Expenses from "../pages/app/Expenses";
import Services from "../pages/app/Services";
import Employees from "../pages/app/Employees";
import Marketing from "../pages/app/Marketing";
import AiCopilot from "../pages/app/AiCopilot";
import Analytics from "../pages/app/Analytics";
import Settings from "../pages/app/Settings";
import FormSubmissions from "../pages/app/FormSubmissions";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PageLoader from "../components/common/PageLoader";

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <PageLoader
            fullScreen
            message="Loading page..."
            subtitle="Preparing workspace views..."
          />
        }
      >
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/explore" element={<ExploreStores />} />
        <Route path="/stores" element={<ExploreStores />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <CreateBuisness />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-business"
          element={
            <ProtectedRoute>
              <CreateBuisness />
            </ProtectedRoute>
          }
        />

        {/* Customer Portal (Protected Client View) */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/portal"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />

        {/* Protected Application Workspace */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="leads" element={<Leads />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="services" element={<Services />} />
          <Route path="employees" element={<Employees />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="ai" element={<AiCopilot />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="forms" element={<FormSubmissions />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Not Found */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
              <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
              <p className="mt-2 text-slate-400">The page you were looking for doesn't exist.</p>
              <a
                href="/app"
                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Return to Workspace
              </a>
            </div>
          }
        />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
}

export default AppRouter;
