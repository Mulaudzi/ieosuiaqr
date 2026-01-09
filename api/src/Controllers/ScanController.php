<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;
use GeoIp2\Database\Reader;
use donatj\UserAgent\UserAgentParser;

class ScanController
{
    public static function log(): void
    {
        $qrId = $_GET['id'] ?? null;
        $dynamicId = $_GET['dynamic'] ?? null;

        $pdo = Database::getInstance();

        // Find QR code by id or dynamic_id
        if ($dynamicId) {
            $stmt = $pdo->prepare("SELECT id, content, is_active FROM qr_codes WHERE dynamic_id = ?");
            $stmt->execute([$dynamicId]);
        } elseif ($qrId) {
            $stmt = $pdo->prepare("SELECT id, content, is_active FROM qr_codes WHERE id = ?");
            $stmt->execute([$qrId]);
        } else {
            Response::error('QR code ID required', 400);
        }

        $qr = $stmt->fetch();

        if (!$qr) {
            Response::error('QR code not found', 404);
        }

        if (!$qr['is_active']) {
            Response::error('This QR code has been deactivated', 410);
        }

        // Get client info
        $ip = self::getClientIp();
        $ipHash = md5($ip . ($_ENV['JWT_SECRET'] ?? 'salt')); // Anonymize IP
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? null;

        // Parse location (requires GeoLite2-City.mmdb)
        $location = null;
        $geoDbPath = $_ENV['GEOIP_DB_PATH'] ?? __DIR__ . '/../../geoip/GeoLite2-City.mmdb';
        
        if (file_exists($geoDbPath) && $ip !== '127.0.0.1') {
            try {
                $reader = new Reader($geoDbPath);
                $record = $reader->city($ip);
                $location = [
                    'city' => $record->city->name ?? null,
                    'country' => $record->country->name ?? null,
                    'country_code' => $record->country->isoCode ?? null,
                    'latitude' => $record->location->latitude ?? null,
                    'longitude' => $record->location->longitude ?? null
                ];
            } catch (\Exception $e) {
                error_log("GeoIP lookup failed: " . $e->getMessage());
            }
        }

        // Parse device info
        $device = null;
        if ($userAgent) {
            try {
                $parser = new UserAgentParser();
                $ua = $parser->parse($userAgent);
                $device = [
                    'browser' => $ua->browser() ?? 'Unknown',
                    'browser_version' => $ua->browserVersion() ?? null,
                    'platform' => $ua->platform() ?? 'Unknown',
                    'is_mobile' => self::isMobile($userAgent)
                ];
            } catch (\Exception $e) {
                error_log("User agent parsing failed: " . $e->getMessage());
            }
        }

        // Log scan
        try {
            $stmt = $pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, location, device, user_agent, referer, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $qr['id'],
                $ipHash,
                json_encode($location),
                json_encode($device),
                substr($userAgent, 0, 500),
                $referer
            ]);

