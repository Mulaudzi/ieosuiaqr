<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * API Endpoint Integration Tests
 * Tests that API routes are correctly configured
 */
class ApiRoutesTest extends TestCase
{
    private string $indexContent;

    protected function setUp(): void
    {
        $indexPath = __DIR__ . '/../../index.php';
        if (!file_exists($indexPath)) {
            $this->markTestSkipped('index.php not found');
        }
        $this->indexContent = file_get_contents($indexPath);
    }

    public function testAuthRoutesExist(): void
    {
        $authRoutes = [
            '/auth/register',
            '/auth/login',
            '/auth/logout',
            '/auth/verify-email',
            '/auth/forgot-password',
            '/auth/reset-password',
        ];

        foreach ($authRoutes as $route) {
            $this->assertStringContainsString($route, $this->indexContent, "Route {$route} should exist");
        }
    }

    public function testUserProfileRoutesExist(): void
    {
        $userRoutes = [
            '/user/profile',
            '/user/avatar',
            '/user/notifications',
            '/user/delete',
        ];

        foreach ($userRoutes as $route) {
            $this->assertStringContainsString($route, $this->indexContent, "Route {$route} should exist");
        }
    }

    public function testQrCodeRoutesExist(): void
    {
        // Base routes
        $this->assertStringContainsString("'/qr'", $this->indexContent);
        $this->assertStringContainsString("'/qr/bulk'", $this->indexContent);
        
        // Dynamic routes (using regex patterns)
        $this->assertStringContainsString("/qr/(\\d+)", $this->indexContent);
        $this->assertStringContainsString("/qr/(\\d+)/stats", $this->indexContent);
        $this->assertStringContainsString("/qr/(\\d+)/scans", $this->indexContent);
    }

    public function testSubscriptionRoutesExist(): void
    {
        $subscriptionRoutes = [
            '/subscriptions/plans',
            '/subscriptions/current',
            '/subscriptions/cancel',
            '/subscriptions/change',
        ];

        foreach ($subscriptionRoutes as $route) {
            $this->assertStringContainsString($route, $this->indexContent, "Route {$route} should exist");
        }
    }

    public function testInventoryRoutesExist(): void
    {
        $inventoryRoutes = [
            '/inventory',
            '/inventory/analytics',
            '/inventory/alerts',
        ];

        foreach ($inventoryRoutes as $route) {
            $this->assertStringContainsString($route, $this->indexContent, "Route {$route} should exist");
        }
    }

    public function testBillingRoutesExist(): void
    {
        $billingRoutes = [
            '/billing/invoices',
            '/billing/payments',
        ];

        foreach ($billingRoutes as $route) {
            $this->assertStringContainsString($route, $this->indexContent, "Route {$route} should exist");
        }
    }

    public function testCorsHandlerIsCalled(): void
    {
        $this->assertStringContainsString('Cors::handle()', $this->indexContent);
    }

    public function testControllersAreImported(): void
    {
        $controllers = [
            'AuthController',
            'QrController',
            'ScanController',
            'SubscriptionController',
            'PaymentController',
            'BillingController',
            'InventoryController',
        ];

        foreach ($controllers as $controller) {
            $this->assertStringContainsString($controller, $this->indexContent, "Controller {$controller} should be imported");
        }
    }

    public function testHttpMethodsAreHandled(): void
    {
        $methods = ['GET', 'POST', 'PUT', 'DELETE'];

        foreach ($methods as $method) {
            $this->assertStringContainsString("\$method === '{$method}'", $this->indexContent, "HTTP method {$method} should be handled");
        }
    }

    public function testErrorHandlingExists(): void
    {
        $this->assertStringContainsString('try {', $this->indexContent);
        $this->assertStringContainsString('catch', $this->indexContent);
        $this->assertStringContainsString('Response::error', $this->indexContent);
    }
}
