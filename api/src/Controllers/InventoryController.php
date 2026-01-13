<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Services\MailService;

class InventoryController
{
    // Plan limits
    private static $planLimits = [
        'Free' => ['max_items' => 3, 'can_edit' => false],
        'Pro' => ['max_items' => 100, 'can_edit' => true],
        'Enterprise' => ['max_items' => PHP_INT_MAX, 'can_edit' => true],
    ];

    /**
     * Get inventory analytics dashboard data
     */
    public static function getAnalytics(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        $period = $_GET['period'] ?? '30d';
        
        $interval = match($period) {
            '7d' => '7 DAY',
            '30d' => '30 DAY',
            '90d' => '90 DAY',
            default => '30 DAY'
        };

        // Total items and counts by status
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
                SUM(CASE WHEN status = 'out' THEN 1 ELSE 0 END) as out,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out
            FROM inventory_items 
            WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $statusCounts = $stmt->fetch();

        // Items by category
        $stmt = $pdo->prepare("
            SELECT category, COUNT(*) as count
            FROM inventory_items 
            WHERE user_id = ?
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
        ");
        $stmt->execute([$user['id']]);
        $byCategory = $stmt->fetchAll();

        // Scan frequency (scans per day for linked QR codes)
        $stmt = $pdo->prepare("
            SELECT DATE(sl.timestamp) as date, COUNT(*) as scans
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            JOIN inventory_items i ON i.qr_id = qr.id
            WHERE i.user_id = ? AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
            GROUP BY DATE(sl.timestamp)
            ORDER BY date
        ");
        $stmt->execute([$user['id']]);
        $scansByDate = $stmt->fetchAll();

        // Total scans in period
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM scan_logs sl
            JOIN qr_codes qr ON sl.qr_id = qr.id
            JOIN inventory_items i ON i.qr_id = qr.id
            WHERE i.user_id = ? AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
        ");
        $stmt->execute([$user['id']]);
        $totalScans = (int)$stmt->fetch()['total'];

        // Status changes over time (movement trends)
        $stmt = $pdo->prepare("
            SELECT DATE(changed_at) as date, 
                   new_status,
                   COUNT(*) as changes
            FROM inventory_status_history h
            JOIN inventory_items i ON h.item_id = i.id
            WHERE i.user_id = ? AND h.changed_at >= DATE_SUB(NOW(), INTERVAL {$interval})
            GROUP BY DATE(changed_at), new_status
            ORDER BY date
        ");
        $stmt->execute([$user['id']]);
        $statusChanges = $stmt->fetchAll();

        // Most active items (by scan count)
        $stmt = $pdo->prepare("
            SELECT i.id, i.name, i.category, i.status, 
                   COUNT(sl.id) as scan_count,
                   MAX(sl.timestamp) as last_scan
            FROM inventory_items i
            LEFT JOIN qr_codes qr ON i.qr_id = qr.id
            LEFT JOIN scan_logs sl ON sl.qr_id = qr.id AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
            WHERE i.user_id = ?
            GROUP BY i.id, i.name, i.category, i.status
            ORDER BY scan_count DESC
            LIMIT 10
        ");
        $stmt->execute([$user['id']]);
        $topItems = $stmt->fetchAll();

        // Recent status changes
        $stmt = $pdo->prepare("
            SELECT h.id, i.name as item_name, h.old_status, h.new_status, 
                   h.new_location, h.changed_by_name, h.changed_at
            FROM inventory_status_history h
            JOIN inventory_items i ON h.item_id = i.id
            WHERE i.user_id = ?
            ORDER BY h.changed_at DESC
            LIMIT 10
        ");
        $stmt->execute([$user['id']]);
        $recentChanges = $stmt->fetchAll();

        // Items with QR vs without
        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN qr_id IS NOT NULL THEN 1 ELSE 0 END) as with_qr,
                SUM(CASE WHEN qr_id IS NULL THEN 1 ELSE 0 END) as without_qr
            FROM inventory_items 
            WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $qrCoverage = $stmt->fetch();

        Response::success([
            'summary' => [
                'total_items' => (int)($statusCounts['total'] ?? 0),
                'total_scans' => $totalScans,
                'items_with_qr' => (int)($qrCoverage['with_qr'] ?? 0),
                'items_without_qr' => (int)($qrCoverage['without_qr'] ?? 0),
            ],
            'status_distribution' => [
                ['status' => 'in_stock', 'count' => (int)($statusCounts['in_stock'] ?? 0), 'label' => 'In Stock'],
                ['status' => 'out', 'count' => (int)($statusCounts['out'] ?? 0), 'label' => 'Out'],
                ['status' => 'maintenance', 'count' => (int)($statusCounts['maintenance'] ?? 0), 'label' => 'Maintenance'],
                ['status' => 'checked_out', 'count' => (int)($statusCounts['checked_out'] ?? 0), 'label' => 'Checked Out'],
            ],
            'by_category' => $byCategory,
            'scan_trend' => $scansByDate,
            'status_changes' => $statusChanges,
            'top_items' => $topItems,
            'recent_changes' => $recentChanges,
        ]);
    }

    /**
     * Export inventory analytics as CSV
     */
    public static function exportAnalyticsCsv(): void
    {
        $user = Auth::check();
        Auth::requirePlan(['Pro', 'Enterprise']);
        
        $pdo = Database::getInstance();
        $period = $_GET['period'] ?? '30d';
        
        $interval = match($period) {
            '7d' => '7 DAY',
            '30d' => '30 DAY',
            '90d' => '90 DAY',
            default => '30 DAY'
        };

        // Get all items with scan data
        $stmt = $pdo->prepare("
            SELECT 
                i.name, i.category, i.status, i.location,
                i.created_at, i.last_scan_date,
                COUNT(sl.id) as scan_count
            FROM inventory_items i
            LEFT JOIN qr_codes qr ON i.qr_id = qr.id
            LEFT JOIN scan_logs sl ON sl.qr_id = qr.id AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
            WHERE i.user_id = ?
            GROUP BY i.id, i.name, i.category, i.status, i.location, i.created_at, i.last_scan_date
            ORDER BY scan_count DESC
        ");
        $stmt->execute([$user['id']]);
        $items = $stmt->fetchAll();

        // Generate CSV
        $csv = "Name,Category,Status,Location,Created,Last Scan,Scans ({$period})\n";
        
        foreach ($items as $item) {
            $csv .= implode(',', [
                '"' . str_replace('"', '""', $item['name'] ?? '') . '"',
                '"' . str_replace('"', '""', $item['category'] ?? '') . '"',
                $item['status'],
                '"' . str_replace('"', '""', $item['location'] ?? '') . '"',
                $item['created_at'] ?? '',
                $item['last_scan_date'] ?? 'Never',
                (int)$item['scan_count']
            ]) . "\n";
        }

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="inventory-report-' . date('Y-m-d') . '.csv"');
        echo $csv;
        exit;
    }

    /**
     * Get alerts for current user
     */
    public static function getAlerts(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Get unread alerts
        $stmt = $pdo->prepare("
            SELECT a.*, i.name as item_name
            FROM inventory_alerts a
            LEFT JOIN inventory_items i ON a.item_id = i.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user['id']]);
        $alerts = $stmt->fetchAll();

        // Count unread
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inventory_alerts WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$user['id']]);
        $unreadCount = (int)$stmt->fetch()['count'];

        Response::success([
            'alerts' => $alerts,
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Mark alerts as read
     */
    public static function markAlertsRead(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo = Database::getInstance();

        if (!empty($data['alert_ids'])) {
            $placeholders = implode(',', array_fill(0, count($data['alert_ids']), '?'));
            $params = array_merge($data['alert_ids'], [$user['id']]);
            $stmt = $pdo->prepare("UPDATE inventory_alerts SET is_read = 1 WHERE id IN ({$placeholders}) AND user_id = ?");
            $stmt->execute($params);
        } else {
            // Mark all as read
            $stmt = $pdo->prepare("UPDATE inventory_alerts SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$user['id']]);
        }

        Response::success(null, 'Alerts marked as read');
    }

    /**
     * Create maintenance reminder
     */
    public static function setMaintenanceReminder(): void
    {
        $user = Auth::check();
        Auth::requirePlan(['Pro', 'Enterprise']);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo = Database::getInstance();

        if (empty($data['item_id']) || empty($data['due_date'])) {
            Response::error('Item ID and due date are required', 400);
        }

        // Verify ownership
        $stmt = $pdo->prepare("SELECT id, name FROM inventory_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$data['item_id'], $user['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Item not found', 404);
        }

        // Update item maintenance date
        $stmt = $pdo->prepare("UPDATE inventory_items SET maintenance_due_date = ? WHERE id = ?");
        $stmt->execute([$data['due_date'], $data['item_id']]);

        // Create alert
        $stmt = $pdo->prepare("
            INSERT INTO inventory_alerts (user_id, item_id, alert_type, title, message, priority, due_date, created_at)
            VALUES (?, ?, 'maintenance_due', ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $user['id'],
            $data['item_id'],
            "Maintenance due: {$item['name']}",
            $data['message'] ?? "Scheduled maintenance for {$item['name']}",
            $data['priority'] ?? 'medium',
            $data['due_date']
        ]);

        Response::success(null, 'Maintenance reminder set');
    }

    /**
     * Check and create low-activity alerts (called by cron or manually)
     */
    public static function checkLowActivityAlerts(): void
    {
        $user = Auth::check();
        Auth::requirePlan(['Pro', 'Enterprise']);
        
        $pdo = Database::getInstance();

        // Find items with no scans in alert_low_activity_days
        $stmt = $pdo->prepare("
            SELECT i.id, i.name, i.alert_low_activity_days,
                   DATEDIFF(NOW(), COALESCE(i.last_scan_date, i.created_at)) as days_inactive
            FROM inventory_items i
            WHERE i.user_id = ? 
              AND i.qr_id IS NOT NULL
              AND DATEDIFF(NOW(), COALESCE(i.last_scan_date, i.created_at)) >= i.alert_low_activity_days
              AND i.id NOT IN (
                  SELECT item_id FROM inventory_alerts 
                  WHERE alert_type = 'low_activity' 
                    AND user_id = ? 
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    AND item_id IS NOT NULL
              )
        ");
        $stmt->execute([$user['id'], $user['id']]);
        $inactiveItems = $stmt->fetchAll();

        $alertsCreated = 0;
        foreach ($inactiveItems as $item) {
            $stmt = $pdo->prepare("
                INSERT INTO inventory_alerts (user_id, item_id, alert_type, title, message, priority, created_at)
                VALUES (?, ?, 'low_activity', ?, ?, 'low', NOW())
            ");
            $stmt->execute([
                $user['id'],
                $item['id'],
                "Low activity: {$item['name']}",
                "No scans for {$item['days_inactive']} days"
            ]);
            $alertsCreated++;
        }

        // Check maintenance due items
        $stmt = $pdo->prepare("
            SELECT i.id, i.name, i.maintenance_due_date
            FROM inventory_items i
            WHERE i.user_id = ? 
              AND i.maintenance_due_date IS NOT NULL
              AND i.maintenance_due_date <= DATE_ADD(NOW(), INTERVAL 3 DAY)
              AND i.id NOT IN (
                  SELECT item_id FROM inventory_alerts 
                  WHERE alert_type = 'maintenance_due' 
                    AND user_id = ? 
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                    AND item_id IS NOT NULL
              )
        ");
        $stmt->execute([$user['id'], $user['id']]);
        $maintenanceItems = $stmt->fetchAll();

        foreach ($maintenanceItems as $item) {
            $daysUntil = (strtotime($item['maintenance_due_date']) - time()) / 86400;
            $priority = $daysUntil <= 0 ? 'high' : ($daysUntil <= 1 ? 'medium' : 'low');
            
            $stmt = $pdo->prepare("
                INSERT INTO inventory_alerts (user_id, item_id, alert_type, title, message, priority, due_date, created_at)
                VALUES (?, ?, 'maintenance_due', ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $user['id'],
                $item['id'],
                "Maintenance " . ($daysUntil <= 0 ? 'overdue' : 'due soon') . ": {$item['name']}",
                $daysUntil <= 0 ? "Maintenance is overdue!" : "Maintenance due in " . ceil($daysUntil) . " day(s)",
                $priority,
                $item['maintenance_due_date']
            ]);
            $alertsCreated++;
        }

        // Send email notifications for high priority alerts
        $stmt = $pdo->prepare("
            SELECT a.*, i.name as item_name, u.email, u.name as user_name,
                   u.notify_low_activity, u.notify_maintenance
            FROM inventory_alerts a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN inventory_items i ON a.item_id = i.id
            WHERE a.user_id = ? AND a.is_emailed = 0 AND a.priority IN ('high', 'medium')
        ");
        $stmt->execute([$user['id']]);
        $pendingAlerts = $stmt->fetchAll();

        foreach ($pendingAlerts as $alert) {
            $shouldEmail = false;
            if ($alert['alert_type'] === 'low_activity' && $alert['notify_low_activity']) {
                $shouldEmail = true;
            }
            if ($alert['alert_type'] === 'maintenance_due' && $alert['notify_maintenance']) {
                $shouldEmail = true;
            }

            if ($shouldEmail) {
                try {
                    MailService::sendAlertEmail(
                        $alert['email'],
                        $alert['user_name'],
                        $alert['title'],
                        $alert['message'],
                        $alert['priority']
                    );
                    
                    $stmt = $pdo->prepare("UPDATE inventory_alerts SET is_emailed = 1 WHERE id = ?");
                    $stmt->execute([$alert['id']]);
                } catch (\Exception $e) {
                    error_log("Failed to send alert email: " . $e->getMessage());
                }
            }
        }

        Response::success([
            'alerts_created' => $alertsCreated,
            'emails_sent' => count($pendingAlerts)
        ]);
    }

    public static function list(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = ["i.user_id = ?"];
        $params = [$user['id']];

        // Search
        if (!empty($_GET['search'])) {
            $where[] = "(i.name LIKE ? OR i.category LIKE ?)";
            $searchTerm = '%' . $_GET['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        // Category filter
        if (!empty($_GET['category'])) {
            $where[] = "i.category = ?";
            $params[] = $_GET['category'];
        }

        // Status filter
        if (!empty($_GET['status'])) {
            $where[] = "i.status = ?";
            $params[] = $_GET['status'];
        }

        $whereClause = implode(' AND ', $where);

        // Get total (use table alias for consistency)
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM inventory_items i WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        // Get items with QR preview
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT i.*, q.content as qr_content
            FROM inventory_items i
            LEFT JOIN qr_codes q ON i.qr_id = q.id
            WHERE {$whereClause}
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        Response::paginated($items, $total, $page, $limit);
    }

    public static function show(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("
            SELECT i.*, q.content as qr_content
            FROM inventory_items i
            LEFT JOIN qr_codes q ON i.qr_id = q.id
            WHERE i.id = ? AND i.user_id = ?
        ");
        $stmt->execute([$id, $user['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Item not found', 404);
        }

        Response::success($item);
    }

    public static function create(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Validate input
        $validator = new Validator($data);
        $validator
            ->required('name', 'Item name is required')
            ->maxLength('name', 255, 'Name must not exceed 255 characters')
            ->validate();

        $pdo = Database::getInstance();

        // Check plan limits
        $limits = self::$planLimits[$user['plan']] ?? self::$planLimits['Free'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $currentCount = (int)$stmt->fetch()['count'];

        if ($currentCount >= $limits['max_items']) {
            Response::error('You have reached your inventory limit. Upgrade your plan to add more items.', 403);
        }

        // Validate QR ownership if provided
        $qrId = null;
        if (!empty($data['qr_id'])) {
            $stmt = $pdo->prepare("SELECT id FROM qr_codes WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['qr_id'], $user['id']]);
            if (!$stmt->fetch()) {
                Response::error('QR code not found or not owned by you', 400);
            }
            $qrId = $data['qr_id'];
        }

        // Insert item
        $stmt = $pdo->prepare("
            INSERT INTO inventory_items (user_id, qr_id, name, category, notes, status, location, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $user['id'],
            $qrId,
            trim($data['name']),
            $data['category'] ?? 'Other',
            $data['notes'] ?? null,
            $data['status'] ?? 'in_stock',
            $data['location'] ?? null,
        ]);

        $itemId = (int)$pdo->lastInsertId();

        // Fetch and return the created item
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();

        Response::success($item, 'Inventory item created successfully', 201);
    }

    public static function update(int $id): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Check edit permission
        $limits = self::$planLimits[$user['plan']] ?? self::$planLimits['Free'];
        if (!$limits['can_edit']) {
            Response::error('Upgrade to Pro to edit inventory items.', 403);
        }

        $pdo = Database::getInstance();

        // Check ownership
        $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        if (!$stmt->fetch()) {
            Response::error('Item not found', 404);
        }

        $updates = [];
        $params = [];

        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = trim($data['name']);
        }
        if (isset($data['category'])) {
            $updates[] = "category = ?";
            $params[] = $data['category'];
        }
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
        }
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        if (isset($data['location'])) {
            $updates[] = "location = ?";
            $params[] = $data['location'];
        }

        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $id;
        $sql = "UPDATE inventory_items SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated item
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        Response::success($item, 'Item updated successfully');
    }

    public static function delete(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("DELETE FROM inventory_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            Response::error('Item not found', 404);
        }

        Response::success(null, 'Item deleted successfully');
    }

    public static function logScan(): void
    {
        // Public endpoint - update item on scan
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['qr_id'])) {
            Response::error('QR ID is required', 400);
        }

        $pdo = Database::getInstance();

        // Find item linked to this QR
        $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE qr_id = ?");
        $stmt->execute([$data['qr_id']]);
        $item = $stmt->fetch();

        if ($item) {
            // Update last scan date and optionally location
            $updates = ["last_scan_date = NOW()"];
            $params = [];

            if (!empty($data['location'])) {
                $updates[] = "location = ?";
                $params[] = $data['location'];
            }

            $params[] = $item['id'];
            $stmt = $pdo->prepare("UPDATE inventory_items SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            // Fetch updated item
            $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
            $stmt->execute([$item['id']]);
            $updatedItem = $stmt->fetch();

            Response::success(['item' => $updatedItem], 'Scan logged');
        } else {
            Response::success(['item' => null], 'No inventory item linked to this QR');
        }
    }

    public static function getLimits(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $limits = self::$planLimits[$user['plan']] ?? self::$planLimits['Free'];

        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $currentCount = (int)$stmt->fetch()['count'];

        Response::success([
            'max_items' => $limits['max_items'],
            'current_count' => $currentCount,
            'can_edit' => $limits['can_edit'],
        ]);
    }

    /**
     * Public endpoint: Get inventory item by QR code ID
     * Also logs the scan
     */
    public static function getByQrCode(int $qrId): void
    {
        $pdo = Database::getInstance();
        $location = $_GET['location'] ?? null;

        // Find item linked to this QR
        $stmt = $pdo->prepare("
            SELECT i.*, q.content as qr_content, u.id as owner_id
            FROM inventory_items i
            LEFT JOIN qr_codes q ON i.qr_id = q.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.qr_id = ?
        ");
        $stmt->execute([$qrId]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::success(['item' => null, 'is_owner' => false]);
            return;
        }

        // Update last scan date
        $updates = ["last_scan_date = NOW()"];
        $params = [];

        if ($location) {
            $updates[] = "location = ?";
            $params[] = $location;
        }

        $params[] = $item['id'];
        $stmt = $pdo->prepare("UPDATE inventory_items SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        // Check if current user is owner
        $isOwner = false;
        try {
            $user = Auth::getUser();
            if ($user && $user['id'] == $item['owner_id']) {
                $isOwner = true;
            }
            // Check shared access for Enterprise
            if ($user && !empty($item['shared_access'])) {
                $sharedAccess = json_decode($item['shared_access'], true) ?? [];
                if (in_array($user['id'], $sharedAccess)) {
                    $isOwner = true;
                }
            }
        } catch (\Exception $e) {
            // Not logged in - that's fine
        }

        // Remove owner_id from response
        unset($item['owner_id']);

        // Refresh item data
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $updatedItem = $stmt->fetch();

        Response::success(['item' => $updatedItem, 'is_owner' => $isOwner]);
    }

    /**
     * Public endpoint: Update item status (owner or shared access only)
     */
    public static function updateStatusByQrCode(int $qrId): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo = Database::getInstance();

        // Find item with owner info
        $stmt = $pdo->prepare("
            SELECT i.*, i.user_id as owner_id, u.email as owner_email, u.name as owner_name, 
                   COALESCE(u.notify_status_change, 1) as notify_status_change
            FROM inventory_items i
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.qr_id = ?
        ");
        $stmt->execute([$qrId]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Item not found', 404);
        }

        // Check authorization
        $user = Auth::check(); // Requires auth
        $limits = self::$planLimits[$user['plan']] ?? self::$planLimits['Free'];
        
        if (!$limits['can_edit']) {
            Response::error('Upgrade to Pro to update item status.', 403);
        }

        $canUpdate = false;
        if ($user['id'] == $item['owner_id']) {
            $canUpdate = true;
        }
        // Check shared access for Enterprise
        if (!empty($item['shared_access'])) {
            $sharedAccess = json_decode($item['shared_access'], true) ?? [];
            if (in_array($user['id'], $sharedAccess)) {
                $canUpdate = true;
            }
        }

        if (!$canUpdate) {
            Response::error('You do not have permission to update this item', 403);
        }

        // Validate status
        $allowedStatuses = ['in_stock', 'out', 'maintenance', 'checked_out'];
        if (!empty($data['status']) && !in_array($data['status'], $allowedStatuses)) {
            Response::error('Invalid status', 400);
        }

        // Store old values for history
        $oldStatus = $item['status'];
        $oldLocation = $item['location'];
        $newStatus = $data['status'] ?? $oldStatus;
        $newLocation = $data['location'] ?? $oldLocation;

        // Update item
        $updates = ["updated_at = NOW()"];
        $params = [];

        if (!empty($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        if (isset($data['location'])) {
            $updates[] = "location = ?";
            $params[] = $data['location'];
        }

        if (count($updates) === 1) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $item['id'];
        $stmt = $pdo->prepare("UPDATE inventory_items SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        // Log status change history
        if ($oldStatus !== $newStatus || $oldLocation !== $newLocation) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO inventory_status_history 
                    (item_id, old_status, new_status, old_location, new_location, changed_by, changed_by_name, changed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $item['id'],
                    $oldStatus,
                    $newStatus,
                    $oldLocation,
                    $newLocation,
                    $user['id'],
                    $user['name']
                ]);
            } catch (\Exception $e) {
                error_log("Failed to log status history: " . $e->getMessage());
            }

            // Send email notification if status changed and notifications enabled
            if ($oldStatus !== $newStatus && $item['notify_status_change'] && $item['owner_email']) {
                try {
                    MailService::sendStatusChangeEmail(
                        $item['owner_email'],
                        $item['owner_name'],
                        $item['name'],
                        $oldStatus,
                        $newStatus,
                        $newLocation
                    );
                } catch (\Exception $e) {
                    error_log("Failed to send status change email: " . $e->getMessage());
                }
            }
        }

        // Return updated item
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $updatedItem = $stmt->fetch();

        Response::success($updatedItem, 'Item updated successfully');
    }

    /**
     * Get status history for an item by QR code (public)
     */
    public static function getHistoryByQrCode(int $qrId): void
    {
        $pdo = Database::getInstance();

        // Find item
        $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE qr_id = ?");
        $stmt->execute([$qrId]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::success(['data' => []]);
            return;
        }

        // Get history
        $stmt = $pdo->prepare("
            SELECT id, item_id, old_status, new_status, old_location, new_location, 
                   changed_by_name as changed_by, changed_at
            FROM inventory_status_history
            WHERE item_id = ?
            ORDER BY changed_at DESC
            LIMIT 50
        ");
        $stmt->execute([$item['id']]);
        $history = $stmt->fetchAll();

        Response::success(['data' => $history]);
    }
}