            // Update total scans
            $stmt = $pdo->prepare("UPDATE qr_codes SET total_scans = total_scans + 1 WHERE id = ?");
            $stmt->execute([$qr['id']]);

        } catch (\Exception $e) {
            error_log("Scan logging failed: " . $e->getMessage());
        }

        // Redirect to content
        $content = json_decode($qr['content'], true);
        $redirectUrl = $content['value'] ?? $content['url'] ?? null;

        if ($redirectUrl && filter_var($redirectUrl, FILTER_VALIDATE_URL)) {
            header("Location: {$redirectUrl}", true, 302);
            exit;
        }

        // If no redirect URL, return success
        Response::success(['logged' => true]);
    }

    public static function getScans(int $qrId): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Check ownership
        $stmt = $pdo->prepare("SELECT id, user_id FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$qrId, $user['id']]);
        $qr = $stmt->fetch();

        if (!$qr) {
            Response::error('QR code not found', 404);
        }

        // Free users cannot access scan data
        if ($user['plan'] === 'Free') {
            Response::error('Scan tracking requires a Pro or Enterprise plan. Upgrade to see who scans your QR codes.', 403);
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        // Build query with filters
        $where = ["qr_id = ?"];
        $params = [$qrId];

        // Date filters
        if (!empty($_GET['from'])) {
            $where[] = "timestamp >= ?";
            $params[] = $_GET['from'];
        }
        if (!empty($_GET['to'])) {
            $where[] = "timestamp <= ?";
            $params[] = $_GET['to'];
        }

        // Device filter
        if (!empty($_GET['device'])) {
            if ($_GET['device'] === 'mobile') {
                $where[] = "JSON_EXTRACT(device, '$.is_mobile') = true";
            } else {
                $where[] = "JSON_EXTRACT(device, '$.is_mobile') = false";
            }
        }

        // Country filter (Enterprise only)
        if (!empty($_GET['country']) && $user['plan'] === 'Enterprise') {
            $where[] = "JSON_EXTRACT(location, '$.country_code') = ?";
            $params[] = strtoupper($_GET['country']);
        }

        $whereClause = implode(' AND ', $where);

        // Get total
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM scan_logs WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        // Select fields based on plan
        if ($user['plan'] === 'Enterprise') {
            $fields = "id, ip_hash, location, device, user_agent, referer, timestamp";
        } else {
            // Pro: Limited data
            $fields = "id, device, timestamp";
        }

        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT {$fields}
            FROM scan_logs 
            WHERE {$whereClause}
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $scans = $stmt->fetchAll();

        // Parse JSON fields
        foreach ($scans as &$scan) {
            if (isset($scan['location'])) {
                $scan['location'] = json_decode($scan['location'], true);
            }
            if (isset($scan['device'])) {
                $scan['device'] = json_decode($scan['device'], true);
            }
        }

        Response::paginated($scans, $total, $page, $limit);
    }

    public static function getStats(int $qrId): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Check ownership
        $stmt = $pdo->prepare("SELECT id FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$qrId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::error('QR code not found', 404);
        }

        if ($user['plan'] === 'Free') {
            Response::error('Analytics requires a Pro or Enterprise plan.', 403);
        }

        // Total scans
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM scan_logs WHERE qr_id = ?");
        $stmt->execute([$qrId]);
        $total = (int)$stmt->fetch()['total'];

        // Scans by day (last 30 days)
        $stmt = $pdo->prepare("
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM scan_logs 
            WHERE qr_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(timestamp)
            ORDER BY date
        ");
        $stmt->execute([$qrId]);
        $byDate = $stmt->fetchAll();

        // Device breakdown
        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN JSON_EXTRACT(device, '$.is_mobile') = true THEN 1 ELSE 0 END) as mobile,
                SUM(CASE WHEN JSON_EXTRACT(device, '$.is_mobile') = false THEN 1 ELSE 0 END) as desktop
            FROM scan_logs 
            WHERE qr_id = ?
        ");
        $stmt->execute([$qrId]);
        $devices = $stmt->fetch();

        $response = [
            'total_scans' => $total,
            'scans_by_date' => $byDate,
            'devices' => [
                'mobile' => (int)($devices['mobile'] ?? 0),
                'desktop' => (int)($devices['desktop'] ?? 0)
            ]
        ];

        // Enterprise: Add geo breakdown
        if ($user['plan'] === 'Enterprise') {
            $stmt = $pdo->prepare("
                SELECT 
                    JSON_UNQUOTE(JSON_EXTRACT(location, '$.country')) as country,
                    COUNT(*) as count
                FROM scan_logs 
                WHERE qr_id = ? AND location IS NOT NULL
                GROUP BY JSON_EXTRACT(location, '$.country')
                ORDER BY count DESC
                LIMIT 10
            ");
            $stmt->execute([$qrId]);
            $response['countries'] = $stmt->fetchAll();

            // Top cities
            $stmt = $pdo->prepare("
                SELECT 
                    JSON_UNQUOTE(JSON_EXTRACT(location, '$.city')) as city,
                    JSON_UNQUOTE(JSON_EXTRACT(location, '$.country')) as country,
                    COUNT(*) as count
                FROM scan_logs 
                WHERE qr_id = ? AND location IS NOT NULL
                GROUP BY JSON_EXTRACT(location, '$.city'), JSON_EXTRACT(location, '$.country')
                ORDER BY count DESC
                LIMIT 10
            ");
            $stmt->execute([$qrId]);
            $response['cities'] = $stmt->fetchAll();
        }

        Response::success($response);
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

    private static function isMobile(string $userAgent): bool
    {
        $mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'webOS', 'BlackBerry', 'Opera Mini', 'IEMobile'];
        
        foreach ($mobileKeywords as $keyword) {
            if (stripos($userAgent, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
}
