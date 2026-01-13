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
    
    // Admin email for notifications
    private static string $adminNotificationEmail = 'admin@ieosuia.com';
    
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
     * Get email logs with enhanced filtering
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
        $readFilter = $_GET['read'] ?? '';
        $repliedFilter = $_GET['replied'] ?? '';
        $archivedFilter = $_GET['archived'] ?? 'false';
        $priority = $_GET['priority'] ?? '';
        
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
        
        // Read/unread filter
        if ($readFilter === 'true') {
            $where[] = "is_read = 1";
        } elseif ($readFilter === 'false') {
            $where[] = "is_read = 0";
        }
        
        // Replied filter
        if ($repliedFilter === 'true') {
            $where[] = "is_replied = 1";
        } elseif ($repliedFilter === 'false') {
            $where[] = "is_replied = 0";
        }
        
        // Archive filter (default to non-archived)
        if ($archivedFilter === 'true') {
            $where[] = "is_archived = 1";
        } elseif ($archivedFilter !== 'all') {
            $where[] = "(is_archived = 0 OR is_archived IS NULL)";
        }
        
        // Priority filter
        if ($priority && in_array($priority, ['low', 'normal', 'high', 'urgent'])) {
            $where[] = "priority = ?";
            $params[] = $priority;
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
        
        // Get stats with enhanced metrics
        $statsSql = "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
            SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contact_forms,
            SUM(CASE WHEN is_read = 0 OR is_read IS NULL THEN 1 ELSE 0 END) as unread,
            SUM(CASE WHEN is_replied = 0 OR is_replied IS NULL THEN 1 ELSE 0 END) as unreplied,
            SUM(CASE WHEN email_type = 'contact' AND (is_read = 0 OR is_read IS NULL) THEN 1 ELSE 0 END) as unread_contacts
            FROM email_logs WHERE (is_archived = 0 OR is_archived IS NULL)";
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
     * Mark email as read/unread
     */
    public static function markEmailRead(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        $isRead = (bool)($data['is_read'] ?? true);
        
        if ($id <= 0) {
            Response::error('Invalid email log ID', 400);
        }
        
        $pdo = Database::getInstance();
        
        if ($isRead) {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_read = 1, read_at = NOW(), read_by = 'Admin' WHERE id = ?");
        } else {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_read = 0, read_at = NULL, read_by = NULL WHERE id = ?");
        }
        $stmt->execute([$id]);
        
        Response::success(['message' => $isRead ? 'Marked as read' : 'Marked as unread']);
    }
    
    /**
     * Mark email as replied
     */
    public static function markEmailReplied(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        $isReplied = (bool)($data['is_replied'] ?? true);
        $notes = $data['notes'] ?? null;
        
        if ($id <= 0) {
            Response::error('Invalid email log ID', 400);
        }
        
        $pdo = Database::getInstance();
        
        if ($isReplied) {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_replied = 1, replied_at = NOW(), replied_by = 'Admin', reply_notes = ? WHERE id = ?");
            $stmt->execute([$notes, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_replied = 0, replied_at = NULL, replied_by = NULL, reply_notes = NULL WHERE id = ?");
            $stmt->execute([$id]);
        }
        
        Response::success(['message' => $isReplied ? 'Marked as replied' : 'Marked as not replied']);
    }
    
    /**
     * Set email priority
     */
    public static function setEmailPriority(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        $priority = $data['priority'] ?? 'normal';
        
        if ($id <= 0) {
            Response::error('Invalid email log ID', 400);
        }
        
        if (!in_array($priority, ['low', 'normal', 'high', 'urgent'])) {
            Response::error('Invalid priority', 400);
        }
        
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("UPDATE email_logs SET priority = ? WHERE id = ?");
        $stmt->execute([$priority, $id]);
        
        Response::success(['message' => 'Priority updated']);
    }
    
    /**
     * Archive/unarchive email
     */
    public static function archiveEmail(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        $isArchived = (bool)($data['is_archived'] ?? true);
        
        if ($id <= 0) {
            Response::error('Invalid email log ID', 400);
        }
        
        $pdo = Database::getInstance();
        
        if ($isArchived) {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_archived = 1, archived_at = NOW() WHERE id = ?");
        } else {
            $stmt = $pdo->prepare("UPDATE email_logs SET is_archived = 0, archived_at = NULL WHERE id = ?");
        }
        $stmt->execute([$id]);
        
        Response::success(['message' => $isArchived ? 'Email archived' : 'Email unarchived']);
    }
    
    /**
     * Bulk mark emails
     */
    public static function bulkMarkEmails(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $ids = $data['ids'] ?? [];
        $action = $data['action'] ?? '';
        
        if (empty($ids) || !is_array($ids)) {
            Response::error('No email IDs provided', 400);
        }
        
        $pdo = Database::getInstance();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        switch ($action) {
            case 'mark_read':
                $stmt = $pdo->prepare("UPDATE email_logs SET is_read = 1, read_at = NOW(), read_by = 'Admin' WHERE id IN ($placeholders)");
                break;
            case 'mark_unread':
                $stmt = $pdo->prepare("UPDATE email_logs SET is_read = 0, read_at = NULL, read_by = NULL WHERE id IN ($placeholders)");
                break;
            case 'archive':
                $stmt = $pdo->prepare("UPDATE email_logs SET is_archived = 1, archived_at = NOW() WHERE id IN ($placeholders)");
                break;
            case 'unarchive':
                $stmt = $pdo->prepare("UPDATE email_logs SET is_archived = 0, archived_at = NULL WHERE id IN ($placeholders)");
                break;
            default:
                Response::error('Invalid action', 400);
        }
        
        $stmt->execute($ids);
        
        Response::success(['message' => 'Bulk action completed', 'affected' => $stmt->rowCount()]);
    }
    
    /**
     * Handle email webhook for bounces and delivery status
     */
    public static function handleEmailWebhook(): void
    {
        // Get raw payload
        $rawPayload = file_get_contents('php://input');
        $data = json_decode($rawPayload, true) ?? [];
        
        // Determine webhook source and extract relevant data
        $eventType = null;
        $recipientEmail = null;
        $bounceType = null;
        $bounceSubtype = null;
        $bounceMessage = null;
        $source = 'unknown';
        
        // Check for various webhook formats (AWS SES, SendGrid, Mailgun, generic)
        if (isset($data['eventType']) || isset($data['notificationType'])) {
            // AWS SES format
            $source = 'aws_ses';
            $eventType = strtolower($data['eventType'] ?? $data['notificationType'] ?? '');
            
            if ($eventType === 'bounce' && isset($data['bounce'])) {
                $recipientEmail = $data['bounce']['bouncedRecipients'][0]['emailAddress'] ?? null;
                $bounceType = $data['bounce']['bounceType'] ?? null;
                $bounceSubtype = $data['bounce']['bounceSubType'] ?? null;
                $bounceMessage = $data['bounce']['bouncedRecipients'][0]['diagnosticCode'] ?? null;
            } elseif ($eventType === 'complaint' && isset($data['complaint'])) {
                $eventType = 'complained';
                $recipientEmail = $data['complaint']['complainedRecipients'][0]['emailAddress'] ?? null;
            } elseif ($eventType === 'delivery' && isset($data['delivery'])) {
                $eventType = 'delivered';
                $recipientEmail = $data['delivery']['recipients'][0] ?? null;
            }
        } elseif (isset($data['event'])) {
            // SendGrid/Generic format
            $source = 'sendgrid';
            $eventType = strtolower($data['event']);
            $recipientEmail = $data['email'] ?? null;
            
            if ($eventType === 'bounce') {
                $bounceType = $data['type'] ?? null;
                $bounceMessage = $data['reason'] ?? null;
            }
        } elseif (isset($data['event-data'])) {
            // Mailgun format
            $source = 'mailgun';
            $eventData = $data['event-data'];
            $eventType = strtolower($eventData['event'] ?? '');
            $recipientEmail = $eventData['recipient'] ?? null;
            
            if ($eventType === 'failed') {
                $eventType = 'bounced';
                $bounceType = $eventData['severity'] ?? null;
                $bounceMessage = $eventData['delivery-status']['message'] ?? null;
            }
        } else {
            // Generic format - try to extract common fields
            $source = 'generic';
            $eventType = strtolower($data['type'] ?? $data['event'] ?? $data['event_type'] ?? 'unknown');
            $recipientEmail = $data['email'] ?? $data['recipient'] ?? $data['to'] ?? null;
            $bounceMessage = $data['message'] ?? $data['reason'] ?? $data['error'] ?? null;
        }
        
        // Normalize event type
        $normalizedEventType = match($eventType) {
            'bounce', 'bounced', 'hard_bounce', 'soft_bounce' => 'bounced',
            'complaint', 'complained', 'spam' => 'complained',
            'delivered', 'delivery' => 'delivered',
            'open', 'opened' => 'opened',
            'click', 'clicked' => 'clicked',
            'unsubscribe', 'unsubscribed' => 'unsubscribed',
            default => null
        };
        
        if (!$normalizedEventType || !$recipientEmail) {
            Response::success(['message' => 'Webhook received but not processed']);
            return;
        }
        
        $pdo = Database::getInstance();
        
        // Find matching email log
        $stmt = $pdo->prepare("SELECT id FROM email_logs WHERE recipient_email = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$recipientEmail]);
        $emailLog = $stmt->fetch();
        $emailLogId = $emailLog ? (int)$emailLog['id'] : null;
        
        // Log webhook event
        $stmt = $pdo->prepare("
            INSERT INTO email_webhooks 
            (email_log_id, event_type, recipient_email, bounce_type, bounce_subtype, bounce_message, raw_payload, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $emailLogId,
            $normalizedEventType,
            $recipientEmail,
            $bounceType,
            $bounceSubtype,
            $bounceMessage,
            $rawPayload,
            $source
        ]);
        
        // Update email log status if bounce
        if ($emailLogId && in_array($normalizedEventType, ['bounced', 'complained'])) {
            $stmt = $pdo->prepare("UPDATE email_logs SET status = 'bounced', error_message = ? WHERE id = ?");
            $stmt->execute([$bounceMessage ?? 'Email bounced', $emailLogId]);
        }
        
        // Mark webhook as processed
        $webhookId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("UPDATE email_webhooks SET processed = 1, processed_at = NOW() WHERE id = ?");
        $stmt->execute([$webhookId]);
        
        error_log("Email webhook processed: $normalizedEventType for $recipientEmail");
        
        Response::success(['message' => 'Webhook processed', 'event' => $normalizedEventType]);
    }
    
    /**
     * Get webhook logs
     */
    public static function getWebhookLogs(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        
        $stmt = $pdo->prepare("SELECT * FROM email_webhooks ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
        $logs = $stmt->fetchAll();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM email_webhooks");
        $total = (int)$stmt->fetchColumn();
        
        Response::success([
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
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
    
    /**
     * Get admin settings
     */
    public static function getSettings(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM admin_settings ORDER BY setting_key");
        $settings = $stmt->fetchAll();
        
        // Parse JSON values
        $parsed = [];
        foreach ($settings as $setting) {
            $value = $setting['setting_value'];
            if ($setting['setting_type'] === 'json') {
                $value = json_decode($value, true);
            } elseif ($setting['setting_type'] === 'boolean') {
                $value = $value === 'true' || $value === '1';
            } elseif ($setting['setting_type'] === 'number') {
                $value = (float)$value;
            }
            $parsed[$setting['setting_key']] = [
                'value' => $value,
                'type' => $setting['setting_type'],
                'description' => $setting['description']
            ];
        }
        
        Response::success($parsed);
    }
    
    /**
     * Update admin settings
     */
    public static function updateSettings(): void
    {
        self::requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (empty($data)) {
            Response::error('No settings provided', 400);
        }
        
        $pdo = Database::getInstance();
        
        foreach ($data as $key => $value) {
            // Determine type and serialize
            $type = 'string';
            $serialized = $value;
            
            if (is_array($value)) {
                $type = 'json';
                $serialized = json_encode($value);
            } elseif (is_bool($value)) {
                $type = 'boolean';
                $serialized = $value ? 'true' : 'false';
            } elseif (is_numeric($value) && !is_string($value)) {
                $type = 'number';
                $serialized = (string)$value;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO admin_settings (setting_key, setting_value, setting_type)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?
            ");
            $stmt->execute([$key, $serialized, $type, $serialized, $type]);
        }
        
        Response::success(['message' => 'Settings updated']);
    }
    
    /**
     * Get email statistics
     */
    public static function getEmailStats(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        
        // Get date range from query params (default last 30 days)
        $days = min(365, max(1, (int)($_GET['days'] ?? 30)));
        $startDate = date('Y-m-d', strtotime("-{$days} days"));
        
        // Total submissions by type
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contact_submissions,
                SUM(CASE WHEN email_type = 'contact' AND is_replied = 1 THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
            FROM email_logs
            WHERE created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $totals = $stmt->fetch();
        
        // Response rate calculation
        $responseRate = $totals['contact_submissions'] > 0 
            ? round(($totals['replied'] / $totals['contact_submissions']) * 100, 1) 
            : 0;
        
        // Average response time (only for replied contact forms)
        $stmt = $pdo->prepare("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, replied_at)) as avg_hours
            FROM email_logs
            WHERE email_type = 'contact' 
            AND is_replied = 1 
            AND replied_at IS NOT NULL
            AND created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $avgResponse = $stmt->fetch();
        $avgResponseHours = $avgResponse['avg_hours'] ? round($avgResponse['avg_hours'], 1) : null;
        
        // Daily submissions for chart
        $stmt = $pdo->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contacts,
                SUM(CASE WHEN is_replied = 1 THEN 1 ELSE 0 END) as replied
            FROM email_logs
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$startDate]);
        $dailyData = $stmt->fetchAll();
        
        // Submissions by inquiry type
        $stmt = $pdo->prepare("
            SELECT 
                inquiry_purpose,
                COUNT(*) as count
            FROM email_logs
            WHERE email_type = 'contact' 
            AND created_at >= ?
            AND inquiry_purpose IS NOT NULL
            GROUP BY inquiry_purpose
            ORDER BY count DESC
        ");
        $stmt->execute([$startDate]);
        $byPurpose = $stmt->fetchAll();
        
        // Submissions by hour of day
        $stmt = $pdo->prepare("
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as count
            FROM email_logs
            WHERE email_type = 'contact' AND created_at >= ?
            GROUP BY HOUR(created_at)
            ORDER BY hour
        ");
        $stmt->execute([$startDate]);
        $byHour = $stmt->fetchAll();
        
        // Recent activity (last 10 contact submissions)
        $stmt = $pdo->prepare("
            SELECT id, sender_name, sender_email, inquiry_purpose, is_read, is_replied, created_at
            FROM email_logs
            WHERE email_type = 'contact'
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute();
        $recentActivity = $stmt->fetchAll();
        
        Response::success([
            'period_days' => $days,
            'totals' => [
                'all_emails' => (int)$totals['total'],
                'contact_submissions' => (int)$totals['contact_submissions'],
                'replied' => (int)$totals['replied'],
                'delivered' => (int)$totals['delivered'],
                'failed' => (int)$totals['failed'],
                'bounced' => (int)$totals['bounced'],
            ],
            'metrics' => [
                'response_rate' => $responseRate,
                'avg_response_hours' => $avgResponseHours,
                'delivery_rate' => $totals['total'] > 0 
                    ? round(($totals['delivered'] / $totals['total']) * 100, 1) 
                    : 0
            ],
            'charts' => [
                'daily' => $dailyData,
                'by_purpose' => $byPurpose,
                'by_hour' => $byHour
            ],
            'recent_activity' => $recentActivity
        ]);
    }
    
    /**
     * Get notification emails from settings
     */
    public static function getNotificationEmails(): array
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'notification_emails'");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result && $result['setting_value']) {
                $emails = json_decode($result['setting_value'], true);
                return is_array($emails) ? $emails : ['admin@ieosuia.com'];
            }
        } catch (\Exception $e) {
            error_log("Failed to get notification emails: " . $e->getMessage());
        }
        
        return ['admin@ieosuia.com'];
    }
    
    /**
     * Export email logs as CSV
     */
    public static function exportEmailsCsv(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        
        // Filters
        $status = $_GET['status'] ?? '';
        $type = $_GET['type'] ?? '';
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $where = ["created_at >= ? AND created_at <= ?"];
        $params = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];
        
        if ($status && in_array($status, ['sent', 'failed', 'bounced', 'pending'])) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if ($type && in_array($type, ['contact', 'verification', 'password_reset', 'welcome', 'notification', 'other'])) {
            $where[] = "email_type = ?";
            $params[] = $type;
        }
        
        $whereClause = "WHERE " . implode(" AND ", $where);
        
        $sql = "SELECT 
            id, recipient_email, cc_email, reply_to_email, subject, email_type, status, 
            sender_name, sender_email, sender_company, inquiry_purpose, 
            is_read, is_replied, priority, created_at, read_at, replied_at
            FROM email_logs {$whereClause} ORDER BY created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        
        // Build CSV
        $csv = "ID,Recipient,CC,Reply-To,Subject,Type,Status,Sender Name,Sender Email,Company,Purpose,Read,Replied,Priority,Created,Read At,Replied At\n";
        
        foreach ($logs as $log) {
            $csv .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"' . "\n",
                $log['id'],
                str_replace('"', '""', $log['recipient_email'] ?? ''),
                str_replace('"', '""', $log['cc_email'] ?? ''),
                str_replace('"', '""', $log['reply_to_email'] ?? ''),
                str_replace('"', '""', $log['subject'] ?? ''),
                $log['email_type'] ?? '',
                $log['status'] ?? '',
                str_replace('"', '""', $log['sender_name'] ?? ''),
                str_replace('"', '""', $log['sender_email'] ?? ''),
                str_replace('"', '""', $log['sender_company'] ?? ''),
                str_replace('"', '""', $log['inquiry_purpose'] ?? ''),
                $log['is_read'] ? 'Yes' : 'No',
                $log['is_replied'] ? 'Yes' : 'No',
                $log['priority'] ?? 'normal',
                $log['created_at'] ?? '',
                $log['read_at'] ?? '',
                $log['replied_at'] ?? ''
            );
        }
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="email_logs_' . date('Y-m-d') . '.csv"');
        header('Cache-Control: no-cache, must-revalidate');
        echo $csv;
        exit;
    }
    
    /**
     * Export statistics report
     */
    public static function exportStatsReport(): void
    {
        self::requireAdmin();
        
        $pdo = Database::getInstance();
        
        $days = min(365, max(1, (int)($_GET['days'] ?? 30)));
        $startDate = date('Y-m-d', strtotime("-{$days} days"));
        $format = $_GET['format'] ?? 'csv';
        
        // Get totals
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contact_submissions,
                SUM(CASE WHEN email_type = 'contact' AND is_replied = 1 THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
            FROM email_logs WHERE created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $totals = $stmt->fetch();
        
        // Response metrics
        $responseRate = $totals['contact_submissions'] > 0 
            ? round(($totals['replied'] / $totals['contact_submissions']) * 100, 1) 
            : 0;
        
        $stmt = $pdo->prepare("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, replied_at)) as avg_hours
            FROM email_logs WHERE email_type = 'contact' AND is_replied = 1 AND replied_at IS NOT NULL AND created_at >= ?
        ");
        $stmt->execute([$startDate]);
        $avgResponse = $stmt->fetch();
        $avgResponseHours = $avgResponse['avg_hours'] ? round($avgResponse['avg_hours'], 1) : 0;
        
        // Daily breakdown
        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as total,
                SUM(CASE WHEN email_type = 'contact' THEN 1 ELSE 0 END) as contacts,
                SUM(CASE WHEN is_replied = 1 THEN 1 ELSE 0 END) as replied
            FROM email_logs WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY date
        ");
        $stmt->execute([$startDate]);
        $dailyData = $stmt->fetchAll();
        
        // By purpose
        $stmt = $pdo->prepare("
            SELECT inquiry_purpose, COUNT(*) as count
            FROM email_logs WHERE email_type = 'contact' AND created_at >= ? AND inquiry_purpose IS NOT NULL
            GROUP BY inquiry_purpose ORDER BY count DESC
        ");
        $stmt->execute([$startDate]);
        $byPurpose = $stmt->fetchAll();
        
        if ($format === 'csv') {
            $csv = "IEOSUIA QR - Email Statistics Report\n";
            $csv .= "Generated: " . date('Y-m-d H:i:s') . "\n";
            $csv .= "Period: Last {$days} days ({$startDate} to " . date('Y-m-d') . ")\n\n";
            
            $csv .= "SUMMARY\n";
            $csv .= "Metric,Value\n";
            $csv .= "Total Emails,{$totals['total']}\n";
            $csv .= "Contact Submissions,{$totals['contact_submissions']}\n";
            $csv .= "Replied,{$totals['replied']}\n";
            $csv .= "Response Rate,{$responseRate}%\n";
            $csv .= "Avg Response Time (hours),{$avgResponseHours}\n";
            $csv .= "Delivered,{$totals['delivered']}\n";
            $csv .= "Failed,{$totals['failed']}\n";
            $csv .= "Bounced,{$totals['bounced']}\n\n";
            
            $csv .= "DAILY BREAKDOWN\n";
            $csv .= "Date,Total,Contacts,Replied\n";
            foreach ($dailyData as $day) {
                $csv .= "{$day['date']},{$day['total']},{$day['contacts']},{$day['replied']}\n";
            }
            $csv .= "\n";
            
            $csv .= "BY INQUIRY TYPE\n";
            $csv .= "Purpose,Count\n";
            foreach ($byPurpose as $purpose) {
                $csv .= "\"{$purpose['inquiry_purpose']}\",{$purpose['count']}\n";
            }
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="email_stats_report_' . date('Y-m-d') . '.csv"');
            header('Cache-Control: no-cache, must-revalidate');
            echo $csv;
            exit;
        }
        
        // JSON format for PDF generation on frontend
        Response::success([
            'report_date' => date('Y-m-d H:i:s'),
            'period' => ['days' => $days, 'start' => $startDate, 'end' => date('Y-m-d')],
            'summary' => [
                'total_emails' => (int)$totals['total'],
                'contact_submissions' => (int)$totals['contact_submissions'],
                'replied' => (int)$totals['replied'],
                'response_rate' => $responseRate,
                'avg_response_hours' => $avgResponseHours,
                'delivered' => (int)$totals['delivered'],
                'failed' => (int)$totals['failed'],
                'bounced' => (int)$totals['bounced']
            ],
            'daily' => $dailyData,
            'by_purpose' => $byPurpose
        ]);
    }
}
