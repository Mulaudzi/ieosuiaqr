<?php
/**
 * Migration Runner
 * Run: php run_all.php
 * 
 * Executes all migrations in order
 */

$host = 'localhost';
$dbname = 'ejetffbz_qr';
$username = 'ejetffbz_ieosuia';
$password = 'I Am Ieosuia';

$migrations = [
    '001_create_plans_table.sql',
    '002_create_users_table.sql',
    '003_create_subscriptions_table.sql',
    '004_create_qr_codes_table.sql',
    '005_create_scan_logs_table.sql',
    '006_create_invoices_table.sql',
    '007_create_api_keys_table.sql',
];

try {
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    echo "Connected to database: {$dbname}\n\n";

    foreach ($migrations as $file) {
        $path = __DIR__ . '/' . $file;
        
        if (!file_exists($path)) {
            echo "⚠️  Skipped: {$file} (not found)\n";
            continue;
        }

        $sql = file_get_contents($path);
        
        try {
            $pdo->exec($sql);
            echo "✅ Executed: {$file}\n";
        } catch (PDOException $e) {
            echo "❌ Failed: {$file} - " . $e->getMessage() . "\n";
        }
    }

    echo "\n🎉 Migration completed!\n";

} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
