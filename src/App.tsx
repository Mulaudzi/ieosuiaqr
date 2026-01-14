import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateQRCode from "./pages/CreateQRCode";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import VerificationRequired from "./pages/VerificationRequired";
import GoogleCallback from "./pages/GoogleCallback";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Documentation from "./pages/Documentation";
import BillingSuccess from "./pages/BillingSuccess";
import BillingError from "./pages/BillingError";
import Scan from "./pages/Scan";
import ItemHistory from "./pages/ItemHistory";
import Inventory from "./pages/Inventory";
import InventoryAnalytics from "./pages/InventoryAnalytics";
import Careers from "./pages/Careers";
import Solutions from "./pages/Solutions";
import SolutionDetail from "./pages/SolutionDetail";
import AdminIndex from "./pages/AdminIndex";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmails from "./pages/AdminEmails";
import AdminSettings from "./pages/AdminSettings";
import AdminStats from "./pages/AdminStats";
import AdminQA from "./pages/AdminQA";
import AdminCreate from "./pages/AdminCreate";
import AdminUsers from "./pages/AdminUsers";
import AdminAuditLog from "./pages/AdminAuditLog";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import Subscription from "./pages/Subscription";
import QA from "./pages/QA";
import TestDashboard from "./pages/TestDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/verification-required" element={<ProtectedRoute requireVerified={false}><VerificationRequired /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/create" element={<ProtectedRoute><CreateQRCode /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/dashboard/inventory/analytics" element={<ProtectedRoute><InventoryAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/dashboard/qa" element={<ProtectedRoute><QA /></ProtectedRoute>} />
            <Route path="/dashboard/tests" element={<ProtectedRoute><TestDashboard /></ProtectedRoute>} />
            <Route path="/scan/:id" element={<Scan />} />
            <Route path="/scan/:id/history" element={<ItemHistory />} />
            <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />
            <Route path="/billing/error" element={<BillingError />} />
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/emails" element={<AdminEmails />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/qa" element={<AdminQA />} />
            <Route path="/admin/create" element={<AdminCreate />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          <WhatsAppButton />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
