<?php

namespace App\Middleware;

use App\Helpers\Response;

class RateLimit
{
    private static string $cacheDir = '/tmp/rate_limit/';

    public static function check(string $key, int $maxAttempts = 5, int $decayMinutes = 1): void
    {
        $identifier = md5($key . self::getClientIp());
        $cacheFile = self::$cacheDir . $identifier;

        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0755, true);
        }

        $attempts = 0;
        $resetTime = time() + ($decayMinutes * 60);

        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true);
            
            if ($data && $data['reset_time'] > time()) {
                $attempts = $data['attempts'];
                $resetTime = $data['reset_time'];
            }
        }

        if ($attempts >= $maxAttempts) {
            $retryAfter = $resetTime - time();
            header("Retry-After: {$retryAfter}");
            Response::error("Too many requests. Please try again in {$retryAfter} seconds.", 429);
        }

        // Increment attempts
        $attempts++;
        file_put_contents($cacheFile, json_encode([
            'attempts' => $attempts,
            'reset_time' => $resetTime
        ]));
    }

    public static function reset(string $key): void
    {
        $identifier = md5($key . self::getClientIp());
        $cacheFile = self::$cacheDir . $identifier;
        
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }

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
}
