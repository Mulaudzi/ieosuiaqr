<?php

namespace Tests\Integration;

/**
 * Billing and Invoice Integration Tests
 */
class BillingTest extends TestCase
{
    private array $testUser;
    private array $createdInvoices = [];
    private array $createdPayments = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser(['plan' => 'Pro']);
    }

    protected function tearDown(): void
    {
        foreach ($this->createdInvoices as $invoiceId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM invoices WHERE id = ?");
                $stmt->execute([$invoiceId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        foreach ($this->createdPayments as $paymentId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM payments WHERE id = ?");
                $stmt->execute([$paymentId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        if (isset($this->testUser['id'])) {
            $this->deleteTestUser($this->testUser['id']);
        }
    }

    public function testCreateInvoice(): void
    {
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . uniqid();
        
        $stmt = self::$pdo->prepare("
            INSERT INTO invoices (user_id, invoice_number, amount_zar, status, description, created_at)
            VALUES (?, ?, 299.00, 'paid', 'Pro Plan - Monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $invoiceNumber]);
        
        $invoiceId = (int)self::$pdo->lastInsertId();
        $this->createdInvoices[] = $invoiceId;
        
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'invoice_number' => $invoiceNumber,
            'status' => 'paid'
        ]);
    }

    public function testReadInvoice(): void
    {
        $invoiceNumber = 'INV-READ-' . uniqid();
        
        $stmt = self::$pdo->prepare("
            INSERT INTO invoices (user_id, invoice_number, amount_zar, status, description, created_at)
            VALUES (?, ?, 599.00, 'paid', 'Enterprise Plan', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $invoiceNumber]);
        $invoiceId = (int)self::$pdo->lastInsertId();
        $this->createdInvoices[] = $invoiceId;
        
        $stmt = self::$pdo->prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$invoiceId, $this->testUser['id']]);
        $invoice = $stmt->fetch();
        
        $this->assertNotFalse($invoice);
        $this->assertEquals(599.00, (float)$invoice['amount_zar']);
        $this->assertEquals('Enterprise Plan', $invoice['description']);
    }

    public function testListUserInvoices(): void
    {
        // Create multiple invoices
        for ($i = 1; $i <= 3; $i++) {
            $stmt = self::$pdo->prepare("
                INSERT INTO invoices (user_id, invoice_number, amount_zar, status, created_at)
                VALUES (?, ?, ?, 'paid', NOW())
            ");
            $stmt->execute([
                $this->testUser['id'],
                'INV-LIST-' . uniqid(),
                $i * 100
            ]);
            $this->createdInvoices[] = (int)self::$pdo->lastInsertId();
        }
        
        $stmt = self::$pdo->prepare("
            SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC
        ");
        $stmt->execute([$this->testUser['id']]);
        $invoices = $stmt->fetchAll();
        
        $this->assertGreaterThanOrEqual(3, count($invoices));
    }

    public function testInvoiceOwnershipValidation(): void
    {
        // Create invoice for test user
        $stmt = self::$pdo->prepare("
            INSERT INTO invoices (user_id, invoice_number, amount_zar, status, created_at)
            VALUES (?, 'INV-OWNER-TEST', 100, 'paid', NOW())
        ");
        $stmt->execute([$this->testUser['id']]);
        $invoiceId = (int)self::$pdo->lastInsertId();
        $this->createdInvoices[] = $invoiceId;
        
        // Create another user
        $otherUser = $this->createTestUser(['email' => 'other_billing_' . uniqid() . '@test.com']);
        
        // Try to access with wrong user
        $stmt = self::$pdo->prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$invoiceId, $otherUser['id']]);
        
        $this->assertFalse($stmt->fetch());
        
        $this->deleteTestUser($otherUser['id']);
    }

    public function testCreatePayment(): void
    {
        $paymentId = 'PAY-' . strtoupper(bin2hex(random_bytes(8)));
        
        $stmt = self::$pdo->prepare("
            INSERT INTO payments (user_id, payment_id, amount_zar, status, payment_method, provider, created_at)
            VALUES (?, ?, 299.00, 'completed', 'payfast', 'payfast', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $paymentId]);
        
        $id = (int)self::$pdo->lastInsertId();
        $this->createdPayments[] = $id;
        
        $this->assertDatabaseHas('payments', [
            'payment_id' => $paymentId,
            'status' => 'completed'
        ]);
    }

    public function testPaymentStatusTransitions(): void
    {
        $paymentId = 'PAY-STATUS-' . uniqid();
        
        // Create pending payment
        $stmt = self::$pdo->prepare("
            INSERT INTO payments (user_id, payment_id, amount_zar, status, provider, created_at)
            VALUES (?, ?, 299.00, 'pending', 'payfast', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $paymentId]);
        $id = (int)self::$pdo->lastInsertId();
        $this->createdPayments[] = $id;
        
        // Verify pending
        $stmt = self::$pdo->prepare("SELECT status FROM payments WHERE id = ?");
        $stmt->execute([$id]);
        $this->assertEquals('pending', $stmt->fetch()['status']);
        
        // Mark as completed
        $stmt = self::$pdo->prepare("UPDATE payments SET status = 'completed' WHERE id = ?");
        $stmt->execute([$id]);
        
        $stmt = self::$pdo->prepare("SELECT status FROM payments WHERE id = ?");
        $stmt->execute([$id]);
        $this->assertEquals('completed', $stmt->fetch()['status']);
    }

    public function testPaymentHistory(): void
    {
        // Create payment history
        $statuses = ['completed', 'completed', 'failed', 'completed'];
        
        foreach ($statuses as $i => $status) {
            $stmt = self::$pdo->prepare("
                INSERT INTO payments (user_id, payment_id, amount_zar, status, provider, created_at)
                VALUES (?, ?, 100, ?, 'payfast', DATE_SUB(NOW(), INTERVAL ? DAY))
            ");
            $stmt->execute([
                $this->testUser['id'],
                'PAY-HIST-' . uniqid(),
                $status,
                $i
            ]);
            $this->createdPayments[] = (int)self::$pdo->lastInsertId();
        }
        
        // Get successful payments
        $stmt = self::$pdo->prepare("
            SELECT COUNT(*) as count FROM payments 
            WHERE user_id = ? AND status = 'completed'
        ");
        $stmt->execute([$this->testUser['id']]);
        $successCount = (int)$stmt->fetch()['count'];
        
        $this->assertGreaterThanOrEqual(3, $successCount);
    }

    public function testInvoiceAmountCalculation(): void
    {
        // Create invoice
        $stmt = self::$pdo->prepare("
            INSERT INTO invoices (user_id, invoice_number, amount_zar, tax_zar, total_zar, status, created_at)
            VALUES (?, 'INV-CALC-TEST', 260.87, 39.13, 300.00, 'paid', NOW())
        ");
        $stmt->execute([$this->testUser['id']]);
        $invoiceId = (int)self::$pdo->lastInsertId();
        $this->createdInvoices[] = $invoiceId;
        
        $stmt = self::$pdo->prepare("SELECT amount_zar, tax_zar, total_zar FROM invoices WHERE id = ?");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();
        
        // Verify calculation (amount + tax = total)
        $calculatedTotal = (float)$invoice['amount_zar'] + (float)$invoice['tax_zar'];
        $this->assertEquals((float)$invoice['total_zar'], $calculatedTotal, '', 0.01);
    }

    public function testInvoicePagination(): void
    {
        // Create 10 invoices
        for ($i = 0; $i < 10; $i++) {
            $stmt = self::$pdo->prepare("
                INSERT INTO invoices (user_id, invoice_number, amount_zar, status, created_at)
                VALUES (?, ?, 100, 'paid', NOW())
            ");
            $stmt->execute([$this->testUser['id'], 'INV-PAGE-' . $i . '-' . uniqid()]);
            $this->createdInvoices[] = (int)self::$pdo->lastInsertId();
        }
        
        // Get page 1 (5 per page)
        $stmt = self::$pdo->prepare("
            SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 5 OFFSET 0
        ");
        $stmt->execute([$this->testUser['id']]);
        $page1 = $stmt->fetchAll();
        
        // Get page 2
        $stmt = self::$pdo->prepare("
            SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 5 OFFSET 5
        ");
        $stmt->execute([$this->testUser['id']]);
        $page2 = $stmt->fetchAll();
        
        $this->assertCount(5, $page1);
        $this->assertCount(5, $page2);
        
        // No overlap
        $page1Ids = array_column($page1, 'id');
        $page2Ids = array_column($page2, 'id');
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }

    public function testTotalRevenue(): void
    {
        // Create payments
        $amounts = [100, 200, 300];
        
        foreach ($amounts as $amount) {
            $stmt = self::$pdo->prepare("
                INSERT INTO payments (user_id, payment_id, amount_zar, status, provider, created_at)
                VALUES (?, ?, ?, 'completed', 'payfast', NOW())
            ");
            $stmt->execute([
                $this->testUser['id'],
                'PAY-REV-' . uniqid(),
                $amount
            ]);
            $this->createdPayments[] = (int)self::$pdo->lastInsertId();
        }
        
        // Calculate total
        $stmt = self::$pdo->prepare("
            SELECT SUM(amount_zar) as total FROM payments 
            WHERE user_id = ? AND status = 'completed'
        ");
        $stmt->execute([$this->testUser['id']]);
        
        $total = (float)$stmt->fetch()['total'];
        $this->assertEquals(600, $total);
    }
}
