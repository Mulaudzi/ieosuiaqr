<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Middleware\RateLimit;

class AdminAuthController
{
    private const MAX_FAILED_ATTEMPTS = 5;
    private const LOCKOUT_MINUTES = 15;

    /**
     * Step 1: Validate email and first password
     */
    public static function loginStep1(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Rate limit admin login attempts by IP
        RateLimit::check('admin_login', 10, 15);

        $validator = new Validator($data);
        $validator
            ->required('email', 'Email is required')
            ->email('email', 'Please provide a valid email address')
            ->required('password', 'Password is required')
            ->validate();

        $pdo = Database::getInstance();

        // Find admin user
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE email = ? AND is_active = TRUE");
        $stmt->execute([strtolower(trim($data['email']))]);
        $admin = $stmt->fetch();

        if (!$admin) {
            self::logAttempt(null, $data['email'], false, 1);
            Response::error('Invalid admin credentials', 401);
        }

        // Check if locked
        if ($admin['locked_until'] && strtotime($admin['locked_until']) > time()) {
            $remaining = ceil((strtotime($admin['locked_until']) - time()) / 60);
            Response::error("Account locked. Try again in {$remaining} minutes.", 429);
        }

        // Verify first password
        if (!password_verify($data['password'], $admin['password'])) {
            self::incrementFailedAttempts($admin['id']);
            self::logAttempt($admin['id'], $data['email'], false, 1);
            Response::error('Invalid admin credentials', 401);
        }

        // Generate step token (valid for 5 minutes)
        $stepToken = self::generateStepToken($admin['id'], 1);

        self::logAttempt($admin['id'], $data['email'], true, 1);

        Response::success([
            'step' => 1,
            'step_token' => $stepToken,
            'message' => 'Step 1 verified. Please enter password 2.'
        ]);
    }

    /**
     * Step 2: Validate second password
     */
    public static function loginStep2(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator
            ->required('step_token', 'Step token is required')
            ->required('password', 'Password is required')
            ->validate();

        // Validate step token
        $tokenData = self::validateStepToken($data['step_token'], 1);
        if (!$tokenData) {
            Response::error('Invalid or expired step token. Please start over.', 401);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$tokenData['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin account not found', 401);
        }

        // Verify second password
        if (!password_verify($data['password'], $admin['password_step2'])) {
            self::incrementFailedAttempts($admin['id']);
            self::logAttempt($admin['id'], $admin['email'], false, 2);
            Response::error('Invalid password. Please start over.', 401);
        }

        // Generate step 2 token
        $stepToken = self::generateStepToken($admin['id'], 2);

        self::logAttempt($admin['id'], $admin['email'], true, 2);

        Response::success([
            'step' => 2,
            'step_token' => $stepToken,
            'message' => 'Step 2 verified. Please enter password 3.'
        ]);
    }

    /**
     * Step 3: Validate third password and grant access
     */
    public static function loginStep3(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator
            ->required('step_token', 'Step token is required')
            ->required('password', 'Password is required')
            ->validate();

        // Validate step token
        $tokenData = self::validateStepToken($data['step_token'], 2);
        if (!$tokenData) {
            Response::error('Invalid or expired step token. Please start over.', 401);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$tokenData['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin account not found', 401);
        }

        // Verify third password
        if (!password_verify($data['password'], $admin['password_step3'])) {
            self::incrementFailedAttempts($admin['id']);
            self::logAttempt($admin['id'], $admin['email'], false, 3);
            Response::error('Invalid password. Please start over.', 401);
        }

        // All steps passed - reset failed attempts and update last login
        $stmt = $pdo->prepare("UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?");
        $stmt->execute([$admin['id']]);

        // Generate admin session token (valid for 30 minutes)
        $adminToken = self::generateAdminToken($admin['id']);

        self::logAttempt($admin['id'], $admin['email'], true, 3);

        Response::success([
            'step' => 3,
            'admin_token' => $adminToken,
            'admin' => [
                'id' => $admin['id'],
                'email' => $admin['email'],
                'name' => $admin['name']
            ],
            'message' => 'Admin access granted. Session expires in 30 minutes of inactivity.'
        ]);
    }

    /**
     * Check admin session validity
     */
    public static function checkSession(): void
    {
        $admin = self::validateAdminSession();
        
        Response::success([
            'valid' => true,
            'admin' => [
                'id' => $admin['id'],
                'email' => $admin['email'],
                'name' => $admin['name']
            ]
        ]);
    }

    /**
     * Create a new admin user (requires existing admin auth)
     */
    public static function createAdmin(): void
    {
        // Verify admin session
        self::validateAdminSession();

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator
            ->required('email', 'Email is required')
            ->email('email', 'Please provide a valid email address')
            ->required('name', 'Name is required')
            ->required('password1', 'Password 1 is required')
            ->minLength('password1', 8, 'Password 1 must be at least 8 characters')
            ->required('password2', 'Password 2 is required')
            ->minLength('password2', 6, 'Password 2 must be at least 6 characters')
            ->required('password3', 'Password 3 is required')
            ->minLength('password3', 6, 'Password 3 must be at least 6 characters')
            ->validate();

        $pdo = Database::getInstance();

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        
        if ($stmt->fetch()) {
            Response::error('An admin with this email already exists', 409);
        }

        // Create admin with hashed passwords
        $stmt = $pdo->prepare("
            INSERT INTO admin_users (email, password, name, password_step2, password_step3, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            strtolower(trim($data['email'])),
            password_hash($data['password1'], PASSWORD_BCRYPT),
            trim($data['name']),
            password_hash($data['password2'], PASSWORD_BCRYPT),
            password_hash($data['password3'], PASSWORD_BCRYPT)
        ]);

        $adminId = (int)$pdo->lastInsertId();

        Response::success([
            'id' => $adminId,
            'email' => strtolower(trim($data['email'])),
            'name' => trim($data['name'])
        ], 'Admin user created successfully', 201);
    }

