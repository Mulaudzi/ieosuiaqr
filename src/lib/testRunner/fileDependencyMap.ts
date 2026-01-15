// ============================================================================
// FILE DEPENDENCY MAP - Complete Application Structure
// ============================================================================

import { PageDependencyMap, FileDependency } from "./types";

// Application name for documentation
export const APP_NAME = "IEOSUIA QR";

// ============================================================================
// CORE FILE DEPENDENCIES
// ============================================================================

export const CORE_FILES: FileDependency[] = [
  // Entry Points
  { path: "src/main.tsx", type: "config", required: true, exists: true, description: "Application entry point", usedBy: ["All pages"] },
  { path: "src/App.tsx", type: "config", required: true, exists: true, description: "Root component with routing", usedBy: ["All pages"] },
  { path: "src/index.css", type: "style", required: true, exists: true, description: "Global styles and Tailwind config", usedBy: ["All pages"] },
  { path: "src/App.css", type: "style", required: false, exists: true, description: "App-specific styles", usedBy: ["App.tsx"] },
  
  // Contexts
  { path: "src/contexts/AuthContext.tsx", type: "context", required: true, exists: true, description: "Authentication state management", usedBy: ["All protected pages", "Header", "DashboardSidebar"] },
  
  // Core Components
  { path: "src/components/ErrorBoundary.tsx", type: "component", required: true, exists: true, description: "Global error boundary", usedBy: ["App.tsx"] },
  { path: "src/components/CookieConsent.tsx", type: "component", required: false, exists: true, description: "Cookie consent banner", usedBy: ["App.tsx"] },
  { path: "src/components/WhatsAppButton.tsx", type: "component", required: false, exists: true, description: "WhatsApp contact button", usedBy: ["App.tsx"] },
  { path: "src/components/NavLink.tsx", type: "component", required: false, exists: true, description: "Navigation link component", usedBy: ["Header", "Footer"] },
  
  // Layout Components
  { path: "src/components/layout/Header.tsx", type: "component", required: true, exists: true, description: "Main navigation header", usedBy: ["Index", "Public pages"] },
  { path: "src/components/layout/Footer.tsx", type: "component", required: true, exists: true, description: "Site footer", usedBy: ["Index", "Public pages"] },
  { path: "src/components/layout/DashboardSidebar.tsx", type: "component", required: true, exists: true, description: "Dashboard navigation sidebar", usedBy: ["All dashboard pages"] },
  
  // Auth Components
  { path: "src/components/auth/ProtectedRoute.tsx", type: "component", required: true, exists: true, description: "Route protection wrapper", usedBy: ["App.tsx routing"] },
  { path: "src/components/auth/PasswordStrengthIndicator.tsx", type: "component", required: false, exists: true, description: "Password strength UI", usedBy: ["Signup", "Settings"] },
  { path: "src/components/auth/SocialLoginButtons.tsx", type: "component", required: false, exists: true, description: "OAuth login buttons", usedBy: ["Login", "Signup"] },
  { path: "src/components/auth/TwoFactorSetup.tsx", type: "component", required: false, exists: true, description: "2FA configuration", usedBy: ["Settings"] },
];

// ============================================================================
// SERVICE FILES
// ============================================================================

export const SERVICE_FILES: FileDependency[] = [
  { path: "src/services/api/client.ts", type: "service", required: true, exists: true, description: "Axios API client with interceptors", usedBy: ["All API calls"] },
  { path: "src/services/api/types.ts", type: "service", required: true, exists: true, description: "API type definitions", usedBy: ["All API services"] },
  { path: "src/services/api/index.ts", type: "service", required: true, exists: true, description: "API exports barrel file", usedBy: ["Components using API"] },
  { path: "src/services/api/auth.ts", type: "service", required: true, exists: true, description: "Authentication API service", usedBy: ["AuthContext", "Login", "Signup"] },
  { path: "src/services/api/qrcodes.ts", type: "service", required: true, exists: true, description: "QR code CRUD API", usedBy: ["Dashboard", "CreateQRCode", "QR components"] },
  { path: "src/services/api/inventory.ts", type: "service", required: true, exists: true, description: "Inventory management API", usedBy: ["Inventory pages"] },
  { path: "src/services/api/analytics.ts", type: "service", required: true, exists: true, description: "Analytics data API", usedBy: ["Analytics", "Dashboard"] },
  { path: "src/services/api/billing.ts", type: "service", required: true, exists: true, description: "Billing and payment API", usedBy: ["Subscription", "Billing pages"] },
  { path: "src/services/api/admin.ts", type: "service", required: false, exists: true, description: "Admin panel API", usedBy: ["Admin pages"] },
  { path: "src/services/api/designPresets.ts", type: "service", required: false, exists: true, description: "Design presets API", usedBy: ["QRDesignCustomizer"] },
];

