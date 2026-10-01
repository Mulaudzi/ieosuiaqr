<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;

class QrController
{
    private const BASIC_TYPES = ['url', 'text', 'email', 'phone', 'sms'];
    private const PREMIUM_TYPES = ['wifi', 'vcard', 'event', 'location', 'whatsapp', 'social', 'app'];

    public static function create(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Validate input
        $validator = new Validator($data);
        $validator
            ->required('type', 'QR code type is required')
            ->required('content', 'QR code content is required')
            ->validate();

        $type = strtolower($data['type']);
        $allTypes = array_merge(self::BASIC_TYPES, self::PREMIUM_TYPES);

        if (!in_array($type, $allTypes)) {
            Response::error('Invalid QR code type', 400);
        }
        if ($type === 'event') self::validateEventContent($data['content']);

        $pdo = Database::getInstance();

        try {
            $dynamicId = bin2hex(random_bytes(8));

            $stmt = $pdo->prepare("
                INSERT INTO qr_codes (user_id, type, name, content, custom_options, dynamic_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");

            $stmt->execute([
                $user['id'],
                $type,
                $data['name'] ?? null,
                json_encode($data['content']),
                json_encode($data['custom_options'] ?? []),
                $dynamicId
            ]);

            $qrId = (int)$pdo->lastInsertId();

            Response::success([
                'id' => $qrId,
                'type' => $type,
                'name' => $data['name'] ?? null,
                'content' => $data['content'],
                'custom_options' => $data['custom_options'] ?? [],
                'dynamic_id' => $dynamicId,
                'created_at' => date('c')
            ], 'QR code created successfully', 201);

        } catch (\Exception $e) {
            error_log("QR creation error: " . $e->getMessage());
            Response::error('Failed to create QR code', 500);
        }
    }

    public static function list(): void
    {
        $user = Auth::check();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $type = $_GET['type'] ?? '';

        $pdo = Database::getInstance();

        // Build query
        $where = ["user_id = ?"];
        $params = [$user['id']];

        if ($search) {
            $where[] = "(name LIKE ? OR type LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        if ($type) {
            $where[] = "type = ?";
            $params[] = $type;
        }

        $whereClause = implode(' AND ', $where);

        // Get total count
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM qr_codes WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        // Get QR codes
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT id, type, name, content, custom_options, dynamic_id, is_active, total_scans, created_at
            FROM qr_codes 
            WHERE {$whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $qrCodes = $stmt->fetchAll();

        // Parse JSON fields
        foreach ($qrCodes as &$qr) {
            $qr['content'] = json_decode($qr['content'], true);
            $qr['custom_options'] = json_decode($qr['custom_options'], true);
        }

        Response::paginated($qrCodes, $total, $page, $limit);
    }

    public static function show(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("
            SELECT id, type, name, content, custom_options, dynamic_id, is_active, total_scans, created_at, updated_at
            FROM qr_codes 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $user['id']]);
        $qr = $stmt->fetch();

        if (!$qr) {
            Response::error('QR code not found', 404);
        }

        $qr['content'] = json_decode($qr['content'], true);
        $qr['custom_options'] = json_decode($qr['custom_options'], true);

        Response::success($qr);
    }

    public static function update(int $id): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = Database::getInstance();

        // Check ownership
        $stmt = $pdo->prepare("SELECT id, dynamic_id, type FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        $qr = $stmt->fetch();

        if (!$qr) {
            Response::error('QR code not found', 404);
        }

        $updates = [];
        $params = [];

        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = $data['name'];
        }

        if (isset($data['content'])) {
            if (($qr['type'] ?? '') === 'event') self::validateEventContent($data['content']);
            $updates[] = "content = ?";
            $params[] = json_encode($data['content']);
        }

        if (isset($data['custom_options'])) {
            $updates[] = "custom_options = ?";
            $params[] = json_encode($data['custom_options']);
        }

        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = (int)$data['is_active'];
        }

        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
        }

        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE qr_codes SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?");
        $stmt->execute($params);

