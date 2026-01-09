<?php
/**
 * Test User Seeder
 * Run: php seed_test_user.php
 * 
 * Creates a test user with verified email for development/testing
 */

$host = 'localhost';
$dbname = 'ejetffbz_qr';
$username = 'ejetffbz_ieosuia';
$password = 'I Am Ieosuia';

try {
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "Connected to database successfully.\n";

    // Test user credentials
    $testEmail = 'test@ieosuia.co.za';
    $testPassword = '123456789';
    $testName = 'Test User';
    $hashedPassword = password_hash($testPassword, PASSWORD_DEFAULT);

    // Check if user already exists
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $checkStmt->execute([$testEmail]);
    
    if ($checkStmt->fetch()) {
        // Update existing user
        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET password = ?, 
                name = ?, 
                plan = 'Pro',
                email_verified_at = NOW(),
                verification_token = NULL,
                reset_token = NULL,
                reset_token_expires = NULL,
                updated_at = NOW()
            WHERE email = ?
        ");
        $updateStmt->execute([$hashedPassword, $testName, $testEmail]);
        echo "Test user updated successfully.\n";
    } else {
        // Insert new user
        $insertStmt = $pdo->prepare("
            INSERT INTO users (email, password, name, plan, email_verified_at, created_at, updated_at)
            VALUES (?, ?, ?, 'Pro', NOW(), NOW(), NOW())
        ");
        $insertStmt->execute([$testEmail, $hashedPassword, $testName]);
        echo "Test user created successfully.\n";
    }

    echo "\n=== Test User Credentials ===\n";
    echo "Email: {$testEmail}\n";
    echo "Password: {$testPassword}\n";
    echo "Plan: Pro\n";
    echo "Email Verified: Yes\n";
    echo "=============================\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}
