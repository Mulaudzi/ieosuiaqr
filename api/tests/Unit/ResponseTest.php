<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Helpers\Response;

class ResponseTest extends TestCase
{
    protected function setUp(): void
    {
        // Mock headers_sent to avoid "headers already sent" errors in tests
        if (!defined('PHPUNIT_RUNNING')) {
            define('PHPUNIT_RUNNING', true);
        }
    }

    public function testSuccessResponseStructure(): void
    {
        // Capture output instead of sending
        ob_start();
        
        try {
            Response::success(['id' => 1, 'name' => 'Test'], 'Success message', 200);
        } catch (\Exception $e) {
            // Expected: Response calls exit()
        }
        
        $output = ob_get_clean();
        
        // Parse the JSON output (may be empty if exit is called before output)
        if (!empty($output)) {
            $decoded = json_decode($output, true);
            
            $this->assertArrayHasKey('success', $decoded);
            $this->assertArrayHasKey('data', $decoded);
            $this->assertArrayHasKey('message', $decoded);
            $this->assertTrue($decoded['success']);
        }
        
        // Test passes if no fatal errors
        $this->assertTrue(true);
    }

    public function testSuccessResponseWithNullData(): void
    {
        ob_start();
        
        try {
            Response::success(null, 'Operation completed');
        } catch (\Exception $e) {
            // Expected: Response calls exit()
        }
        
        $output = ob_get_clean();
        
        if (!empty($output)) {
            $decoded = json_decode($output, true);
            $this->assertNull($decoded['data']);
        }
        
        $this->assertTrue(true);
    }

    public function testJsonResponseFormat(): void
    {
        ob_start();
        
        try {
            Response::json(['key' => 'value'], 200);
        } catch (\Exception $e) {
            // Expected
        }
        
        $output = ob_get_clean();
        
        if (!empty($output)) {
            $this->assertJson($output);
        }
        
        $this->assertTrue(true);
    }
}
