<?php

namespace App\Services;

/**
 * Google OAuth Service
 * Handles Google Sign-In flow for authentication
 */
class GoogleOAuthService
{
    private static ?string $clientId = null;
    private static ?string $clientSecret = null;
    private static ?string $redirectUri = null;

    private static function init(): void
    {
        if (self::$clientId === null) {
            self::$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? null;
            self::$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? null;
            self::$redirectUri = ($_ENV['APP_URL'] ?? 'https://qr.ieosuia.com') . '/api/auth/google/callback';
        }
    }

    /**
     * Check if Google OAuth is configured
     */
    public static function isConfigured(): bool
    {
        self::init();
        return !empty(self::$clientId) && !empty(self::$clientSecret);
    }

    /**
     * Get the Google OAuth authorization URL
     */
    public static function getAuthUrl(): string
    {
        self::init();

        if (!self::isConfigured()) {
            throw new \Exception('Google OAuth is not configured');
        }

        $state = bin2hex(random_bytes(16));
        
        // Store state in session for verification
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['google_oauth_state'] = $state;

        $params = [
            'client_id' => self::$clientId,
            'redirect_uri' => self::$redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account'
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Exchange authorization code for access token
     */
    public static function getAccessToken(string $code): array
    {
        self::init();

        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'code' => $code,
                'client_id' => self::$clientId,
                'client_secret' => self::$clientSecret,
                'redirect_uri' => self::$redirectUri,
                'grant_type' => 'authorization_code'
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Google token exchange failed: " . $response);
            throw new \Exception('Failed to exchange authorization code');
        }

        return json_decode($response, true);
    }

    /**
     * Get user info from Google using access token
     */
    public static function getUserInfo(string $accessToken): array
    {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Google user info request failed: " . $response);
            throw new \Exception('Failed to get user info from Google');
        }

        return json_decode($response, true);
    }

    /**
     * Verify state parameter to prevent CSRF
     */
    public static function verifyState(string $state): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $savedState = $_SESSION['google_oauth_state'] ?? null;
        unset($_SESSION['google_oauth_state']);

        return $savedState !== null && hash_equals($savedState, $state);
    }

    /**
     * Verify an ID token from Google Sign-In (for frontend-initiated auth)
     */
    public static function verifyIdToken(string $idToken): ?array
    {
        self::init();

        // Verify with Google's tokeninfo endpoint
        $ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return null;
        }

        $payload = json_decode($response, true);

        // Verify the audience matches our client ID
        if (($payload['aud'] ?? '') !== self::$clientId) {
            return null;
        }

        return $payload;
    }
}
