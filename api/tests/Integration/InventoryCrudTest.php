<?php

namespace Tests\Integration;

/**
 * Inventory CRUD Integration Tests
 */
class InventoryCrudTest extends TestCase
{
    private array $testUser;
    private array $createdItems = [];
    private array $createdQRCodes = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser(['plan' => 'Pro']);
    }

    protected function tearDown(): void
    {
        // Clean up inventory items
        foreach ($this->createdItems as $itemId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM inventory_status_history WHERE item_id = ?");
                $stmt->execute([$itemId]);
                $stmt = self::$pdo->prepare("DELETE FROM inventory_items WHERE id = ?");
                $stmt->execute([$itemId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Clean up QR codes
        foreach ($this->createdQRCodes as $qrId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM qr_codes WHERE id = ?");
                $stmt->execute([$qrId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        if (isset($this->testUser['id'])) {
            $this->deleteTestUser($this->testUser['id']);
        }
    }

    public function testCreateInventoryItem(): void
    {
        $stmt = self::$pdo->prepare("
            INSERT INTO inventory_items (user_id, name, category, status, location, created_at)
            VALUES (?, 'Test Item', 'Equipment', 'in_stock', 'Warehouse A', NOW())
        ");
        $stmt->execute([$this->testUser['id']]);
        
        $itemId = (int)self::$pdo->lastInsertId();
        $this->createdItems[] = $itemId;
        
        $this->assertGreaterThan(0, $itemId);
        $this->assertDatabaseHas('inventory_items', [
            'id' => $itemId,
            'name' => 'Test Item',
            'category' => 'Equipment'
        ]);
    }

    public function testCreateInventoryItemWithQRCode(): void
    {
        // Create a QR code first
        $qr = $this->createTestQRCode($this->testUser['id']);
        $this->createdQRCodes[] = $qr['id'];
        
        // Create inventory item linked to QR
        $stmt = self::$pdo->prepare("
            INSERT INTO inventory_items (user_id, qr_id, name, category, status, created_at)
            VALUES (?, ?, 'QR Linked Item', 'Assets', 'in_stock', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $qr['id']]);
        
        $itemId = (int)self::$pdo->lastInsertId();
        $this->createdItems[] = $itemId;
        
        $this->assertDatabaseHas('inventory_items', [
            'id' => $itemId,
            'qr_id' => $qr['id']
        ]);
    }

    public function testReadInventoryItem(): void
    {
        $item = $this->createTestInventoryItem($this->testUser['id'], null, [
            'name' => 'Read Test Item',
            'category' => 'Tools'
        ]);
        $this->createdItems[] = $item['id'];
        
        $stmt = self::$pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $result = $stmt->fetch();
        
        $this->assertNotFalse($result);
        $this->assertEquals('Read Test Item', $result['name']);
        $this->assertEquals('Tools', $result['category']);
    }

    public function testUpdateInventoryItem(): void
    {
        $item = $this->createTestInventoryItem($this->testUser['id']);
        $this->createdItems[] = $item['id'];
        
        $stmt = self::$pdo->prepare("
            UPDATE inventory_items SET name = ?, category = ?, updated_at = NOW() WHERE id = ?
        ");
        $stmt->execute(['Updated Item', 'New Category', $item['id']]);
        
        $stmt = self::$pdo->prepare("SELECT * FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $result = $stmt->fetch();
        
        $this->assertEquals('Updated Item', $result['name']);
        $this->assertEquals('New Category', $result['category']);
    }

    public function testUpdateInventoryStatus(): void
    {
        $item = $this->createTestInventoryItem($this->testUser['id'], null, [
            'status' => 'in_stock'
        ]);
        $this->createdItems[] = $item['id'];
        
        // Update status
        $stmt = self::$pdo->prepare("
            UPDATE inventory_items SET status = ?, updated_at = NOW() WHERE id = ?
        ");
        $stmt->execute(['checked_out', $item['id']]);
        
        // Record status change in history
        $stmt = self::$pdo->prepare("
            INSERT INTO inventory_status_history (item_id, old_status, new_status, changed_at)
            VALUES (?, 'in_stock', 'checked_out', NOW())
        ");
        $stmt->execute([$item['id']]);
        
        // Verify status changed
        $stmt = self::$pdo->prepare("SELECT status FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        $this->assertEquals('checked_out', $stmt->fetch()['status']);
        
        // Verify history recorded
        $this->assertDatabaseHas('inventory_status_history', [
            'item_id' => $item['id'],
            'old_status' => 'in_stock',
            'new_status' => 'checked_out'
        ]);
    }

    public function testDeleteInventoryItem(): void
    {
        $item = $this->createTestInventoryItem($this->testUser['id']);
        
        $stmt = self::$pdo->prepare("DELETE FROM inventory_items WHERE id = ?");
        $stmt->execute([$item['id']]);
        
        $this->assertDatabaseMissing('inventory_items', ['id' => $item['id']]);
    }

    public function testListInventoryByCategory(): void
    {
        // Create items in different categories
        $item1 = $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'Electronics']);
        $item2 = $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'Furniture']);
        $item3 = $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'Electronics']);
        
        $this->createdItems = [$item1['id'], $item2['id'], $item3['id']];
        
        // Filter by category
        $stmt = self::$pdo->prepare("
            SELECT * FROM inventory_items WHERE user_id = ? AND category = ?
        ");
        $stmt->execute([$this->testUser['id'], 'Electronics']);
        $results = $stmt->fetchAll();
        
        $this->assertCount(2, $results);
    }

    public function testListInventoryByStatus(): void
    {
        $item1 = $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'in_stock']);
        $item2 = $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'out']);
        $item3 = $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'in_stock']);
        
        $this->createdItems = [$item1['id'], $item2['id'], $item3['id']];
        
        $stmt = self::$pdo->prepare("
            SELECT * FROM inventory_items WHERE user_id = ? AND status = ?
        ");
        $stmt->execute([$this->testUser['id'], 'in_stock']);
        $results = $stmt->fetchAll();
        
        $this->assertCount(2, $results);
    }

    public function testInventoryItemSearch(): void
    {
        $item1 = $this->createTestInventoryItem($this->testUser['id'], null, ['name' => 'Laptop Dell']);
        $item2 = $this->createTestInventoryItem($this->testUser['id'], null, ['name' => 'Laptop HP']);
        $item3 = $this->createTestInventoryItem($this->testUser['id'], null, ['name' => 'Monitor']);
        
        $this->createdItems = [$item1['id'], $item2['id'], $item3['id']];
        
        $stmt = self::$pdo->prepare("
            SELECT * FROM inventory_items WHERE user_id = ? AND name LIKE ?
        ");
        $stmt->execute([$this->testUser['id'], '%Laptop%']);
        $results = $stmt->fetchAll();
        
        $this->assertCount(2, $results);
    }

    public function testInventoryStatusCounts(): void
    {
        $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'in_stock']);
        $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'in_stock']);
        $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'out']);
        $item = $this->createTestInventoryItem($this->testUser['id'], null, ['status' => 'maintenance']);
        
        $this->createdItems[] = $item['id'];
        // Add others to cleanup
        $stmt = self::$pdo->prepare("SELECT id FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$this->testUser['id']]);
        foreach ($stmt->fetchAll() as $row) {
            if (!in_array($row['id'], $this->createdItems)) {
                $this->createdItems[] = $row['id'];
            }
        }
        
        // Get status distribution
        $stmt = self::$pdo->prepare("
            SELECT status, COUNT(*) as count FROM inventory_items 
            WHERE user_id = ? GROUP BY status
        ");
        $stmt->execute([$this->testUser['id']]);
        $results = $stmt->fetchAll();
        
        $counts = [];
        foreach ($results as $row) {
            $counts[$row['status']] = (int)$row['count'];
        }
        
        $this->assertEquals(2, $counts['in_stock'] ?? 0);
        $this->assertEquals(1, $counts['out'] ?? 0);
        $this->assertEquals(1, $counts['maintenance'] ?? 0);
    }

    public function testInventoryCategoryAggregation(): void
    {
        $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'IT']);
        $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'IT']);
        $this->createTestInventoryItem($this->testUser['id'], null, ['category' => 'Office']);
        
        // Get all created items for cleanup
        $stmt = self::$pdo->prepare("SELECT id FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$this->testUser['id']]);
        $this->createdItems = array_column($stmt->fetchAll(), 'id');
        
        $stmt = self::$pdo->prepare("
            SELECT category, COUNT(*) as count FROM inventory_items 
            WHERE user_id = ? GROUP BY category ORDER BY count DESC
        ");
        $stmt->execute([$this->testUser['id']]);
        $results = $stmt->fetchAll();
        
        $this->assertEquals('IT', $results[0]['category']);
        $this->assertEquals(2, (int)$results[0]['count']);
    }
}
