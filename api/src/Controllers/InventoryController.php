<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Services\MailService;
use App\Services\InventoryMovementService;
use App\Services\InventoryApplicationService;

class InventoryController
{
    public static function createWithQr(): void
    {
        $user=Auth::check();$data=json_decode(file_get_contents('php://input'),true)??[];
        try{$result=InventoryApplicationService::createWithQr($user,$data);Response::success($result,'QR code and inventory item created',$result['duplicate']?200:201);}
        catch(\InvalidArgumentException $e){Response::error($e->getMessage(),422);}
        catch(\Throwable $e){error_log('Inventory QR creation failed: '.$e->getMessage());Response::error('Could not create the inventory item and QR code',500);}
    }
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
                SUM(CASE WHEN status = 'out' THEN 1 ELSE 0 END) as out_count,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out
            FROM inventory_items 
            WHERE user_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$user['id']]);
        $statusCounts = $stmt->fetch();
        $stmt=$pdo->prepare("SELECT SUM(inventory_type='quantity') quantity_products,SUM(inventory_type='serialized') serialized_items,COALESCE(SUM(CASE WHEN inventory_type='quantity' THEN quantity ELSE 0 END),0) units_in_stock,SUM(inventory_type='quantity' AND quantity<=minimum_stock_level AND quantity>0) low_stock_products,SUM(inventory_type='quantity' AND quantity=0) out_of_stock_products,SUM(status='checked_out') checked_out_items,SUM(status='maintenance') maintenance_items,SUM(status='damaged') damaged_items,SUM(status IN ('lost','missing')) lost_items FROM inventory_items WHERE user_id=? AND deleted_at IS NULL");
        $stmt->execute([$user['id']]);$inventoryCounts=$stmt->fetch()?:[];

        // Items by category
        $stmt = $pdo->prepare("
            SELECT category, COUNT(*) as count
            FROM inventory_items 
            WHERE user_id = ? AND deleted_at IS NULL
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
            WHERE i.user_id = ? AND i.deleted_at IS NULL AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
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
            WHERE i.user_id = ? AND i.deleted_at IS NULL AND sl.timestamp >= DATE_SUB(NOW(), INTERVAL {$interval})
        ");
        $stmt->execute([$user['id']]);
        $totalScans = (int)$stmt->fetch()['total'];

        // Status changes over time (movement trends)
        $stmt = $pdo->prepare("
            SELECT DATE(occurred_at) as date,
                   new_status,
                   COUNT(*) as changes
            FROM inventory_movements h
            JOIN inventory_items i ON h.item_id = i.id
            WHERE i.user_id = ? AND i.deleted_at IS NULL AND h.occurred_at >= DATE_SUB(NOW(), INTERVAL {$interval})
            GROUP BY DATE(occurred_at), new_status
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
            WHERE i.user_id = ? AND i.deleted_at IS NULL
            GROUP BY i.id, i.name, i.category, i.status
            ORDER BY scan_count DESC
            LIMIT 10
        ");
        $stmt->execute([$user['id']]);
        $topItems = $stmt->fetchAll();

        // Recent status changes
        $stmt = $pdo->prepare("
            SELECT h.id, i.name as item_name, h.previous_status AS old_status, h.new_status,
                   h.to_location AS new_location, h.performed_by_name AS changed_by_name, h.occurred_at AS changed_at
            FROM inventory_movements h
            JOIN inventory_items i ON h.item_id = i.id
            WHERE i.user_id = ? AND i.deleted_at IS NULL
            ORDER BY h.occurred_at DESC
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
            WHERE user_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$user['id']]);
        $qrCoverage = $stmt->fetch();

        $stmt=$pdo->prepare("SELECT action_type,COUNT(*) movement_count,COALESCE(SUM(ABS(quantity_delta)),0) units_moved FROM inventory_movements WHERE user_id=? AND occurred_at>=DATE_SUB(NOW(),INTERVAL {$interval}) GROUP BY action_type ORDER BY movement_count DESC,action_type");
        $stmt->execute([$user['id']]);$movementsByAction=$stmt->fetchAll();
        $stmt=$pdo->prepare("SELECT COALESCE(NULLIF(from_location,''),'Unassigned') from_location,COALESCE(NULLIF(to_location,''),'Unassigned') to_location,COUNT(*) movement_count,COALESCE(SUM(ABS(quantity_delta)),0) units_moved FROM inventory_movements WHERE user_id=? AND occurred_at>=DATE_SUB(NOW(),INTERVAL {$interval}) GROUP BY from_location,to_location ORDER BY movement_count DESC,from_location,to_location LIMIT 20");
        $stmt->execute([$user['id']]);$movementsByLocation=$stmt->fetchAll();
        $movementTotal=array_sum(array_map(static fn(array $row): int => (int)$row['movement_count'],$movementsByAction));

        Response::success([
            'summary' => [
                'total_items' => (int)($statusCounts['total'] ?? 0),
                'total_scans' => $totalScans,
                'items_with_qr' => (int)($qrCoverage['with_qr'] ?? 0),
                'items_without_qr' => (int)($qrCoverage['without_qr'] ?? 0),
                'quantity_products' => (int)($inventoryCounts['quantity_products'] ?? 0),
                'serialized_items' => (int)($inventoryCounts['serialized_items'] ?? 0),
                'units_in_stock' => (int)($inventoryCounts['units_in_stock'] ?? 0),
                'low_stock_products' => (int)($inventoryCounts['low_stock_products'] ?? 0),
                'out_of_stock_products' => (int)($inventoryCounts['out_of_stock_products'] ?? 0),
                'checked_out_items' => (int)($inventoryCounts['checked_out_items'] ?? 0),
                'maintenance_items' => (int)($inventoryCounts['maintenance_items'] ?? 0),
                'damaged_items' => (int)($inventoryCounts['damaged_items'] ?? 0),
                'lost_items' => (int)($inventoryCounts['lost_items'] ?? 0),
                'movement_total' => $movementTotal,
            ],
            'status_distribution' => [
                ['status' => 'in_stock', 'count' => (int)($statusCounts['in_stock'] ?? 0), 'label' => 'In Stock'],
                ['status' => 'out', 'count' => (int)($statusCounts['out_count'] ?? 0), 'label' => 'Out'],
                ['status' => 'maintenance', 'count' => (int)($statusCounts['maintenance'] ?? 0), 'label' => 'Maintenance'],
                ['status' => 'checked_out', 'count' => (int)($statusCounts['checked_out'] ?? 0), 'label' => 'Checked Out'],
            ],
            'by_category' => $byCategory,
            'scan_trend' => $scansByDate,
            'status_changes' => $statusChanges,
            'top_items' => $topItems,
            'recent_changes' => $recentChanges,
            'movements_by_action' => $movementsByAction,
            'movements_by_location' => $movementsByLocation,
            'period' => ['key'=>$period,'days'=>(int)$interval,'generated_at'=>date(DATE_ATOM)],
        ]);
    }

    /**
     * Export inventory analytics as CSV
     */
    public static function exportAnalyticsCsv(): void
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

        $where = ["i.deleted_at IS NULL", "(i.user_id = ? OR EXISTS(SELECT 1 FROM inventory_access ia WHERE ia.owner_user_id=i.user_id AND ia.user_id=? AND ia.is_active=1))"];
        $params = [$user['id'],$user['id']];

        // Search
        if (!empty($_GET['search'])) {
            $where[] = "(i.name LIKE ? OR i.category LIKE ? OR i.inventory_identifier LIKE ? OR CAST(i.qr_id AS CHAR) LIKE ?)";
            $searchTerm = '%' . $_GET['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
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
        if (!empty($_GET['location'])) { $where[]='i.location = ?'; $params[]=$_GET['location']; }
        if (!empty($_GET['assigned_to'])) { $where[]='i.assigned_to LIKE ?'; $params[]='%'.$_GET['assigned_to'].'%'; }
        if (!empty($_GET['inventory_type'])) { $where[]='i.inventory_type = ?'; $params[]=$_GET['inventory_type']; }
        if (($_GET['low_stock'] ?? '') === '1') { $where[]="i.inventory_type='quantity' AND i.quantity <= i.minimum_stock_level"; }

        $whereClause = implode(' AND ', $where);

        // Get total (use table alias for consistency)
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM inventory_items i WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        // Get items with QR preview
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT i.*, q.content as qr_content,
              CASE WHEN i.user_id=? THEN 'owner' ELSE (SELECT ia.role FROM inventory_access ia WHERE ia.owner_user_id=i.user_id AND ia.user_id=? AND ia.is_active=1 LIMIT 1) END access_role
            FROM inventory_items i
            LEFT JOIN qr_codes q ON i.qr_id = q.id
            WHERE {$whereClause}
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute(array_merge([$user['id'],$user['id']],$params));
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
            WHERE i.id = ? AND i.deleted_at IS NULL AND (i.user_id = ? OR EXISTS(SELECT 1 FROM inventory_access ia WHERE ia.owner_user_id=i.user_id AND ia.user_id=? AND ia.is_active=1))
        ");
        $stmt->execute([$id, $user['id'], $user['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Item not found', 404);
        }

        $role = 'owner';
        if ((int)$item['user_id'] !== (int)$user['id']) {
            $access = $pdo->prepare('SELECT role FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1 LIMIT 1');
            $access->execute([$item['user_id'],$user['id']]);
            $role = (string)$access->fetchColumn();
        }
        $levels=$pdo->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=? ORDER BY location_name');
        $levels->execute([$id]);
        $item['access_role']=$role;
        $item['capabilities']=[
            'operate'=>in_array($role,['owner','operator','controller','admin'],true),
            'control'=>in_array($role,['owner','controller','admin'],true),
            'administer'=>in_array($role,['owner','admin'],true),
        ];
        $item['stock_levels']=$levels->fetchAll();
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
        $inventoryType = ($data['inventory_type'] ?? 'serialized') === 'quantity' ? 'quantity' : 'serialized';
        $allowedStatuses = ['in_stock','available','low_stock','out_of_stock','checked_out','maintenance','damaged','lost','missing','unavailable','out'];
        $status = $data['status'] ?? ($inventoryType === 'quantity' ? 'out_of_stock' : 'available');
        $rawQuantity=$data['quantity'] ?? ($inventoryType === 'serialized' ? 1 : 0);
        $rawMinimum=$data['minimum_stock_level'] ?? 0;
        if(filter_var($rawQuantity,FILTER_VALIDATE_INT)===false||(int)$rawQuantity<0)Response::error('Quantity must be zero or greater',422);
        if(filter_var($rawMinimum,FILTER_VALIDATE_INT)===false||(int)$rawMinimum<0)Response::error('Minimum stock must be zero or greater',422);
        $quantity = $inventoryType === 'serialized' ? 1 : (int)$rawQuantity;
        $minimumStock = (int)$rawMinimum;
        if ($inventoryType === 'quantity') $status = $quantity === 0 ? 'out_of_stock' : ($minimumStock > 0 && $quantity <= $minimumStock ? 'low_stock' : 'in_stock');
        if (!in_array($status, $allowedStatuses, true)) {
            Response::error('Invalid status', 400);
        }

        // Validate QR ownership if provided
        $qrId = null;
        if (!empty($data['qr_id'])) {
            $stmt = $pdo->prepare("SELECT id FROM qr_codes WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['qr_id'], $user['id']]);
            if (!$stmt->fetch()) {
                Response::error('QR code not found or not owned by you', 400);
            }
            $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE qr_id = ? LIMIT 1");
            $stmt->execute([$data['qr_id']]);
            if ($stmt->fetch()) {
                Response::error('This QR code is already linked to another inventory item', 409);
            }
            $qrId = $data['qr_id'];
        }

        // Insert initial state and its explicit opening movement atomically.
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("
            INSERT INTO inventory_items (user_id, qr_id, public_token, name, category, inventory_type, inventory_identifier, quantity, minimum_stock_level, notes, status, location, created_at, updated_at)
            VALUES (?, ?, UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $user['id'],
            $qrId,
            trim($data['name']),
            $data['category'] ?? 'Other',
            $inventoryType,
            !empty($data['inventory_identifier']) ? trim((string)$data['inventory_identifier']) : null,
            $quantity,
            $minimumStock,
            $data['notes'] ?? null,
            $status,
            $data['location'] ?? null,
        ]);

        $itemId = (int)$pdo->lastInsertId();

        if ($inventoryType === 'quantity') {
            $location = trim((string)($data['location'] ?? '')) ?: 'Unassigned';
            if($location!=='Unassigned')$pdo->prepare('INSERT IGNORE INTO inventory_locations(user_id,name) VALUES(?,?)')->execute([$user['id'],$location]);
            $pdo->prepare('INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,?,?)')->execute([$itemId,$location,$quantity]);
        }
        $pdo->prepare("INSERT INTO inventory_movements(item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by,performed_by_name,occurred_at,workflow_id,idempotency_key,metadata) VALUES(?,?, 'opening_state', ?,0,?,NULL,?,NULL,?,'Initial inventory state',?,?,NOW(),UUID(),?,JSON_OBJECT('provenance','creation'))")
            ->execute([$itemId,$user['id'],$quantity,$quantity,$status,$data['location']??null,$user['id'],$user['name'],'create-'.$itemId]);

        // Fetch and return the created item
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();
        $pdo->commit();

        Response::success($item, 'Inventory item created successfully', 201);
    }

    public static function update(int $id): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = Database::getInstance();

        if (array_key_exists('status',$data) || array_key_exists('location',$data) || array_key_exists('quantity',$data) || array_key_exists('assigned_to',$data)) {
            Response::error('Use a transactional inventory action to change quantity, status, assignment, or location',422);
        }

        // Check ownership
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        $existingItem = $stmt->fetch();
        if (!$existingItem) {
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
        if (array_key_exists('qr_id', $data)) {
            $qrId = !empty($data['qr_id']) ? $data['qr_id'] : null;
            if ($qrId !== null) {
                $stmt = $pdo->prepare("SELECT id FROM qr_codes WHERE id = ? AND user_id = ?");
                $stmt->execute([$qrId, $user['id']]);
                if (!$stmt->fetch()) {
                    Response::error('QR code not found or not owned by you', 400);
                }
                $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE qr_id = ? AND id <> ? LIMIT 1");
                $stmt->execute([$qrId, $id]);
                if ($stmt->fetch()) {
                    Response::error('This QR code is already linked to another inventory item', 409);
                }
            }
            $updates[] = "qr_id = ?";
            $params[] = $qrId;
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

        $stmt = $pdo->prepare("UPDATE inventory_items SET deleted_at=NOW(),updated_at=NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL");
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            Response::error('Item not found', 404);
        }

        Response::success(null, 'Item deleted successfully');
    }

    public static function getLimits(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $currentCount = (int)$stmt->fetch()['count'];

        Response::success([
            'max_items' => null,
            'current_count' => $currentCount,
            'can_edit' => true,
        ]);
    }

    /**
     * Public endpoint: Get inventory item by QR code ID
     * Also logs the scan
     */
    public static function getByQrCode(int $qrId): void
    {
        $item = InventoryApplicationService::resolveByQr($qrId);

        if (!$item) {
            Response::success(['item' => null, 'is_owner' => false]);
            return;
        }

        // Check if current user is owner
        $isOwner = false;
        $user = Auth::optionalUser();
        if ($user && (int)$user['id'] === (int)$item['user_id']) {
            $isOwner = true;
        }
        if ($user && !empty($item['shared_access'])) {
            $sharedAccess = array_map('intval', json_decode($item['shared_access'], true) ?: []);
            $isOwner = $isOwner || in_array((int)$user['id'], $sharedAccess, true);
        }

        // Public scans expose only the safe current-state view. Management
        // notes, owner IDs and access-control data remain private.
        $visibility=(string)($item['public_visibility']??'status_only');
        if($visibility==='private'&&!$isOwner)Response::error('This inventory item is private',403);
        $publicItem = [
            'id' => (string)$item['id'],
            'qr_id' => (string)$item['qr_id'],
            'name' => $item['name'],
            'category' => $item['category'],
            'status' => $item['status'],
            'last_scan_date' => $item['last_scan_date'],
            'inventory_type' => $item['inventory_type'] ?? 'serialized',
            'updated_at' => $item['updated_at'],
        ];
        if($isOwner||$visibility==='summary'){$publicItem['location']=$item['location'];$publicItem['quantity']=isset($item['quantity'])?(int)$item['quantity']:null;$publicItem['minimum_stock_level']=isset($item['minimum_stock_level'])?(int)$item['minimum_stock_level']:null;}
        if($isOwner)$publicItem['assigned_to']=$item['assigned_to']??null;
        Response::success(['item' => $publicItem, 'is_owner' => $isOwner]);
    }

    /**
     * Get status history for an item by QR code (authorized users only)
     */
    public static function getHistoryByQrCode(int $qrId): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Find item
        $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE qr_id = ? AND user_id = ?");
        $stmt->execute([$qrId, $user['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::success([]);
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

        Response::success($history);
    }

    public static function performAction(int $id, string $action): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        try {
            Response::success(InventoryMovementService::perform($id,$user,$action,$data), 'Inventory action completed successfully');
        } catch (\InvalidArgumentException|\DomainException $e) {
            Response::error($e->getMessage(),422);
        } catch (\RuntimeException $e) {
            $code=in_array($e->getCode(),[403,404,409],true)?$e->getCode():409;
            Response::error($e->getMessage(),$code);
        }
    }

    public static function getMovements(int $id): void
    {
        try{Response::success(InventoryApplicationService::movementPage($id,Auth::check(),$_GET));}catch(\RuntimeException $e){Response::error($e->getMessage(),in_array($e->getCode(),[403,404],true)?$e->getCode():500);}
    }

    public static function exportMovements(int $id): void
    {
        $user=Auth::check();$pdo=Database::getInstance();
        $owner=$pdo->prepare('SELECT user_id FROM inventory_items WHERE id=? AND deleted_at IS NULL');$owner->execute([$id]);$ownerId=$owner->fetchColumn();
        if(!$ownerId)Response::error('Inventory item not found',404);
        if((int)$ownerId!==(int)$user['id']){$access=$pdo->prepare('SELECT 1 FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1');$access->execute([$ownerId,$user['id']]);if(!$access->fetchColumn())Response::error('You do not have permission to export this history',403);}
        $where=['item_id=?'];$params=[$id];
        if(!empty($_GET['action_type'])){$where[]='action_type=?';$params[]=$_GET['action_type'];}
        if(!empty($_GET['reason'])){$where[]='reason LIKE ?';$params[]='%'.$_GET['reason'].'%';}
        if(!empty($_GET['user'])){$where[]='performed_by_name LIKE ?';$params[]='%'.$_GET['user'].'%';}
        if(!empty($_GET['location'])){$where[]='(from_location=? OR to_location=?)';$params[]=$_GET['location'];$params[]=$_GET['location'];}
        if(!empty($_GET['status'])){$where[]='(previous_status=? OR new_status=?)';$params[]=$_GET['status'];$params[]=$_GET['status'];}
        if(!empty($_GET['from'])){$where[]='occurred_at>=?';$params[]=$_GET['from'];}
        if(!empty($_GET['to'])){$where[]='occurred_at<=?';$params[]=$_GET['to'];}
        $stmt=$pdo->prepare('SELECT id,item_id,workflow_id,occurred_at,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by_name,related_party,notes,metadata FROM inventory_movements WHERE '.implode(' AND ',$where).' ORDER BY occurred_at DESC,id DESC');$stmt->execute($params);
        header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="inventory-movements-'.$id.'-'.date('Y-m-d').'.csv"');
        $out=fopen('php://output','wb');fputcsv($out,['Movement ID','Item ID','Workflow ID','Date','Action','Quantity change','Previous quantity','New quantity','Previous status','New status','From','To','Reason','Performed by','Related party','Notes','Metadata']);
        while($row=$stmt->fetch()){foreach($row as &$value){$value=self::safeCsv($value);}unset($value);fputcsv($out,array_values($row));}fclose($out);exit;
    }

    private static function safeCsv(mixed $value): string
    {
        $text=(string)($value??'');return preg_match('/^[=+\-@\t\r]/',$text)?"'".$text:$text;
    }

    public static function saveStockCount(int $id): void
    {
        $user=Auth::check();$data=json_decode(file_get_contents('php://input'),true)??[];
        try{Response::success(InventoryApplicationService::saveStockCount($id,$user,$data),'Stock count saved',201);}
        catch(\PDOException $e){if($e->getCode()==='23000')Response::error('This stock count was already saved',409);throw $e;}
        catch(\Throwable $e){$code=in_array($e->getCode(),[403,404,409],true)?$e->getCode():422;Response::error($e->getMessage(),$code);}
    }

    public static function applyStockCount(int $id, int $countId): void
    {
        $user=Auth::check();$data=json_decode(file_get_contents('php://input'),true)??[];
        $data['apply_count_id']=$countId;$data['idempotency_key']='stock-count-'.$countId;$data['reason']=$data['reason']??'other';
        try{Response::success(InventoryMovementService::perform($id,$user,'reconciliation',$data),'Stock reconciliation applied');}
        catch(\InvalidArgumentException|\DomainException $e){Response::error($e->getMessage(),422);}catch(\RuntimeException $e){Response::error($e->getMessage(),in_array($e->getCode(),[403,404,409],true)?$e->getCode():409);}
    }

    public static function listLocations(): void
    {
        $user=Auth::check();$pdo=Database::getInstance();$ownerId=(int)$user['id'];
        if(!empty($_GET['item_id'])){$item=$pdo->prepare('SELECT user_id FROM inventory_items WHERE id=? AND deleted_at IS NULL');$item->execute([(int)$_GET['item_id']]);$candidate=$item->fetchColumn();if(!$candidate)Response::error('Inventory item not found',404);if((int)$candidate!==$ownerId){$access=$pdo->prepare('SELECT 1 FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1');$access->execute([$candidate,$user['id']]);if(!$access->fetchColumn())Response::error('You do not have permission to view these locations',403);}$ownerId=(int)$candidate;}
        $stmt=$pdo->prepare('SELECT * FROM inventory_locations WHERE user_id=? AND is_active=1 ORDER BY name');$stmt->execute([$ownerId]);Response::success($stmt->fetchAll());
    }

    public static function createLocation(): void
    {
        $user=Auth::check();$data=json_decode(file_get_contents('php://input'),true)??[];$name=trim((string)($data['name']??''));if($name===''||mb_strlen($name)>255)Response::error('A valid location name is required',422);
        try{Response::success(InventoryApplicationService::createLocation($user,$name,$data['code']??null,$data['description']??null),'Location created',201);}catch(\PDOException $e){if($e->getCode()==='23000')Response::error('A location with this name already exists',409);throw $e;}
    }
}
