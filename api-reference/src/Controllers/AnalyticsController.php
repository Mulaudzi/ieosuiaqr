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
