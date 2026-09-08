import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import CentralAuthRedirect from "@/components/auth/CentralAuthRedirect";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateQRCode = lazy(() => import("./pages/CreateQRCode"));
const EditQRCode = lazy(() => import("./pages/EditQRCode"));
const Settings = lazy(() => import("./pages/Settings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const VerificationRequired = lazy(() => import("./pages/VerificationRequired"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Scan = lazy(() => import("./pages/Scan"));
const ScanRedirect = lazy(() => import("./pages/ScanRedirect"));
const ItemHistory = lazy(() => import("./pages/ItemHistory"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryAnalytics = lazy(() => import("./pages/InventoryAnalytics"));
const Careers = lazy(() => import("./pages/Careers"));
const Solutions = lazy(() => import("./pages/Solutions"));
const SolutionDetail = lazy(() => import("./pages/SolutionDetail"));
const AdminIndex = lazy(() => import("./pages/AdminIndex"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEmails = lazy(() => import("./pages/AdminEmails"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminStats = lazy(() => import("./pages/AdminStats"));
const AdminCreate = lazy(() => import("./pages/AdminCreate"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen grid place-items-center" role="status">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<CentralAuthRedirect />} />
              <Route path="/signup" element={<CentralAuthRedirect mode="signup" />} />
              <Route path="/auth/callback" element={<CentralAuthRedirect callback />} />
              <Route path="/admin/auth/callback" element={<CentralAuthRedirect mode="admin" callback />} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verification-required" element={<ProtectedRoute requireVerified={false}><VerificationRequired /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/create" element={<ProtectedRoute><CreateQRCode /></ProtectedRoute>} />
              <Route path="/dashboard/edit/:id" element={<ProtectedRoute><EditQRCode /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="/dashboard/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/dashboard/inventory/analytics" element={<ProtectedRoute><InventoryAnalytics /></ProtectedRoute>} />
              <Route path="/scan/:id" element={<Scan />} />
              <Route path="/go/:id" element={<ScanRedirect />} />
              <Route path="/scan/:id/history" element={<ItemHistory />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/solutions/:solutionId" element={<SolutionDetail />} />
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/admin/login" element={<CentralAuthRedirect mode="admin" />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/emails" element={<AdminEmails />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/stats" element={<AdminStats />} />
              <Route path="/admin/create" element={<AdminCreate />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/audit" element={<AdminAuditLog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CookieConsent />
            <WhatsAppButton />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
