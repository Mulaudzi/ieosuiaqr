<?php
/**
 * IEOSUIA QR API - Main Entry Point
 * Plain PHP REST API Router
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

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
use App\Controllers\GoogleAuthController;
use App\Controllers\QrController;
use App\Controllers\ScanController;
use App\Controllers\SubscriptionController;
use App\Controllers\PaymentController;
use App\Controllers\BillingController;
use App\Controllers\AnalyticsController;

// Handle CORS
Cors::handle();

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$uri = preg_replace('#^/api#', '', $uri);

// Route matching
try {
    // Auth routes (no auth required)
    if ($uri === '/auth/register' && $method === 'POST') {
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
    // Google OAuth
    elseif ($uri === '/auth/google' && $method === 'GET') {
        GoogleAuthController::redirect();
    }
    elseif ($uri === '/auth/google/callback' && $method === 'GET') {
        GoogleAuthController::callback();
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

    // Subscriptions
    elseif ($uri === '/subscriptions/plans' && $method === 'GET') {
        SubscriptionController::getPlans();
    }
    elseif ($uri === '/subscriptions/current' && $method === 'GET') {
        SubscriptionController::getCurrentSubscription();
    }
    elseif ($uri === '/subscriptions/cancel' && $method === 'POST') {
        SubscriptionController::cancel();
    }

    // Payments
    elseif ($uri === '/payments/checkout' && $method === 'POST') {
        PaymentController::checkout();
    }
    elseif ($uri === '/webhooks/payfast' && $method === 'POST') {
        PaymentController::handleWebhook();
    }

    // Billing/Invoices
    elseif ($uri === '/billing/invoices' && $method === 'GET') {
        BillingController::getInvoices();
    }
    elseif (preg_match('#^/billing/invoices/(\d+)$#', $uri, $matches) && $method === 'GET') {
        BillingController::getInvoice((int)$matches[1]);
    }
    elseif (preg_match('#^/billing/invoices/(\d+)/receipt$#', $uri, $matches) && $method === 'GET') {
        BillingController::downloadReceipt((int)$matches[1]);
    }

    // Analytics
    elseif ($uri === '/analytics/dashboard' && $method === 'GET') {
        AnalyticsController::getDashboard();
    }
    elseif ($uri === '/analytics/export' && $method === 'GET') {
        AnalyticsController::exportCsv();
    }

    // 404 Not Found
    else {
        Response::error('Endpoint not found', 404);
    }

} catch (\Exception $e) {
    error_log("API Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error('Internal server error', 500);
}
