<?php

namespace App\Middleware;

use App\Helpers\Response;
use App\Config\Database;

class Auth
{
    private static ?array $user = null;

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Decode and verify JWT token
     */
    private static function decodeToken(string $token): ?object
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        
        $secret = $_ENV['JWT_SECRET'] ?? '';
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", $secret, true)
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $decodedPayload = json_decode(self::base64UrlDecode($payload));
        if (!$decodedPayload) {
            return null;
        }

        return $decodedPayload;
    }

    public static function check(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            Response::error('Authorization token required', 401);
        }

        $token = $matches[1];

        try {
            $decoded = self::decodeToken($token);
            
            if (!$decoded) {
                Response::error('Invalid token', 401);
            }

            // Verify token hasn't expired
            if (isset($decoded->exp) && $decoded->exp < time()) {
                Response::error('Token has expired', 401);
            }

            // Get user from database with all fields
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at, avatar_url, created_at FROM users WHERE id = ?");
            $stmt->execute([$decoded->user_id]);
            $user = $stmt->fetch();

            if (!$user) {
                Response::error('User not found', 401);
            }

            self::$user = $user;
            return $user;

        } catch (\Exception $e) {
            error_log("JWT decode error: " . $e->getMessage());
            Response::error('Invalid token', 401);
        }
    }

    public static function getUser(): ?array
    {
        if (self::$user === null) {
            self::check();
        }
        return self::$user;
    }

    public static function requirePlan(array $allowedPlans): void
    {
        $user = self::getUser();
        
        if (!in_array($user['plan'], $allowedPlans)) {
            Response::error(
                'This feature requires ' . implode(' or ', $allowedPlans) . ' plan. Please upgrade to access.',
                403
            );
        }
    }

    public static function requireVerifiedEmail(): void
    {
        $user = self::getUser();
        
        if (empty($user['email_verified_at'])) {
            Response::error('Please verify your email to access this feature', 403);
        }
    }

    public static function generateToken(int $userId, string $plan): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        $issuer = $_ENV['JWT_ISSUER'] ?? 'qr.ieosuia.com';
        $expiry = (int)($_ENV['JWT_EXPIRY'] ?? 3600);

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'iss' => $issuer,
            'user_id' => $userId,
            'plan' => $plan,
            'iat' => time(),
            'exp' => time() + $expiry
        ]);

        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode($payload);
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$base64Header.$base64Payload", $secret, true)
        );

        return "$base64Header.$base64Payload.$signature";
    }

    /**
     * Format user data for frontend consumption
     * Converts snake_case DB fields to camelCase and transforms data types
     */
    public static function formatUserForFrontend(?array $user): ?array
    {
        if ($user === null) return null;

        return [
            'id' => (string)$user['id'],
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'plan' => $user['plan'] ?? 'Free',
            'avatar_url' => $user['avatar_url'] ?? null,
            'email_verified' => !empty($user['email_verified_at']),
            'email_verified_at' => $user['email_verified_at'] ?? null,
            'created_at' => $user['created_at'] ?? null,
        ];
    }
}
