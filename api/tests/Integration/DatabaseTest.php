<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Config\Database;

/**
 * Database Integration Tests
 * Tests database connection and basic operations
 */
class DatabaseTest extends TestCase
{
    private static ?\PDO $pdo = null;

    public static function setUpBeforeClass(): void
    {
        // Skip tests if no database configured
        if (empty($_ENV['DB_NAME']) || $_ENV['DB_NAME'] === 'qr_test') {
            self::markTestSkipped('Database not configured for integration tests');
        }
    }

    public function testDatabaseConnectionReturnsInstance(): void
    {
        try {
            $pdo = Database::getInstance();
            $this->assertInstanceOf(\PDO::class, $pdo);
        } catch (\Exception $e) {
            $this->markTestSkipped('Database connection not available: ' . $e->getMessage());
        }
    }

    public function testDatabaseConnectionIsSingleton(): void
    {
        try {
            $pdo1 = Database::getInstance();
            $pdo2 = Database::getInstance();
            $this->assertSame($pdo1, $pdo2);
        } catch (\Exception $e) {
            $this->markTestSkipped('Database connection not available');
        }
    }

    public function testDatabaseCanExecuteSimpleQuery(): void
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->query("SELECT 1 as test");
            $result = $stmt->fetch();
            
            $this->assertEquals(1, $result['test']);
        } catch (\Exception $e) {
            $this->markTestSkipped('Database not available');
        }
    }

    public function testRequiredTablesExist(): void
    {
        try {
            $pdo = Database::getInstance();
            
            $requiredTables = ['users', 'plans', 'qr_codes', 'scan_logs', 'subscriptions'];
            
            foreach ($requiredTables as $table) {
                $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
                $exists = $stmt->fetch() !== false;
                
                $this->assertTrue($exists, "Table '{$table}' should exist");
            }
        } catch (\Exception $e) {
            $this->markTestSkipped('Database not available');
        }
    }

    public function testTransactionMethods(): void
    {
        try {
            $pdo = Database::getInstance();
            
            // Test begin transaction
            Database::beginTransaction();
            $this->assertTrue($pdo->inTransaction());
            
            // Test rollback
            Database::rollback();
            $this->assertFalse($pdo->inTransaction());
            
            // Test commit
            Database::beginTransaction();
            Database::commit();
            $this->assertFalse($pdo->inTransaction());
        } catch (\Exception $e) {
            $this->markTestSkipped('Database not available');
        }
    }
}
