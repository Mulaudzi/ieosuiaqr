<?php
/**
 * IEOSUIA QR API - Main Entry Point
 * Plain PHP REST API Router
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Autoload
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
use Dotenv\Dotenv;
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

// Use classes
use App\Middleware\Cors;
use App\Helpers\Response;
use App\Controllers\AuthController;
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
    if ($uri === '/v1/auth/register' && $method === 'POST') {
        AuthController::register();
    }
    elseif ($uri === '/v1/auth/login' && $method === 'POST') {
        AuthController::login();
    }
    elseif ($uri === '/v1/auth/logout' && $method === 'POST') {
        AuthController::logout();
    }
    elseif ($uri === '/v1/auth/verify-email' && $method === 'POST') {
        AuthController::verifyEmail();
    }
    elseif ($uri === '/v1/auth/forgot-password' && $method === 'POST') {
        AuthController::forgotPassword();
    }
    elseif ($uri === '/v1/auth/reset-password' && $method === 'POST') {
        AuthController::resetPassword();
    }
    elseif ($uri === '/v1/auth/resend-verification' && $method === 'POST') {
        AuthController::resendVerification();
    }

    // User profile (auth required)
    elseif ($uri === '/v1/user/profile' && $method === 'GET') {
        AuthController::getProfile();
    }
    elseif ($uri === '/v1/user/profile' && $method === 'PUT') {
        AuthController::updateProfile();
    }

    // QR codes
    elseif ($uri === '/v1/qr' && $method === 'POST') {
        QrController::create();
    }
    elseif ($uri === '/v1/qr' && $method === 'GET') {
        QrController::list();
    }
    elseif ($uri === '/v1/qr/bulk' && $method === 'POST') {
        QrController::bulkCreate();
    }
    elseif (preg_match('#^/v1/qr/(\d+)$#', $uri, $matches) && $method === 'GET') {
        QrController::show((int)$matches[1]);
    }
    elseif (preg_match('#^/v1/qr/(\d+)$#', $uri, $matches) && $method === 'PUT') {
        QrController::update((int)$matches[1]);
    }
    elseif (preg_match('#^/v1/qr/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        QrController::delete((int)$matches[1]);
    }
    elseif (preg_match('#^/v1/qr/(\d+)/scans$#', $uri, $matches) && $method === 'GET') {
        ScanController::getScans((int)$matches[1]);
    }
    elseif (preg_match('#^/v1/qr/(\d+)/stats$#', $uri, $matches) && $method === 'GET') {
        ScanController::getStats((int)$matches[1]);
    }

    // Scan logging (public)
    elseif ($uri === '/v1/scan/log' && $method === 'POST') {
        ScanController::log();
    }
    elseif ($uri === '/v1/scan/log' && $method === 'GET') {
        ScanController::log(); // Also support GET for redirects
    }

    // Subscriptions
    elseif ($uri === '/v1/subscriptions/plans' && $method === 'GET') {
        SubscriptionController::getPlans();
    }
    elseif ($uri === '/v1/subscriptions/current' && $method === 'GET') {
        SubscriptionController::getCurrentSubscription();
    }
    elseif ($uri === '/v1/subscriptions/cancel' && $method === 'POST') {
        SubscriptionController::cancel();
    }

    // Payments
    elseif ($uri === '/v1/payments/checkout' && $method === 'POST') {
        PaymentController::checkout();
    }
    elseif ($uri === '/v1/webhooks/payfast' && $method === 'POST') {
        PaymentController::handleWebhook();
    }

    // Billing/Invoices
    elseif ($uri === '/v1/billing/invoices' && $method === 'GET') {
        BillingController::getInvoices();
    }
    elseif (preg_match('#^/v1/billing/invoices/(\d+)$#', $uri, $matches) && $method === 'GET') {
        BillingController::getInvoice((int)$matches[1]);
    }
    elseif (preg_match('#^/v1/billing/invoices/(\d+)/receipt$#', $uri, $matches) && $method === 'GET') {
        BillingController::downloadReceipt((int)$matches[1]);
    }

    // Analytics
    elseif ($uri === '/v1/analytics/dashboard' && $method === 'GET') {
        AnalyticsController::getDashboard();
    }
    elseif ($uri === '/v1/analytics/export' && $method === 'GET') {
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
