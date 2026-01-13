<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;

class AdminController
{
    // Admin credentials - hardcoded for security
    private static string $adminUsername = 'I Am God In Human Form';
    private static array $adminPasswords = ['billionaires', 'Mu1@udz!', '7211018830'];
    
    /**
     * Validate admin login step
     * Step 1: Verify username and first password
     * Step 2: Verify second password
     * Step 3: Verify third password and grant access
     */
    public static function validateStep(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $step = (int)($data['step'] ?? 1);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $sessionToken = $data['session_token'] ?? '';
        
        switch ($step) {
            case 1:
                // Validate username and first password
                if ($username !== self::$adminUsername) {
                    Response::error('Invalid credentials', 401);
                }
                if ($password !== self::$adminPasswords[0]) {
                    Response::error('Invalid credentials', 401);
                }
                // Generate session token for next step
                $token = bin2hex(random_bytes(32));
                self::storeAdminSession($token, 1);
                Response::success([
                    'session_token' => $token,
                    'next_step' => 2,
                    'message' => 'Step 1 complete. Enter second password.'
                ]);
                break;
                
            case 2:
                // Validate session and second password
                if (!self::validateAdminSession($sessionToken, 1)) {
                    Response::error('Session expired. Please start over.', 401);
                }
                if ($password !== self::$adminPasswords[1]) {
                    self::clearAdminSession($sessionToken);
                    Response::error('Invalid credentials', 401);
                }
                // Update session for next step
                self::updateAdminSession($sessionToken, 2);
                Response::success([
                    'session_token' => $sessionToken,
                    'next_step' => 3,
                    'message' => 'Step 2 complete. Enter final password.'
                ]);
                break;
                
            case 3:
                // Validate session and third password
                if (!self::validateAdminSession($sessionToken, 2)) {
                    Response::error('Session expired. Please start over.', 401);
                }
                if ($password !== self::$adminPasswords[2]) {
                    self::clearAdminSession($sessionToken);
                    Response::error('Invalid credentials', 401);
                }
                // Generate admin access token
                $adminToken = bin2hex(random_bytes(64));
                self::storeAdminAccessToken($adminToken);
                self::clearAdminSession($sessionToken);
                Response::success([
                    'admin_token' => $adminToken,
                    'message' => 'Admin access granted.'
                ]);
                break;
                
            default:
                Response::error('Invalid step', 400);
        }
    }
    
    /**
     * Verify admin access token
     */
    public static function verifyAccess(): void
    {
        $token = self::getAdminTokenFromRequest();
        
        if (!$token || !self::validateAdminAccessToken($token)) {
            Response::error('Unauthorized', 401);
        }
        
        Response::success(['valid' => true]);
    }
    
    /**
     * Get email logs
     */
    public static function getEmailLogs(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        
        // Pagination
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        
        // Filters
        $status = $_GET['status'] ?? '';
        $type = $_GET['type'] ?? '';
        $search = $_GET['search'] ?? '';
        
        $where = [];
        $params = [];
        
        if ($status && in_array($status, ['sent', 'failed', 'bounced', 'pending'])) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if ($type && in_array($type, ['contact', 'verification', 'password_reset', 'welcome', 'notification', 'other'])) {
            $where[] = "email_type = ?";
            $params[] = $type;
        }
        
        if ($search) {
            $where[] = "(recipient_email LIKE ? OR sender_email LIKE ? OR sender_name LIKE ? OR subject LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM email_logs {$whereClause}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        
        // Get logs
        $sql = "SELECT * FROM email_logs {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        
        // Get stats
        $statsSql = "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
            SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contact_forms
            FROM email_logs";
        $stmt = $pdo->query($statsSql);
        $stats = $stmt->fetch();
        
        Response::success([
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ],
            'stats' => $stats
        ]);
    }
    
    /**
     * Get single email log details
     */
    public static function getEmailLog(): void
    {
        self::requireAdmin();
        
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::error('Invalid email log ID', 400);
        }
        
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM email_logs WHERE id = ?");
        $stmt->execute([$id]);
        $log = $stmt->fetch();
        
        if (!$log) {
            Response::error('Email log not found', 404);
        }
        
        Response::success($log);
    }
    
    /**
     * Logout admin
     */
    public static function logout(): void
    {
        $token = self::getAdminTokenFromRequest();
        if ($token) {
            self::clearAdminAccessToken($token);
        }
        Response::success(['message' => 'Logged out']);
    }
    
    // ==================== Helper Methods ====================
    
    private static function requireAdmin(): void
    {
        $token = self::getAdminTokenFromRequest();
        
        if (!$token || !self::validateAdminAccessToken($token)) {
            Response::error('Unauthorized', 401);
        }
    }
    
    private static function getAdminTokenFromRequest(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Admin\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return $_GET['admin_token'] ?? null;
    }
    
    private static function storeAdminSession(string $token, int $step): void
    {
        $cacheDir = '/tmp/admin_sessions/';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        file_put_contents($cacheDir . md5($token), json_encode([
            'step' => $step,
            'expires' => time() + 300 // 5 minutes
        ]));
    }
    
    private static function validateAdminSession(string $token, int $expectedStep): bool
    {
        $cacheFile = '/tmp/admin_sessions/' . md5($token);
        if (!file_exists($cacheFile)) {
            return false;
        }
        $data = json_decode(file_get_contents($cacheFile), true);
        return $data && $data['step'] === $expectedStep && $data['expires'] > time();
    }
    
    private static function updateAdminSession(string $token, int $step): void
    {
        self::storeAdminSession($token, $step);
    }
    
    private static function clearAdminSession(string $token): void
    {
        $cacheFile = '/tmp/admin_sessions/' . md5($token);
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
    
    private static function storeAdminAccessToken(string $token): void
    {
        $cacheDir = '/tmp/admin_tokens/';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        file_put_contents($cacheDir . md5($token), json_encode([
            'created' => time(),
            'expires' => time() + 86400 // 24 hours
        ]));
    }
    
    private static function validateAdminAccessToken(string $token): bool
    {
        $cacheFile = '/tmp/admin_tokens/' . md5($token);
        if (!file_exists($cacheFile)) {
            return false;
        }
        $data = json_decode(file_get_contents($cacheFile), true);
        return $data && $data['expires'] > time();
    }
    
    private static function clearAdminAccessToken(string $token): void
    {
        $cacheFile = '/tmp/admin_tokens/' . md5($token);
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
}
