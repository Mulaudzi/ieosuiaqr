<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Middleware\RateLimit;
use App\Services\CaptchaService;
use App\Services\EmailValidationService;
use App\Services\MailService;
use App\Services\GoogleOAuthService;

class AuthController
{
    public static function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Rate limit registration attempts
        RateLimit::check('register', 5, 60);

        // Verify CAPTCHA
        CaptchaService::verify($data['captcha_token'] ?? null, 'signup');

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

        // Verify CAPTCHA
        CaptchaService::verify($data['captcha_token'] ?? null, 'login');

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

        // Validate file type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

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
        $stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        // Always return success to prevent email enumeration
        if ($user) {
            $resetToken = bin2hex(random_bytes(32));
            $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?");
            $stmt->execute([$resetToken, $user['id']]);

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
        $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()");
        $stmt->execute([$data['token']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Invalid or expired reset token', 400);
        }

        $stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?");
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
        if (!GoogleOAuthService::isConfigured()) {
            Response::error('Google Sign-In is not configured', 503);
        }

        try {
            $authUrl = GoogleOAuthService::getAuthUrl();
            Response::success(['url' => $authUrl], 'Redirect to this URL to sign in with Google');
        } catch (\Exception $e) {
            error_log("Google auth URL error: " . $e->getMessage());
            Response::error('Failed to generate Google auth URL', 500);
        }
    }

    /**
     * Handle Google OAuth callback
     */
    public static function googleCallback(): void
    {
        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;
        $error = $_GET['error'] ?? null;

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://qr.ieosuia.com';

        if ($error) {
            header("Location: $frontendUrl/login?error=google_auth_cancelled");
            exit;
        }

        if (!$code) {
            header("Location: $frontendUrl/login?error=missing_code");
            exit;
        }

        // Verify state to prevent CSRF
        if (!GoogleOAuthService::verifyState($state)) {
            header("Location: $frontendUrl/login?error=invalid_state");
            exit;
        }

        try {
            // Exchange code for tokens
            $tokens = GoogleOAuthService::getAccessToken($code);
            $accessToken = $tokens['access_token'] ?? null;

            if (!$accessToken) {
                throw new \Exception('No access token received');
            }

            // Get user info from Google
            $googleUser = GoogleOAuthService::getUserInfo($accessToken);
            $email = strtolower($googleUser['email'] ?? '');
            $name = $googleUser['name'] ?? 'Google User';
            $avatarUrl = $googleUser['picture'] ?? null;
            $googleId = $googleUser['id'] ?? null;

            if (!$email) {
                throw new \Exception('No email received from Google');
            }

            $pdo = Database::getInstance();

            // Check if user exists
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                // Update Google ID and avatar if not set
                $updates = [];
                $params = [];

                if (empty($user['google_id'])) {
                    $updates[] = "google_id = ?";
                    $params[] = $googleId;
                }
                if (empty($user['avatar_url']) && $avatarUrl) {
                    $updates[] = "avatar_url = ?";
                    $params[] = $avatarUrl;
                }
                if (!empty($updates)) {
                    $params[] = $user['id'];
                    $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
                    $stmt->execute($params);
                }
            } else {
                // Create new user (no password for OAuth users)
                $stmt = $pdo->prepare("
                    INSERT INTO users (email, name, google_id, avatar_url, plan, email_verified_at, created_at)
                    VALUES (?, ?, ?, ?, 'Free', NOW(), NOW())
                ");
                $stmt->execute([$email, $name, $googleId, $avatarUrl]);
                
                $userId = (int)$pdo->lastInsertId();

                // Fetch the new user
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();

                // Send welcome email
                MailService::sendWelcomeEmail($email, $name);
            }

            // Generate JWT token
            $token = Auth::generateToken($user['id'], $user['plan']);

            // Redirect to frontend with token
            $redirectUrl = $frontendUrl . '/auth/google/callback?token=' . urlencode($token);
            header("Location: $redirectUrl");
            exit;

        } catch (\Exception $e) {
            error_log("Google callback error: " . $e->getMessage());
            header("Location: $frontendUrl/login?error=google_auth_failed");
            exit;
        }
    }

    /**
     * Handle Google Sign-In from frontend (using ID token)
     */
    public static function googleSignIn(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $idToken = $data['id_token'] ?? null;

        if (!$idToken) {
            Response::error('ID token is required', 400);
        }

        if (!GoogleOAuthService::isConfigured()) {
            Response::error('Google Sign-In is not configured', 503);
        }

        try {
            // Verify the ID token
            $payload = GoogleOAuthService::verifyIdToken($idToken);

            if (!$payload) {
                Response::error('Invalid ID token', 401);
            }

            $email = strtolower($payload['email'] ?? '');
            $name = $payload['name'] ?? 'Google User';
            $avatarUrl = $payload['picture'] ?? null;
            $googleId = $payload['sub'] ?? null;

            if (!$email) {
                Response::error('No email in token', 400);
            }

            $pdo = Database::getInstance();

            // Check if user exists
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                // Update Google ID and avatar if not set
                $updates = [];
                $params = [];

                if (empty($user['google_id'])) {
                    $updates[] = "google_id = ?";
                    $params[] = $googleId;
                }
                if (empty($user['avatar_url']) && $avatarUrl) {
                    $updates[] = "avatar_url = ?";
                    $params[] = $avatarUrl;
                }
                if (!empty($updates)) {
                    $params[] = $user['id'];
                    $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
                    $stmt->execute($params);
                    
                    // Refetch user
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->execute([$user['id']]);
                    $user = $stmt->fetch();
                }
            } else {
                // Create new user
                $stmt = $pdo->prepare("
                    INSERT INTO users (email, name, google_id, avatar_url, plan, email_verified_at, created_at)
                    VALUES (?, ?, ?, ?, 'Free', NOW(), NOW())
                ");
                $stmt->execute([$email, $name, $googleId, $avatarUrl]);
                
                $userId = (int)$pdo->lastInsertId();

                // Fetch the new user
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();

                // Send welcome email
                MailService::sendWelcomeEmail($email, $name);
            }

            // Generate JWT token
            $token = Auth::generateToken($user['id'], $user['plan']);

            Response::success([
                'user' => Auth::formatUserForFrontend($user),
                'tokens' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => (int)($_ENV['JWT_EXPIRY'] ?? 3600)
                ]
            ], 'Google sign-in successful');

        } catch (\Exception $e) {
            error_log("Google sign-in error: " . $e->getMessage());
            Response::error('Google sign-in failed', 500);
        }
    }