// ============================================================================
// HOOK FILES
// ============================================================================

export const HOOK_FILES: FileDependency[] = [
  { path: "src/hooks/use-toast.ts", type: "hook", required: true, exists: true, description: "Toast notification hook", usedBy: ["All pages with notifications"] },
  { path: "src/hooks/use-mobile.tsx", type: "hook", required: true, exists: true, description: "Mobile detection hook", usedBy: ["Responsive components"] },
  { path: "src/hooks/useQRStorage.ts", type: "hook", required: true, exists: true, description: "QR code state management", usedBy: ["Dashboard", "CreateQRCode"] },
  { path: "src/hooks/useQRDownload.ts", type: "hook", required: true, exists: true, description: "QR code download functionality", usedBy: ["QR components"] },
  { path: "src/hooks/useUserPlan.ts", type: "hook", required: true, exists: true, description: "User subscription plan hook", usedBy: ["Dashboard", "Subscription"] },
  { path: "src/hooks/useRateLimit.ts", type: "hook", required: false, exists: true, description: "Rate limiting hook", usedBy: ["Forms"] },
  { path: "src/hooks/useRecaptcha.ts", type: "hook", required: false, exists: true, description: "reCAPTCHA integration", usedBy: ["Login", "Signup"] },
  { path: "src/hooks/useAdminSession.ts", type: "hook", required: false, exists: true, description: "Admin session management", usedBy: ["Admin pages"] },
  { path: "src/hooks/useAdminLoginRateLimit.ts", type: "hook", required: false, exists: true, description: "Admin login rate limiting", usedBy: ["AdminLogin"] },
];

// ============================================================================
// PAGE DEPENDENCY MAPS
// ============================================================================

