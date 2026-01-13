<?php

namespace Tests\Integration;

/**
 * Scan Log Integration Tests
 * Tests QR code scanning and analytics
 */
class ScanLogTest extends TestCase
{
    private array $testUser;
    private array $testQR;
    private array $createdScans = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser(['plan' => 'Pro']);
        $this->testQR = $this->createTestQRCode($this->testUser['id']);
    }

    protected function tearDown(): void
    {
        // Clean up scans
        foreach ($this->createdScans as $scanId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM scan_logs WHERE id = ?");
                $stmt->execute([$scanId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Clean up QR code
        if (isset($this->testQR['id'])) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM scan_logs WHERE qr_id = ?");
                $stmt->execute([$this->testQR['id']]);
                $stmt = self::$pdo->prepare("DELETE FROM qr_codes WHERE id = ?");
                $stmt->execute([$this->testQR['id']]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        if (isset($this->testUser['id'])) {
            $this->deleteTestUser($this->testUser['id']);
        }
    }

    public function testLogScan(): void
    {
        $stmt = self::$pdo->prepare("
            INSERT INTO scan_logs (qr_id, ip_hash, user_agent, country, city, device, browser, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $this->testQR['id'],
            hash('sha256', '192.168.1.1'),
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'ZA',
            'Cape Town',
            'Desktop',
            'Chrome'
        ]);
        
        $scanId = (int)self::$pdo->lastInsertId();
        $this->createdScans[] = $scanId;
        
        $this->assertGreaterThan(0, $scanId);
        $this->assertDatabaseHas('scan_logs', [
            'id' => $scanId,
            'qr_id' => $this->testQR['id']
        ]);
    }

    public function testGetScansForQRCode(): void
    {
        // Create multiple scans
        for ($i = 0; $i < 5; $i++) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', "ip_{$i}")]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
        }
        
        $stmt = self::$pdo->prepare("SELECT * FROM scan_logs WHERE qr_id = ?");
        $stmt->execute([$this->testQR['id']]);
        $scans = $stmt->fetchAll();
        
        $this->assertCount(5, $scans);
    }

    public function testScanCountAggregation(): void
    {
        // Create scans
        for ($i = 0; $i < 10; $i++) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', "ip_{$i}")]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
        }
        
        $stmt = self::$pdo->prepare("SELECT COUNT(*) as total FROM scan_logs WHERE qr_id = ?");
        $stmt->execute([$this->testQR['id']]);
        
        $this->assertEquals(10, (int)$stmt->fetch()['total']);
    }

    public function testUniqueScanCount(): void
    {
        // Create scans with some duplicate IPs
        $ips = ['ip1', 'ip1', 'ip2', 'ip3', 'ip3', 'ip3'];
        
        foreach ($ips as $ip) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', $ip)]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
        }
        
        // Total scans
        $stmt = self::$pdo->prepare("SELECT COUNT(*) as total FROM scan_logs WHERE qr_id = ?");
        $stmt->execute([$this->testQR['id']]);
        $this->assertEquals(6, (int)$stmt->fetch()['total']);
        
        // Unique scans
        $stmt = self::$pdo->prepare("SELECT COUNT(DISTINCT ip_hash) as unique_count FROM scan_logs WHERE qr_id = ?");
        $stmt->execute([$this->testQR['id']]);
        $this->assertEquals(3, (int)$stmt->fetch()['unique_count']);
    }

    public function testScansByCountry(): void
    {
        // Create scans from different countries
        $countries = ['ZA', 'ZA', 'US', 'GB', 'ZA'];
        
        foreach ($countries as $i => $country) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, country, timestamp)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', "ip_{$i}"), $country]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
        }
        
        $stmt = self::$pdo->prepare("
            SELECT country, COUNT(*) as count 
            FROM scan_logs WHERE qr_id = ? 
            GROUP BY country ORDER BY count DESC
        ");
        $stmt->execute([$this->testQR['id']]);
        $results = $stmt->fetchAll();
        
        $this->assertEquals('ZA', $results[0]['country']);
        $this->assertEquals(3, (int)$results[0]['count']);
    }

    public function testScansByDevice(): void
    {
        $devices = ['Mobile', 'Desktop', 'Mobile', 'Tablet', 'Mobile'];
        
        foreach ($devices as $i => $device) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, device, timestamp)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', "ip_{$i}"), $device]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
        }
        
        $stmt = self::$pdo->prepare("
            SELECT device, COUNT(*) as count 
            FROM scan_logs WHERE qr_id = ? 
            GROUP BY device ORDER BY count DESC
        ");
        $stmt->execute([$this->testQR['id']]);
        $results = $stmt->fetchAll();
        
        $this->assertEquals('Mobile', $results[0]['device']);
        $this->assertEquals(3, (int)$results[0]['count']);
    }

    public function testScansInDateRange(): void
    {
        // Create scans at different times
        $stmt = self::$pdo->prepare("
            INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
            VALUES (?, ?, DATE_SUB(NOW(), INTERVAL 1 DAY))
        ");
        $stmt->execute([$this->testQR['id'], hash('sha256', 'yesterday')]);
        $this->createdScans[] = (int)self::$pdo->lastInsertId();
        
        $stmt = self::$pdo->prepare("
            INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$this->testQR['id'], hash('sha256', 'today')]);
        $this->createdScans[] = (int)self::$pdo->lastInsertId();
        
        $stmt = self::$pdo->prepare("
            INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
            VALUES (?, ?, DATE_SUB(NOW(), INTERVAL 10 DAY))
        ");
        $stmt->execute([$this->testQR['id'], hash('sha256', 'last_week')]);
        $this->createdScans[] = (int)self::$pdo->lastInsertId();
        
        // Get scans from last 7 days
        $stmt = self::$pdo->prepare("
            SELECT COUNT(*) as count FROM scan_logs 
            WHERE qr_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stmt->execute([$this->testQR['id']]);
        
        $this->assertEquals(2, (int)$stmt->fetch()['count']);
    }

    public function testQRCodeTotalScansUpdates(): void
    {
        // Log some scans
        for ($i = 0; $i < 3; $i++) {
            $stmt = self::$pdo->prepare("
                INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$this->testQR['id'], hash('sha256', "ip_{$i}")]);
            $this->createdScans[] = (int)self::$pdo->lastInsertId();
            
            // Update QR code total_scans
            $stmt = self::$pdo->prepare("
                UPDATE qr_codes SET total_scans = total_scans + 1 WHERE id = ?
            ");
            $stmt->execute([$this->testQR['id']]);
        }
        
        // Verify total_scans matches
        $stmt = self::$pdo->prepare("SELECT total_scans FROM qr_codes WHERE id = ?");
        $stmt->execute([$this->testQR['id']]);
        
        $this->assertEquals(3, (int)$stmt->fetch()['total_scans']);
    }

    public function testLastScanTimestamp(): void
    {
        // Log a scan
        $stmt = self::$pdo->prepare("
            INSERT INTO scan_logs (qr_id, ip_hash, timestamp)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$this->testQR['id'], hash('sha256', 'test_ip')]);
        $this->createdScans[] = (int)self::$pdo->lastInsertId();
        
        // Get last scan
        $stmt = self::$pdo->prepare("
            SELECT MAX(timestamp) as last_scan FROM scan_logs WHERE qr_id = ?
        ");
        $stmt->execute([$this->testQR['id']]);
        $result = $stmt->fetch();
        
        $this->assertNotNull($result['last_scan']);
        
        // Should be within last minute
        $lastScanTime = strtotime($result['last_scan']);
        $this->assertGreaterThan(time() - 60, $lastScanTime);
    }
}
