<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;

class AnalyticsController
{
    public static function getDashboard(): void
    {
        $user = Auth::check();

        if ($user['plan'] === 'Free') {
            Response::error('Analytics requires a Pro or Enterprise plan. Upgrade to track your QR code performance.', 403);
        }

        $pdo = Database::getInstance();
        $period = $_GET['period'] ?? '30d';
        $interval = self::getInterval($period);

        // Total QR codes
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM qr_codes WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $totalQrCodes = (int)$stmt->fetch()['total'];

        // Total scans
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $totalScans = (int)$stmt->fetch()['total'];

        // Scans in period
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
        ");
        $stmt->execute([$user['id']]);
        $periodScans = (int)$stmt->fetch()['total'];

        // Scans by date
        $stmt = $pdo->prepare("
            SELECT DATE(sl.timestamp) as date, COUNT(*) as count
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
            GROUP BY DATE(sl.timestamp)
            ORDER BY date
        ");
        $stmt->execute([$user['id']]);
        $scansByDate = $stmt->fetchAll();

        // Device breakdown
        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = true THEN 1 ELSE 0 END) as mobile,
                SUM(CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = false THEN 1 ELSE 0 END) as desktop
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $devices = $stmt->fetch();

        // Top QR codes
        $stmt = $pdo->prepare("
            SELECT qr.id, qr.name, qr.type, qr.total_scans
            FROM qr_codes qr
            WHERE qr.user_id = ?
            ORDER BY qr.total_scans DESC
            LIMIT 5
        ");
        $stmt->execute([$user['id']]);
        $topQrCodes = $stmt->fetchAll();

        $response = [
            'total_qr_codes' => $totalQrCodes,
            'total_scans' => $totalScans,
            'period_scans' => $periodScans,
            'scans_by_date' => $scansByDate,
            'devices' => [
                'mobile' => (int)($devices['mobile'] ?? 0),
                'desktop' => (int)($devices['desktop'] ?? 0)
            ],
            'top_qr_codes' => $topQrCodes
        ];

        // Enterprise: Add geo data
        if ($user['plan'] === 'Enterprise') {
            // Countries
            $stmt = $pdo->prepare("
                SELECT 
                    JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.country')) as country,
                    JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.country_code')) as country_code,
                    COUNT(*) as count
                FROM scan_logs sl
                JOIN qr_codes qr ON sl.qr_id = qr.id
                WHERE qr.user_id = ? AND sl.location IS NOT NULL
                GROUP BY JSON_EXTRACT(sl.location, '$.country'), JSON_EXTRACT(sl.location, '$.country_code')
                ORDER BY count DESC
                LIMIT 10
            ");
            $stmt->execute([$user['id']]);
            $response['countries'] = $stmt->fetchAll();

            // Heatmap data (lat/long points)
            $stmt = $pdo->prepare("
                SELECT 
                    JSON_EXTRACT(sl.location, '$.latitude') as lat,
                    JSON_EXTRACT(sl.location, '$.longitude') as lng,
                    COUNT(*) as intensity
                FROM scan_logs sl
                JOIN qr_codes qr ON sl.qr_id = qr.id
                WHERE qr.user_id = ? 
                    AND sl.location IS NOT NULL
                    AND JSON_EXTRACT(sl.location, '$.latitude') IS NOT NULL
                GROUP BY JSON_EXTRACT(sl.location, '$.latitude'), JSON_EXTRACT(sl.location, '$.longitude')
                LIMIT 100
            ");
            $stmt->execute([$user['id']]);
            $response['heatmap'] = $stmt->fetchAll();

            // Browser breakdown
            $stmt = $pdo->prepare("
                SELECT 
                    JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.browser')) as browser,
                    COUNT(*) as count
                FROM scan_logs sl
                JOIN qr_codes qr ON sl.qr_id = qr.id
                WHERE qr.user_id = ? AND sl.device IS NOT NULL
                GROUP BY JSON_EXTRACT(sl.device, '$.browser')
                ORDER BY count DESC
                LIMIT 5
            ");
            $stmt->execute([$user['id']]);
            $response['browsers'] = $stmt->fetchAll();
        }

        Response::success($response);
    }

    public static function exportCsv(): void
    {
        $user = Auth::check();
        Auth::requirePlan(['Pro', 'Enterprise']);

        $pdo = Database::getInstance();
        $period = $_GET['period'] ?? '30d';
        $interval = self::getInterval($period);

        $stmt = $pdo->prepare("
            SELECT 
                qr.name as qr_name,
                qr.type as qr_type,
                sl.timestamp,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.browser')) as browser,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.platform')) as platform,
                CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = true THEN 'Mobile' ELSE 'Desktop' END as device_type,
                JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.country')) as country,
                JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.city')) as city
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
            ORDER BY sl.timestamp DESC
        ");
        $stmt->execute([$user['id']]);
        $scans = $stmt->fetchAll();

        // Generate CSV
        $csv = "QR Name,QR Type,Timestamp,Browser,Platform,Device Type,Country,City\n";
        
        foreach ($scans as $scan) {
            $csv .= implode(',', [
                '"' . str_replace('"', '""', $scan['qr_name'] ?? '') . '"',
                $scan['qr_type'],
                $scan['timestamp'],
                $scan['browser'] ?? '',
                $scan['platform'] ?? '',
                $scan['device_type'],
                $scan['country'] ?? '',
                $scan['city'] ?? ''
            ]) . "\n";
        }

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="analytics-export-' . date('Y-m-d') . '.csv"');
        echo $csv;
        exit;
    }

    /**
     * Get analytics summary
     */
    public static function getSummary(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        // Total scans
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $totalScans = (int)$stmt->fetch()['total'];
        
        // Previous period for comparison
        $daysDiff = (strtotime($endDate) - strtotime($startDate)) / 86400;
        $prevStart = date('Y-m-d', strtotime("-$daysDiff days", strtotime($startDate)));
        $prevEnd = date('Y-m-d', strtotime('-1 day', strtotime($startDate)));
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
        ");
        $stmt->execute([$user['id'], $prevStart, $prevEnd]);
        $prevScans = (int)$stmt->fetch()['total'];
        
        $changePercent = $prevScans > 0 ? round((($totalScans - $prevScans) / $prevScans) * 100, 1) : 0;
        
        // Unique scans (by IP hash)
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT sl.ip_hash) as total 
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $uniqueScans = (int)$stmt->fetch()['total'];
        
        // Top device
        $stmt = $pdo->prepare("
            SELECT 
                CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = true THEN 'Mobile' ELSE 'Desktop' END as device_type,
                COUNT(*) as count
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
            GROUP BY device_type
            ORDER BY count DESC
            LIMIT 1
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $topDeviceRow = $stmt->fetch();
        $topDevice = $topDeviceRow['device_type'] ?? 'N/A';
        
        Response::success([
            'total_scans' => $totalScans,
            'unique_scans' => $uniqueScans,
            'scan_change_percent' => $changePercent,
            'top_device' => $topDevice,
        ]);
    }

    /**
     * Get top performing QR codes
     */
    public static function getTopQRCodes(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        $limit = min(10, max(1, (int)($_GET['limit'] ?? 5)));
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                qr.id as qr_id,
                qr.name as qr_name,
                qr.type as qr_type,
                COUNT(sl.id) as scan_count
            FROM qr_codes qr
            LEFT JOIN scan_logs sl ON qr.id = sl.qr_id AND DATE(sl.timestamp) BETWEEN ? AND ?
            WHERE qr.user_id = ?
            GROUP BY qr.id
            ORDER BY scan_count DESC
            LIMIT ?
        ");
        $stmt->execute([$startDate, $endDate, $user['id'], $limit]);
        $topQRs = $stmt->fetchAll();
        
        // Add change percent (simplified - just use 0 for now)
        foreach ($topQRs as &$qr) {
            $qr['change_percent'] = 0;
        }
        
        Response::success($topQRs);
    }

    /**
     * Get device breakdown
     */
    public static function getDeviceBreakdown(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = true THEN 'Mobile' ELSE 'Desktop' END as device_type,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.browser')) as browser,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.platform')) as os,
                COUNT(*) as count
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
            GROUP BY device_type, browser, os
            ORDER BY count DESC
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $devices = $stmt->fetchAll();
        
        // Calculate percentages
        $total = array_sum(array_column($devices, 'count'));
        foreach ($devices as &$device) {
            $device['percentage'] = $total > 0 ? round(($device['count'] / $total) * 100, 1) : 0;
        }
        
        Response::success($devices);
    }

    /**
     * Get daily scan trend
     */
    public static function getDailyTrend(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT DATE(sl.timestamp) as date, COUNT(*) as count
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
            GROUP BY DATE(sl.timestamp)
            ORDER BY date
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $trend = $stmt->fetchAll();
        
        Response::success($trend);
    }

    /**
     * Get hourly scan distribution
     */
    public static function getHourlyDistribution(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT HOUR(sl.timestamp) as hour, COUNT(*) as count
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
            GROUP BY HOUR(sl.timestamp)
            ORDER BY hour
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $hourly = $stmt->fetchAll();
        
        Response::success($hourly);
    }

    /**
     * Export analytics report (POST for more options)
     */
    public static function exportReport(): void
    {
        $user = Auth::check();
        Auth::requirePlan(['Pro', 'Enterprise']);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $format = $data['format'] ?? 'csv';
        $type = $data['type'] ?? 'analytics';
        $startDate = $data['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $data['end_date'] ?? date('Y-m-d');
        
        $pdo = Database::getInstance();
        
        // Generate filename
        $filename = "ieosuia-{$type}-{$startDate}-to-{$endDate}.{$format}";
        $exportPath = $_ENV['EXPORT_PATH'] ?? '/tmp';
        $filePath = $exportPath . '/' . $filename;
        
        // Get scan data
        $stmt = $pdo->prepare("
            SELECT 
                qr.name as qr_name,
                qr.type as qr_type,
                sl.timestamp,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.browser')) as browser,
                JSON_UNQUOTE(JSON_EXTRACT(sl.device, '$.platform')) as platform,
                CASE WHEN JSON_EXTRACT(sl.device, '$.is_mobile') = true THEN 'Mobile' ELSE 'Desktop' END as device_type,
                JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.country')) as country,
                JSON_UNQUOTE(JSON_EXTRACT(sl.location, '$.city')) as city
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            WHERE qr.user_id = ? AND DATE(sl.timestamp) BETWEEN ? AND ?
            ORDER BY sl.timestamp DESC
        ");
        $stmt->execute([$user['id'], $startDate, $endDate]);
        $scans = $stmt->fetchAll();
        
        if ($format === 'csv') {
            $csv = "QR Name,QR Type,Timestamp,Browser,Platform,Device Type,Country,City\n";
            foreach ($scans as $scan) {
                $csv .= implode(',', [
                    '"' . str_replace('"', '""', $scan['qr_name'] ?? '') . '"',
                    $scan['qr_type'] ?? '',
                    $scan['timestamp'] ?? '',
                    $scan['browser'] ?? '',
                    $scan['platform'] ?? '',
                    $scan['device_type'] ?? '',
                    $scan['country'] ?? '',
                    $scan['city'] ?? ''
                ]) . "\n";
            }
            file_put_contents($filePath, $csv);
        } else {
            // JSON format
            file_put_contents($filePath, json_encode($scans, JSON_PRETTY_PRINT));
        }
        
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        
        Response::success([
            'download_url' => $appUrl . '/api/exports/' . $filename,
            'filename' => $filename,
            'records' => count($scans),
        ]);
    }

    private static function getInterval(string $period): string
    {
        return match($period) {
            '7d' => '7 DAY',
            '30d' => '30 DAY',
            '90d' => '90 DAY',
            '1y' => '1 YEAR',
            default => '30 DAY'
        };
    }
}