export const PAGE_DEPENDENCIES: PageDependencyMap[] = [
  // Public Pages
  {
    page: "Index (Landing)",
    route: "/",
    status: "complete",
    files: [
      { path: "src/pages/Index.tsx", type: "page", required: true, exists: true, description: "Landing page", usedBy: [] },
      { path: "src/components/layout/Header.tsx", type: "component", required: true, exists: true, description: "Navigation header", usedBy: ["Index"] },
      { path: "src/components/layout/Footer.tsx", type: "component", required: true, exists: true, description: "Site footer", usedBy: ["Index"] },
      { path: "src/components/landing/", type: "component", required: true, exists: true, description: "Landing page components", usedBy: ["Index"] },
    ],
  },
  {
    page: "Login",
    route: "/login",
    status: "complete",
    files: [
      { path: "src/pages/Login.tsx", type: "page", required: true, exists: true, description: "Login page", usedBy: [] },
      { path: "src/services/api/auth.ts", type: "service", required: true, exists: true, description: "Auth API", usedBy: ["Login"] },
      { path: "src/contexts/AuthContext.tsx", type: "context", required: true, exists: true, description: "Auth state", usedBy: ["Login"] },
      { path: "src/components/auth/SocialLoginButtons.tsx", type: "component", required: false, exists: true, description: "OAuth buttons", usedBy: ["Login"] },
    ],
  },
  {
    page: "Signup",
    route: "/signup",
    status: "complete",
    files: [
      { path: "src/pages/Signup.tsx", type: "page", required: true, exists: true, description: "Signup page", usedBy: [] },
      { path: "src/services/api/auth.ts", type: "service", required: true, exists: true, description: "Auth API", usedBy: ["Signup"] },
      { path: "src/components/auth/PasswordStrengthIndicator.tsx", type: "component", required: false, exists: true, description: "Password strength", usedBy: ["Signup"] },
    ],
  },
  
  // Dashboard Pages
  {
    page: "Dashboard",
    route: "/dashboard",
    status: "complete",
    files: [
      { path: "src/pages/Dashboard.tsx", type: "page", required: true, exists: true, description: "Main dashboard", usedBy: [] },
      { path: "src/components/layout/DashboardSidebar.tsx", type: "component", required: true, exists: true, description: "Sidebar navigation", usedBy: ["Dashboard"] },
      { path: "src/hooks/useQRStorage.ts", type: "hook", required: true, exists: true, description: "QR state", usedBy: ["Dashboard"] },
      { path: "src/services/api/qrcodes.ts", type: "service", required: true, exists: true, description: "QR API", usedBy: ["Dashboard"] },
      { path: "src/components/dashboard/DashboardTutorial.tsx", type: "component", required: false, exists: true, description: "Tutorial overlay", usedBy: ["Dashboard"] },
    ],
  },
  {
    page: "Create QR Code",
    route: "/dashboard/create",
    status: "complete",
    files: [
      { path: "src/pages/CreateQRCode.tsx", type: "page", required: true, exists: true, description: "QR creation page", usedBy: [] },
      { path: "src/components/qr/QRCodeRenderer.tsx", type: "component", required: true, exists: true, description: "QR preview renderer", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/QRDesignCustomizer.tsx", type: "component", required: true, exists: true, description: "Design customization", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/LogoUploader.tsx", type: "component", required: true, exists: true, description: "Logo upload", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/WiFiForm.tsx", type: "component", required: true, exists: true, description: "WiFi QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/VCardForm.tsx", type: "component", required: true, exists: true, description: "vCard QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/EventForm.tsx", type: "component", required: true, exists: true, description: "Event QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/LocationForm.tsx", type: "component", required: true, exists: true, description: "Location QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/SMSForm.tsx", type: "component", required: true, exists: true, description: "SMS QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/WhatsAppForm.tsx", type: "component", required: true, exists: true, description: "WhatsApp QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/SocialMediaForm.tsx", type: "component", required: true, exists: true, description: "Social media QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/AppForm.tsx", type: "component", required: true, exists: true, description: "App store QR form", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/UpsellModal.tsx", type: "component", required: false, exists: true, description: "Upgrade upsell", usedBy: ["CreateQRCode"] },
      { path: "src/components/qr/TemplateGallery.tsx", type: "component", required: false, exists: true, description: "Design templates", usedBy: ["CreateQRCode"] },
      { path: "src/services/api/qrcodes.ts", type: "service", required: true, exists: true, description: "QR API", usedBy: ["CreateQRCode"] },
      { path: "src/hooks/useQRStorage.ts", type: "hook", required: true, exists: true, description: "QR state", usedBy: ["CreateQRCode"] },
      { path: "src/hooks/useQRDownload.ts", type: "hook", required: true, exists: true, description: "Download logic", usedBy: ["CreateQRCode"] },
    ],
  },
  {
    page: "Analytics",
    route: "/dashboard/analytics",
    status: "complete",
    files: [
      { path: "src/pages/Analytics.tsx", type: "page", required: true, exists: true, description: "Analytics dashboard", usedBy: [] },
      { path: "src/services/api/analytics.ts", type: "service", required: true, exists: true, description: "Analytics API", usedBy: ["Analytics"] },
      { path: "src/components/analytics/", type: "component", required: false, exists: true, description: "Analytics components", usedBy: ["Analytics"] },
    ],
  },
  {
    page: "Profile",
    route: "/dashboard/profile",
    status: "complete",
    files: [
      { path: "src/pages/Profile.tsx", type: "page", required: true, exists: true, description: "User profile", usedBy: [] },
      { path: "src/components/profile/AvatarCropper.tsx", type: "component", required: false, exists: true, description: "Avatar editing", usedBy: ["Profile"] },
      { path: "src/services/api/auth.ts", type: "service", required: true, exists: true, description: "Auth/profile API", usedBy: ["Profile"] },
    ],
  },
  {
    page: "Settings",
    route: "/dashboard/settings",
    status: "complete",
    files: [
      { path: "src/pages/Settings.tsx", type: "page", required: true, exists: true, description: "User settings", usedBy: [] },
      { path: "src/components/settings/NotificationSettings.tsx", type: "component", required: true, exists: true, description: "Notification prefs", usedBy: ["Settings"] },
      { path: "src/components/auth/TwoFactorSetup.tsx", type: "component", required: false, exists: true, description: "2FA setup", usedBy: ["Settings"] },
    ],
  },
  {
    page: "Inventory",
    route: "/dashboard/inventory",
    status: "complete",
    files: [
      { path: "src/pages/Inventory.tsx", type: "page", required: true, exists: true, description: "Inventory management", usedBy: [] },
      { path: "src/services/api/inventory.ts", type: "service", required: true, exists: true, description: "Inventory API", usedBy: ["Inventory"] },
      { path: "src/components/inventory/InventoryTab.tsx", type: "component", required: true, exists: true, description: "Inventory list", usedBy: ["Inventory"] },
      { path: "src/components/inventory/CreateQRAndItemModal.tsx", type: "component", required: true, exists: true, description: "Create item modal", usedBy: ["Inventory"] },
      { path: "src/components/inventory/BulkInventoryImport.tsx", type: "component", required: false, exists: true, description: "Bulk import", usedBy: ["Inventory"] },
      { path: "src/components/inventory/QRLabelPrinter.tsx", type: "component", required: false, exists: true, description: "Label printing", usedBy: ["Inventory"] },
      { path: "src/components/inventory/ScanHistoryModal.tsx", type: "component", required: false, exists: true, description: "Scan history", usedBy: ["Inventory"] },
    ],
  },
  {
    page: "Subscription",
    route: "/dashboard/subscription",
    status: "complete",
    files: [
      { path: "src/pages/Subscription.tsx", type: "page", required: true, exists: true, description: "Subscription management", usedBy: [] },
      { path: "src/services/api/billing.ts", type: "service", required: true, exists: true, description: "Billing API", usedBy: ["Subscription"] },
      { path: "src/hooks/useUserPlan.ts", type: "hook", required: true, exists: true, description: "Plan hook", usedBy: ["Subscription"] },
    ],
  },
  {
    page: "Test Dashboard",
    route: "/dashboard/tests",
    status: "complete",
    files: [
      { path: "src/pages/TestDashboard.tsx", type: "page", required: true, exists: true, description: "Automated test dashboard", usedBy: [] },
      { path: "src/lib/testRunner/types.ts", type: "util", required: true, exists: true, description: "Test types", usedBy: ["TestDashboard"] },
      { path: "src/lib/testRunner/fileDependencyMap.ts", type: "util", required: true, exists: true, description: "File dependencies", usedBy: ["TestDashboard"] },
    ],
  },
];

