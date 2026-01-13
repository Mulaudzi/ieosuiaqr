<?php

namespace Tests\Integration;

use App\Config\Database;

/**
 * QR Code CRUD Integration Tests
 * Tests complete create, read, update, delete workflows
 */
class QrCodeCrudTest extends TestCase
{
    private array $testUser;
    private array $createdQRCodes = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser(['plan' => 'Pro']);
    }

    protected function tearDown(): void
    {
        // Clean up created QR codes
        foreach ($this->createdQRCodes as $qrId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM scan_logs WHERE qr_id = ?");
                $stmt->execute([$qrId]);
                $stmt = self::$pdo->prepare("DELETE FROM qr_codes WHERE id = ?");
                $stmt->execute([$qrId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Clean up test user
        if (isset($this->testUser['id'])) {
            $this->deleteTestUser($this->testUser['id']);
        }
    }

    public function testCreateQRCode(): void
    {
        $stmt = self::$pdo->prepare("
            INSERT INTO qr_codes (user_id, type, name, content, is_active, created_at)
            VALUES (?, 'url', 'Integration Test QR', ?, 1, NOW())
        ");
        $content = json_encode(['url' => 'https://test.example.com']);
        $stmt->execute([$this->testUser['id'], $content]);
        
        $qrId = (int)self::$pdo->lastInsertId();
        $this->createdQRCodes[] = $qrId;
        
        $this->assertGreaterThan(0, $qrId);
        
        // Verify it was created
        $this->assertDatabaseHas('qr_codes', [
            'id' => $qrId,
            'user_id' => $this->testUser['id'],
            'type' => 'url'
        ]);
    }

    public function testReadQRCode(): void
    {
        // Create a QR code
        $qr = $this->createTestQRCode($this->testUser['id'], [
            'name' => 'Read Test QR',
            'type' => 'text'
        ]);
        $this->createdQRCodes[] = $qr['id'];
        
        // Read it back
        $stmt = self::$pdo->prepare("SELECT * FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$qr['id'], $this->testUser['id']]);
        $result = $stmt->fetch();
        
        $this->assertNotFalse($result);
        $this->assertEquals('Read Test QR', $result['name']);
        $this->assertEquals('text', $result['type']);
        $this->assertEquals($this->testUser['id'], $result['user_id']);
    }

    public function testUpdateQRCode(): void
    {
        // Create a QR code
        $qr = $this->createTestQRCode($this->testUser['id'], [
            'name' => 'Original Name'
        ]);
        $this->createdQRCodes[] = $qr['id'];
        
        // Update it
        $stmt = self::$pdo->prepare("
            UPDATE qr_codes SET name = ?, updated_at = NOW() WHERE id = ? AND user_id = ?
        ");
        $stmt->execute(['Updated Name', $qr['id'], $this->testUser['id']]);
        
        $this->assertEquals(1, $stmt->rowCount());
        
        // Verify update
        $stmt = self::$pdo->prepare("SELECT name FROM qr_codes WHERE id = ?");
        $stmt->execute([$qr['id']]);
        $result = $stmt->fetch();
        
        $this->assertEquals('Updated Name', $result['name']);
    }

    public function testDeleteQRCode(): void
    {
        // Create a QR code
        $qr = $this->createTestQRCode($this->testUser['id']);
        // Don't add to cleanup list since we're deleting it
        
        // Delete it
        $stmt = self::$pdo->prepare("DELETE FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$qr['id'], $this->testUser['id']]);
        
        $this->assertEquals(1, $stmt->rowCount());
        
        // Verify deletion
        $this->assertDatabaseMissing('qr_codes', ['id' => $qr['id']]);
    }

    public function testListQRCodesWithPagination(): void
    {
        // Create multiple QR codes
        for ($i = 1; $i <= 5; $i++) {
            $qr = $this->createTestQRCode($this->testUser['id'], [
                'name' => "Pagination Test QR {$i}"
            ]);
            $this->createdQRCodes[] = $qr['id'];
        }
        
        // Get paginated list (page 1, limit 2)
        $stmt = self::$pdo->prepare("
            SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 2 OFFSET 0
        ");
        $stmt->execute([$this->testUser['id']]);
        $page1 = $stmt->fetchAll();
        
        $this->assertCount(2, $page1);
        
        // Get page 2
        $stmt = self::$pdo->prepare("
            SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 2 OFFSET 2
        ");
        $stmt->execute([$this->testUser['id']]);
        $page2 = $stmt->fetchAll();
        
        $this->assertCount(2, $page2);
        
        // Verify no overlap
        $page1Ids = array_column($page1, 'id');
        $page2Ids = array_column($page2, 'id');
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }

    public function testQRCodeSearchByName(): void
    {
        // Create QR codes with different names
        $qr1 = $this->createTestQRCode($this->testUser['id'], ['name' => 'Alpha Search']);
        $qr2 = $this->createTestQRCode($this->testUser['id'], ['name' => 'Beta Search']);
        $qr3 = $this->createTestQRCode($this->testUser['id'], ['name' => 'Gamma Other']);
        
        $this->createdQRCodes = array_merge($this->createdQRCodes, [$qr1['id'], $qr2['id'], $qr3['id']]);
        
        // Search for "Search"
        $stmt = self::$pdo->prepare("
            SELECT * FROM qr_codes WHERE user_id = ? AND name LIKE ?
        ");
        $stmt->execute([$this->testUser['id'], '%Search%']);
        $results = $stmt->fetchAll();
        
        $this->assertCount(2, $results);
        
        $names = array_column($results, 'name');
        $this->assertContains('Alpha Search', $names);
        $this->assertContains('Beta Search', $names);
        $this->assertNotContains('Gamma Other', $names);
    }

    public function testQRCodeFilterByType(): void
    {
        // Create QR codes of different types
        $qr1 = $this->createTestQRCode($this->testUser['id'], ['type' => 'url']);
        $qr2 = $this->createTestQRCode($this->testUser['id'], ['type' => 'text']);
        $qr3 = $this->createTestQRCode($this->testUser['id'], ['type' => 'url']);
        
        $this->createdQRCodes = array_merge($this->createdQRCodes, [$qr1['id'], $qr2['id'], $qr3['id']]);
        
        // Filter by URL type
        $stmt = self::$pdo->prepare("
            SELECT * FROM qr_codes WHERE user_id = ? AND type = ?
        ");
        $stmt->execute([$this->testUser['id'], 'url']);
        $results = $stmt->fetchAll();
        
        $this->assertCount(2, $results);
        
        foreach ($results as $result) {
            $this->assertEquals('url', $result['type']);
        }
    }

    public function testQRCodeOwnershipValidation(): void
    {
        // Create another user
        $otherUser = $this->createTestUser(['email' => 'other_' . uniqid() . '@test.com']);
        
        // Create QR code for first user
        $qr = $this->createTestQRCode($this->testUser['id']);
        $this->createdQRCodes[] = $qr['id'];
        
        // Try to read with wrong user
        $stmt = self::$pdo->prepare("SELECT * FROM qr_codes WHERE id = ? AND user_id = ?");
        $stmt->execute([$qr['id'], $otherUser['id']]);
        $result = $stmt->fetch();
        
        $this->assertFalse($result);
        
        // Clean up other user
        $this->deleteTestUser($otherUser['id']);
    }

    public function testQRCodeTotalScansIncrement(): void
    {
        // Create a QR code
        $qr = $this->createTestQRCode($this->testUser['id']);
        $this->createdQRCodes[] = $qr['id'];
        
        // Simulate scans by incrementing total_scans
        for ($i = 0; $i < 5; $i++) {
            $stmt = self::$pdo->prepare("
                UPDATE qr_codes SET total_scans = total_scans + 1 WHERE id = ?
            ");
            $stmt->execute([$qr['id']]);
        }
        
        // Verify count
        $stmt = self::$pdo->prepare("SELECT total_scans FROM qr_codes WHERE id = ?");
        $stmt->execute([$qr['id']]);
        $result = $stmt->fetch();
        
        $this->assertEquals(5, (int)$result['total_scans']);
    }

    public function testQRCodeToggleActive(): void
    {
        // Create an active QR code
        $qr = $this->createTestQRCode($this->testUser['id']);
        $this->createdQRCodes[] = $qr['id'];
        
        // Verify it's active
        $stmt = self::$pdo->prepare("SELECT is_active FROM qr_codes WHERE id = ?");
        $stmt->execute([$qr['id']]);
        $this->assertEquals(1, (int)$stmt->fetch()['is_active']);
        
        // Deactivate
        $stmt = self::$pdo->prepare("UPDATE qr_codes SET is_active = 0 WHERE id = ?");
        $stmt->execute([$qr['id']]);
        
        // Verify it's inactive
        $stmt = self::$pdo->prepare("SELECT is_active FROM qr_codes WHERE id = ?");
        $stmt->execute([$qr['id']]);
        $this->assertEquals(0, (int)$stmt->fetch()['is_active']);
    }
}
