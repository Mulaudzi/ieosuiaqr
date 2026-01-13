<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Middleware\Auth;

/**
 * Authentication Integration Tests
 */
class AuthTest extends TestCase
{
    private const TEST_USER_ID = 99999;
    private const TEST_USER_PLAN = 'Pro';

    public function testJwtTokenGeneration(): void
    {
        $token = Auth::generateToken(self::TEST_USER_ID, self::TEST_USER_PLAN);
        
        $this->assertIsString($token);
        $this->assertNotEmpty($token);
        
        // JWT format: header.payload.signature
        $parts = explode('.', $token);
        $this->assertCount(3, $parts);
    }

    public function testJwtTokenIsBase64Encoded(): void
    {
        $token = Auth::generateToken(self::TEST_USER_ID, self::TEST_USER_PLAN);
        $parts = explode('.', $token);
        
        // Each part should be base64url encoded
        foreach ($parts as $part) {
            // base64url uses - and _ instead of + and /
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $part);
        }
    }

    public function testDifferentUsersGetDifferentTokens(): void
    {
        $token1 = Auth::generateToken(1, 'Free');
        $token2 = Auth::generateToken(2, 'Free');
        
        $this->assertNotEquals($token1, $token2);
    }

    public function testDifferentPlansGetDifferentTokens(): void
    {
        $token1 = Auth::generateToken(1, 'Free');
        $token2 = Auth::generateToken(1, 'Pro');
        
        $this->assertNotEquals($token1, $token2);
    }

    public function testFormatUserForFrontendStructure(): void
    {
        $mockUser = [
            'id' => 1,
            'email' => 'test@example.com',
            'name' => 'Test User',
            'plan' => 'Pro',
            'email_verified_at' => '2024-01-01 00:00:00',
            'avatar_url' => 'https://example.com/avatar.jpg',
            'created_at' => '2024-01-01 00:00:00',
        ];

        $formatted = Auth::formatUserForFrontend($mockUser);
        
        $this->assertArrayHasKey('id', $formatted);
        $this->assertArrayHasKey('email', $formatted);
        $this->assertArrayHasKey('name', $formatted);
        $this->assertArrayHasKey('plan', $formatted);
        $this->assertArrayHasKey('email_verified', $formatted);
        $this->assertArrayHasKey('avatar_url', $formatted);
        $this->assertArrayHasKey('created_at', $formatted);
    }

    public function testFormatUserSanitizesData(): void
    {
        $mockUser = [
            'id' => 1,
            'email' => 'test@example.com',
            'name' => 'Test User',
            'plan' => 'Pro',
            'email_verified_at' => '2024-01-01 00:00:00',
            'password' => 'should_not_appear', // Sensitive data
            'verification_token' => 'should_not_appear', // Sensitive data
        ];

        $formatted = Auth::formatUserForFrontend($mockUser);
        
        // Sensitive fields should not be in output
        $this->assertArrayNotHasKey('password', $formatted);
        $this->assertArrayNotHasKey('verification_token', $formatted);
        $this->assertArrayNotHasKey('reset_token', $formatted);
    }

    public function testEmailVerifiedIsBooleanTrue(): void
    {
        $mockUser = [
            'id' => 1,
            'email' => 'test@example.com',
            'name' => 'Test',
            'plan' => 'Free',
            'email_verified_at' => '2024-01-01 00:00:00',
        ];

        $formatted = Auth::formatUserForFrontend($mockUser);
        
        $this->assertTrue($formatted['email_verified']);
    }

    public function testEmailVerifiedIsBooleanFalse(): void
    {
        $mockUser = [
            'id' => 1,
            'email' => 'test@example.com',
            'name' => 'Test',
            'plan' => 'Free',
            'email_verified_at' => null,
        ];

        $formatted = Auth::formatUserForFrontend($mockUser);
        
        $this->assertFalse($formatted['email_verified']);
    }
}