// ============================================================================
// QR COMPONENTS
// ============================================================================

export const QR_COMPONENTS: FileDependency[] = [
  { path: "src/components/qr/QRCodeRenderer.tsx", type: "component", required: true, exists: true, description: "QR code preview component", usedBy: ["CreateQRCode", "QRViewModal"] },
  { path: "src/components/qr/QRDesignCustomizer.tsx", type: "component", required: true, exists: true, description: "QR design customization panel", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/LogoUploader.tsx", type: "component", required: true, exists: true, description: "Logo upload for QR codes", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/QRViewModal.tsx", type: "component", required: true, exists: true, description: "QR code view modal", usedBy: ["Dashboard"] },
  { path: "src/components/qr/QREditModal.tsx", type: "component", required: true, exists: true, description: "QR code edit modal", usedBy: ["Dashboard"] },
  { path: "src/components/qr/QRDeleteConfirmModal.tsx", type: "component", required: true, exists: true, description: "Delete confirmation modal", usedBy: ["Dashboard"] },
  { path: "src/components/qr/QRFramePreview.tsx", type: "component", required: false, exists: true, description: "Frame preview component", usedBy: ["QRDesignCustomizer"] },
  { path: "src/components/qr/DesignPresetManager.tsx", type: "component", required: false, exists: true, description: "Design preset management", usedBy: ["QRDesignCustomizer"] },
  { path: "src/components/qr/BulkCSVImport.tsx", type: "component", required: false, exists: true, description: "Bulk QR import from CSV", usedBy: ["Dashboard"] },
  { path: "src/components/qr/TemplateGallery.tsx", type: "component", required: false, exists: true, description: "Template selection gallery", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/UpsellModal.tsx", type: "component", required: false, exists: true, description: "Upgrade upsell modal", usedBy: ["CreateQRCode", "Dashboard"] },
  { path: "src/components/qr/WiFiForm.tsx", type: "component", required: true, exists: true, description: "WiFi QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/VCardForm.tsx", type: "component", required: true, exists: true, description: "vCard QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/EventForm.tsx", type: "component", required: true, exists: true, description: "Event QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/LocationForm.tsx", type: "component", required: true, exists: true, description: "Location QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/SMSForm.tsx", type: "component", required: true, exists: true, description: "SMS QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/WhatsAppForm.tsx", type: "component", required: true, exists: true, description: "WhatsApp QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/SocialMediaForm.tsx", type: "component", required: true, exists: true, description: "Social media QR form", usedBy: ["CreateQRCode"] },
  { path: "src/components/qr/AppForm.tsx", type: "component", required: true, exists: true, description: "App store QR form", usedBy: ["CreateQRCode"] },
];

// ============================================================================
// UI COMPONENTS (shadcn/ui)
// ============================================================================

export const UI_COMPONENTS: FileDependency[] = [
  { path: "src/components/ui/button.tsx", type: "component", required: true, exists: true, description: "Button component", usedBy: ["All pages"] },
  { path: "src/components/ui/card.tsx", type: "component", required: true, exists: true, description: "Card component", usedBy: ["Dashboard", "Analytics"] },
  { path: "src/components/ui/dialog.tsx", type: "component", required: true, exists: true, description: "Dialog/modal component", usedBy: ["Modals"] },
  { path: "src/components/ui/form.tsx", type: "component", required: true, exists: true, description: "Form components", usedBy: ["All forms"] },
  { path: "src/components/ui/input.tsx", type: "component", required: true, exists: true, description: "Input component", usedBy: ["All forms"] },
  { path: "src/components/ui/label.tsx", type: "component", required: true, exists: true, description: "Label component", usedBy: ["All forms"] },
  { path: "src/components/ui/select.tsx", type: "component", required: true, exists: true, description: "Select component", usedBy: ["Forms with dropdowns"] },
  { path: "src/components/ui/tabs.tsx", type: "component", required: true, exists: true, description: "Tabs component", usedBy: ["Dashboard", "Settings"] },
  { path: "src/components/ui/toast.tsx", type: "component", required: true, exists: true, description: "Toast component", usedBy: ["Notifications"] },
  { path: "src/components/ui/toaster.tsx", type: "component", required: true, exists: true, description: "Toaster container", usedBy: ["App.tsx"] },
  { path: "src/components/ui/sonner.tsx", type: "component", required: true, exists: true, description: "Sonner toast", usedBy: ["App.tsx"] },
  { path: "src/components/ui/progress.tsx", type: "component", required: true, exists: true, description: "Progress bar", usedBy: ["Loading states"] },
  { path: "src/components/ui/badge.tsx", type: "component", required: true, exists: true, description: "Badge component", usedBy: ["Status indicators"] },
  { path: "src/components/ui/avatar.tsx", type: "component", required: true, exists: true, description: "Avatar component", usedBy: ["Profile", "Header"] },
  { path: "src/components/ui/switch.tsx", type: "component", required: true, exists: true, description: "Switch toggle", usedBy: ["Settings"] },
  { path: "src/components/ui/scroll-area.tsx", type: "component", required: true, exists: true, description: "Scroll area", usedBy: ["Lists"] },
  { path: "src/components/ui/separator.tsx", type: "component", required: true, exists: true, description: "Separator", usedBy: ["Layout"] },
  { path: "src/components/ui/skeleton.tsx", type: "component", required: true, exists: true, description: "Loading skeleton", usedBy: ["Loading states"] },
  { path: "src/components/ui/tooltip.tsx", type: "component", required: true, exists: true, description: "Tooltip component", usedBy: ["Interactive elements"] },
  { path: "src/components/ui/dropdown-menu.tsx", type: "component", required: true, exists: true, description: "Dropdown menu", usedBy: ["Navigation", "Actions"] },
];

// ============================================================================
// GET ALL FILES
// ============================================================================

export function getAllFileDependencies(): FileDependency[] {
  return [
    ...CORE_FILES,
    ...SERVICE_FILES,
    ...HOOK_FILES,
    ...QR_COMPONENTS,
    ...UI_COMPONENTS,
  ];
}

export function getPageDependencies(): PageDependencyMap[] {
  return PAGE_DEPENDENCIES;
}

export function getMissingRequiredFiles(): FileDependency[] {
  return getAllFileDependencies().filter(f => f.required && !f.exists);
}
