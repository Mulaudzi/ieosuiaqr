<?php
/**
 * Database Schema Introspection Utility
 * 
 * Outputs a JSON summary of all database tables and columns.
 * 
 * USAGE:
 *   Access via: /api/schema_dump.php?key=YOUR_SCHEMA_KEY
 * 
 * SECURITY:
 *   Protected by SCHEMA_DUMP_KEY environment variable or defaults to disabled.
 *   Set SCHEMA_DUMP_KEY in your .env file to enable access.
 * 
 * REMOVAL:
 *   Delete this file after use to prevent schema exposure.
 *   Or set SCHEMA_DUMP_KEY to empty string to disable.
 */

// Prevent any HTML output
header('Content-Type: application/json; charset=utf-8');

// Load environment if available
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// Load .env file if it exists
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = array_map('trim', explode('=', $line, 2));
        $value = trim($value, '"\'');
        $_ENV[$name] = $value;
        putenv("{$name}={$value}");
    }
}

// ============================================
// ACCESS CONTROL
// ============================================

$schemaKey = $_ENV['SCHEMA_DUMP_KEY'] ?? '';
$providedKey = $_GET['key'] ?? '';

// Require key to be set and match
if (empty($schemaKey)) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Schema dump disabled',
        'message' => 'Set SCHEMA_DUMP_KEY in .env to enable this utility'
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($providedKey !== $schemaKey) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Unauthorized',
        'message' => 'Invalid or missing key parameter'
    ], JSON_PRETTY_PRINT);
    exit;
}

// ============================================
// DATABASE CONNECTION
// ============================================

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? '';
    $username = $_ENV['DB_USER'] ?? '';
    $password = $_ENV['DB_PASS'] ?? '';
    
    if (empty($dbname)) {
        throw new Exception('DB_NAME not configured');
    }
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit;
}

// ============================================
// SCHEMA INTROSPECTION
// ============================================

try {
    // Get all tables in the current database
    $tablesQuery = $pdo->prepare("
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = :dbname 
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ");
    $tablesQuery->execute(['dbname' => $dbname]);
    $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);
    
    // Build schema structure
    $schema = [
        'database' => $dbname,
        'generated_at' => date('Y-m-d H:i:s T'),
        'table_count' => count($tables),
        'tables' => []
    ];
    
    // Get columns for each table
    $columnsQuery = $pdo->prepare("
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            COLUMN_TYPE,
            IS_NULLABLE,
            COLUMN_KEY,
            COLUMN_DEFAULT,
            EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = :dbname 
        AND TABLE_NAME = :table_name
        ORDER BY ORDINAL_POSITION
    ");
    
    foreach ($tables as $tableName) {
        $columnsQuery->execute([
            'dbname' => $dbname,
            'table_name' => $tableName
        ]);
        $columns = $columnsQuery->fetchAll();
        
        $tableSchema = [
            'columns' => []
        ];
        
        foreach ($columns as $col) {
            $tableSchema['columns'][$col['COLUMN_NAME']] = [
                'type' => $col['COLUMN_TYPE'],
                'nullable' => $col['IS_NULLABLE'] === 'YES',
                'primary' => $col['COLUMN_KEY'] === 'PRI',
                'default' => $col['COLUMN_DEFAULT'],
                'extra' => !empty($col['EXTRA']) ? $col['EXTRA'] : null
            ];
        }
        
        $schema['tables'][$tableName] = $tableSchema;
    }
    
    // Output the schema
    echo json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Schema introspection failed',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit;
}

// Ensure script terminates
exit;
