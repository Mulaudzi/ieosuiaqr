<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Middleware\RateLimit;
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

            Response::success([
                'user' => [
                    'id' => $userId,
                    'email' => strtolower(trim($data['email'])),
                    'name' => trim($data['name']),
                    'plan' => 'Free',
                    'email_verified' => false
                ],
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

        // Find user
        $stmt = $pdo->prepare("SELECT id, email, password, name, plan, email_verified_at FROM users WHERE email = ?");
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
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'plan' => $user['plan'],
                'email_verified' => !empty($user['email_verified_at'])
            ],
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

        Response::success([
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'plan' => $user['plan'],
            'email_verified' => !empty($user['email_verified_at'])
        ]);
    }

    public static function updateProfile(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $updates = [];
        $params = [];

        if (isset($data['name'])) {
            $validator = new Validator(['name' => $data['name']]);
            $validator->maxLength('name', 100)->validate();
            $updates[] = "name = ?";
            $params[] = trim($data['name']);
        }

        if (isset($data['email'])) {
            $validator = new Validator(['email' => $data['email']]);
            $validator->email('email')->validate();
            
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([strtolower(trim($data['email'])), $user['id']]);
            
            if ($stmt->fetch()) {
                Response::error('This email is already in use', 409);
            }
            
            $updates[] = "email = ?";
            $params[] = strtolower(trim($data['email']));
        }

        if (isset($data['password'])) {
            $validator = new Validator(['password' => $data['password']]);
            $validator->minLength('password', 8)->validate();
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $user['id'];
        $pdo = Database::getInstance();
        $sql = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated user
        $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updatedUser = $stmt->fetch();

        Response::success([
            'id' => $updatedUser['id'],
            'email' => $updatedUser['email'],
            'name' => $updatedUser['name'],
            'plan' => $updatedUser['plan'],
            'email_verified' => !empty($updatedUser['email_verified_at'])
        ], 'Profile updated successfully');
    }

    public static function verifyEmail(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['token'])) {
            Response::error('Verification token is required', 400);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE verification_token = ? AND email_verified_at IS NULL");
        $stmt->execute([$data['token']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Invalid or expired verification token', 400);
        }

        $stmt = $pdo->prepare("UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);

        Response::success(null, 'Email verified successfully');
    }

    public static function forgotPassword(): void
    {
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
}