    /**
     * Delete user account (soft delete)
     */
    public static function deleteAccount(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        try {
            Database::beginTransaction();

            // Soft delete - set deleted_at timestamp
            $stmt = $pdo->prepare("UPDATE users SET deleted_at = NOW(), email = CONCAT('deleted_', id, '_', email) WHERE id = ?");
            $stmt->execute([$user['id']]);

            // Optionally deactivate all QR codes
            $stmt = $pdo->prepare("UPDATE qr_codes SET is_active = 0 WHERE user_id = ?");
            $stmt->execute([$user['id']]);

            Database::commit();

            Response::success(null, 'Account deleted successfully');

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Delete account error: " . $e->getMessage());
            Response::error('Failed to delete account', 500);
        }
    }

    /**
     * Enable 2FA (stub - returns setup info)
     */
    public static function enable2FA(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Generate a secret key (in production, use speakeasy or similar)
        $secret = strtoupper(substr(bin2hex(random_bytes(16)), 0, 16));
        
        // Store the secret (not verified yet)
        $stmt = $pdo->prepare("UPDATE users SET two_factor_secret = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$secret, $user['id']]);

        // Generate QR code URL for authenticator apps
        $appName = urlencode('IEOSUIA QR');
        $email = urlencode($user['email']);
        $qrCodeUrl = "otpauth://totp/{$appName}:{$email}?secret={$secret}&issuer={$appName}";

        Response::success([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message' => 'Scan the QR code with your authenticator app'
        ], '2FA setup initiated');
    }

    /**
     * Disable 2FA
     */
    public static function disable2FA(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        Response::success(null, '2FA disabled successfully');
    }
}
