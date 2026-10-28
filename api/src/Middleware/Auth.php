<?php

namespace App\Middleware;

use App\Helpers\Response;
use App\Config\Database;

class Auth
{
    private static ?array $user = null;

    private static function validSigningSecret(string $secret): bool
    {
        return strlen($secret) >= 32
            && preg_match('/change[-_ ]?me|replace|example|secret-key-for|your[-_ ]/i', $secret) !== 1
            && count(array_unique(str_split($secret))) >= 10;
    }

    public static function ensureRevocationTable(): void
    {
        Database::getInstance()->exec("CREATE TABLE IF NOT EXISTS revoked_auth_tokens (token_hash CHAR(64) PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, token_type ENUM('customer','admin') NOT NULL, expires_at DATETIME NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX revoked_auth_expiry_idx (expires_at), INDEX revoked_auth_user_idx (user_id, token_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

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
    private static function base64UrlDecode(string $data): string|false
    {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $data)) return false;
        $padded = strtr($data, '-_', '+/');
        $padded .= str_repeat('=', (4 - strlen($padded) % 4) % 4);
        return base64_decode($padded, true);
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
        $decodedHeaderRaw=self::base64UrlDecode($header);
        $decodedPayloadRaw=self::base64UrlDecode($payload);
        $decodedHeader=$decodedHeaderRaw===false?null:json_decode($decodedHeaderRaw,true);
        $decodedPayload=$decodedPayloadRaw===false?null:json_decode($decodedPayloadRaw,true);
        if(!is_array($decodedHeader)||!is_array($decodedPayload)||($decodedHeader['alg']??null)!=='HS256'||($decodedHeader['typ']??null)!=='JWT')return null;

        $secret = (string)($_ENV['JWT_SECRET'] ?? '');
        $issuer = trim((string)($_ENV['JWT_ISSUER'] ?? ''));
        $audience = trim((string)($_ENV['JWT_AUDIENCE'] ?? ''));
        if(!self::validSigningSecret($secret)||$issuer===''||$audience==='')return null;
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", $secret, true)
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        foreach(['iss','aud','sub','user_id','iat','exp','jti'] as $claim)if(!array_key_exists($claim,$decodedPayload))return null;
        $now=time();$skew=30;
        if(!is_string($decodedPayload['iss'])||!hash_equals($issuer,$decodedPayload['iss']))return null;
        if(!is_string($decodedPayload['aud'])||!hash_equals($audience,$decodedPayload['aud']))return null;
        if(!is_numeric($decodedPayload['user_id'])||(int)$decodedPayload['user_id']<1||(string)$decodedPayload['sub']!==(string)(int)$decodedPayload['user_id'])return null;
        if(!is_numeric($decodedPayload['iat'])||!is_numeric($decodedPayload['exp'])||(int)$decodedPayload['iat']>$now+$skew||(int)$decodedPayload['exp']<=$now-$skew||(int)$decodedPayload['exp']<=(int)$decodedPayload['iat'])return null;
        if(!is_string($decodedPayload['jti'])||preg_match('/^[a-f0-9]{32,128}$/',$decodedPayload['jti'])!==1)return null;
        return (object)$decodedPayload;
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

            $pdo = Database::getInstance();
            self::ensureRevocationTable();
            $revoked = $pdo->prepare('SELECT 1 FROM revoked_auth_tokens WHERE token_hash = ? AND expires_at >= NOW() LIMIT 1');
            $revoked->execute([hash('sha256', $token)]);
            if ($revoked->fetchColumn()) Response::error('Session has been invalidated', 401);

            // Get user from database with all fields
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

    /** Return the authenticated customer when a valid bearer token is present, otherwise null. */
    public static function optionalUser(): ?array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) return null;
        $token = $matches[1];
        $decoded = self::decodeToken($token);
        if (!$decoded || empty($decoded->user_id) || (isset($decoded->exp) && $decoded->exp < time())) return null;
        try {
            $pdo = Database::getInstance();
            self::ensureRevocationTable();
            $revoked = $pdo->prepare('SELECT 1 FROM revoked_auth_tokens WHERE token_hash = ? AND expires_at >= NOW() LIMIT 1');
            $revoked->execute([hash('sha256', $token)]);
            if ($revoked->fetchColumn()) return null;
            $stmt = $pdo->prepare('SELECT id, email, name, plan, email_verified_at, avatar_url, created_at FROM users WHERE id = ?');
            $stmt->execute([(int)$decoded->user_id]);
            $user = $stmt->fetch();
            if (!$user) return null;
            self::$user = $user;
            return $user;
        } catch (\Throwable $e) {
            error_log('Optional authentication failed: ' . $e->getMessage());
            return null;
        }
    }

    public static function requirePlan(array $allowedPlans): void
    {
        self::getUser();
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
        $issuer = trim((string)($_ENV['JWT_ISSUER'] ?? ''));
        $audience = trim((string)($_ENV['JWT_AUDIENCE'] ?? ''));
        $expiry = (int)($_ENV['JWT_EXPIRY'] ?? 3600);
        if(!self::validSigningSecret($secret)||$issuer===''||$audience===''||$expiry<60||$expiry>86400)throw new \RuntimeException('JWT signing configuration is invalid');

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'iss' => $issuer,
            'aud' => $audience,
            'sub' => (string)$userId,
            'user_id' => $userId,
            'plan' => $plan,
            'jti' => bin2hex(random_bytes(16)),
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
