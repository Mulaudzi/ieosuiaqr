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
        $currentAdmin = self::validateAdminSession();

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

        // Log the action
        self::logAudit(
            $currentAdmin['id'],
            $currentAdmin['email'],
            'admin_created',
            'admin_management',
            'admin',
            $adminId,
            trim($data['name'])
        );

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
     * List all admin users
     */
    public static function listAdmins(): void
    {
        self::validateAdminSession();

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT id, email, name, is_active, last_login_at, failed_attempts, locked_until, created_at, updated_at
            FROM admin_users
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $admins = $stmt->fetchAll();

        Response::success(['admins' => $admins]);
    }

    /**
     * Get single admin user
     */
    public static function getAdmin(int $id): void
    {
        self::validateAdminSession();

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT id, email, name, is_active, last_login_at, failed_attempts, locked_until, created_at, updated_at
            FROM admin_users WHERE id = ?
        ");
        $stmt->execute([$id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin not found', 404);
        }

        Response::success($admin);
    }

    /**
     * Update an admin user (name, email, active status)
     */
    public static function updateAdmin(int $id): void
    {
        $currentAdmin = self::validateAdminSession();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = Database::getInstance();

        // Check admin exists
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin not found', 404);
        }

        $updates = [];
        $params = [];

        if (isset($data['name']) && !empty(trim($data['name']))) {
            $updates[] = "name = ?";
            $params[] = trim($data['name']);
        }

        if (isset($data['email'])) {
            $validator = new Validator(['email' => $data['email']]);
            $validator->email('email')->validate();
            
            // Check email not taken by another admin
            $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = ? AND id != ?");
            $stmt->execute([strtolower(trim($data['email'])), $id]);
            if ($stmt->fetch()) {
                Response::error('Email already in use by another admin', 409);
            }
            
            $updates[] = "email = ?";
            $params[] = strtolower(trim($data['email']));
        }

        if (isset($data['is_active'])) {
            // Prevent deactivating yourself
            if ($id === $currentAdmin['id'] && !$data['is_active']) {
                Response::error('Cannot deactivate your own account', 400);
            }
            $updates[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }

        // Update passwords if provided
        if (!empty($data['password1'])) {
            if (strlen($data['password1']) < 8) {
                Response::error('Password 1 must be at least 8 characters', 400);
            }
            $updates[] = "password = ?";
            $params[] = password_hash($data['password1'], PASSWORD_BCRYPT);
        }

        if (!empty($data['password2'])) {
            if (strlen($data['password2']) < 6) {
                Response::error('Password 2 must be at least 6 characters', 400);
            }
            $updates[] = "password_step2 = ?";
            $params[] = password_hash($data['password2'], PASSWORD_BCRYPT);
        }

        if (!empty($data['password3'])) {
            if (strlen($data['password3']) < 6) {
                Response::error('Password 3 must be at least 6 characters', 400);
            }
            $updates[] = "password_step3 = ?";
            $params[] = password_hash($data['password3'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $id;
        $sql = "UPDATE admin_users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated admin
        $stmt = $pdo->prepare("
            SELECT id, email, name, is_active, last_login_at, failed_attempts, locked_until, created_at, updated_at
            FROM admin_users WHERE id = ?
        ");
        $stmt->execute([$id]);
        $updatedAdmin = $stmt->fetch();

        // Log the action
        self::logAudit(
            $currentAdmin['id'],
            $currentAdmin['email'],
            'admin_updated',
            'admin_management',
            'admin',
            $id,
            $updatedAdmin['name'],
            ['updated_fields' => array_keys($data)]
        );

        Response::success($updatedAdmin, 'Admin updated successfully');
    }

    /**
     * Toggle admin active status
     */
    public static function toggleAdminStatus(int $id): void
    {
        $currentAdmin = self::validateAdminSession();

        if ($id === $currentAdmin['id']) {
            Response::error('Cannot change your own active status', 400);
        }

        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT is_active FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin not found', 404);
        }

        $newStatus = !$admin['is_active'];
        $stmt = $pdo->prepare("UPDATE admin_users SET is_active = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$newStatus ? 1 : 0, $id]);

        // Log the action
        self::logAudit(
            $currentAdmin['id'],
            $currentAdmin['email'],
            $newStatus ? 'admin_activated' : 'admin_deactivated',
            'admin_management',
            'admin',
            $id,
            null
        );

        Response::success([
            'id' => $id,
            'is_active' => $newStatus
        ], $newStatus ? 'Admin activated' : 'Admin deactivated');
    }

    /**
     * Reset admin failed attempts and unlock
     */
    public static function unlockAdmin(int $id): void
    {
        $currentAdmin = self::validateAdminSession();

        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        
        if (!$stmt->fetch()) {
            Response::error('Admin not found', 404);
        }

        $stmt = $pdo->prepare("UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);

        // Log the action
        self::logAudit(
            $currentAdmin['id'],
            $currentAdmin['email'],
            'admin_unlocked',
            'admin_management',
            'admin',
            $id,
            null
        );

        Response::success(null, 'Admin account unlocked');
    }

    /**
     * Delete an admin user permanently
     */
    public static function deleteAdmin(int $id): void
    {
        $currentAdmin = self::validateAdminSession();

        if ($id === $currentAdmin['id']) {
            Response::error('Cannot delete your own account', 400);
        }

        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        
        if (!$stmt->fetch()) {
            Response::error('Admin not found', 404);
        }

        $stmt = $pdo->prepare("DELETE FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);

        // Log the action
        self::logAudit(
            $currentAdmin['id'],
            $currentAdmin['email'],
            'admin_deleted',
            'admin_management',
            'admin',
            $id,
            null
        );

        Response::success(null, 'Admin deleted permanently');
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
        
        // Log to audit table
        $action = $success ? ($step === 3 ? 'login_success' : 'login_step_passed') : 'login_failed';
        self::logAudit(
            $adminId,
            $email,
            $action,
            'auth',
            null,
            null,
            null,
            ['step' => $step],
            $success ? 'success' : 'failure'
        );
        
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

    /**
     * Log an admin action to the audit table
     */
    public static function logAudit(
        ?int $adminId,
        ?string $adminEmail,
        string $action,
        string $category,
        ?string $targetType = null,
        ?int $targetId = null,
        ?string $targetName = null,
        ?array $details = null,
        string $status = 'success'
    ): void {
        try {
            $pdo = Database::getInstance();
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

            $stmt = $pdo->prepare("
                INSERT INTO admin_audit_logs 
                (admin_id, admin_email, action, category, target_type, target_id, target_name, details, ip_address, user_agent, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $adminId,
                $adminEmail,
                $action,
                $category,
                $targetType,
                $targetId,
                $targetName,
                $details ? json_encode($details) : null,
                $ip,
                $userAgent ? substr($userAgent, 0, 500) : null,
                $status
            ]);
        } catch (\Exception $e) {
            error_log("Failed to log audit: " . $e->getMessage());
        }
    }

    /**
     * Get audit logs with pagination and filtering
     */
    public static function getAuditLogs(): void
    {
        $admin = self::validateAdminSession();

        $pdo = Database::getInstance();
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['per_page'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $where = [];
        $params = [];

        // Filter by category
        if (!empty($_GET['category'])) {
            $where[] = "category = ?";
            $params[] = $_GET['category'];
        }

        // Filter by action
        if (!empty($_GET['action'])) {
            $where[] = "action = ?";
            $params[] = $_GET['action'];
        }

        // Filter by admin
        if (!empty($_GET['admin_id'])) {
            $where[] = "admin_id = ?";
            $params[] = (int)$_GET['admin_id'];
        }

        // Filter by status
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }

        // Filter by date range
        if (!empty($_GET['from_date'])) {
            $where[] = "created_at >= ?";
            $params[] = $_GET['from_date'] . ' 00:00:00';
        }
        if (!empty($_GET['to_date'])) {
            $where[] = "created_at <= ?";
            $params[] = $_GET['to_date'] . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM admin_audit_logs {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['total'];

        // Get logs
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT * FROM admin_audit_logs 
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        // Parse JSON details
        foreach ($logs as &$log) {
            if ($log['details']) {
                $log['details'] = json_decode($log['details'], true);
            }
        }

        Response::paginated($logs, $total, $page, $limit);
    }

    /**
     * Get audit log statistics
     */
    public static function getAuditStats(): void
    {
        $admin = self::validateAdminSession();

        $pdo = Database::getInstance();

        // Get counts by category
        $stmt = $pdo->prepare("
            SELECT category, COUNT(*) as count 
            FROM admin_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY category
        ");
        $stmt->execute();
        $byCategory = $stmt->fetchAll();

        // Get counts by status
        $stmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM admin_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY status
        ");
        $stmt->execute();
        $byStatus = $stmt->fetchAll();

        // Get recent failed actions
        $stmt = $pdo->prepare("
            SELECT * FROM admin_audit_logs 
            WHERE status = 'failure' 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        $stmt->execute();
        $recentFailures = $stmt->fetchAll();

        // Get activity by day (last 7 days)
        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM admin_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute();
        $activityByDay = $stmt->fetchAll();

        // Get top admins by activity
        $stmt = $pdo->prepare("
            SELECT admin_email, COUNT(*) as count 
            FROM admin_audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND admin_email IS NOT NULL
            GROUP BY admin_email
            ORDER BY count DESC
            LIMIT 5
        ");
        $stmt->execute();
        $topAdmins = $stmt->fetchAll();

        Response::success([
            'by_category' => $byCategory,
            'by_status' => $byStatus,
            'recent_failures' => $recentFailures,
            'activity_by_day' => $activityByDay,
            'top_admins' => $topAdmins
        ]);
    }

    /**
     * Export audit logs as CSV
     */
    public static function exportAuditLogs(): void
    {
        $admin = self::validateAdminSession();

        $pdo = Database::getInstance();

        $where = [];
        $params = [];

        if (!empty($_GET['from_date'])) {
            $where[] = "created_at >= ?";
            $params[] = $_GET['from_date'] . ' 00:00:00';
        }
        if (!empty($_GET['to_date'])) {
            $where[] = "created_at <= ?";
            $params[] = $_GET['to_date'] . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $pdo->prepare("
            SELECT id, admin_email, action, category, target_type, target_name, status, ip_address, created_at
            FROM admin_audit_logs 
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT 10000
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        // Log the export action
        self::logAudit(
            $admin['id'],
            $admin['email'],
            'audit_export',
            'system',
            null,
            null,
            null,
            ['count' => count($logs)]
        );

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="admin_audit_logs_' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['ID', 'Admin Email', 'Action', 'Category', 'Target Type', 'Target Name', 'Status', 'IP Address', 'Timestamp']);

        foreach ($logs as $log) {
            fputcsv($output, [
                $log['id'],
                $log['admin_email'],
                $log['action'],
                $log['category'],
                $log['target_type'],
                $log['target_name'],
                $log['status'],
                $log['ip_address'],
                $log['created_at']
            ]);
        }

        fclose($output);
        exit;
    }
}