    /**
     * Update admin passwords
     */
    public static function updatePasswords(): void
    {
        $admin = self::validateAdminSession();

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator
            ->required('current_password', 'Current password is required')
            ->validate();

        $pdo = Database::getInstance();

        // Verify current password (step 1)
        $stmt = $pdo->prepare("SELECT password FROM admin_users WHERE id = ?");
        $stmt->execute([$admin['id']]);
        $adminData = $stmt->fetch();

        if (!password_verify($data['current_password'], $adminData['password'])) {
            Response::error('Current password is incorrect', 401);
        }

        $updates = [];
        $params = [];

        if (!empty($data['new_password1'])) {
            if (strlen($data['new_password1']) < 8) {
                Response::error('Password 1 must be at least 8 characters', 400);
            }
            $updates[] = "password = ?";
            $params[] = password_hash($data['new_password1'], PASSWORD_BCRYPT);
        }

        if (!empty($data['new_password2'])) {
            if (strlen($data['new_password2']) < 6) {
                Response::error('Password 2 must be at least 6 characters', 400);
            }
            $updates[] = "password_step2 = ?";
            $params[] = password_hash($data['new_password2'], PASSWORD_BCRYPT);
        }

        if (!empty($data['new_password3'])) {
            if (strlen($data['new_password3']) < 6) {
                Response::error('Password 3 must be at least 6 characters', 400);
            }
            $updates[] = "password_step3 = ?";
            $params[] = password_hash($data['new_password3'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            Response::error('No new passwords provided', 400);
        }

        $params[] = $admin['id'];
        $sql = "UPDATE admin_users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'Passwords updated successfully');
    }

    /**
     * Validate admin session from Authorization header
     */
    public static function validateAdminSession(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            Response::error('Admin authentication required', 401);
        }

        $token = $matches[1];
        $tokenData = self::decodeAdminToken($token);

        if (!$tokenData || $tokenData['exp'] < time()) {
            Response::error('Admin session expired. Please login again.', 401);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$tokenData['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin account not found or deactivated', 401);
        }

        return $admin;
    }

    // ===== Helper Methods =====

    private static function generateStepToken(int $adminId, int $step): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $payload = [
            'admin_id' => $adminId,
            'step' => $step,
            'exp' => time() + 300, // 5 minutes
            'iat' => time()
        ];
        
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', "$header.$payload", $secret);
        
        return "$header.$payload.$signature";
    }

    private static function validateStepToken(string $token, int $expectedStep): ?array
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        
        $expectedSignature = hash_hmac('sha256', "$header.$payload", $secret);
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $data = json_decode(base64_decode($payload), true);
        
        if (!$data || $data['exp'] < time() || $data['step'] !== $expectedStep) {
            return null;
        }

        return $data;
    }

    private static function generateAdminToken(int $adminId): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $payload = [
            'admin_id' => $adminId,
            'type' => 'admin_session',
            'exp' => time() + 1800, // 30 minutes
            'iat' => time()
        ];
        
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', "$header.$payload", $secret);
        
        return "$header.$payload.$payload.$signature";
    }

    private static function decodeAdminToken(string $token): ?array
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $parts = explode('.', $token);
        
        // Handle both 3-part and 4-part tokens (legacy fix)
        if (count($parts) === 4) {
            [$header, $payload, , $signature] = $parts;
        } elseif (count($parts) === 3) {
            [$header, $payload, $signature] = $parts;
        } else {
            return null;
        }

        $expectedSignature = hash_hmac('sha256', "$header.$payload", $secret);
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $data = json_decode(base64_decode($payload), true);
        
        if (!$data || ($data['type'] ?? '') !== 'admin_session') {
            return null;
        }

        return $data;
    }

    private static function incrementFailedAttempts(int $adminId): void
    {
        $pdo = Database::getInstance();
        
        $stmt = $pdo->prepare("SELECT failed_attempts FROM admin_users WHERE id = ?");
        $stmt->execute([$adminId]);
        $current = (int)$stmt->fetchColumn();

        $newAttempts = $current + 1;
        
        if ($newAttempts >= self::MAX_FAILED_ATTEMPTS) {
            // Lock account
            $stmt = $pdo->prepare("UPDATE admin_users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?");
            $stmt->execute([$newAttempts, self::LOCKOUT_MINUTES, $adminId]);
        } else {
            $stmt = $pdo->prepare("UPDATE admin_users SET failed_attempts = ? WHERE id = ?");
            $stmt->execute([$newAttempts, $adminId]);
        }
    }

    private static function logAttempt(?int $adminId, string $email, bool $success, int $step): void
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        error_log(sprintf(
            "Admin Login Attempt: email=%s, admin_id=%s, step=%d, success=%s, ip=%s, ua=%s",
            $email,
            $adminId ?? 'null',
            $step,
            $success ? 'true' : 'false',
            $ip,
            substr($userAgent, 0, 100)
        ));
    }
}
