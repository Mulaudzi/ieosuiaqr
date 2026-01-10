<?php

namespace App\Services;

use App\Helpers\Response;

class CaptchaService
{
    private static string $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    private static float $minScore = 0.5; // Score threshold (0.0 - 1.0)

    /**
     * Verify a reCAPTCHA v3 token
     * Returns true if valid, or sends error response and exits if invalid
     */
    public static function verify(?string $token, string $expectedAction = ''): bool
    {
        // Skip verification in development/testing if not configured
        $secretKey = $_ENV['RECAPTCHA_SECRET_KEY'] ?? '';
        
        if (empty($secretKey)) {
            // If no secret key is configured, skip verification (for development)
            error_log("CAPTCHA: Skipping verification - no secret key configured");
            return true;
        }

        if (empty($token)) {
            error_log("CAPTCHA: Missing token");
            Response::error('Security verification failed. Please try again.', 400);
            return false;
        }

        try {
            // Prepare POST data
            $postData = [
                'secret' => $secretKey,
                'response' => $token,
                'remoteip' => self::getClientIp()
            ];

            // Make request to Google
            $ch = curl_init(self::$verifyUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($postData),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_SSL_VERIFYPEER => true
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error || $httpCode !== 200) {
                error_log("CAPTCHA: cURL error - {$error}, HTTP {$httpCode}");
                // Fail open on network errors to not block legitimate users
                return true;
            }

            $result = json_decode($response, true);

            if (!$result) {
                error_log("CAPTCHA: Invalid JSON response");
                return true; // Fail open
            }

            // Log the result for debugging
            error_log("CAPTCHA result: " . json_encode($result));

            // Check if verification was successful
            if (!isset($result['success']) || $result['success'] !== true) {
                $errorCodes = $result['error-codes'] ?? ['unknown'];
                error_log("CAPTCHA: Verification failed - " . implode(', ', $errorCodes));
                Response::error('Security verification failed. Please refresh and try again.', 400);
                return false;
            }

            // Check the score (reCAPTCHA v3 specific)
            $score = $result['score'] ?? 0;
            if ($score < self::$minScore) {
                error_log("CAPTCHA: Low score ({$score}) for IP " . self::getClientIp());
                Response::error('Automated activity detected. Please try again.', 403);
                return false;
            }

            // Optionally verify the action matches
            if (!empty($expectedAction) && isset($result['action'])) {
                if ($result['action'] !== $expectedAction) {
                    error_log("CAPTCHA: Action mismatch - expected {$expectedAction}, got {$result['action']}");
                    Response::error('Security verification failed. Please try again.', 400);
                    return false;
                }
            }

            return true;

        } catch (\Exception $e) {
            error_log("CAPTCHA: Exception - " . $e->getMessage());
            // Fail open on exceptions
            return true;
        }
    }

    /**
     * Get client IP address
     */
    private static function getClientIp(): string
    {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        
        return '127.0.0.1';
    }

    /**
     * Set minimum score threshold
     */
    public static function setMinScore(float $score): void
    {
        self::$minScore = max(0.0, min(1.0, $score));
    }
}