        Response::success(null, 'QR code updated successfully');
    }

    public static function delete(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("DELETE FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);

        if ($stmt->rowCount() === 0) {
            Response::error('QR code not found', 404);
        }

        Response::success(null, 'QR code deleted successfully');
    }

    private static function validateEventContent(mixed $content): void
    {
        if (!is_array($content)) Response::error('Event content must be an object',422);
        foreach (['title','startDate','startTime','endDate','endTime'] as $field) {
            if (!isset($content[$field]) || trim((string)$content[$field]) === '') Response::error("Event {$field} is required",422);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/',(string)$content['startDate']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/',(string)$content['endDate']) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/',(string)$content['startTime']) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/',(string)$content['endTime'])) Response::error('Event dates or times are invalid',422);
        $start=\DateTimeImmutable::createFromFormat('!Y-m-d H:i',(string)$content['startDate'].' '.(string)$content['startTime']);
        $startErrors=\DateTimeImmutable::getLastErrors();
        $end=\DateTimeImmutable::createFromFormat('!Y-m-d H:i',(string)$content['endDate'].' '.(string)$content['endTime']);
        $endErrors=\DateTimeImmutable::getLastErrors();
        if(!$start||!$end||(is_array($startErrors)&&(($startErrors['warning_count']??0)>0||($startErrors['error_count']??0)>0))||(is_array($endErrors)&&(($endErrors['warning_count']??0)>0||($endErrors['error_count']??0)>0))) Response::error('Event dates or times are invalid',422);
        if($end<=$start) Response::error('Event end must be after its start',422);
    }

    public static function bulkCreate(): void
    {
        $user = Auth::check();

        if (!isset($_FILES['file'])) {
            Response::error('CSV file is required', 400);
        }

        $file = $_FILES['file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('File upload failed', 400);
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($extension !== 'csv') {
            Response::error('Only CSV files are supported', 400);
        }

        $handle = fopen($file['tmp_name'], 'r');
        $header = fgetcsv($handle, null, ',', '"', '\\');
        
        if (!$header || !in_array('type', $header) || !in_array('content', $header)) {
            fclose($handle);
            Response::error('CSV must have "type" and "content" columns', 400);
        }

        $pdo = Database::getInstance();
        $created = 0;
        $errors = [];
        $row = 1;

        Database::beginTransaction();

        try {
            $stmt = $pdo->prepare("
                INSERT INTO qr_codes (user_id, type, name, content, custom_options, dynamic_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");

            while (($data = fgetcsv($handle, null, ',', '"', '\\')) !== false) {
                $row++;
                $rowData = array_combine($header, $data);

                $type = strtolower($rowData['type'] ?? '');
                $allTypes = array_merge(self::BASIC_TYPES, self::PREMIUM_TYPES);

                if (!in_array($type, $allTypes)) {
                    $errors[] = "Row {$row}: Invalid type '{$type}'";
                    continue;
                }

                try {
                    // Parse content based on type
                    $content = $rowData['content'];
                    if ($type === 'wifi') {
                        $parts = explode(',', $content);
                        $content = json_encode([
                            'ssid' => $parts[0] ?? '',
                            'password' => $parts[1] ?? '',
                            'encryption' => $parts[2] ?? 'WPA'
                        ]);
                    } else {
                        $content = json_encode(['value' => $content]);
                    }

                    $stmt->execute([
                        $user['id'],
                        $type,
                        $rowData['name'] ?? null,
                        $content,
                        json_encode([]),
                        bin2hex(random_bytes(8))
                    ]);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$row}: Failed to create";
                }
            }

            fclose($handle);
            Database::commit();

            Response::success([
                'created' => $created,
                'errors' => $errors
            ], "Bulk import complete. {$created} QR codes created.");

        } catch (\Exception $e) {
            Database::rollback();
            fclose($handle);
            error_log("Bulk create error: " . $e->getMessage());
            Response::error('Bulk import failed', 500);
        }
    }
}
