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
            $stmt = $pdo->prepare("SELECT id, type, content, is_active FROM qr_codes WHERE dynamic_id = ?");
            $stmt->execute([$dynamicId]);
        } elseif ($qrId) {
            $stmt = $pdo->prepare("SELECT id, type, content, is_active FROM qr_codes WHERE id = ?");
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

        // Already-printed QR codes may still contain the former API address.
        // Move browser GET requests onto the public, branded transition page;
        // that page calls this endpoint with response=json to record the scan.
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && ($_GET['response'] ?? '') !== 'json') {
            $appUrl = rtrim((string)($_ENV['APP_URL'] ?? 'https://qr.ieosuia.com'), '/');
            header('Cache-Control: no-store, private');
            header('Location: ' . $appUrl . '/go/' . rawurlencode((string)$qr['id']), true, 302);
            exit;
        }

        // Get client info
        $ip = self::getClientIp();
        $ipHash = md5($ip . ($_ENV['JWT_SECRET'] ?? 'salt')); // Anonymize IP
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? null;

        // Parse location (requires GeoLite2-City.mmdb)
        $location = null;
        $geoDbPath = $_ENV['GEOIP_DB_PATH'] ?? __DIR__ . '/../../geoip/GeoLite2-City.mmdb';
        
        if (class_exists(Reader::class) && file_exists($geoDbPath) && $ip !== '127.0.0.1') {
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
            } catch (\Throwable $e) {
                error_log("GeoIP lookup failed: " . $e->getMessage());
            }
        }

        // Parse device info
        $device = null;
        if ($userAgent && class_exists(UserAgentParser::class)) {
            try {
                $parser = new UserAgentParser();
                $ua = $parser->parse($userAgent);
                $device = [
                    'browser' => $ua->browser() ?? 'Unknown',
                    'browser_version' => $ua->browserVersion() ?? null,
                    'platform' => $ua->platform() ?? 'Unknown',
                    'is_mobile' => self::isMobile($userAgent)
                ];
            } catch (\Throwable $e) {
                error_log("User agent parsing failed: " . $e->getMessage());
            }
        }

        // Some camera/scanner apps resolve the same QR more than once before
        // opening the destination. Count identical requests only once within a
        // short window so one physical scan produces one analytics event.
        try {
            $normalizedUserAgent = substr($userAgent, 0, 500);
            $stmt = $pdo->prepare("
                SELECT id
                FROM scan_logs
                WHERE qr_id = ?
                  AND ip_hash = ?
                  AND user_agent = ?
                  AND timestamp >= DATE_SUB(NOW(), INTERVAL 10 SECOND)
                LIMIT 1
            ");
            $stmt->execute([$qr['id'], $ipHash, $normalizedUserAgent]);

            if (!$stmt->fetch()) {
                $stmt = $pdo->prepare("
                    INSERT INTO scan_logs (qr_id, ip_hash, location, device, user_agent, referer, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $qr['id'],
                    $ipHash,
                    json_encode($location),
                    json_encode($device),
                    $normalizedUserAgent,
                    $referer
                ]);

                $stmt = $pdo->prepare("UPDATE qr_codes SET total_scans = total_scans + 1 WHERE id = ?");
                $stmt->execute([$qr['id']]);
            }

        } catch (\Throwable $e) {
            error_log("Scan logging failed: " . $e->getMessage());
        }

        // Keep any linked inventory item's activity timestamp synchronized with
        // the canonical QR scan event, regardless of the QR's destination.
        try {
            $stmt = $pdo->prepare("UPDATE inventory_items SET last_scan_date = NOW(), updated_at = NOW() WHERE qr_id = ?");
            $stmt->execute([$qr['id']]);
        } catch (\Throwable $e) {
            error_log("Inventory scan timestamp update failed: " . $e->getMessage());
        }

        // Resolve both current structured content and older/string records.
        $redirectUrl = self::resolveRedirectUrl(
            (string)($qr['type'] ?? ''),
            $qr['content'],
            $userAgent
        );

        // The public /go/:id page requests JSON in the background so visitors
        // see a friendly transition instead of an API response or API URL.
        if (($_GET['response'] ?? '') === 'json') {
            header('Cache-Control: no-store, private');
            Response::success([
                'logged' => true,
                'redirect_url' => $redirectUrl,
                'type' => (string)($qr['type'] ?? ''),
                'content' => self::decodeContent($qr['content']),
            ]);
        }

        if ($redirectUrl !== null) {
            header('Cache-Control: no-store, private');
            header("Location: {$redirectUrl}", true, 302);
            exit;
        }

        // If no redirect URL, return success
        Response::success(['logged' => true]);
    }

    /**
     * Convert stored QR content into a safe browser destination.
     *
     * Content has existed in several shapes over the lifetime of the app:
     * JSON objects, JSON-encoded strings, and nested `content` values. Keep
     * this resolver tolerant so already-printed QR codes continue to work.
     */
    public static function resolveRedirectUrl(string $type, mixed $storedContent, string $userAgent = ''): ?string
    {
        $content = self::decodeContent($storedContent);
        $type = strtolower(trim($type));

        if (is_string($content)) {
            return self::normalizeWebUrl($content);
        }

        if (!is_array($content)) {
            return null;
        }

        // A nested `content` value is used by the current basic QR forms.
        $primary = $content['url'] ?? $content['content'] ?? $content['value'] ?? null;
        if (is_string($primary)) {
            $decodedPrimary = self::decodeContent($primary);
            if (is_array($decodedPrimary)) {
                $content = array_merge($decodedPrimary, $content);
                $primary = $decodedPrimary['url'] ?? $decodedPrimary['content'] ?? $decodedPrimary['value'] ?? null;
            }
        }

        if ($type === 'email') {
            $email = trim((string)($content['email'] ?? $primary ?? ''));
            if ($email === '') { return null; }
            $query = http_build_query(array_filter([
                'subject' => $content['subject'] ?? null,
                'body' => $content['body'] ?? $content['message'] ?? null,
            ], static fn($value) => $value !== null && $value !== ''));
            return 'mailto:' . rawurlencode($email) . ($query ? '?' . $query : '');
        }

        if ($type === 'phone') {
            $phone = self::cleanPhone((string)($content['phoneNumber'] ?? $content['phone'] ?? $primary ?? ''));
            return $phone !== '' ? 'tel:' . $phone : null;
        }

        if ($type === 'sms') {
            $phone = self::cleanPhone((string)($content['phoneNumber'] ?? $content['phone'] ?? ''));
            if ($phone === '') { return null; }
            $message = trim((string)($content['message'] ?? ''));
            return 'sms:' . $phone . ($message !== '' ? '?body=' . rawurlencode($message) : '');
        }

        if ($type === 'whatsapp') {
            $phone = preg_replace('/\D+/', '', (string)($content['phoneNumber'] ?? $content['phone'] ?? ''));
            if ($phone === '') { return null; }
            $message = trim((string)($content['message'] ?? ''));
            return 'https://wa.me/' . $phone . ($message !== '' ? '?text=' . rawurlencode($message) : '');
        }

        if ($type === 'location') {
            $latitude = $content['latitude'] ?? null;
            $longitude = $content['longitude'] ?? null;
            $query = ($latitude !== null && $longitude !== null && $latitude !== '' && $longitude !== '')
                ? $latitude . ',' . $longitude
                : trim((string)($content['address'] ?? $content['locationName'] ?? $primary ?? ''));
            return $query !== ''
                ? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($query)
                : null;
        }

        if ($type === 'social') {
            // Social QR codes are link hubs. The public scan page displays all
            // profiles so the visitor can choose instead of being sent to the
            // first entry automatically.
            return null;
        }

        if ($type === 'app') {
            $isApple = preg_match('/iPhone|iPad|iPod/i', $userAgent) === 1;
            $candidate = $isApple
                ? ($content['appStoreUrl'] ?? $content['playStoreUrl'] ?? null)
                : ($content['playStoreUrl'] ?? $content['appStoreUrl'] ?? null);
            return is_string($candidate) ? self::normalizeWebUrl($candidate) : null;
        }

        foreach ([$primary, $content['website'] ?? null, $content['websiteUrl'] ?? null] as $candidate) {
            $url = is_string($candidate) ? self::normalizeWebUrl($candidate) : null;
            if ($url !== null) { return $url; }
        }

        return null;
    }

    private static function decodeContent(mixed $value): mixed
    {
        for ($depth = 0; $depth < 3 && is_string($value); $depth++) {
            $trimmed = trim($value);
            if ($trimmed === '') { return ''; }
            $decoded = json_decode($trimmed, true);
            if (json_last_error() !== JSON_ERROR_NONE) { return $trimmed; }
            $value = $decoded;
        }
        return $value;
    }

    private static function normalizeWebUrl(string $value): ?string
    {
        $value = trim(str_replace(["\r", "\n"], '', $value));
        if ($value === '') { return null; }
        if (preg_match('/^www\./i', $value)) { $value = 'https://' . $value; }
        if (!filter_var($value, FILTER_VALIDATE_URL)) { return null; }
        $scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    private static function cleanPhone(string $value): string
    {
        $value = trim($value);
        $prefix = str_starts_with($value, '+') ? '+' : '';
        return $prefix . preg_replace('/\D+/', '', $value);
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

        if (!empty($_GET['country'])) {
            $where[] = "JSON_EXTRACT(location, '$.country_code') = ?";
            $params[] = strtoupper($_GET['country']);
        }

        $whereClause = implode(' AND ', $where);

        // Get total
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM scan_logs WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        $fields = "id, ip_hash, location, device, user_agent, referer, timestamp";

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

        // Add geographic breakdown for every account.
        {
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
