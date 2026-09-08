<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Middleware\RateLimit;
use App\Services\EmailValidationService;
use App\Services\MailService;

class AuthController
{
    public static function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Rate limit registration attempts
        RateLimit::check('register', 5, 60);

        // Validate input
        $validator = new Validator($data);
        $validator
            ->required('name', 'Name is required')
            ->maxLength('name', 100, 'Name must not exceed 100 characters')
            ->required('email', 'Email is required')
            ->email('email', 'Please provide a valid email address')
            ->required('password', 'Password is required')
            ->minLength('password', 8, 'Password must be at least 8 characters')
            ->validate();

        // Advanced email validation (disposable, role-based, MX records)
        $emailValidation = EmailValidationService::validate($data['email']);
        if (!$emailValidation['valid']) {
            Response::error($emailValidation['message'], 400);
        }

        $pdo = Database::getInstance();

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        
        if ($stmt->fetch()) {
            Response::error('An account with this email already exists', 409);
        }

        try {
            Database::beginTransaction();

            // Create user
            $verificationToken = bin2hex(random_bytes(32));
            $stmt = $pdo->prepare("
                INSERT INTO users (email, password, name, plan, verification_token, created_at)
                VALUES (?, ?, ?, 'Free', ?, NOW())
            ");
            
            $stmt->execute([
                strtolower(trim($data['email'])),
                password_hash($data['password'], PASSWORD_BCRYPT),
                trim($data['name']),
                $verificationToken
            ]);

            $userId = (int)$pdo->lastInsertId();

            Database::commit();

            // Generate JWT token
            $token = Auth::generateToken($userId, 'Free');

            // Send verification email
            $emailSent = MailService::sendVerificationEmail(
                strtolower(trim($data['email'])),
                trim($data['name']),
                $verificationToken
            );

            if (!$emailSent) {
                error_log("Failed to send verification email to: " . $data['email']);
            }

            // Fetch the newly created user for formatting
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch();

            Response::success([
                'user' => Auth::formatUserForFrontend($newUser),
                'tokens' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => (int)($_ENV['JWT_EXPIRY'] ?? 3600)
                ]
            ], 'Registration successful. Please check your email to verify your account.', 201);

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Registration error: " . $e->getMessage());
            Response::error('Registration failed. Please try again.', 500);
        }
    }

    public static function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Rate limit login attempts
        RateLimit::check('login', 5, 5);

        // Validate input
        $validator = new Validator($data);
        $validator
            ->required('email', 'Email is required')
            ->email('email', 'Please provide a valid email address')
            ->required('password', 'Password is required')
            ->validate();

        $pdo = Database::getInstance();

        // Find user with all fields needed for frontend
        $stmt = $pdo->prepare("SELECT id, email, password, name, plan, email_verified_at, created_at FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Invalid email or password', 401);
        }

        // Reset rate limit on successful login
        RateLimit::reset('login');

        // Generate JWT token
        $token = Auth::generateToken($user['id'], $user['plan']);

        Response::success([
            'user' => Auth::formatUserForFrontend($user),
            'tokens' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => (int)($_ENV['JWT_EXPIRY'] ?? 3600)
            ]
        ], 'Login successful');
    }

    public static function logout(): void
    {
        // With JWT, we don't need server-side logout
        // The client should remove the token
        Auth::check(); // Verify user is authenticated
        Response::success(null, 'Logged out successfully');
    }

    public static function getProfile(): void
    {
        $user = Auth::check();

        Response::success(Auth::formatUserForFrontend($user));
    }

    public static function updateProfile(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = Database::getInstance();
        $updates = [];
        $params = [];

        // Verify current password if changing password
        if (isset($data['password']) && !empty($data['password'])) {
            if (empty($data['current_password'])) {
                Response::error('Current password is required to change password', 400);
            }

            // Fetch current password hash
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $userData = $stmt->fetch();

            if (!password_verify($data['current_password'], $userData['password'])) {
                Response::error('Current password is incorrect', 401);
            }

            $validator = new Validator(['password' => $data['password']]);
            $validator->minLength('password', 8)->validate();
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (isset($data['name'])) {
            $validator = new Validator(['name' => $data['name']]);
            $validator->maxLength('name', 100)->validate();
            $updates[] = "name = ?";
            $params[] = trim($data['name']);
        }

        if (isset($data['email'])) {
            $validator = new Validator(['email' => $data['email']]);
            $validator->email('email')->validate();
            
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([strtolower(trim($data['email'])), $user['id']]);
            
            if ($stmt->fetch()) {
                Response::error('This email is already in use', 409);
            }
            
            $updates[] = "email = ?";
            $params[] = strtolower(trim($data['email']));
        }

        if (isset($data['avatar_url'])) {
            $updates[] = "avatar_url = ?";
            $params[] = $data['avatar_url'];
        }

        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $user['id'];
        $sql = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated user
        $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updatedUser = $stmt->fetch();

        Response::success(Auth::formatUserForFrontend($updatedUser), 'Profile updated successfully');
    }

    public static function uploadAvatar(): void
    {
        $user = Auth::check();

        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No valid file uploaded', 400);
        }

        $file = $_FILES['avatar'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        // Validate file type with fallback for missing finfo extension
        $mimeType = self::detectMimeType($file['tmp_name'], $file['name']);

        if (!in_array($mimeType, $allowedTypes)) {
            Response::error('Invalid file type. Allowed: JPG, PNG, GIF, WebP', 400);
        }

        if ($file['size'] > $maxSize) {
            Response::error('File too large. Maximum size: 5MB', 400);
        }

        // Create upload directory
        $uploadDir = __DIR__ . '/../../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $extension = match($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg'
        };
        $filename = 'avatar_' . $user['id'] . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        $filepath = $uploadDir . $filename;

        // Delete old avatar if exists
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT avatar_url FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $oldAvatar = $stmt->fetchColumn();

        if ($oldAvatar && strpos($oldAvatar, '/uploads/avatars/') !== false) {
            $oldPath = __DIR__ . '/../../' . str_replace('/api/', '', parse_url($oldAvatar, PHP_URL_PATH));
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            Response::error('Failed to save file', 500);
        }

        // Update database with avatar URL
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $avatarUrl = $appUrl . '/api/uploads/avatars/' . $filename;

        $stmt = $pdo->prepare("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$avatarUrl, $user['id']]);

        Response::success([
            'avatar_url' => $avatarUrl
        ], 'Avatar uploaded successfully');
    }

    /**
     * Get user notification preferences
     */
    public static function getNotificationPreferences(): void
    {
        $user = Auth::check();

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT email_notifications, scan_alerts, weekly_report, marketing_emails 
            FROM users WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        $prefs = $stmt->fetch();

        Response::success([
            'email_notifications' => (bool)($prefs['email_notifications'] ?? true),
            'scan_alerts' => (bool)($prefs['scan_alerts'] ?? true),
            'weekly_report' => (bool)($prefs['weekly_report'] ?? false),
            'marketing_emails' => (bool)($prefs['marketing_emails'] ?? false),
        ]);
    }

    /**
     * Update user notification preferences
     */
    public static function updateNotificationPreferences(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = Database::getInstance();
        
        $updates = [];
        $params = [];

        if (isset($data['email_notifications'])) {
            $updates[] = "email_notifications = ?";
            $params[] = $data['email_notifications'] ? 1 : 0;
        }
        if (isset($data['scan_alerts'])) {
            $updates[] = "scan_alerts = ?";
            $params[] = $data['scan_alerts'] ? 1 : 0;
        }
        if (isset($data['weekly_report'])) {
            $updates[] = "weekly_report = ?";
            $params[] = $data['weekly_report'] ? 1 : 0;
        }
        if (isset($data['marketing_emails'])) {
            $updates[] = "marketing_emails = ?";
            $params[] = $data['marketing_emails'] ? 1 : 0;
        }

        if (empty($updates)) {
            Response::success(null, 'No preferences to update');
            return;
        }

        $params[] = $user['id'];
        $sql = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'Notification preferences updated');
    }

    public static function verifyEmail(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Check both JSON body AND query parameters for token
        $token = $data['token'] ?? $_GET['token'] ?? null;

        if (empty($token)) {
            Response::error('Verification token is required', 400);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE verification_token = ? AND email_verified_at IS NULL");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Invalid or expired verification token', 400);
        }

        $stmt = $pdo->prepare("UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);

        // Send welcome email
        $emailSent = MailService::sendWelcomeEmail($user['email'], $user['name']);
        if (!$emailSent) {
            error_log("Failed to send welcome email to: " . $user['email']);
        }

        Response::success(null, 'Email verified successfully');
    }

    public static function forgotPassword(): void
    {
        // Rate limit: max 3 forgot password attempts per 15 minutes per IP
        RateLimit::check('forgot_password', 3, 15);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator->required('email')->email('email')->validate();

        $pdo = Database::getInstance();
        
        // Set timezone to UTC for consistent token expiry handling
        $pdo->exec("SET time_zone = '+00:00'");
        
        $stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        // Always return success to prevent email enumeration
        if ($user) {
            // Generate secure token
            $resetToken = bin2hex(random_bytes(32));
            
            // Store token (plain - for simplicity) with 1 hour expiry using UTC
            $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), updated_at = NOW() WHERE id = ?");
            $result = $stmt->execute([$resetToken, $user['id']]);
            
            if (!$result || $stmt->rowCount() === 0) {
                error_log("Failed to store reset token for user: " . $user['email']);
            } else {
                // Send password reset email
                $emailSent = MailService::sendPasswordResetEmail(
                    $user['email'],
                    $user['name'],
                    $resetToken
                );

                if (!$emailSent) {
                    error_log("Failed to send password reset email to: " . $user['email']);
                }
            }
        }

        Response::success(null, 'If an account exists with this email, you will receive a password reset link.');
    }

    public static function resetPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator($data);
        $validator
            ->required('token', 'Reset token is required')
            ->required('password', 'Password is required')
            ->minLength('password', 8)
            ->validate();

        $pdo = Database::getInstance();
        
        // Set timezone to UTC for consistent token expiry handling
        $pdo->exec("SET time_zone = '+00:00'");
        
        // Check if token exists first
        $stmt = $pdo->prepare("SELECT id, reset_token_expires FROM users WHERE reset_token = ?");
        $stmt->execute([$data['token']]);
        $user = $stmt->fetch();

        if (!$user) {
            error_log("Reset password failed: Token not found in database");
            Response::error('Invalid reset token. Please request a new password reset link.', 400);
        }
        
        // Check expiry using UTC timestamp
        $expiryTime = strtotime($user['reset_token_expires']);
        $currentTime = time();
        
        if ($expiryTime < $currentTime) {
            error_log("Reset password failed: Token expired. Expiry: " . $user['reset_token_expires'] . ", Current UTC: " . gmdate('Y-m-d H:i:s'));
            // Clear expired token
            $stmt = $pdo->prepare("UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?");
            $stmt->execute([$user['id']]);
            Response::error('This reset link has expired. Please request a new password reset link.', 400);
        }

        // Update password and clear token (single-use)
        $stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = ?");
        $stmt->execute([password_hash($data['password'], PASSWORD_BCRYPT), $user['id']]);

        Response::success(null, 'Password reset successfully. You can now login with your new password.');
    }

    public static function resendVerification(): void
    {
        $user = Auth::check();

        // Rate limit: max 3 resend attempts per 5 minutes per user
        RateLimit::check('resend_verification_' . $user['id'], 3, 5);

        if (!empty($user['email_verified_at'])) {
            Response::error('Email is already verified', 400);
        }

        $pdo = Database::getInstance();
        $verificationToken = bin2hex(random_bytes(32));
        $stmt = $pdo->prepare("UPDATE users SET verification_token = ? WHERE id = ?");
        $stmt->execute([$verificationToken, $user['id']]);

        // Send verification email
        $emailSent = MailService::sendVerificationEmail(
            $user['email'],
            $user['name'],
            $verificationToken
        );

        if (!$emailSent) {
            error_log("Failed to send verification email to: " . $user['email']);
            Response::error('Failed to send verification email. Please try again.', 500);
        }

        Response::success(null, 'Verification email sent. Please check your inbox.');
    }

    /**
     * Get Google OAuth authorization URL
     */
    public static function googleAuthUrl(): void
    {
        Response::error('Google Sign-In has been disabled. Please use email and password.', 410);
    }

    /**
     * Handle Google OAuth callback
     */
    public static function googleCallback(): void
    {
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://qr.ieosuia.com';
        header("Location: $frontendUrl/login?error=google_auth_disabled");
        exit;
    }

    /**
     * Handle Google Sign-In from frontend (using ID token)
     */
    public static function googleSignIn(): void
    {
        Response::error('Google Sign-In has been disabled. Please use email and password.', 410);
    }

    /**
     * Get user's saved logos
     */
    public static function getLogos(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT id, logo_path, preview_thumb, name, created_at FROM user_logos WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user['id']]);
        $logos = $stmt->fetchAll() ?: [];

        // Drop broken entries and normalize logo_path to same-origin relative paths.
        $logos = array_values(array_filter(array_map(function ($logo) {
            if (empty($logo['logo_path'])) {
                return null;
            }

            $path = parse_url($logo['logo_path'], PHP_URL_PATH) ?: $logo['logo_path'];
            $relativePath = str_starts_with($path, '/api/uploads/logos/') ? $path : '/api/uploads/logos/' . basename($path);
            $diskPath = __DIR__ . '/../../' . ltrim(str_replace('/api/', '', $relativePath), '/');

            if (!file_exists($diskPath)) {
                return null;
            }

            $logo['logo_path'] = $relativePath;
            return $logo;
        }, $logos)));

        Response::success($logos);
    }

    /**
     * Upload a new logo
     */
    public static function uploadLogo(): void
    {
        $user = Auth::check();

        if (!isset($_FILES['logo'])) {
            Response::error('No logo file was provided', 400);
        }

        $file = $_FILES['logo'];
        $maxSize = 2 * 1024 * 1024; // 2MB

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadMax = ini_get('upload_max_filesize') ?: 'server limit';
            $postMax = ini_get('post_max_size') ?: 'server limit';

            $errorMessage = match ($file['error']) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "Logo exceeds server upload limits (upload_max_filesize={$uploadMax}, post_max_size={$postMax}).",
                UPLOAD_ERR_PARTIAL => 'Logo upload was interrupted. Please retry.',
                UPLOAD_ERR_NO_FILE => 'No logo file was selected.',
                UPLOAD_ERR_NO_TMP_DIR => 'Server temporary upload directory is missing.',
                UPLOAD_ERR_CANT_WRITE => 'Server could not write uploaded file to disk.',
                UPLOAD_ERR_EXTENSION => 'Upload blocked by a server extension.',
                default => 'Logo upload failed. Please try again.',
            };

            Response::error($errorMessage, 400);
        }

        // Validate file type (PNG only) with fallback for missing finfo extension
        $mimeType = self::detectMimeType($file['tmp_name'], $file['name']);

        if ($mimeType !== 'image/png') {
            Response::error('Only PNG files are allowed for logos', 400);
        }

        if ($file['size'] > $maxSize) {
            Response::error('Logo must be less than 2MB', 400);
        }

        $pdo = Database::getInstance();

        // Create upload directory
        $uploadDir = __DIR__ . '/../../uploads/logos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $filename = 'logo_' . $user['id'] . '_' . bin2hex(random_bytes(8)) . '.png';
        $filepath = $uploadDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            Response::error('Failed to save file', 500);
        }

        // Save to database
        $logoPath = '/api/uploads/logos/' . $filename;

        $stmt = $pdo->prepare("INSERT INTO user_logos (user_id, logo_path, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$user['id'], $logoPath]);

        $logoId = (int)$pdo->lastInsertId();

        Response::success([
            'id' => $logoId,
            'logo_path' => $logoPath
        ], 'Logo uploaded successfully', 201);
    }

    /**
     * Detect MIME type with fallback for missing finfo extension
     * @param string $filePath Path to the file
     * @param string $fileName Original filename for extension-based fallback
     * @return string MIME type
     */
    private static function detectMimeType(string $filePath, string $fileName): string
    {
        // Try finfo extension first (most reliable)
        if (extension_loaded('fileinfo') && class_exists('finfo')) {
            try {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->file($filePath);
                if ($mimeType !== false) {
                    return $mimeType;
                }
            } catch (\Exception $e) {
                error_log("finfo detection failed: " . $e->getMessage());
            }
        }

        // Fallback to mime_content_type function
        if (function_exists('mime_content_type')) {
            $mimeType = mime_content_type($filePath);
            if ($mimeType !== false) {
                return $mimeType;
            }
        }

        // Fallback to extension-based detection
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $mimeMap = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'bmp' => 'image/bmp',
            'ico' => 'image/x-icon',
            'pdf' => 'application/pdf',
            'csv' => 'text/csv',
        ];

        if (isset($mimeMap[$extension])) {
            return $mimeMap[$extension];
        }

        // Last resort - check image getimagesize
        $imageInfo = @getimagesize($filePath);
        if ($imageInfo !== false && isset($imageInfo['mime'])) {
            return $imageInfo['mime'];
        }

        // Cannot determine MIME type
        error_log("Could not determine MIME type for file: {$fileName}");
        return 'application/octet-stream';
    }

    /**
     * Delete user account and all associated data
     * POST /user/delete
     */
    public static function deleteAccount(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Require password confirmation for security
        if (empty($data['password'])) {
            Response::error('Password confirmation is required to delete your account', 400);
        }

        $pdo = Database::getInstance();

        // Verify password
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch();

        if (!$userData || !password_verify($data['password'], $userData['password'])) {
            Response::error('Incorrect password', 401);
        }

        try {
            Database::beginTransaction();

            // Delete user's QR code scan logs first (foreign key constraint)
            $stmt = $pdo->prepare("
                DELETE sl FROM scan_logs sl
                INNER JOIN qr_codes qr ON sl.qr_id = qr.id
                WHERE qr.user_id = ?
            ");
            $stmt->execute([$user['id']]);

            // Delete user's QR codes
            $stmt = $pdo->prepare("DELETE FROM qr_codes WHERE user_id = ?");
            $stmt->execute([$user['id']]);

            // Delete inventory status history
            $stmt = $pdo->prepare("
                DELETE h FROM inventory_status_history h
                INNER JOIN inventory_items i ON h.item_id = i.id
                WHERE i.user_id = ?
            ");
            $stmt->execute([$user['id']]);

            // Delete inventory alerts
            $stmt = $pdo->prepare("DELETE FROM inventory_alerts WHERE user_id = ?");
            $stmt->execute([$user['id']]);

            // Delete inventory items
            $stmt = $pdo->prepare("DELETE FROM inventory_items WHERE user_id = ?");
            $stmt->execute([$user['id']]);

            // Delete user's avatar file if exists
            if (!empty($user['avatar_url']) && strpos($user['avatar_url'], '/uploads/avatars/') !== false) {
                $avatarPath = __DIR__ . '/../../' . str_replace('/api/', '', parse_url($user['avatar_url'], PHP_URL_PATH));
                if (file_exists($avatarPath)) {
                    unlink($avatarPath);
                }
            }

            // Finally delete the user
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);

            Database::commit();

            // Log the account deletion
            error_log("User account deleted: ID={$user['id']}, Email={$user['email']}");

            Response::success(null, 'Your account has been permanently deleted.');

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Account deletion error for user {$user['id']}: " . $e->getMessage());
            Response::error('Failed to delete account. Please contact support.', 500);
        }
    }
}
