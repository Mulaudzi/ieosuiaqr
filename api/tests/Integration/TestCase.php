<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase as BaseTestCase;
use App\Config\Database;

/**
 * Base Integration Test Case
 * Provides common utilities for integration testing
 */
abstract class TestCase extends BaseTestCase
{
    protected static ?\PDO $pdo = null;
    protected static bool $databaseAvailable = false;

    public static function setUpBeforeClass(): void
    {
        try {
            self::$pdo = Database::getInstance();
            self::$databaseAvailable = true;
        } catch (\Exception $e) {
            self::$databaseAvailable = false;
        }
    }

    protected function setUp(): void
    {
        if (!self::$databaseAvailable) {
            $this->markTestSkipped('Database not available for integration tests');
        }
    }

    /**
     * Create a test user and return their data
     */
    protected function createTestUser(array $overrides = []): array
    {
        $email = $overrides['email'] ?? 'test_' . uniqid() . '@example.com';
        $name = $overrides['name'] ?? 'Test User';
        $password = $overrides['password'] ?? 'password123';
        $plan = $overrides['plan'] ?? 'Free';

        $stmt = self::$pdo->prepare("
            INSERT INTO users (email, password, name, plan, email_verified_at, created_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            strtolower($email),
            password_hash($password, PASSWORD_BCRYPT),
            $name,
            $plan
        ]);

        $userId = (int)self::$pdo->lastInsertId();

        return [
            'id' => $userId,
            'email' => strtolower($email),
            'name' => $name,
            'password' => $password,
            'plan' => $plan
        ];
    }

    /**
     * Delete a test user and all related data
     */
    protected function deleteTestUser(int $userId): void
    {
        // Delete in order to respect foreign keys
        $tables = [
            "DELETE sl FROM scan_logs sl INNER JOIN qr_codes qr ON sl.qr_id = qr.id WHERE qr.user_id = ?",
            "DELETE FROM qr_codes WHERE user_id = ?",
            "DELETE h FROM inventory_status_history h INNER JOIN inventory_items i ON h.item_id = i.id WHERE i.user_id = ?",
            "DELETE FROM inventory_alerts WHERE user_id = ?",
            "DELETE FROM inventory_items WHERE user_id = ?",
            "DELETE FROM subscriptions WHERE user_id = ?",
            "DELETE FROM invoices WHERE user_id = ?",
            "DELETE FROM payments WHERE user_id = ?",
            "DELETE FROM users WHERE id = ?"
        ];

        foreach ($tables as $sql) {
            try {
                $stmt = self::$pdo->prepare($sql);
                $stmt->execute([$userId]);
            } catch (\Exception $e) {
                // Table might not exist, continue
            }
        }
    }

    /**
     * Create a test QR code
     */
    protected function createTestQRCode(int $userId, array $overrides = []): array
    {
        $type = $overrides['type'] ?? 'url';
        $name = $overrides['name'] ?? 'Test QR Code';
        $content = $overrides['content'] ?? json_encode(['url' => 'https://example.com']);

        $stmt = self::$pdo->prepare("
            INSERT INTO qr_codes (user_id, type, name, content, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([$userId, $type, $name, $content]);

        $qrId = (int)self::$pdo->lastInsertId();

        return [
            'id' => $qrId,
            'user_id' => $userId,
            'type' => $type,
            'name' => $name,
            'content' => $content
        ];
    }

    /**
     * Create a test inventory item
     */
    protected function createTestInventoryItem(int $userId, ?int $qrId = null, array $overrides = []): array
    {
        $name = $overrides['name'] ?? 'Test Item';
        $category = $overrides['category'] ?? 'Equipment';
        $status = $overrides['status'] ?? 'in_stock';

        $stmt = self::$pdo->prepare("
            INSERT INTO inventory_items (user_id, qr_id, name, category, status, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $qrId, $name, $category, $status]);

        $itemId = (int)self::$pdo->lastInsertId();

        return [
            'id' => $itemId,
            'user_id' => $userId,
            'qr_id' => $qrId,
            'name' => $name,
            'category' => $category,
            'status' => $status
        ];
    }

    /**
     * Generate a JWT token for testing
     */
    protected function generateTestToken(int $userId, string $plan = 'Free'): string
    {
        return \App\Middleware\Auth::generateToken($userId, $plan);
    }

    /**
     * Assert that a table contains a record matching conditions
     */
    protected function assertDatabaseHas(string $table, array $conditions): void
    {
        $where = [];
        $params = [];
        
        foreach ($conditions as $column => $value) {
            $where[] = "{$column} = ?";
            $params[] = $value;
        }
        
        $whereClause = implode(' AND ', $where);
        $stmt = self::$pdo->prepare("SELECT COUNT(*) as count FROM {$table} WHERE {$whereClause}");
        $stmt->execute($params);
        $count = (int)$stmt->fetch()['count'];
        
        $this->assertGreaterThan(0, $count, "Failed asserting that table '{$table}' has matching record");
    }

    /**
     * Assert that a table does not contain a record matching conditions
     */
    protected function assertDatabaseMissing(string $table, array $conditions): void
    {
        $where = [];
        $params = [];
        
        foreach ($conditions as $column => $value) {
            $where[] = "{$column} = ?";
            $params[] = $value;
        }
        
        $whereClause = implode(' AND ', $where);
        $stmt = self::$pdo->prepare("SELECT COUNT(*) as count FROM {$table} WHERE {$whereClause}");
        $stmt->execute($params);
        $count = (int)$stmt->fetch()['count'];
        
        $this->assertEquals(0, $count, "Failed asserting that table '{$table}' is missing matching record");
    }
}
