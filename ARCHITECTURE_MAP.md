# IEOSUIA QR Application - Complete Architecture Map

## Table of Contents
1. [Overview](#overview)
2. [Frontend Routes & Pages](#frontend-routes--pages)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [CRUD Operations Summary](#crud-operations-summary)
5. [Component Hierarchy](#component-hierarchy)
6. [Data Flow Patterns](#data-flow-patterns)
7. [File Dependencies](#file-dependencies)
8. [Authentication Flow](#authentication-flow)
9. [Subscription & Billing Flow](#subscription--billing-flow)

---

## Overview

**Stack:**
- **Frontend:** React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Plain PHP REST API (no framework)
- **Database:** MySQL
- **State Management:** React Query + Context API
- **Routing:** React Router DOM v6

---

## Frontend Routes & Pages

### Public Routes (No Auth Required)

| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/` | `Index.tsx` | Landing page with hero, features, pricing |
| `/login` | `Login.tsx` | User login form |
| `/signup` | `Signup.tsx` | User registration form |
| `/forgot-password` | `ForgotPassword.tsx` | Password reset request |
| `/reset-password` | `ResetPassword.tsx` | Password reset with token |
| `/verify-email` | `VerifyEmail.tsx` | Email verification handler |
| `/auth/google/callback` | `GoogleCallback.tsx` | Google OAuth callback |
| `/scan/:id` | `Scan.tsx` | Public QR scan page |
| `/scan/:id/history` | `ItemHistory.tsx` | Public item history view |
| `/terms` | `TermsOfService.tsx` | Terms of service |
| `/privacy` | `PrivacyPolicy.tsx` | Privacy policy |
| `/cookies` | `CookiePolicy.tsx` | Cookie policy |
| `/support` | `Support.tsx` | Support page |
| `/contact` | `Contact.tsx` | Contact form |
| `/docs` | `Documentation.tsx` | Documentation |
| `/careers` | `Careers.tsx` | Careers page |
| `/solutions` | `Solutions.tsx` | Solutions overview |
| `/solutions/:solutionId` | `SolutionDetail.tsx` | Solution detail page |
| `/billing/error` | `BillingError.tsx` | Payment error page |

### Protected Routes (Auth Required)

| Route | Page Component | Purpose | Components Used |
|-------|---------------|---------|-----------------|
| `/verification-required` | `VerificationRequired.tsx` | Email verification prompt | - |
| `/dashboard` | `Dashboard.tsx` | Main user dashboard | `DashboardSidebar`, QR list |
| `/dashboard/create` | `CreateQRCode.tsx` | Create new QR codes | QR forms, `LogoUploader` |
| `/dashboard/analytics` | `Analytics.tsx` | QR code analytics | Charts, `DateRangePicker` |
| `/dashboard/settings` | `Settings.tsx` | User settings | `NotificationSettings` |
| `/dashboard/profile` | `Profile.tsx` | User profile management | `AvatarCropper` |
| `/dashboard/inventory` | `Inventory.tsx` | Inventory tracking | `InventoryTab`, `CreateQRAndItemModal` |
| `/dashboard/inventory/analytics` | `InventoryAnalytics.tsx` | Inventory analytics | Charts, exports |
| `/dashboard/subscription` | `Subscription.tsx` | Subscription management | `PlanSelector`, `PayFastCheckout` |
| `/dashboard/qa` | `QA.tsx` | QA/Debug console | Test runners |
| `/billing/success` | `BillingSuccess.tsx` | Payment success page | - |

### Admin Routes

| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/admin` | `AdminIndex.tsx` | Admin entry point |
| `/admin/login` | `AdminLogin.tsx` | Multi-step admin login |
| `/admin/dashboard` | `AdminDashboard.tsx` | Admin main dashboard |
| `/admin/emails` | `AdminEmails.tsx` | Email log management |
| `/admin/settings` | `AdminSettings.tsx` | Admin settings |
| `/admin/stats` | `AdminStats.tsx` | Platform statistics |
| `/admin/qa` | `AdminQA.tsx` | System QA tests |
| `/admin/create` | `AdminCreate.tsx` | Create new admin |
| `/admin/users` | `AdminUsers.tsx` | User management |
| `/admin/audit` | `AdminAuditLog.tsx` | Audit log viewer |
| `/admin/subscriptions` | `AdminSubscriptions.tsx` | Subscription management |

---

## Backend API Endpoints

### Authentication Endpoints (`AuthController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| POST | `/auth/register` | `register()` | No |
| POST | `/auth/login` | `login()` | No |
| POST | `/auth/logout` | `logout()` | Yes |
| POST | `/auth/verify-email` | `verifyEmail()` | No |
| POST | `/auth/forgot-password` | `forgotPassword()` | No |
| POST | `/auth/reset-password` | `resetPassword()` | No |
| POST | `/auth/resend-verification` | `resendVerification()` | No |
| GET | `/auth/google` | `googleAuthUrl()` | No |
| GET | `/auth/google/callback` | `googleCallback()` | No |
| POST | `/auth/google/signin` | `googleSignIn()` | No |

### User Profile Endpoints (`AuthController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/user/profile` | `getProfile()` | Yes |
| PUT | `/user/profile` | `updateProfile()` | Yes |
| POST | `/user/avatar` | `uploadAvatar()` | Yes |
| GET | `/user/notifications` | `getNotificationPreferences()` | Yes |
| PUT | `/user/notifications` | `updateNotificationPreferences()` | Yes |
| POST | `/user/delete` | `deleteAccount()` | Yes |
| POST | `/user/2fa/enable` | `enable2FA()` | Yes |
| POST | `/user/2fa/disable` | `disable2FA()` | Yes |
| POST | `/user/2fa/verify` | `verify2FA()` | Yes |
| GET | `/user/logos` | `getLogos()` | Yes |
| POST | `/user/logos` | `uploadLogo()` | Yes |

### QR Code Endpoints (`QrController.php`)

| Method | Endpoint | Function | Auth Required | CRUD |
|--------|----------|----------|---------------|------|
| GET | `/qr` | `list()` | Yes | Read |
| POST | `/qr` | `create()` | Yes | Create |
| POST | `/qr/bulk` | `bulkCreate()` | Yes | Create |
| GET | `/qr/{id}` | `show()` | Yes | Read |
| PUT | `/qr/{id}` | `update()` | Yes | Update |
| DELETE | `/qr/{id}` | `delete()` | Yes | Delete |

### Scan Endpoints (`ScanController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/qr/{id}/scans` | `getScans()` | Yes |
| GET | `/qr/{id}/stats` | `getStats()` | Yes |
| POST | `/scan/log` | `log()` | No (Public) |
| GET | `/scan/log` | `log()` | No (Public) |

### Subscription Endpoints (`SubscriptionController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/subscriptions/plans` | `getPlans()` | No |
| GET | `/subscriptions/current` | `getCurrentSubscription()` | Yes |
| POST | `/subscriptions/cancel` | `cancel()` | Yes |
| POST | `/subscriptions/proration-preview` | `getProrationPreview()` | Yes |
| POST | `/subscriptions/change` | `changePlan()` | Yes |

### Payment Endpoints (`PaymentController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| POST | `/payments/checkout` | `checkout()` | Yes |
| POST | `/webhooks/payfast` | `handleWebhook()` | No (Webhook) |
| POST | `/webhooks/paystack` | `handlePaystackWebhook()` | No (Webhook) |
| GET | `/subscriptions/status` | `getSubscriptionStatus()` | Yes |
| POST | `/subscriptions/sync` | `syncSubscription()` | Yes |
| POST | `/cron/renewal-reminders` | `sendRenewalReminders()` | No (Cron) |
| POST | `/cron/process-retries` | `processPaymentRetries()` | No (Cron) |
| POST | `/cron/process-grace-periods` | `processExpiredGracePeriods()` | No (Cron) |
| GET | `/billing/retry-status` | `getRetryStatus()` | Yes |
| GET | `/payments/{id}/receipt` | `downloadReceipt()` | Yes |

### Billing Endpoints (`BillingController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/billing/invoices` | `getInvoices()` | Yes |
| GET | `/billing/invoices/{id}` | `getInvoice()` | Yes |
| GET | `/billing/invoices/{id}/receipt` | `downloadReceipt()` | Yes |
| GET | `/billing/payments` | `getPayments()` | Yes |

### Analytics Endpoints (`AnalyticsController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/analytics/dashboard` | `getDashboard()` | Yes |
| GET | `/analytics/export` | `exportCsv()` | Yes |
| GET | `/analytics/summary` | `getSummary()` | Yes |
| GET | `/analytics/top-qr-codes` | `getTopQRCodes()` | Yes |
| GET | `/analytics/devices` | `getDeviceBreakdown()` | Yes |
| GET | `/analytics/daily` | `getDailyTrend()` | Yes |
| GET | `/analytics/hourly` | `getHourlyDistribution()` | Yes |
| POST | `/reports/export` | `exportReport()` | Yes |

### Inventory Endpoints (`InventoryController.php`)

| Method | Endpoint | Function | Auth Required | CRUD |
|--------|----------|----------|---------------|------|
| GET | `/inventory` | `list()` | Yes | Read |
| POST | `/inventory` | `create()` | Yes | Create |
| POST | `/inventory/scan` | `logScan()` | Yes | Create |
| GET | `/inventory/limits` | `getLimits()` | Yes | Read |
| GET | `/inventory/analytics` | `getAnalytics()` | Yes | Read |
| GET | `/inventory/analytics/export` | `exportAnalyticsCsv()` | Yes | Read |
| GET | `/inventory/alerts` | `getAlerts()` | Yes | Read |
| POST | `/inventory/alerts/read` | `markAlertsRead()` | Yes | Update |
| POST | `/inventory/alerts/check` | `checkLowActivityAlerts()` | Yes | Read |
| POST | `/inventory/maintenance` | `setMaintenanceReminder()` | Yes | Create |
| GET | `/inventory/qr/{id}` | `getByQrCode()` | No (Public) | Read |
| POST | `/inventory/qr/{id}/status` | `updateStatusByQrCode()` | No (Public) | Update |
| GET | `/inventory/qr/{id}/history` | `getHistoryByQrCode()` | No (Public) | Read |
| GET | `/inventory/{id}` | `show()` | Yes | Read |
| PUT | `/inventory/{id}` | `update()` | Yes | Update |
| DELETE | `/inventory/{id}` | `delete()` | Yes | Delete |

### Contact Endpoint (`ContactController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| POST | `/contact` | `submit()` | No |

### Admin Auth Endpoints (`AdminAuthController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| POST | `/admin/auth/batch` | `batchLogin()` | No |
| POST | `/admin/auth/step1` | `loginStep1()` | No |
| POST | `/admin/auth/step2` | `loginStep2()` | No |
| POST | `/admin/auth/step3` | `loginStep3()` | No |
| GET | `/admin/auth/session` | `checkSession()` | Admin |
| POST | `/admin/auth/create` | `createAdmin()` | Admin |
| PUT | `/admin/auth/passwords` | `updatePasswords()` | Admin |
| POST | `/admin/auth/check-email` | `checkAdminEmail()` | No |
| GET | `/admin/users` | `listAdmins()` | Admin |
| GET | `/admin/users/{id}` | `getAdmin()` | Admin |
| PUT | `/admin/users/{id}` | `updateAdmin()` | Admin |
| POST | `/admin/users/{id}/toggle` | `toggleAdminStatus()` | Admin |
| POST | `/admin/users/{id}/unlock` | `unlockAdmin()` | Admin |
| DELETE | `/admin/users/{id}` | `deleteAdmin()` | Admin |
| GET | `/admin/audit` | `getAuditLogs()` | Admin |
| GET | `/admin/audit/stats` | `getAuditStats()` | Admin |
| GET | `/admin/audit/export` | `exportAuditLogs()` | Admin |

### Admin Management Endpoints (`AdminController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| POST | `/admin/login` | `validateStep()` | No |
| GET | `/admin/verify` | `verifyAccess()` | Admin |
| GET | `/admin/emails` | `getEmailLogs()` | Admin |
| GET | `/admin/emails/{id}` | `getEmailLog()` | Admin |
| POST | `/admin/logout` | `logout()` | Admin |
| POST | `/admin/emails/read` | `markEmailRead()` | Admin |
| POST | `/admin/emails/replied` | `markEmailReplied()` | Admin |
| POST | `/admin/emails/priority` | `setEmailPriority()` | Admin |
| POST | `/admin/emails/archive` | `archiveEmail()` | Admin |
| POST | `/admin/emails/bulk` | `bulkMarkEmails()` | Admin |
| GET | `/admin/webhooks` | `getWebhookLogs()` | Admin |
| POST | `/webhooks/email` | `handleEmailWebhook()` | No (Webhook) |
| GET | `/admin/settings` | `getSettings()` | Admin |
| POST | `/admin/settings` | `updateSettings()` | Admin |
| GET | `/admin/stats` | `getEmailStats()` | Admin |
| GET | `/admin/export/emails` | `exportEmailsCsv()` | Admin |
| GET | `/admin/export/stats` | `exportStatsReport()` | Admin |
| GET | `/admin/subscriptions/metrics` | `getSubscriptionMetrics()` | Admin |

### QA Endpoints (`QAController.php`)

| Method | Endpoint | Function | Auth Required |
|--------|----------|----------|---------------|
| GET | `/admin/qa/dashboard` | `getDashboard()` | Admin |
| POST | `/admin/qa/run` | `runQA()` | Admin |
| POST | `/admin/qa/seed` | `seedTestData()` | Admin |
| POST | `/admin/qa/cleanup` | `cleanupTestData()` | Admin |
| GET | `/admin/qa/status` | `getSeedingStatus()` | Admin |
| POST | `/admin/qa/errors` | `getErrorReport()` | Admin |
| GET | `/qa/dashboard` | `getDashboardUser()` | Yes |
| POST | `/qa/run` | `runQAUser()` | Yes |
| POST | `/qa/seed` | `seedTestDataUser()` | Yes |
| POST | `/qa/cleanup` | `cleanupTestDataUser()` | Yes |

---

## CRUD Operations Summary

### QR Codes
| Operation | Frontend | API | Backend | Database |
|-----------|----------|-----|---------|----------|
| **Create** | `CreateQRCode.tsx` → `qrCodeApi.create()` | POST `/qr` | `QrController::create()` | INSERT `qr_codes` |
| **Read (List)** | `Dashboard.tsx` → `useQRStorage.loadQRCodes()` | GET `/qr` | `QrController::list()` | SELECT `qr_codes` |
| **Read (Single)** | `QRViewModal.tsx` → `qrCodeApi.get()` | GET `/qr/{id}` | `QrController::show()` | SELECT `qr_codes` |
| **Update** | `QREditModal.tsx` → `qrCodeApi.update()` | PUT `/qr/{id}` | `QrController::update()` | UPDATE `qr_codes` |
| **Delete** | `QRDeleteConfirmModal.tsx` → `qrCodeApi.delete()` | DELETE `/qr/{id}` | `QrController::delete()` | DELETE `qr_codes` |

### Inventory Items
| Operation | Frontend | API | Backend | Database |
|-----------|----------|-----|---------|----------|
| **Create** | `CreateQRAndItemModal.tsx` → `inventoryApi.create()` | POST `/inventory` | `InventoryController::create()` | INSERT `inventory_items` |
| **Read (List)** | `InventoryTab.tsx` → `inventoryApi.list()` | GET `/inventory` | `InventoryController::list()` | SELECT `inventory_items` |
| **Update** | `InventoryTab.tsx` → `inventoryApi.update()` | PUT `/inventory/{id}` | `InventoryController::update()` | UPDATE `inventory_items` |
| **Delete** | `InventoryTab.tsx` → `inventoryApi.delete()` | DELETE `/inventory/{id}` | `InventoryController::delete()` | DELETE `inventory_items` |

### User Profile
| Operation | Frontend | API | Backend | Database |
|-----------|----------|-----|---------|----------|
| **Read** | `Profile.tsx` → `authApi.getProfile()` | GET `/user/profile` | `AuthController::getProfile()` | SELECT `users` |
| **Update** | `Profile.tsx` → `authApi.updateProfile()` | PUT `/user/profile` | `AuthController::updateProfile()` | UPDATE `users` |
| **Delete** | `Settings.tsx` → `authApi.deleteAccount()` | POST `/user/delete` | `AuthController::deleteAccount()` | DELETE `users` |

### Subscriptions
| Operation | Frontend | API | Backend | Database |
|-----------|----------|-----|---------|----------|
| **Read (Plans)** | `PlanSelector.tsx` | GET `/subscriptions/plans` | `SubscriptionController::getPlans()` | SELECT `plans` |
| **Read (Current)** | `Subscription.tsx` | GET `/subscriptions/current` | `SubscriptionController::getCurrentSubscription()` | SELECT `subscriptions` |
| **Update (Change)** | `PlanChangeModal.tsx` | POST `/subscriptions/change` | `SubscriptionController::changePlan()` | UPDATE `subscriptions` |
| **Update (Cancel)** | `Subscription.tsx` | POST `/subscriptions/cancel` | `SubscriptionController::cancel()` | UPDATE `subscriptions` |

---

## Component Hierarchy

```
App.tsx
├── Providers
│   ├── QueryClientProvider (React Query)
│   ├── AuthProvider (AuthContext)
│   ├── TooltipProvider
│   └── ThemeProvider
│
├── Routes
│   ├── Public Pages
│   │   ├── Index (Landing)
│   │   │   ├── Header
│   │   │   ├── HeroSection
│   │   │   ├── FeaturesSection
│   │   │   ├── HowItWorksSection
│   │   │   ├── UseCasesSection
│   │   │   ├── PricingSection
│   │   │   ├── CTASection
│   │   │   └── Footer
│   │   ├── Login / Signup
│   │   │   ├── SocialLoginButtons
│   │   │   └── PasswordStrengthIndicator
│   │   └── Scan (Public QR)
│   │
│   └── Protected Pages (wrapped in ProtectedRoute)
│       ├── Dashboard
│       │   ├── DashboardSidebar
│       │   ├── DashboardTutorial
│       │   ├── QRViewModal
│       │   ├── QREditModal
│       │   └── QRDeleteConfirmModal
│       ├── CreateQRCode
│       │   ├── Form Components (WiFiForm, VCardForm, EventForm, etc.)
│       │   ├── LogoUploader
│       │   └── UpsellModal
│       ├── Inventory
│       │   ├── DashboardSidebar
│       │   ├── InventoryTab
│       │   ├── CreateQRAndItemModal
│       │   ├── ScanHistoryModal
│       │   └── QRLabelPrinter
│       ├── Analytics
│       │   └── DateRangePicker
│       ├── Profile
│       │   └── AvatarCropper
│       ├── Settings
│       │   └── NotificationSettings
│       └── Subscription
│           ├── PlanSelector
│           ├── PlanChangeModal
│           ├── PayFastCheckout
│           ├── InvoiceHistory
│           └── PaymentRetryStatus
│
└── Global Components
    ├── Toaster (notifications)
    ├── Sonner (toast)
    ├── CookieConsent
    └── WhatsAppButton
```

---

## Data Flow Patterns

### 1. Authentication Flow

```
User Action → Frontend Component → AuthContext → authApi → Backend → Database
                                       ↓
                              localStorage (token, user)
                                       ↓
                              Subsequent requests include Authorization header
```

**Login Flow:**
```
Login.tsx
  ↓ onSubmit
useAuth().login(email, password, captchaToken)
  ↓
authApi.login({ email, password, captcha_token })
  ↓ POST /auth/login
AuthController::login()
  ↓ Validate credentials
Database (users table)
  ↓ Return user + JWT token
authHelpers.setAuth(tokens, userData)
  ↓ Store in localStorage
setUser(userData) → AuthContext state updated
  ↓
Navigate to /dashboard
```

### 2. QR Code Creation Flow

```
CreateQRCode.tsx
  ↓ Form submission
qrCodeApi.create(formData)
  ↓ POST /qr
QrController::create()
  ↓ Validate, generate QR
Database INSERT qr_codes
  ↓ Return QR object
Update local state / cache
  ↓
Show success toast
```

### 3. Scan Logging Flow (Public)

```
User scans QR code → /scan/{id}
  ↓
Scan.tsx loads
  ↓
scanHelpers.getScanUrl() or direct API call
  ↓ POST /scan/log
ScanController::log()
  ↓ Log device, location, timestamp
Database INSERT scan_logs
  ↓ Increment qr_codes.scan_count
Return redirect URL or content
```

### 4. Subscription Change Flow

```
Subscription.tsx → PlanSelector
  ↓ Select plan
PlanChangeModal opens
  ↓ Confirm
subscriptionApi.changePlan({ new_plan_id, billing_cycle })
  ↓ POST /subscriptions/change
SubscriptionController::changePlan()
  ↓ Calculate proration, update subscription
Database UPDATE subscriptions
  ↓
PayFast/Paystack redirect for payment
  ↓ Webhook callback
PaymentController::handleWebhook()
  ↓ Update subscription status
User refreshed with new plan
```

---

## File Dependencies

### Frontend API Layer

```
src/services/api/
├── client.ts          ← Base axios instance, interceptors
├── types.ts           ← TypeScript interfaces
├── index.ts           ← Re-exports all API modules
├── auth.ts            ← authApi, authHelpers
├── qrcodes.ts         ← qrCodeApi
├── analytics.ts       ← analyticsApi, scanHelpers
├── billing.ts         ← billingApi
├── inventory.ts       ← inventoryApi
└── admin.ts           ← adminApi
```

### Frontend Hooks

```
src/hooks/
├── useAdminLoginRateLimit.ts  ← Admin login rate limiting
├── useAdminSession.ts         ← Admin session management
├── useQRDownload.ts           ← QR code download utilities
├── useQRStorage.ts            ← QR CRUD operations, localStorage fallback
├── useRateLimit.ts            ← General rate limiting
├── useRecaptcha.ts            ← reCAPTCHA integration
├── useUserPlan.ts             ← Plan limits and features
├── use-mobile.tsx             ← Mobile detection
└── use-toast.ts               ← Toast notifications
```

### Backend Controllers

```
api/src/Controllers/
├── AuthController.php         ← User auth, profile, 2FA
├── AdminAuthController.php    ← Admin multi-step auth
├── AdminController.php        ← Admin operations
├── QrController.php           ← QR CRUD
├── ScanController.php         ← Scan logging, stats
├── SubscriptionController.php ← Plan management
├── PaymentController.php      ← Checkout, webhooks
├── BillingController.php      ← Invoices, payments
├── AnalyticsController.php    ← Analytics data
├── InventoryController.php    ← Inventory CRUD
├── ContactController.php      ← Contact form
└── QAController.php           ← QA/Debug tools
```

### Backend Services

```
api/src/Services/
├── CaptchaService.php         ← reCAPTCHA validation
├── EmailValidationService.php ← Email validation
├── GoogleOAuthService.php     ← Google OAuth
├── InvoiceService.php         ← Invoice generation
├── MailService.php            ← Email sending (PHPMailer)
└── PaymentRetryService.php    ← Failed payment retries
```

---

## Authentication Flow

### User Authentication
1. User submits credentials on `/login`
2. Frontend calls `POST /auth/login`
3. Backend validates, returns JWT + user object
4. Frontend stores in localStorage via `authHelpers.setAuth()`
5. `AuthContext` updates, app re-renders as authenticated
6. All subsequent API calls include `Authorization: Bearer <token>`

### Admin Authentication (Multi-Step)
1. **Step 1:** Email verification (`POST /admin/auth/step1`)
2. **Step 2:** Password 1 verification (`POST /admin/auth/step2`)
3. **Step 3:** Password 2 + 2FA verification (`POST /admin/auth/step3`)
4. Session created with admin privileges
5. `useAdminSession` hook manages admin state

---

## Subscription & Billing Flow

### Plan Selection → Payment → Activation

```
1. User views plans (GET /subscriptions/plans)
2. User selects plan → PlanSelector component
3. Preview proration (POST /subscriptions/proration-preview)
4. Confirm → PayFastCheckout initiates payment
5. Redirect to payment gateway
6. User completes payment
7. Webhook received (POST /webhooks/payfast or /webhooks/paystack)
8. Backend updates subscription, creates invoice
9. User redirected to /billing/success
10. Frontend refreshes user data with new plan
```

### Payment Retry Flow

```
1. Payment fails → subscription marked `past_due`
2. Cron job: POST /cron/process-retries
3. PaymentRetryService attempts retry
4. If successful → reactivate subscription
5. If failed 3+ times → enter grace period
6. Cron job: POST /cron/process-grace-periods
7. If grace period expired → downgrade to free
```

---

## Database Tables (Inferred)

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | User accounts | - |
| `qr_codes` | QR code records | `user_id` → `users` |
| `scan_logs` | QR scan history | `qr_id` → `qr_codes` |
| `subscriptions` | User subscriptions | `user_id` → `users`, `plan_id` → `plans` |
| `plans` | Available plans | - |
| `invoices` | Payment invoices | `user_id`, `subscription_id` |
| `payments` | Payment attempts | `user_id` |
| `inventory_items` | Inventory records | `user_id`, `qr_id` |
| `inventory_scans` | Inventory scan history | `inventory_id` |
| `inventory_alerts` | Low activity alerts | `inventory_id` |
| `admins` | Admin accounts | - |
| `admin_audit_log` | Admin action history | `admin_id` |
| `email_logs` | Email records | - |
| `webhook_logs` | Webhook history | - |
| `user_logos` | Uploaded logos | `user_id` |
| `notification_preferences` | User notification settings | `user_id` |

---

## Quick Reference: Button → Action Mapping

### Dashboard Page
| Button/Action | Component | API Call | Endpoint |
|---------------|-----------|----------|----------|
| "Create QR" | Dashboard | Navigate | `/dashboard/create` |
| View QR | QRViewModal | `qrCodeApi.get()` | GET `/qr/{id}` |
| Edit QR | QREditModal | `qrCodeApi.update()` | PUT `/qr/{id}` |
| Delete QR | QRDeleteConfirmModal | `qrCodeApi.delete()` | DELETE `/qr/{id}` |
| Download QR | useQRDownload | Local generation | N/A |

### Profile Page
| Button/Action | Component | API Call | Endpoint |
|---------------|-----------|----------|----------|
| Update Avatar | AvatarCropper | `authApi.uploadAvatar()` | POST `/user/avatar` |
| Save Profile | Profile | `authApi.updateProfile()` | PUT `/user/profile` |
| Enable 2FA | TwoFactorSetup | `authApi.enable2FA()` | POST `/user/2fa/enable` |

### Subscription Page
| Button/Action | Component | API Call | Endpoint |
|---------------|-----------|----------|----------|
| Change Plan | PlanSelector | `subscriptionApi.changePlan()` | POST `/subscriptions/change` |
| Cancel | Subscription | `subscriptionApi.cancel()` | POST `/subscriptions/cancel` |
| View Invoices | InvoiceHistory | `billingApi.getInvoices()` | GET `/billing/invoices` |
| Download Receipt | InvoiceHistory | `billingApi.downloadReceipt()` | GET `/billing/invoices/{id}/receipt` |

---

*Generated: 2026-01-13*
*Version: Complete Application Map v1.0*
