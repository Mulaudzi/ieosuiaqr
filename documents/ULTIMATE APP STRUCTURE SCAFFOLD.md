# IEOSUIA QR - Ultimate Application Structure Scaffold

> **Version**: 1.0  
> **Generated**: 2024-01-15  
> **Status**: Production-Grade Forensic Documentation  
> **Update Policy**: Update with every schema change; treat as canonical truth

---

## Table of Contents

1. [System-Level Traceability Map](#1-system-level-traceability-map)
2. [Page-Level Forensic Analysis](#2-page-level-forensic-analysis)
3. [Database & Data-Flow Traceability](#3-database--data-flow-traceability)
4. [API Contract & Data Integrity](#4-api-contract--data-integrity)
5. [Auth, Permissions & Security](#5-auth-permissions--security)
6. [Cross-Page Impact Analysis](#6-cross-page-impact-analysis)
7. [Mock Data & Fake Success Detection](#7-mock-data--fake-success-detection)
8. [Root Cause Resolution Tree](#8-root-cause-resolution-tree)
9. [Debug Playbook & Test Checklist](#9-debug-playbook--test-checklist)
10. [Final Status Verdict](#10-final-status-verdict)

---

## 1. System-Level Traceability Map

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                           │
│  src/                                                                       │
│  ├── pages/           → 42 page components                                  │
│  ├── components/      → Organized by feature (admin, analytics, auth, etc.) │
│  ├── hooks/           → 9 custom hooks                                      │
│  ├── services/api/    → API client layer (10 modules)                       │
│  ├── contexts/        → AuthContext (global state)                          │
│  └── lib/             → Utilities, testRunner                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Plain PHP API)                           │
│  api/                                                                       │
│  ├── index.php        → Main router (526 lines, ~100 routes)                │
│  ├── src/Controllers/ → 13 controllers                                      │
│  ├── src/Middleware/  → CORS, JWT validation                                │
│  ├── src/Helpers/     → Response formatting, utilities                      │
│  ├── src/Services/    → Business logic services                             │
│  └── database/        → Migrations                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ PDO/MySQL
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (MySQL)                                  │
│  Tables: users, qr_codes, scans, subscriptions, invoices, inventory,       │
│          design_presets, admin_users, admin_sessions, email_logs,          │
│          contact_submissions, user_logos, notification_preferences         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 All Frontend Pages

| Route | Page File | Purpose | Access | Importance |
|-------|-----------|---------|--------|------------|
| `/` | Index.tsx | Landing page / Auth redirect | Public | 🔴 Critical |
| `/login` | Login.tsx | User authentication | Public | 🔴 Critical |
| `/signup` | Signup.tsx | User registration | Public | 🔴 Critical |
| `/forgot-password` | ForgotPassword.tsx | Password recovery | Public | 🟠 High |
| `/reset-password` | ResetPassword.tsx | Password reset form | Public | 🟠 High |
| `/verify-email` | VerifyEmail.tsx | Email verification | Public | 🟠 High |
| `/verification-required` | VerificationRequired.tsx | Prompt to verify | Protected | 🟠 High |
| `/auth/google/callback` | GoogleCallback.tsx | OAuth callback | Public | 🟠 High |
| `/dashboard` | Dashboard.tsx | Main QR dashboard | Protected | 🔴 Critical |
| `/dashboard/create` | CreateQRCode.tsx | QR code creation | Protected | 🔴 Critical |
| `/dashboard/analytics` | Analytics.tsx | Scan analytics | Protected | 🟠 High |
| `/dashboard/settings` | Settings.tsx | User settings | Protected | 🟡 Isolated |
| `/dashboard/profile` | Profile.tsx | User profile | Protected | 🟡 Isolated |
| `/dashboard/inventory` | Inventory.tsx | Inventory tracking | Protected | 🟠 High |
| `/dashboard/inventory/analytics` | InventoryAnalytics.tsx | Inventory stats | Protected | 🟡 Isolated |
| `/dashboard/subscription` | Subscription.tsx | Plan management | Protected | 🟠 High |
| `/dashboard/tests` | TestDashboard.tsx | Automated tests | Protected | 🟡 Isolated |
| `/scan/:id` | Scan.tsx | Public QR scan page | Public | 🔴 Critical |
| `/scan/:id/history` | ItemHistory.tsx | Inventory history | Public | 🟡 Isolated |
| `/billing/success` | BillingSuccess.tsx | Payment confirmation | Protected | 🟠 High |
| `/billing/error` | BillingError.tsx | Payment failure | Public | 🟠 High |
| `/terms` | TermsOfService.tsx | Legal | Public | 🟢 Cosmetic |
| `/privacy` | PrivacyPolicy.tsx | Legal | Public | 🟢 Cosmetic |
| `/cookies` | CookiePolicy.tsx | Legal | Public | 🟢 Cosmetic |
| `/support` | Support.tsx | Help center | Public | 🟡 Isolated |
| `/contact` | Contact.tsx | Contact form | Public | 🟡 Isolated |
| `/docs` | Documentation.tsx | API docs | Public | 🟡 Isolated |
| `/careers` | Careers.tsx | Job listings | Public | 🟢 Cosmetic |
| `/solutions` | Solutions.tsx | Use cases | Public | 🟢 Cosmetic |
| `/solutions/:solutionId` | SolutionDetail.tsx | Solution detail | Public | 🟢 Cosmetic |
| `/admin` | AdminIndex.tsx | Admin landing | Admin | 🟠 High |
| `/admin/login` | AdminLogin.tsx | Admin auth | Admin | 🔴 Critical |
| `/admin/dashboard` | AdminDashboard.tsx | Admin overview | Admin | 🟠 High |
| `/admin/emails` | AdminEmails.tsx | Email management | Admin | 🟡 Isolated |
| `/admin/settings` | AdminSettings.tsx | Admin config | Admin | 🟡 Isolated |
| `/admin/stats` | AdminStats.tsx | System statistics | Admin | 🟡 Isolated |
| `/admin/qa` | AdminQA.tsx | QA testing | Admin | 🟡 Isolated |
| `/admin/create` | AdminCreate.tsx | Create admin user | Admin | 🟠 High |
| `/admin/users` | AdminUsers.tsx | User management | Admin | 🟠 High |
| `/admin/audit` | AdminAuditLog.tsx | Audit logs | Admin | 🟠 High |
| `/admin/subscriptions` | AdminSubscriptions.tsx | Subscription mgmt | Admin | 🟠 High |
| `*` | NotFound.tsx | 404 page | Public | 🟢 Cosmetic |

### 1.3 All Backend Controllers

| Controller | File | Primary Endpoints | Tables |
|------------|------|-------------------|--------|
| AuthController | AuthController.php | `/auth/*`, `/user/*` | users, user_logos |
| QrController | QrController.php | `/qr/*` | qr_codes |
| ScanController | ScanController.php | `/scan/*`, `/qr/:id/scans` | scans |
| SubscriptionController | SubscriptionController.php | `/subscriptions/*` | subscriptions, plans |
| PaymentController | PaymentController.php | `/payments/*`, `/webhooks/*` | invoices, subscriptions |
| BillingController | BillingController.php | `/billing/*` | invoices |
| AnalyticsController | AnalyticsController.php | `/analytics/*` | scans, qr_codes |
| InventoryController | InventoryController.php | `/inventory/*` | inventory, inventory_scans |
| ContactController | ContactController.php | `/contact` | contact_submissions |
| AdminController | AdminController.php | `/admin/*` | admin_users, email_logs |
| AdminAuthController | AdminAuthController.php | `/admin/auth/*` | admin_users, admin_sessions |
| QAController | QAController.php | `/qa/*`, `/admin/qa/*` | All (testing) |
| DesignPresetController | DesignPresetController.php | `/design-presets/*` | design_presets |

### 1.4 All API Services (Frontend)

| Service | File | Purpose |
|---------|------|---------|
| client | client.ts | Axios instance, interceptors, base config |
| auth | auth.ts | Login, register, profile, 2FA |
| qrcodes | qrcodes.ts | QR CRUD, bulk operations |
| analytics | analytics.ts | Dashboard stats, exports |
| billing | billing.ts | Invoices, payments |
| inventory | inventory.ts | Inventory CRUD, scans |
| admin | admin.ts | Admin operations |
| designPresets | designPresets.ts | QR design templates |
| types | types.ts | TypeScript interfaces |

### 1.5 Database Tables Map

| Table | Primary Purpose | Key Relations |
|-------|-----------------|---------------|
| `users` | User accounts | → qr_codes, subscriptions, inventory |
| `qr_codes` | QR code records | → users, scans |
| `scans` | QR scan logs | → qr_codes |
| `subscriptions` | User plans | → users, plans |
| `plans` | Available tiers | → subscriptions |
| `invoices` | Payment records | → users, subscriptions |
| `inventory` | Tracked items | → users, qr_codes |
| `inventory_scans` | Item scan history | → inventory |
| `design_presets` | QR templates | → users |
| `user_logos` | Custom logos | → users |
| `admin_users` | Admin accounts | → admin_sessions |
| `admin_sessions` | Admin auth | → admin_users |
| `email_logs` | Contact emails | standalone |
| `contact_submissions` | Contact forms | standalone |

### 1.6 Environment Configurations

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `VITE_API_URL` | `http://localhost:8000/api` | `https://staging.qr.ieosuia.com/api` | `https://qr.ieosuia.com/api` |
| `APP_ENV` | development | staging | production |
| `DB_HOST` | localhost | staging-db | prod-db |
| `PAYFAST_SANDBOX` | true | true | false |
| `CORS_ORIGIN` | `*` | staging URL | production URL |

### 1.7 Critical Blockers & Risk Map

#### High-Risk Areas (P0 - Immediate)
1. **QR Code Creation Flow** - If broken, no new QR codes can be created
2. **Authentication** - If broken, no user access
3. **Payment Processing** - If broken, no revenue
4. **Scan Logging** - If broken, analytics fail

#### Medium-Risk Areas (P1 - High Impact)
1. **Analytics Dashboard** - Affects user insights
2. **Subscription Management** - Affects billing
3. **Inventory Tracking** - Affects enterprise users

#### Low-Risk Areas (P2 - Isolated)
1. **Profile/Settings** - Limited user impact
2. **Admin Features** - Internal only
3. **Legal Pages** - Static content

### 1.8 Pre-Build/Pre-Runtime Risks

| Risk Category | What Breaks | Detection Method |
|--------------|-------------|------------------|
| Missing imports | Build failure | `npm run build` |
| Circular dependencies | Runtime errors | ESLint, build logs |
| Missing env vars | API 404/500 | `console.log(import.meta.env)` |
| Type mismatches | Build errors | TypeScript compiler |
| Missing components | White screen | Browser console |
| CORS misconfiguration | API blocks | Network tab |

### 1.9 Reverse Dependency Index

```
If users table fails:
  └── Check: auth endpoints, qr_codes, subscriptions, inventory

If qr_codes table fails:
  └── Check: scans, Dashboard.tsx, CreateQRCode.tsx, Analytics.tsx

If subscriptions table fails:
  └── Check: PaymentController, BillingController, user plan checks

If AuthContext fails:
  └── Check: ALL protected routes, ProtectedRoute component

If API client fails:
  └── Check: ALL data fetching, axios interceptors, token storage
```

---

## 2. Page-Level Forensic Analysis

### 2.1 Landing Page (Index.tsx)

#### Identity & Overview
- **Page Name**: Landing / Home
- **URL**: `/`
- **Purpose**: Marketing landing page, redirect authenticated users to dashboard
- **User Roles**: Public (unauthenticated)
- **Expected Actions**: View content, navigate to login/signup
- **Dependencies**: AuthContext for auth check
- **Entry Points**: Direct URL, external links
- **Downstream Pages**: Login, Signup, Dashboard
- **Importance**: 🔴 Critical
- **Safe to Disable**: ❌ No - Primary entry point

#### Expected Behavior (Ground Truth)

| Action | Expected Result |
|--------|-----------------|
| Page Load (Unauthenticated) | Show landing page with hero, features, pricing |
| Page Load (Authenticated) | Redirect to `/dashboard` |
| Click "Get Started" | Navigate to `/signup` |
| Click "Login" | Navigate to `/login` |

#### Frontend Execution Chain

```
User visits /
  → App.tsx (BrowserRouter)
    → Index.tsx (page component)
      → useAuth() hook
        → AuthContext.isAuthenticated
          → IF true: navigate("/dashboard")
          → IF false: render landing sections
            → Header.tsx
            → HeroSection.tsx
            → FeaturesSection.tsx
            → PricingSection.tsx
            → Footer.tsx
```

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Index.tsx` | Main page component |
| Layout | `src/components/layout/Header.tsx` | Navigation header |
| Layout | `src/components/layout/Footer.tsx` | Site footer |
| Section | `src/components/landing/HeroSection.tsx` | Hero banner |
| Section | `src/components/landing/FeaturesSection.tsx` | Features grid |
| Section | `src/components/landing/HowItWorksSection.tsx` | Process steps |
| Section | `src/components/landing/PricingSection.tsx` | Pricing cards |
| Section | `src/components/landing/UseCasesSection.tsx` | Use cases |
| Section | `src/components/landing/CTASection.tsx` | Call to action |
| Section | `src/components/landing/QRTypesExplainedSection.tsx` | QR types info |
| Section | `src/components/landing/QRTypesShowcaseSection.tsx` | QR showcase |
| Section | `src/components/landing/QRDesignShowcaseSection.tsx` | Design examples |
| Context | `src/contexts/AuthContext.tsx` | Auth state |
| Asset | `src/assets/ieosuia-qr-logo-blue.png` | Logo image |

#### Frontend Failure Matrix

| Symptom | Expected | Actual | Likely Cause | Fix |
|---------|----------|--------|--------------|-----|
| Blank page | Landing content | White screen | Component crash | Check ErrorBoundary, console errors |
| Infinite loading | Content or redirect | Spinner forever | isLoading stuck true | Check AuthContext init |
| No redirect when logged in | Dashboard | Stays on landing | isAuthenticated false | Check token storage |
| Broken images | Logo displays | Broken img | Asset path wrong | Verify import path |
| Styles missing | Tailwind styles | Unstyled | CSS not loaded | Check index.css import |

#### Backend Dependencies
- None for unauthenticated view
- AuthContext calls `authApi.getProfile()` on init if token exists

---

### 2.2 Login Page (Login.tsx)

#### Identity & Overview
- **Page Name**: Login
- **URL**: `/login`
- **Purpose**: User authentication
- **User Roles**: Unauthenticated only
- **Expected Actions**: Enter credentials, submit, social login
- **Dependencies**: AuthContext, reCAPTCHA (optional)
- **Entry Points**: Header link, Index CTA, direct URL
- **Downstream Pages**: Dashboard (success), ForgotPassword, Signup
- **Importance**: 🔴 Critical
- **Safe to Disable**: ❌ No - Primary auth

#### Expected Behavior (Ground Truth)

| Action | Expected Result |
|--------|-----------------|
| Page Load | Show login form with email/password |
| Submit Valid Credentials | API call → token stored → redirect to /dashboard |
| Submit Invalid Credentials | Show error message, stay on page |
| Click "Forgot Password" | Navigate to /forgot-password |
| Click "Sign Up" | Navigate to /signup |
| Click "Google" | Initiate OAuth flow |

#### Frontend Execution Chain

```
User submits login form
  → Login.tsx (handleSubmit)
    → useAuth().login(email, password, captchaToken)
      → AuthContext.login()
        → authApi.login({ email, password })
          → POST /api/auth/login
            → AuthController::login()
              → Validate credentials
              → Generate JWT
              → Return { user, tokens }
        → authHelpers.setAuth(tokens, user)
          → localStorage.setItem('token', access_token)
        → setUser(userData)
    → navigate("/dashboard")
```

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Login.tsx` | Login form |
| Context | `src/contexts/AuthContext.tsx` | Auth methods |
| Service | `src/services/api/auth.ts` | API calls |
| Service | `src/services/api/client.ts` | HTTP client |
| Hook | `src/hooks/useRecaptcha.ts` | CAPTCHA integration |
| Component | `src/components/auth/ProtectedRoute.tsx` | Route guard (PublicRoute) |

#### Backend Execution Chain

```
POST /api/auth/login
  → api/index.php (router)
    → AuthController::login()
      → Validate: email, password required
      → Query: SELECT * FROM users WHERE email = ?
      → Verify: password_verify($password, $hash)
      → Generate: JWT token with user_id claim
      → Response: { success, data: { user, tokens } }
```

#### Backend Files

| Type | File | Purpose |
|------|------|---------|
| Router | `api/index.php:86-87` | Route definition |
| Controller | `api/src/Controllers/AuthController.php` | Login logic |
| Middleware | `api/src/Middleware/Cors.php` | CORS headers |
| Helper | `api/src/Helpers/Response.php` | JSON formatting |

#### Frontend Failure Matrix

| Symptom | Expected | Actual | Likely Cause | Fix |
|---------|----------|--------|--------------|-----|
| Button does nothing | API call | No action | Handler not bound | Check onClick |
| Network error | 200 response | CORS error | CORS misconfigured | Check Cors.php |
| "Invalid credentials" always | Success on valid | Always fails | Wrong password hash algo | Check password_verify |
| No redirect | Navigate to dashboard | Stays on login | navigate not called | Check success handling |
| Token not stored | Token in localStorage | No token | setAuth not called | Check authHelpers |

#### Backend Failure Matrix

| Symptom | API | Expected | Actual | Root Cause | Fix |
|---------|-----|----------|--------|------------|-----|
| 500 error | POST /auth/login | 200 | 500 | DB connection fail | Check .env DB_* vars |
| 401 always | POST /auth/login | 200 | 401 | password_verify fail | Check hash algorithm |
| Empty response | POST /auth/login | JSON body | Empty | Response::success not called | Check controller return |
| CORS blocked | POST /auth/login | Response | Blocked | OPTIONS not handled | Check Cors::handle() |

---

### 2.3 Dashboard (Dashboard.tsx)

#### Identity & Overview
- **Page Name**: QR Dashboard
- **URL**: `/dashboard`
- **Purpose**: Main user dashboard showing QR codes
- **User Roles**: Authenticated users
- **Expected Actions**: View QR list, create, edit, delete, download
- **Dependencies**: AuthContext, useQRStorage hook, qrCodeApi
- **Entry Points**: Post-login redirect, sidebar navigation
- **Downstream Pages**: CreateQRCode, Analytics, individual QR actions
- **Importance**: 🔴 Critical
- **Safe to Disable**: ❌ No - Core functionality

#### Expected Behavior (Ground Truth)

| Action | Expected Result |
|--------|-----------------|
| Page Load | Fetch QR codes, display list/grid |
| Click "Create" | Navigate to /dashboard/create |
| Click QR card | Open view modal |
| Click Edit | Open edit modal |
| Click Delete | Confirm dialog → DELETE API → refresh list |
| Click Download | Generate and download QR image |

#### Frontend Execution Chain

```
Page Load
  → Dashboard.tsx
    → useQRStorage() hook
      → qrCodeApi.list()
        → GET /api/qr
          → QrController::list()
            → SELECT * FROM qr_codes WHERE user_id = ?
            → Return paginated results
      → setQRCodes(data)
    → Render QRCard components
```

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Dashboard.tsx` | Main dashboard |
| Hook | `src/hooks/useQRStorage.ts` | QR state management |
| Hook | `src/hooks/useQRDownload.ts` | Download functionality |
| Service | `src/services/api/qrcodes.ts` | QR API calls |
| Component | `src/components/dashboard/QRCard.tsx` | QR display card |
| Component | `src/components/qr/QRViewModal.tsx` | View details |
| Component | `src/components/qr/QREditModal.tsx` | Edit form |
| Layout | `src/components/layout/DashboardSidebar.tsx` | Navigation |

#### CRUD Verification

| Operation | Endpoint | Expected SQL | Confirmation Query |
|-----------|----------|--------------|-------------------|
| Create | POST /qr | INSERT INTO qr_codes | SELECT * WHERE id = ? |
| Read | GET /qr | SELECT * FROM qr_codes WHERE user_id = ? | N/A |
| Update | PUT /qr/:id | UPDATE qr_codes SET... WHERE id = ? | SELECT * WHERE id = ? |
| Delete | DELETE /qr/:id | DELETE FROM qr_codes WHERE id = ? | SELECT * WHERE id = ? (should be empty) |

#### Frontend Failure Matrix

| Symptom | Expected | Actual | Likely Cause | Fix |
|---------|----------|--------|--------------|-----|
| Empty list | QR cards | "No QR codes" | API returns empty | Check user_id in query |
| Loading forever | Data loads | Spinner | API timeout/error | Check network tab |
| Delete does nothing | Item removed | Still shows | API call failed | Check DELETE response |
| Download fails | File downloads | Error toast | Canvas/QR generation | Check useQRDownload |

---

### 2.4 Create QR Code (CreateQRCode.tsx)

#### Identity & Overview
- **Page Name**: Create QR Code
- **URL**: `/dashboard/create`
- **Purpose**: Multi-step QR code creation wizard
- **User Roles**: Authenticated users
- **Expected Actions**: Select type, enter content, customize, generate
- **Dependencies**: AuthContext, qrCodeApi, useUserPlan
- **Entry Points**: Dashboard "Create" button, sidebar
- **Downstream Pages**: Dashboard (after creation)
- **Importance**: 🔴 Critical
- **Safe to Disable**: ❌ No - Core functionality

#### Expected Behavior (Ground Truth)

| Action | Expected Result |
|--------|-----------------|
| Page Load | Show type selection grid |
| Select Type | Show content form for type |
| Fill Content | Validate inputs |
| Click "Generate" | Preview QR code |
| Click "Save" | POST /qr → redirect to dashboard |

#### Frontend Execution Chain

```
User clicks "Save"
  → CreateQRCode.tsx (handleSubmit)
    → qrCodeApi.create({
        type, name, content, customization
      })
      → POST /api/qr
        → QrController::create()
          → Validate input
          → Generate QR image (phpqrcode)
          → INSERT INTO qr_codes
          → Return new QR object
    → toast.success()
    → navigate("/dashboard")
```

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/CreateQRCode.tsx` | Creation wizard |
| Components | `src/components/qr/forms/*.tsx` | Type-specific forms |
| Component | `src/components/qr/LogoUploader.tsx` | Logo upload |
| Component | `src/components/qr/QRPreview.tsx` | Live preview |
| Component | `src/components/qr/UpsellModal.tsx` | Plan upgrade prompt |
| Service | `src/services/api/qrcodes.ts` | API calls |
| Hook | `src/hooks/useUserPlan.ts` | Plan limits |

#### Backend Execution Chain

```
POST /api/qr
  → api/index.php:190-191
    → QrController::create()
      → Get authenticated user from JWT
      → Validate: type, name, content required
      → Check: user plan limits
      → Generate: QR code image (phpqrcode)
      → INSERT: qr_codes table
      → Response: { success, data: QRCode }
```

#### Frontend Failure Matrix

| Symptom | Expected | Actual | Likely Cause | Fix |
|---------|----------|--------|--------------|-----|
| 500 on save | 201 Created | 500 Error | Backend crash | Check PHP error logs |
| No redirect | Dashboard | Stays on page | Success not detected | Check response handling |
| Logo not on QR | Logo merged | No logo | GD/image merge fail | Check backend merge logic |
| Form validation fails | Submit allowed | Blocked | Frontend validation | Check form schema |
| Plan limit error | Success | 403 error | Limit exceeded | Check useUserPlan |

#### Backend Failure Matrix

| Symptom | API | Expected | Actual | Root Cause | Fix |
|---------|-----|----------|--------|------------|-----|
| 500 error | POST /qr | 201 | 500 | Exception in create() | Add try/catch, log error |
| 401 error | POST /qr | 201 | 401 | JWT invalid/expired | Check token refresh |
| 422 error | POST /qr | 201 | 422 | Validation failed | Check required fields |
| Success but no insert | POST /qr | Row created | No row | Transaction rollback | Check DB permissions |

---

### 2.5 Analytics (Analytics.tsx)

#### Identity & Overview
- **Page Name**: Analytics Dashboard
- **URL**: `/dashboard/analytics`
- **Purpose**: Scan statistics and visualizations
- **User Roles**: Authenticated users (Pro/Enterprise for full)
- **Expected Actions**: View charts, filter by date, export
- **Dependencies**: AuthContext, analyticsApi, recharts
- **Entry Points**: Sidebar navigation
- **Importance**: 🟠 High

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Analytics.tsx` | Analytics dashboard |
| Components | `src/components/analytics/*.tsx` | Chart components |
| Service | `src/services/api/analytics.ts` | API calls |

#### Backend Endpoints

| Endpoint | Purpose | Controller Method |
|----------|---------|-------------------|
| GET /analytics/dashboard | Full dashboard data | AnalyticsController::getDashboard |
| GET /analytics/summary | Quick stats | AnalyticsController::getSummary |
| GET /analytics/top-qr-codes | Top performing QRs | AnalyticsController::getTopQRCodes |
| GET /analytics/devices | Device breakdown | AnalyticsController::getDeviceBreakdown |
| GET /analytics/daily | Daily trend | AnalyticsController::getDailyTrend |
| GET /analytics/hourly | Hourly distribution | AnalyticsController::getHourlyDistribution |

---

### 2.6 Inventory (Inventory.tsx)

#### Identity & Overview
- **Page Name**: Inventory Tracking
- **URL**: `/dashboard/inventory`
- **Purpose**: Track physical items with QR codes
- **User Roles**: Authenticated users
- **Expected Actions**: Add items, view, update status, scan history
- **Dependencies**: AuthContext, inventoryApi
- **Entry Points**: Sidebar navigation
- **Importance**: 🟠 High

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Inventory.tsx` | Inventory list |
| Component | `src/components/inventory/InventoryTab.tsx` | Main content |
| Service | `src/services/api/inventory.ts` | API calls |

---

### 2.7 Scan Page (Scan.tsx)

#### Identity & Overview
- **Page Name**: Public Scan Page
- **URL**: `/scan/:id`
- **Purpose**: Handle QR code scans, redirect to content
- **User Roles**: Public (anyone scanning)
- **Expected Actions**: Load QR content, log scan, redirect
- **Dependencies**: ScanController for logging
- **Entry Points**: QR code scan
- **Importance**: 🔴 Critical
- **Safe to Disable**: ❌ No - Core QR functionality

#### Execution Chain

```
User scans QR code
  → Browser opens /scan/:id
    → Scan.tsx loads
      → POST /api/scan/log { qr_id, device_info }
        → ScanController::log()
          → INSERT INTO scans
          → Get QR content
          → Return redirect URL
      → Redirect to QR content
```

---

### 2.8 Subscription (Subscription.tsx)

#### Identity & Overview
- **Page Name**: Subscription Management
- **URL**: `/dashboard/subscription`
- **Purpose**: View/change subscription plan
- **User Roles**: Authenticated users
- **Expected Actions**: View plan, upgrade, cancel
- **Dependencies**: billingApi, PayFast integration
- **Importance**: 🟠 High

#### Files Involved

| Type | File | Purpose |
|------|------|---------|
| Page | `src/pages/Subscription.tsx` | Plan management |
| Components | `src/components/billing/*.tsx` | Billing UI |
| Service | `src/services/api/billing.ts` | Payment APIs |

---

### 2.9 Profile (Profile.tsx)

#### Identity & Overview
- **Page Name**: User Profile
- **URL**: `/dashboard/profile`
- **Purpose**: View/edit user information
- **User Roles**: Authenticated users
- **Expected Actions**: Update name, email, avatar, password
- **Importance**: 🟡 Isolated

---

### 2.10 Settings (Settings.tsx)

#### Identity & Overview
- **Page Name**: Settings
- **URL**: `/dashboard/settings`
- **Purpose**: Application preferences, notifications, 2FA
- **User Roles**: Authenticated users
- **Expected Actions**: Toggle notifications, enable 2FA, delete account
- **Importance**: 🟡 Isolated

---

### 2.11 Admin Pages

#### Admin Login (AdminLogin.tsx)
- **URL**: `/admin/login`
- **Purpose**: Multi-step admin authentication
- **Importance**: 🔴 Critical for admin access

#### Admin Dashboard (AdminDashboard.tsx)
- **URL**: `/admin/dashboard`
- **Purpose**: System overview, metrics
- **Importance**: 🟠 High

#### Admin Users (AdminUsers.tsx)
- **URL**: `/admin/users`
- **Purpose**: User management
- **Importance**: 🟠 High

---

## 3. Database & Data-Flow Traceability

### 3.1 Table Schemas

#### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL,
  avatar_url VARCHAR(500) NULL,
  plan_id INT DEFAULT 1,
  two_factor_secret VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### qr_codes
```sql
CREATE TABLE qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  customization JSON,
  is_dynamic BOOLEAN DEFAULT FALSE,
  dynamic_id VARCHAR(50) NULL,
  image_url VARCHAR(500),
  scan_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### scans
```sql
CREATE TABLE scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  qr_id INT NOT NULL,
  ip_hash VARCHAR(64) NOT NULL,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  user_agent TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  country_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (qr_id) REFERENCES qr_codes(id) ON DELETE CASCADE
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'trial', 'cancelled', 'past_due') DEFAULT 'active',
  billing_cycle ENUM('monthly', 'annual') DEFAULT 'monthly',
  payfast_token VARCHAR(255) NULL,
  renewal_date DATE,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3.2 Table Involvement by Action

| Page | Action | Table(s) | Operation |
|------|--------|----------|-----------|
| Login | Submit | users | SELECT |
| Signup | Submit | users | INSERT |
| Dashboard | Load | qr_codes | SELECT |
| Create QR | Save | qr_codes | INSERT |
| Edit QR | Save | qr_codes | UPDATE |
| Delete QR | Confirm | qr_codes, scans | DELETE |
| Analytics | Load | scans, qr_codes | SELECT (aggregate) |
| Scan | Visit | scans, qr_codes | INSERT, UPDATE |
| Subscribe | Checkout | subscriptions, invoices | INSERT/UPDATE |
| Inventory | Add | inventory, qr_codes | INSERT |

### 3.3 Data Flow Diagram

```
User Action → Frontend Component → API Service → HTTP Request → 
Backend Controller → Database Query → Response → State Update → UI Render
```

---

## 4. API Contract & Data Integrity

### 4.1 Authentication Endpoints

#### POST /auth/register
```typescript
// Request
{
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  captcha_token?: string;
}

// Response (201)
{
  success: true;
  message: "Registration successful";
  data: {
    user: User;
    tokens: { access_token: string; token_type: "Bearer"; expires_in: number };
  }
}

// Error (422)
{
  success: false;
  message: "Validation failed";
  errors: { email: ["Email already exists"] }
}
```

#### POST /auth/login
```typescript
// Request
{
  email: string;
  password: string;
  captcha_token?: string;
}

// Response (200)
{
  success: true;
  data: {
    user: User;
    tokens: AuthTokens;
  }
}

// Error (401)
{
  success: false;
  message: "Invalid credentials"
}
```

### 4.2 QR Code Endpoints

#### POST /qr
```typescript
// Request
{
  type: "url" | "text" | "email" | "phone" | "wifi" | "vcard" | "event" | "location";
  name: string;
  content: QRCodeContent;
  customization?: {
    foreground_color?: string;
    background_color?: string;
    logo_url?: string;
    corner_radius?: number;
    error_correction?: "L" | "M" | "Q" | "H";
  };
  is_dynamic?: boolean;
}

// Response (201)
{
  success: true;
  data: QRCode;
}
```

#### GET /qr
```typescript
// Query params
{
  page?: number;
  per_page?: number;
  search?: string;
  type?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Response (200)
{
  data: QRCode[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }
}
```

### 4.3 Contract Validation Checklist

| Endpoint | Frontend Expects | Backend Returns | Status |
|----------|------------------|-----------------|--------|
| POST /auth/login | `{ user, tokens }` | `{ user, tokens }` | ✅ Match |
| GET /qr | `QRCode[]` with `content` object | `QRCode[]` with `content` JSON | ✅ Match |
| POST /qr | `QRCode` with `id` | `QRCode` with `id` | ✅ Match |
| GET /analytics/summary | Stats object | Stats object | ✅ Match |

---

## 5. Auth, Permissions & Security

### 5.1 Authentication Flow

```
1. User enters credentials
2. Frontend calls POST /auth/login
3. Backend verifies password with password_verify()
4. Backend generates JWT with firebase/php-jwt
5. Frontend stores token in localStorage (token only, no user data)
6. Subsequent requests include Authorization: Bearer <token>
7. Backend validates JWT on protected routes
8. If invalid/expired, return 401 → frontend clears auth, redirects to login
```

### 5.2 Protected Routes

| Route Pattern | Protection | Verified By |
|--------------|------------|-------------|
| `/dashboard/*` | ProtectedRoute | AuthContext.isAuthenticated |
| `/admin/*` | AdminProtectedRoute | Admin session |
| `/api/qr/*` | JWT Middleware | Authorization header |
| `/api/user/*` | JWT Middleware | Authorization header |

### 5.3 Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Passwords hashed | ✅ | bcrypt via password_hash() |
| JWT tokens used | ✅ | firebase/php-jwt |
| HTTPS enforced | ⚠️ | Production only |
| CORS configured | ✅ | Cors.php middleware |
| SQL injection prevented | ✅ | PDO prepared statements |
| XSS prevention | ✅ | React auto-escapes |
| CSRF protection | ⚠️ | Relies on CORS |
| Rate limiting | ⚠️ | Partial (login only) |
| Sensitive data in localStorage | ✅ | Only token stored |

---

## 6. Cross-Page Impact Analysis

### 6.1 Cascade Effects

| If This Breaks | These Pages Fail | Data Impact |
|----------------|------------------|-------------|
| AuthContext | All protected pages | No user data |
| qrCodeApi.list() | Dashboard | Empty list |
| QrController::create() | CreateQRCode | No new QRs |
| scans table | Analytics, Scan | No tracking |
| PaymentController | Subscription, Billing | No payments |
| users table | Everything | Complete failure |

### 6.2 Shared Dependencies

| Dependency | Used By | Risk Level |
|------------|---------|------------|
| AuthContext | All protected routes | 🔴 Critical |
| useToast | All pages with notifications | 🟡 Low |
| DashboardSidebar | All dashboard pages | 🟡 Low |
| API client (axios) | All API calls | 🔴 Critical |
| React Query | Data fetching | 🟠 High |

---

## 7. Mock Data & Fake Success Detection

### 7.1 Known Mock Locations

| File | Mock Type | Condition |
|------|-----------|-----------|
| None currently | - | - |

### 7.2 Detection Queries

```javascript
// Check for mock data in localStorage
const mockKeys = ['mockUser', 'mockData', 'testMode', 'demo'];
mockKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.warn(`Mock data found: ${key}`);
  }
});

// Check for test mode
if (import.meta.env.VITE_TEST_MODE === 'true') {
  console.warn('Running in test mode');
}
```

### 7.3 Force Real Mode

```javascript
// Clear all test/mock data
['mockUser', 'mockData', 'testMode', 'demo'].forEach(key => {
  localStorage.removeItem(key);
});

// Verify API is real
fetch('/api/health').then(r => r.json()).then(data => {
  console.log('API response:', data);
});
```

---

## 8. Root Cause Resolution Tree

### 8.1 Blank Page

```
Blank page?
├── Check browser console for errors
│   ├── JavaScript error → Fix the error
│   ├── Network error → Check API/CORS
│   └── No errors → Component not rendering
├── Check React DevTools
│   ├── Component exists → Check state/props
│   └── Component missing → Check imports/routing
└── Check Network tab
    ├── 404 → Wrong route
    ├── 500 → Backend error
    └── CORS → Check Cors.php
```

### 8.2 Button Does Nothing

```
Button does nothing?
├── Check onClick handler attached
│   ├── Missing → Add handler
│   └── Present → Check if executing
├── Check browser console
│   ├── Error thrown → Fix error
│   └── No error → Add console.log
├── Check if async operation
│   ├── Promise pending → Check network
│   └── Promise rejected → Handle error
└── Check disabled state
    └── Button disabled → Check condition
```

### 8.3 Data Not Saving

```
Data not saving?
├── Frontend: Check form submission
│   ├── Validation failing → Check form errors
│   └── Submission works → Check API call
├── API: Check network request
│   ├── Not sent → Check trigger logic
│   ├── 401 → Token issue
│   ├── 422 → Validation error
│   └── 500 → Backend error
├── Backend: Check controller
│   ├── Not reached → Check routing
│   ├── Exception → Check logs
│   └── No exception → Check DB query
└── Database: Check table
    ├── Row exists → Success path broken
    └── No row → INSERT failed
```

### 8.4 Common Root Causes Summary

| Symptom | Top Causes | Fix |
|---------|------------|-----|
| 401 Unauthorized | Token expired/missing | Refresh token, check storage |
| 500 Internal Error | DB connection, unhandled exception | Check .env, add try/catch |
| CORS blocked | Missing headers | Check Cors.php |
| Empty response | No return in controller | Add Response::success() |
| Data disappears | State not updated | Check React Query cache |
| Form won't submit | Validation failing | Check required fields |

---

## 9. Debug Playbook & Test Checklist

### 9.1 Browser Debugging

```javascript
// Check auth state
console.log('Token:', localStorage.getItem('token'));
console.log('Auth Context:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Check API calls
// Open Network tab, filter by XHR/Fetch

// Check component state
// Open React DevTools, inspect component props/state
```

### 9.2 API Debugging (cURL)

```bash
# Test login
curl -X POST https://qr.ieosuia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoint
curl https://qr.ieosuia.com/api/qr \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test QR creation
curl -X POST https://qr.ieosuia.com/api/qr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"url","name":"Test","content":{"url":"https://example.com"}}'
```

### 9.3 Database Debugging (SQL)

```sql
-- Check user exists
SELECT id, email, email_verified_at FROM users WHERE email = 'test@example.com';

-- Check QR codes for user
SELECT * FROM qr_codes WHERE user_id = 1;

-- Check recent scans
SELECT * FROM scans ORDER BY scanned_at DESC LIMIT 10;

-- Check subscription status
SELECT s.*, p.name as plan_name 
FROM subscriptions s 
JOIN plans p ON s.plan_id = p.id 
WHERE s.user_id = 1;
```

### 9.4 Test Checklist

#### Authentication
- [ ] Register new user
- [ ] Verify email flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Forgot password flow
- [ ] Reset password flow
- [ ] Google OAuth flow
- [ ] Logout clears session
- [ ] Protected routes redirect when unauthenticated

#### QR Codes
- [ ] Create URL QR code
- [ ] Create each QR type (text, email, phone, wifi, vcard, event, location)
- [ ] Edit QR code
- [ ] Delete QR code
- [ ] Download QR as PNG
- [ ] Download QR as SVG
- [ ] Download QR as PDF
- [ ] Bulk create (Enterprise)
- [ ] Custom logo upload
- [ ] Dynamic QR updates

#### Analytics
- [ ] View scan summary
- [ ] View device breakdown
- [ ] View geographic data
- [ ] Export CSV report
- [ ] Date range filtering

#### Subscriptions
- [ ] View current plan
- [ ] Initiate upgrade
- [ ] Complete payment (sandbox)
- [ ] Cancel subscription
- [ ] View invoices

---

## 10. Final Status Verdict

### 10.1 Page Status Summary

| Page | Status | Confidence | Issues |
|------|--------|------------|--------|
| Landing | ✅ Functional | 95% | None |
| Login | ✅ Functional | 90% | Rate limiting partial |
| Signup | ✅ Functional | 90% | - |
| Dashboard | ⚠️ Partial | 80% | QR creation flow needs verification |
| Create QR | ⚠️ Partial | 75% | 500 errors reported, logo merge issues |
| Analytics | ✅ Functional | 85% | - |
| Inventory | ✅ Functional | 85% | - |
| Scan | ✅ Functional | 90% | - |
| Profile | ✅ Functional | 90% | - |
| Settings | ✅ Functional | 90% | - |
| Subscription | ⚠️ Partial | 75% | PayFast integration needs live testing |
| Admin | ⚠️ Partial | 70% | Multi-step auth needs verification |

### 10.2 Global Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| QR creation 500 errors | 🔴 High | Add comprehensive error handling |
| Payment in production | 🔴 High | Disable sandbox, test live |
| Admin access security | 🟠 Medium | Audit multi-step auth |
| Rate limiting | 🟡 Low | Implement on all sensitive endpoints |

### 10.3 Remaining Unknowns

1. **Production environment variables** - Need verification
2. **PayFast live mode** - Untested in production
3. **GeoIP database** - Path verification needed
4. **Email delivery** - SMTP configuration
5. **File storage paths** - Logo/avatar storage

### 10.4 Final Verdict

**Overall Status**: ⚠️ **Partially Production-Ready**

**Confidence**: 80%

**Critical Action Items**:
1. Fix QR creation 500 errors (P0)
2. Verify all environment variables for production (P0)
3. Test payment flow end-to-end in sandbox (P0)
4. Add comprehensive error logging (P1)
5. Implement rate limiting on all auth endpoints (P1)

---

## Appendix A: File Index

### Frontend Files
```
src/
├── App.tsx                          # Main router
├── main.tsx                         # Entry point
├── index.css                        # Global styles
├── contexts/
│   └── AuthContext.tsx              # Auth state
├── pages/
│   ├── Index.tsx                    # Landing
│   ├── Login.tsx                    # Login
│   ├── Signup.tsx                   # Register
│   ├── Dashboard.tsx                # QR list
│   ├── CreateQRCode.tsx             # QR creation
│   ├── Analytics.tsx                # Stats
│   ├── Inventory.tsx                # Tracking
│   ├── Profile.tsx                  # User profile
│   ├── Settings.tsx                 # Preferences
│   ├── Subscription.tsx             # Plans
│   └── [... 30+ more pages]
├── components/
│   ├── ui/                          # shadcn components
│   ├── layout/                      # Header, Footer, Sidebar
│   ├── landing/                     # Landing sections
│   ├── dashboard/                   # Dashboard components
│   ├── qr/                          # QR components
│   ├── analytics/                   # Charts
│   ├── auth/                        # Auth components
│   ├── billing/                     # Payment UI
│   ├── inventory/                   # Inventory UI
│   └── admin/                       # Admin components
├── hooks/
│   ├── useQRStorage.ts              # QR state
│   ├── useQRDownload.ts             # Downloads
│   ├── useUserPlan.ts               # Plan limits
│   ├── use-toast.ts                 # Notifications
│   └── [... more hooks]
├── services/api/
│   ├── client.ts                    # Axios setup
│   ├── auth.ts                      # Auth API
│   ├── qrcodes.ts                   # QR API
│   ├── analytics.ts                 # Stats API
│   ├── billing.ts                   # Payment API
│   ├── inventory.ts                 # Inventory API
│   └── types.ts                     # TypeScript types
└── lib/
    └── testRunner/                  # Automated tests
```

### Backend Files
```
api/
├── index.php                        # Main router
├── .env                             # Environment vars
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── QrController.php
│   │   ├── ScanController.php
│   │   ├── SubscriptionController.php
│   │   ├── PaymentController.php
│   │   ├── BillingController.php
│   │   ├── AnalyticsController.php
│   │   ├── InventoryController.php
│   │   ├── ContactController.php
│   │   ├── AdminController.php
│   │   ├── AdminAuthController.php
│   │   ├── QAController.php
│   │   └── DesignPresetController.php
│   ├── Middleware/
│   │   └── Cors.php
│   ├── Helpers/
│   │   └── Response.php
│   └── Services/
└── database/
    └── migrations/
```

---

*Document generated by IEOSUIA QR Automated Test System*
*Last updated: 2024-01-15*
*Version: 1.0*
