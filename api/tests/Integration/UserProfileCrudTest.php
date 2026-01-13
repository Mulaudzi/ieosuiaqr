<?php

namespace Tests\Integration;

/**
 * User Profile CRUD Integration Tests
 */
class UserProfileCrudTest extends TestCase
{
    private array $createdUsers = [];

    protected function tearDown(): void
    {
        foreach ($this->createdUsers as $userId) {
            $this->deleteTestUser($userId);
        }
    }

    public function testCreateUser(): void
    {
        $email = 'create_test_' . uniqid() . '@example.com';
        $password = 'SecurePassword123';
        $name = 'Create Test User';
        
        $stmt = self::$pdo->prepare("
            INSERT INTO users (email, password, name, plan, created_at)
            VALUES (?, ?, ?, 'Free', NOW())
        ");
        $stmt->execute([
            strtolower($email),
            password_hash($password, PASSWORD_BCRYPT),
            $name
        ]);
        
        $userId = (int)self::$pdo->lastInsertId();
        $this->createdUsers[] = $userId;
        
        $this->assertGreaterThan(0, $userId);
        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'email' => strtolower($email),
            'name' => $name
        ]);
    }

    public function testReadUserProfile(): void
    {
        $user = $this->createTestUser([
            'name' => 'Profile Read Test',
            'plan' => 'Pro'
        ]);
        $this->createdUsers[] = $user['id'];
        
        $stmt = self::$pdo->prepare("
            SELECT id, email, name, plan, email_verified_at, avatar_url, created_at
            FROM users WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        $result = $stmt->fetch();
        
        $this->assertNotFalse($result);
        $this->assertEquals('Profile Read Test', $result['name']);
        $this->assertEquals('Pro', $result['plan']);
        
        // Sensitive fields should not be queried
        $this->assertArrayNotHasKey('password', $result);
    }

    public function testUpdateUserName(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        $newName = 'Updated Name ' . uniqid();
        
        $stmt = self::$pdo->prepare("UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$newName, $user['id']]);
        
        $stmt = self::$pdo->prepare("SELECT name FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $this->assertEquals($newName, $stmt->fetch()['name']);
    }

    public function testUpdateUserEmail(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        $newEmail = 'updated_' . uniqid() . '@example.com';
        
        $stmt = self::$pdo->prepare("UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([strtolower($newEmail), $user['id']]);
        
        $this->assertDatabaseHas('users', [
            'id' => $user['id'],
            'email' => strtolower($newEmail)
        ]);
    }

    public function testUpdateUserPassword(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        $newPassword = 'NewSecurePassword456';
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        
        $stmt = self::$pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$hashedPassword, $user['id']]);
        
        // Verify password was changed by checking it verifies
        $stmt = self::$pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $storedHash = $stmt->fetch()['password'];
        
        $this->assertTrue(password_verify($newPassword, $storedHash));
        $this->assertFalse(password_verify($user['password'], $storedHash)); // Old password no longer works
    }

    public function testUpdateUserAvatarUrl(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        $avatarUrl = 'https://example.com/avatars/user_' . $user['id'] . '.jpg';
        
        $stmt = self::$pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $user['id']]);
        
        $stmt = self::$pdo->prepare("SELECT avatar_url FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $this->assertEquals($avatarUrl, $stmt->fetch()['avatar_url']);
    }

    public function testDeleteUser(): void
    {
        $user = $this->createTestUser();
        // Don't add to cleanup since we're deleting
        
        $stmt = self::$pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $this->assertDatabaseMissing('users', ['id' => $user['id']]);
    }

    public function testDeleteUserCascadesData(): void
    {
        $user = $this->createTestUser(['plan' => 'Pro']);
        
        // Create related data
        $qr = $this->createTestQRCode($user['id']);
        $item = $this->createTestInventoryItem($user['id']);
        
        // Now delete all user data
        $this->deleteTestUser($user['id']);
        
        // Verify cascade
        $this->assertDatabaseMissing('users', ['id' => $user['id']]);
        $this->assertDatabaseMissing('qr_codes', ['id' => $qr['id']]);
        $this->assertDatabaseMissing('inventory_items', ['id' => $item['id']]);
    }

    public function testEmailUniqueness(): void
    {
        $email = 'unique_' . uniqid() . '@example.com';
        
        $user1 = $this->createTestUser(['email' => $email]);
        $this->createdUsers[] = $user1['id'];
        
        // Try to create another user with same email
        $this->expectException(\PDOException::class);
        
        $stmt = self::$pdo->prepare("
            INSERT INTO users (email, password, name, plan, created_at)
            VALUES (?, ?, 'Duplicate User', 'Free', NOW())
        ");
        $stmt->execute([strtolower($email), password_hash('password', PASSWORD_BCRYPT)]);
    }

    public function testEmailVerification(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        // Initially not verified
        $stmt = self::$pdo->prepare("SELECT email_verified_at FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Our createTestUser sets verification, so let's test the update
        $stmt = self::$pdo->prepare("UPDATE users SET email_verified_at = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $stmt = self::$pdo->prepare("SELECT email_verified_at FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $this->assertNull($stmt->fetch()['email_verified_at']);
        
        // Verify email
        $stmt = self::$pdo->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $stmt = self::$pdo->prepare("SELECT email_verified_at FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $this->assertNotNull($stmt->fetch()['email_verified_at']);
    }

    public function testNotificationPreferencesUpdate(): void
    {
        $user = $this->createTestUser();
        $this->createdUsers[] = $user['id'];
        
        // Update notification preferences
        $stmt = self::$pdo->prepare("
            UPDATE users SET 
                email_notifications = 1,
                scan_alerts = 0,
                weekly_report = 1,
                marketing_emails = 0
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        
        $stmt = self::$pdo->prepare("
            SELECT email_notifications, scan_alerts, weekly_report, marketing_emails
            FROM users WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        $prefs = $stmt->fetch();
        
        $this->assertEquals(1, (int)$prefs['email_notifications']);
        $this->assertEquals(0, (int)$prefs['scan_alerts']);
        $this->assertEquals(1, (int)$prefs['weekly_report']);
        $this->assertEquals(0, (int)$prefs['marketing_emails']);
    }

    public function testUserPlanUpgrade(): void
    {
        $user = $this->createTestUser(['plan' => 'Free']);
        $this->createdUsers[] = $user['id'];
        
        // Upgrade to Pro
        $stmt = self::$pdo->prepare("UPDATE users SET plan = 'Pro', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $this->assertDatabaseHas('users', [
            'id' => $user['id'],
            'plan' => 'Pro'
        ]);
    }
}
