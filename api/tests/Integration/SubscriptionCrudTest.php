<?php

namespace Tests\Integration;

/**
 * Subscription CRUD Integration Tests
 */
class SubscriptionCrudTest extends TestCase
{
    private array $testUser;
    private array $createdSubscriptions = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser();
    }

    protected function tearDown(): void
    {
        foreach ($this->createdSubscriptions as $subId) {
            try {
                $stmt = self::$pdo->prepare("DELETE FROM subscriptions WHERE id = ?");
                $stmt->execute([$subId]);
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        if (isset($this->testUser['id'])) {
            $this->deleteTestUser($this->testUser['id']);
        }
    }

    public function testPlansTableExists(): void
    {
        $stmt = self::$pdo->query("SELECT * FROM plans ORDER BY price_monthly_zar");
        $plans = $stmt->fetchAll();
        
        $this->assertNotEmpty($plans);
        
        $planNames = array_column($plans, 'name');
        $this->assertContains('Free', $planNames);
    }

    public function testGetAllPlans(): void
    {
        $stmt = self::$pdo->query("SELECT * FROM plans");
        $plans = $stmt->fetchAll();
        
        foreach ($plans as $plan) {
            $this->assertArrayHasKey('id', $plan);
            $this->assertArrayHasKey('name', $plan);
            $this->assertArrayHasKey('price_monthly_zar', $plan);
            $this->assertArrayHasKey('features', $plan);
        }
    }

    public function testCreateSubscription(): void
    {
        // Get Pro plan ID
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, renewal_date, created_at)
            VALUES (?, ?, 'active', 'monthly', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        $this->assertDatabaseHas('subscriptions', [
            'id' => $subId,
            'user_id' => $this->testUser['id'],
            'status' => 'active'
        ]);
    }

    public function testReadCurrentSubscription(): void
    {
        // Create a subscription first
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        // Read it with plan details
        $stmt = self::$pdo->prepare("
            SELECT s.*, p.name as plan_name, p.price_monthly_zar, p.features
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
        ");
        $stmt->execute([$this->testUser['id']]);
        $result = $stmt->fetch();
        
        $this->assertNotFalse($result);
        $this->assertEquals('Pro', $result['plan_name']);
        $this->assertEquals('active', $result['status']);
    }

    public function testUpdateSubscriptionStatus(): void
    {
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        // Create active subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        // Cancel it
        $stmt = self::$pdo->prepare("UPDATE subscriptions SET status = 'canceled' WHERE id = ?");
        $stmt->execute([$subId]);
        
        $stmt = self::$pdo->prepare("SELECT status FROM subscriptions WHERE id = ?");
        $stmt->execute([$subId]);
        
        $this->assertEquals('canceled', $stmt->fetch()['status']);
    }

    public function testSubscriptionPlanChange(): void
    {
        // Get plan IDs
        $stmt = self::$pdo->query("SELECT id, name FROM plans WHERE name IN ('Pro', 'Enterprise')");
        $plans = $stmt->fetchAll(\PDO::FETCH_KEY_PAIR);
        
        if (count($plans) < 2) {
            $this->markTestSkipped('Need Pro and Enterprise plans');
        }
        
        // Create Pro subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $proId = array_search('Pro', array_flip($plans)) ?: array_key_first($plans);
        $stmt->execute([$this->testUser['id'], $proId]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        // Upgrade to Enterprise
        $enterpriseId = array_search('Enterprise', array_flip($plans)) ?: array_key_last($plans);
        $stmt = self::$pdo->prepare("UPDATE subscriptions SET plan_id = ? WHERE id = ?");
        $stmt->execute([$enterpriseId, $subId]);
        
        $stmt = self::$pdo->prepare("
            SELECT p.name FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.id = ?
        ");
        $stmt->execute([$subId]);
        
        $result = $stmt->fetch()['name'];
        $this->assertTrue(in_array($result, ['Pro', 'Enterprise']));
    }

    public function testSubscriptionFrequencyChange(): void
    {
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        // Create monthly subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        // Change to annual
        $stmt = self::$pdo->prepare("UPDATE subscriptions SET frequency = 'annual' WHERE id = ?");
        $stmt->execute([$subId]);
        
        $stmt = self::$pdo->prepare("SELECT frequency FROM subscriptions WHERE id = ?");
        $stmt->execute([$subId]);
        
        $this->assertEquals('annual', $stmt->fetch()['frequency']);
    }

    public function testSubscriptionRenewalDate(): void
    {
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        $renewalDate = date('Y-m-d', strtotime('+30 days'));
        
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, renewal_date, created_at)
            VALUES (?, ?, 'active', 'monthly', ?, NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id'], $renewalDate]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        $stmt = self::$pdo->prepare("SELECT renewal_date FROM subscriptions WHERE id = ?");
        $stmt->execute([$subId]);
        $result = $stmt->fetch();
        
        $this->assertEquals($renewalDate, date('Y-m-d', strtotime($result['renewal_date'])));
    }

    public function testCancelSubscription(): void
    {
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        // Create active subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId;
        
        // Cancel
        $stmt = self::$pdo->prepare("
            UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE id = ?
        ");
        $stmt->execute([$subId]);
        
        // Downgrade user to Free
        $stmt = self::$pdo->prepare("UPDATE users SET plan = 'Free' WHERE id = ?");
        $stmt->execute([$this->testUser['id']]);
        
        // Verify
        $stmt = self::$pdo->prepare("SELECT status FROM subscriptions WHERE id = ?");
        $stmt->execute([$subId]);
        $this->assertEquals('canceled', $stmt->fetch()['status']);
        
        $stmt = self::$pdo->prepare("SELECT plan FROM users WHERE id = ?");
        $stmt->execute([$this->testUser['id']]);
        $this->assertEquals('Free', $stmt->fetch()['plan']);
    }

    public function testOnlyOneActiveSubscriptionPerUser(): void
    {
        $stmt = self::$pdo->prepare("SELECT id FROM plans WHERE name = 'Pro'");
        $stmt->execute();
        $proPlan = $stmt->fetch();
        
        if (!$proPlan) {
            $this->markTestSkipped('Pro plan not found');
        }
        
        // Create first subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId1 = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId1;
        
        // Cancel old before creating new
        $stmt = self::$pdo->prepare("
            UPDATE subscriptions SET status = 'canceled' WHERE user_id = ? AND status = 'active'
        ");
        $stmt->execute([$this->testUser['id']]);
        
        // Create second subscription
        $stmt = self::$pdo->prepare("
            INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
            VALUES (?, ?, 'active', 'monthly', NOW())
        ");
        $stmt->execute([$this->testUser['id'], $proPlan['id']]);
        $subId2 = (int)self::$pdo->lastInsertId();
        $this->createdSubscriptions[] = $subId2;
        
        // Verify only one active
        $stmt = self::$pdo->prepare("
            SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ? AND status = 'active'
        ");
        $stmt->execute([$this->testUser['id']]);
        
        $this->assertEquals(1, (int)$stmt->fetch()['count']);
    }
}
