// API Service Layer - Export all modules
// Ready to connect to your Laravel PHP backend

export * from "./types";
export * from "./client";
export { authApi, authHelpers } from "./auth";
export { qrCodeApi } from "./qrcodes";
export { billingApi, payfastHelpers } from "./billing";
export { analyticsApi, scanHelpers } from "./analytics";

/**
 * API Integration Guide for Laravel Backend
 * =========================================
 * 
 * This service layer is ready to connect to your Laravel PHP backend.
 * 
 * Backend Requirements:
 * ---------------------
 * 1. Laravel 10+ with tymon/jwt-auth for authentication
 * 2. PayFast PHP SDK for payments
 * 3. GeoIP2 for scan location tracking
 * 4. WhichBrowser for device detection
 * 
 * Environment Variables (frontend):
 * ---------------------------------
 * VITE_API_URL=/api/v1  (or https://qr.ieosuia.com/api/v1 for production)
 * 
 * Laravel .env (backend):
 * -----------------------
 * APP_KEY=your-app-key
 * DB_CONNECTION=mysql
 * DB_HOST=127.0.0.1
 * DB_DATABASE=ieosuia_qr
 * DB_USERNAME=your-username
 * DB_PASSWORD=your-password
 * 
 * JWT_SECRET=your-jwt-secret
 * 
 * PAYFAST_MERCHANT_ID=your-merchant-id
 * PAYFAST_MERCHANT_KEY=your-merchant-key
 * PAYFAST_PASSPHRASE=your-passphrase
 * PAYFAST_SANDBOX=true  (set to false for production)
 * 
 * GEOIP_DB_PATH=/path/to/GeoLite2-City.mmdb
 * 
 * Laravel Routes (routes/api.php):
 * --------------------------------
 * // Public routes
 * Route::post('/register', [AuthController::class, 'register']);
 * Route::post('/login', [AuthController::class, 'login']);
 * Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
 * Route::post('/reset-password', [AuthController::class, 'resetPassword']);
 * Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
 * Route::post('/scan/log', [ScanController::class, 'log']);
 * Route::get('/plans', [PlanController::class, 'index']);
 * Route::post('/webhooks/payfast', [PaymentController::class, 'handleWebhook']);
 * 
 * // Protected routes
 * Route::middleware('auth:api')->group(function () {
 *   Route::post('/logout', [AuthController::class, 'logout']);
 *   Route::get('/user/profile', [AuthController::class, 'profile']);
 *   Route::put('/user/update', [AuthController::class, 'update']);
 *   
 *   Route::apiResource('/qr', QrController::class);
 *   Route::post('/qr/bulk-create', [QrController::class, 'bulkCreate']);
 *   Route::post('/qr/bulk-import', [QrController::class, 'bulkImport']);
 *   Route::get('/qr/{id}/scans', [QrController::class, 'scans']);
 *   Route::get('/qr/{id}/stats', [QrController::class, 'stats']);
 *   
 *   Route::get('/subscription', [SubscriptionController::class, 'show']);
 *   Route::post('/payments/checkout', [PaymentController::class, 'checkout']);
 *   Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
 *   
 *   Route::get('/billing/invoices', [InvoiceController::class, 'index']);
 *   Route::get('/billing/invoice/{id}', [InvoiceController::class, 'show']);
 *   Route::get('/billing/invoice/{id}/receipt', [InvoiceController::class, 'receipt']);
 *   
 *   Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
 *   Route::get('/analytics/top-qr-codes', [AnalyticsController::class, 'topQrCodes']);
 *   Route::get('/analytics/devices', [AnalyticsController::class, 'devices']);
 *   Route::get('/analytics/geo', [AnalyticsController::class, 'geo']);
 *   Route::post('/reports/export', [ReportController::class, 'export']);
 * });
 * 
 * Usage Examples:
 * ---------------
 * import { authApi, qrCodeApi, billingApi } from '@/services/api';
 * 
 * // Login
 * const { data } = await authApi.login({ email, password });
 * authHelpers.setAuth(data.tokens, data.user);
 * 
 * // Create QR code
 * const qr = await qrCodeApi.create({
 *   type: 'url',
 *   name: 'My Website',
 *   content: { url: 'https://example.com' }
 * });
 * 
 * // Checkout with PayFast
 * const { data: checkout } = await billingApi.checkout({
 *   plan_id: 2,
 *   billing_cycle: 'monthly'
 * });
 * window.location.href = checkout.payment_url;
 */
