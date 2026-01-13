<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;

class InventoryController
{
    // Plan limits
    private static $planLimits = [
        'Free' => ['max_items' => 3, 'can_edit' => false],
        'Pro' => ['max_items' => 100, 'can_edit' => true],
        'Enterprise' => ['max_items' => PHP_INT_MAX, 'can_edit' => true],
    ];

    public static function list(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = ["user_id = ?"];
        $params = [$user['id']];

        // Search
        if (!empty($_GET['search'])) {
            $where[] = "(name LIKE ? OR category LIKE ?)";
            $searchTerm = '%' . $_GET['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        // Category filter
        if (!empty($_GET['category'])) {
            $where[] = "category = ?";
            $params[] = $_GET['category'];
        }

        // Status filter
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }

        $whereClause = implode(' AND ', $where);

        // Get total
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM inventory_items WHERE {$whereClause}");
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

        // Find item
        $stmt = $pdo->prepare("
            SELECT i.*, i.user_id as owner_id
            FROM inventory_items i
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

        // Return updated item
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $updatedItem = $stmt->fetch();

        Response::success($updatedItem, 'Item updated successfully');
    }
}
