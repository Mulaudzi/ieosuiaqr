<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;

class GoogleAuthController
{
    /**
     * Initiate Google OAuth flow
     * GET /api/auth/google
     */
    public static function redirect(): void
    {
        $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
        $redirectUri = $_GET['redirect_uri'] ?? ($_ENV['APP_URL'] ?? 'https://qr.ieosuia.com') . '/auth/google/callback';
        
        if (empty($clientId)) {
            Response::error('Google OAuth is not configured', 500);
        }

        // Store the frontend redirect URI in session/state
        $state = base64_encode(json_encode([
            'redirect_uri' => $redirectUri,
            'csrf' => bin2hex(random_bytes(16))
        ]));

        // Google OAuth URL
        $googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => ($_ENV['API_URL'] ?? 'https://qr.ieosuia.com/api') . '/auth/google/callback',
            'response_type' => 'code',
            'scope' => 'email profile',
            'access_type' => 'online',
            'state' => $state,
            'prompt' => 'select_account'
        ]);

        header('Location: ' . $googleAuthUrl);
        exit;
    }

    /**
     * Handle Google OAuth callback
     * GET /api/auth/google/callback
     */
    public static function callback(): void
    {
        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;
        $error = $_GET['error'] ?? null;

        // Decode state to get frontend redirect URI
        $stateData = $state ? json_decode(base64_decode($state), true) : null;
        $frontendRedirect = $stateData['redirect_uri'] ?? ($_ENV['APP_URL'] ?? 'https://qr.ieosuia.com') . '/auth/google/callback';

        if ($error) {
            self::redirectWithError($frontendRedirect, 'Google authentication was cancelled');
            return;
        }

        if (!$code) {
            self::redirectWithError($frontendRedirect, 'No authorization code received');
            return;
        }

        $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
        $clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
        $apiUrl = $_ENV['API_URL'] ?? 'https://qr.ieosuia.com/api';

        try {
            // Exchange code for tokens
            $tokenResponse = self::httpPost('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $apiUrl . '/auth/google/callback',
                'grant_type' => 'authorization_code'
            ]);

            if (!$tokenResponse || !isset($tokenResponse['access_token'])) {
                self::redirectWithError($frontendRedirect, 'Failed to exchange authorization code');
                return;
            }

            // Get user info from Google
            $userInfo = self::httpGet('https://www.googleapis.com/oauth2/v2/userinfo', [
                'Authorization: Bearer ' . $tokenResponse['access_token']
            ]);

            if (!$userInfo || !isset($userInfo['email'])) {
                self::redirectWithError($frontendRedirect, 'Failed to get user information from Google');
                return;
            }

            // Find or create user
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at, avatar_url, created_at FROM users WHERE email = ?");
            $stmt->execute([strtolower($userInfo['email'])]);
            $user = $stmt->fetch();

            if ($user) {
                // Existing user - update avatar if not set
                if (empty($user['avatar_url']) && !empty($userInfo['picture'])) {
                    $stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
                    $stmt->execute([$userInfo['picture'], $user['id']]);
                    $user['avatar_url'] = $userInfo['picture'];
                }
                
                // Verify email if not verified
                if (empty($user['email_verified_at'])) {
                    $stmt = $pdo->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?");
                    $stmt->execute([$user['id']]);
                    $user['email_verified_at'] = date('Y-m-d H:i:s');
                }
            } else {
                // Create new user
                $randomPassword = bin2hex(random_bytes(16));
                $stmt = $pdo->prepare("
                    INSERT INTO users (email, password, name, plan, email_verified_at, avatar_url, created_at)
                    VALUES (?, ?, ?, 'Free', NOW(), ?, NOW())
                ");
                $stmt->execute([
                    strtolower($userInfo['email']),
                    password_hash($randomPassword, PASSWORD_BCRYPT),
                    $userInfo['name'] ?? explode('@', $userInfo['email'])[0],
                    $userInfo['picture'] ?? null
                ]);

                $userId = (int)$pdo->lastInsertId();
                
                // Fetch the newly created user
                $stmt = $pdo->prepare("SELECT id, email, name, plan, email_verified_at, avatar_url, created_at FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
            }

            // Generate JWT token
            $token = Auth::generateToken($user['id'], $user['plan']);
            
            // Prepare response data
            $responseData = [
                'access_token' => $token,
                'user' => Auth::formatUserForFrontend($user),
                'expires_in' => (int)($_ENV['JWT_EXPIRY'] ?? 3600)
            ];

            // Redirect to frontend with token
            $encodedData = base64_encode(json_encode($responseData));
            header('Location: ' . $frontendRedirect . '?token=' . urlencode($encodedData));
            exit;

        } catch (\Exception $e) {
            error_log("Google OAuth error: " . $e->getMessage());
            self::redirectWithError($frontendRedirect, 'Authentication failed. Please try again.');
        }
    }

    private static function redirectWithError(string $redirectUri, string $error): void
    {
        header('Location: ' . $redirectUri . '?error=' . urlencode($error));
        exit;
    }

    private static function httpPost(string $url, array $data): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("HTTP POST error: $error");
            return null;
        }

        return json_decode($response, true);
    }

    private static function httpGet(string $url, array $headers = []): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("HTTP GET error: $error");
            return null;
        }

        return json_decode($response, true);
    }
}