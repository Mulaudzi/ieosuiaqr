<?php
/**
 * IEOSUIA QR API - Main Entry Point
 * Plain PHP REST API Router
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

$composerAutoload = __DIR__ . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

// Manual class loading (no composer)
spl_autoload_register(function ($class) {
    // Convert namespace to file path
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/src/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

// Load environment variables manually
function loadEnv($path) {
    if (!file_exists($path)) return;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            // Remove quotes if present
            $value = trim($value, '"\'');
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

loadEnv(__DIR__ . '/.env');

// Use classes
use App\Middleware\Cors;
use App\Helpers\Response;
use App\Controllers\AuthController;
use App\Controllers\QrController;
use App\Controllers\ScanController;
use App\Controllers\ContactController;
use App\Controllers\AnalyticsController;
use App\Controllers\InventoryController;
use App\Controllers\AdminController;
use App\Controllers\AdminAuthController;
use App\Controllers\DesignPresetController;
use App\Controllers\IeosuiaAuthController;

// Handle CORS
Cors::handle();

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$uri = preg_replace('#^/api#', '', $uri);

// QA endpoints can seed and delete test data and must never be exposed in production.
if (preg_match('#^/(admin/)?qa(?:/|$)#', $uri) && ($_ENV['APP_ENV'] ?? 'production') === 'production') {
    Response::error('Endpoint not found', 404);
}

// Route matching
try {
    $legacyAuthRoutes = ['/auth/register','/auth/login','/auth/verify-email','/auth/forgot-password','/auth/reset-password','/auth/resend-verification','/admin/auth/batch','/admin/auth/step1','/admin/auth/step2','/admin/auth/step3','/admin/auth/create','/admin/auth/passwords'];
    if (in_array($uri, $legacyAuthRoutes, true)) {
        IeosuiaAuthController::disabled();
    }
    if ($uri === '/auth/ieosuia/start' && $method === 'GET') {
        IeosuiaAuthController::start();
    }
    elseif ($uri === '/auth/ieosuia/callback' && $method === 'GET') {
        IeosuiaAuthController::callback();
    }
    // Auth routes (no auth required)
    elseif ($uri === '/auth/register' && $method === 'POST') {
        AuthController::register();
    }
    elseif ($uri === '/auth/login' && $method === 'POST') {
        AuthController::login();
    }
    elseif ($uri === '/auth/logout' && $method === 'POST') {
        AuthController::logout();
    }
    elseif ($uri === '/auth/verify-email' && $method === 'POST') {
        AuthController::verifyEmail();
    }
    elseif ($uri === '/auth/forgot-password' && $method === 'POST') {
        AuthController::forgotPassword();
    }
    elseif ($uri === '/auth/reset-password' && $method === 'POST') {
        AuthController::resetPassword();
    }
    elseif ($uri === '/auth/resend-verification' && $method === 'POST') {
        AuthController::resendVerification();
    }
    // Admin Auth routes (multi-step authentication)
    elseif ($uri === '/admin/auth/batch' && $method === 'POST') {
        AdminAuthController::batchLogin();
    }
    elseif ($uri === '/admin/auth/step1' && $method === 'POST') {
        AdminAuthController::loginStep1();
    }
    elseif ($uri === '/admin/auth/step2' && $method === 'POST') {
        AdminAuthController::loginStep2();
    }
    elseif ($uri === '/admin/auth/step3' && $method === 'POST') {
        AdminAuthController::loginStep3();
    }
    elseif ($uri === '/admin/auth/session' && $method === 'GET') {
        AdminAuthController::checkSession();
    }
    elseif ($uri === '/admin/auth/create' && $method === 'POST') {
        AdminAuthController::createAdmin();
    }
    elseif ($uri === '/admin/auth/passwords' && $method === 'PUT') {
        AdminAuthController::updatePasswords();
    }
    // Admin management routes
    elseif ($uri === '/admin/users' && $method === 'GET') {
        AdminAuthController::listAdmins();
    }
    elseif (preg_match('#^/admin/users/(\d+)$#', $uri, $matches) && $method === 'GET') {
        AdminAuthController::getAdmin((int)$matches[1]);
    }
    elseif (preg_match('#^/admin/users/(\d+)$#', $uri, $matches) && $method === 'PUT') {
        AdminAuthController::updateAdmin((int)$matches[1]);
    }
    elseif (preg_match('#^/admin/users/(\d+)/toggle$#', $uri, $matches) && $method === 'POST') {
        AdminAuthController::toggleAdminStatus((int)$matches[1]);
    }
    elseif (preg_match('#^/admin/users/(\d+)/unlock$#', $uri, $matches) && $method === 'POST') {
        AdminAuthController::unlockAdmin((int)$matches[1]);
    }
    elseif (preg_match('#^/admin/users/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        AdminAuthController::deleteAdmin((int)$matches[1]);
    }
    // Admin Audit Logs
    elseif ($uri === '/admin/audit' && $method === 'GET') {
        AdminAuthController::getAuditLogs();
    }
    elseif ($uri === '/admin/audit/stats' && $method === 'GET') {
        AdminAuthController::getAuditStats();
    }
    elseif ($uri === '/admin/audit/export' && $method === 'GET') {
        AdminAuthController::exportAuditLogs();
    }

    // User profile (auth required)
    elseif ($uri === '/user/profile' && $method === 'GET') {
        AuthController::getProfile();
    }
    elseif ($uri === '/user/profile' && $method === 'PUT') {
        AuthController::updateProfile();
    }
    elseif ($uri === '/user/avatar' && $method === 'POST') {
        AuthController::uploadAvatar();
    }
    elseif ($uri === '/user/notifications' && $method === 'GET') {
        AuthController::getNotificationPreferences();
    }
    elseif ($uri === '/user/notifications' && $method === 'PUT') {
        AuthController::updateNotificationPreferences();
    }
    elseif ($uri === '/user/delete' && $method === 'POST') {
        AuthController::deleteAccount();
    }
    // QR codes
    elseif ($uri === '/qr' && $method === 'POST') {
        QrController::create();
    }
    elseif ($uri === '/qr' && $method === 'GET') {
        QrController::list();
    }
    elseif ($uri === '/qr/bulk' && $method === 'POST') {
        QrController::bulkCreate();
    }
    elseif (preg_match('#^/qr/(\d+)$#', $uri, $matches) && $method === 'GET') {
        QrController::show((int)$matches[1]);
    }
    elseif (preg_match('#^/qr/(\d+)$#', $uri, $matches) && $method === 'PUT') {
        QrController::update((int)$matches[1]);
    }
    elseif (preg_match('#^/qr/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        QrController::delete((int)$matches[1]);
    }
    elseif (preg_match('#^/qr/(\d+)/scans$#', $uri, $matches) && $method === 'GET') {
        ScanController::getScans((int)$matches[1]);
    }
    elseif (preg_match('#^/qr/(\d+)/stats$#', $uri, $matches) && $method === 'GET') {
        ScanController::getStats((int)$matches[1]);
    }

    // Scan logging (public)
    elseif ($uri === '/scan/log' && $method === 'POST') {
        ScanController::log();
    }
    elseif ($uri === '/scan/log' && $method === 'GET') {
        ScanController::log(); // Also support GET for redirects
    }

    // Analytics
    elseif ($uri === '/analytics/dashboard' && $method === 'GET') {
        AnalyticsController::getDashboard();
    }
    elseif ($uri === '/analytics/export' && $method === 'GET') {
        AnalyticsController::exportCsv();
    }
    elseif ($uri === '/analytics/summary' && $method === 'GET') {
        AnalyticsController::getSummary();
    }
    elseif ($uri === '/analytics/top-qr-codes' && $method === 'GET') {
        AnalyticsController::getTopQRCodes();
    }
    elseif ($uri === '/analytics/devices' && $method === 'GET') {
        AnalyticsController::getDeviceBreakdown();
    }
    elseif ($uri === '/analytics/daily' && $method === 'GET') {
        AnalyticsController::getDailyTrend();
    }
    elseif ($uri === '/analytics/hourly' && $method === 'GET') {
        AnalyticsController::getHourlyDistribution();
    }
    elseif ($uri === '/reports/export' && $method === 'POST') {
        AnalyticsController::exportReport();
    }

    // Contact form
    elseif ($uri === '/contact' && $method === 'POST') {
        ContactController::submit();
    }

    // User logos
    elseif ($uri === '/user/logos' && $method === 'GET') {
        AuthController::getLogos();
    }
    elseif ($uri === '/user/logos' && $method === 'POST') {
        AuthController::uploadLogo();
    }

    // Inventory
    elseif ($uri === '/inventory' && $method === 'GET') {
        InventoryController::list();
    }
    elseif ($uri === '/inventory' && $method === 'POST') {
        InventoryController::create();
    }
    elseif ($uri === '/inventory/scan' && $method === 'POST') {
        InventoryController::logScan();
    }
    elseif ($uri === '/inventory/limits' && $method === 'GET') {
        InventoryController::getLimits();
    }
    elseif ($uri === '/inventory/analytics' && $method === 'GET') {
        InventoryController::getAnalytics();
    }
    elseif ($uri === '/inventory/analytics/export' && $method === 'GET') {
        InventoryController::exportAnalyticsCsv();
    }
    elseif ($uri === '/inventory/alerts' && $method === 'GET') {
        InventoryController::getAlerts();
    }
    elseif ($uri === '/inventory/alerts/read' && $method === 'POST') {
        InventoryController::markAlertsRead();
    }
    elseif ($uri === '/inventory/alerts/check' && $method === 'POST') {
        InventoryController::checkLowActivityAlerts();
    }
    elseif ($uri === '/inventory/maintenance' && $method === 'POST') {
        InventoryController::setMaintenanceReminder();
    }
    // Public inventory endpoints (for scan page)
    elseif (preg_match('#^/inventory/qr/(\d+)$#', $uri, $matches) && $method === 'GET') {
        InventoryController::getByQrCode((int)$matches[1]);
    }
    elseif (preg_match('#^/inventory/qr/(\d+)/status$#', $uri, $matches) && $method === 'POST') {
        InventoryController::updateStatusByQrCode((int)$matches[1]);
    }
    elseif (preg_match('#^/inventory/qr/(\d+)/history$#', $uri, $matches) && $method === 'GET') {
        InventoryController::getHistoryByQrCode((int)$matches[1]);
    }
    elseif (preg_match('#^/inventory/(\d+)$#', $uri, $matches) && $method === 'GET') {
        InventoryController::show((int)$matches[1]);
    }
    elseif (preg_match('#^/inventory/(\d+)$#', $uri, $matches) && $method === 'PUT') {
        InventoryController::update((int)$matches[1]);
    }
    elseif (preg_match('#^/inventory/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        InventoryController::delete((int)$matches[1]);
    }

    // Admin routes
    elseif ($uri === '/admin/verify' && $method === 'GET') {
        AdminController::verifyAccess();
    }
    elseif ($uri === '/admin/emails' && $method === 'GET') {
        AdminController::getEmailLogs();
    }
    elseif (preg_match('#^/admin/emails/(\d+)$#', $uri, $matches) && $method === 'GET') {
        $_GET['id'] = $matches[1];
        AdminController::getEmailLog();
    }
    elseif ($uri === '/admin/logout' && $method === 'POST') {
        AdminController::logout();
    }
    // Admin email management endpoints
    elseif ($uri === '/admin/emails/read' && $method === 'POST') {
        AdminController::markEmailRead();
    }
    elseif ($uri === '/admin/emails/replied' && $method === 'POST') {
        AdminController::markEmailReplied();
    }
    elseif ($uri === '/admin/emails/priority' && $method === 'POST') {
        AdminController::setEmailPriority();
    }
    elseif ($uri === '/admin/emails/archive' && $method === 'POST') {
        AdminController::archiveEmail();
    }
    elseif ($uri === '/admin/emails/bulk' && $method === 'POST') {
        AdminController::bulkMarkEmails();
    }
    elseif ($uri === '/admin/webhooks' && $method === 'GET') {
        AdminController::getWebhookLogs();
    }
    // Email webhook endpoint (public)
    elseif ($uri === '/webhooks/email' && $method === 'POST') {
        AdminController::handleEmailWebhook();
    }
    // Admin settings endpoints
    elseif ($uri === '/admin/settings' && $method === 'GET') {
        AdminController::getSettings();
    }
    elseif ($uri === '/admin/settings' && $method === 'POST') {
        AdminController::updateSettings();
    }
    // Admin statistics endpoint
    elseif ($uri === '/admin/stats' && $method === 'GET') {
        AdminController::getEmailStats();
    }
    // Export endpoints
    elseif ($uri === '/admin/export/emails' && $method === 'GET') {
        AdminController::exportEmailsCsv();
    }
    elseif ($uri === '/admin/export/stats' && $method === 'GET') {
        AdminController::exportStatsReport();
    }
    // Design Presets
    elseif ($uri === '/design-presets' && $method === 'GET') {
        (new DesignPresetController())->index();
    }
    elseif ($uri === '/design-presets' && $method === 'POST') {
        (new DesignPresetController())->store();
    }
    elseif (preg_match('#^/design-presets/([a-zA-Z0-9-]+)$#', $uri, $matches) && $method === 'GET') {
        (new DesignPresetController())->show($matches[1]);
    }
    elseif (preg_match('#^/design-presets/([a-zA-Z0-9-]+)$#', $uri, $matches) && $method === 'PUT') {
        (new DesignPresetController())->update($matches[1]);
    }
    elseif (preg_match('#^/design-presets/([a-zA-Z0-9-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new DesignPresetController())->destroy($matches[1]);
    }
    elseif (preg_match('#^/design-presets/([a-zA-Z0-9-]+)/set-default$#', $uri, $matches) && $method === 'POST') {
        (new DesignPresetController())->setDefault($matches[1]);
    }

    // 404 Not Found
    else {
        Response::error('Endpoint not found', 404);
    }

} catch (\Throwable $e) {
    error_log("API Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error('Internal server error', 500);
}
