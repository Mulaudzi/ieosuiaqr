<?php

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Helpers\Response;
use App\Config\Database;

class Auth
{
    private static ?array $user = null;

    public static function check(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            Response::error('Authorization token required', 401);
        }

        $token = $matches[1];

        try {
            $secret = $_ENV['JWT_SECRET'] ?? '';
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            // Verify token hasn't expired
            if (isset($decoded->exp) && $decoded->exp < time()) {
                Response::error('Token has expired', 401);
            }

            // Get user from database
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at FROM users WHERE id = ?");
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

        $payload = [
            'iss' => $issuer,
            'user_id' => $userId,
            'plan' => $plan,
            'iat' => time(),
            'exp' => time() + $expiry
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }
}
