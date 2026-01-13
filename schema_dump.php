<?php
/**
 * Simple Database Schema Dump
 * Access directly: https://your-domain.com/schema_dump.php
 * DELETE THIS FILE AFTER USE!
 */

header('Content-Type: application/json');

// HARDCODE YOUR DATABASE CREDENTIALS HERE
$host = 'localhost';
$dbname = 'your_database_name';
$user = 'your_database_user';
$pass = 'your_database_password';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Get all tables
    $tables = $pdo->query("
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '$dbname' 
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ")->fetchAll(PDO::FETCH_COLUMN);
    
    $schema = ['tables' => []];
    
    foreach ($tables as $table) {
        $columns = $pdo->query("
            SELECT 
                COLUMN_NAME,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_KEY,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '$dbname' 
            AND TABLE_NAME = '$table'
            ORDER BY ORDINAL_POSITION
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        $schema['tables'][$table] = ['columns' => []];
        
        foreach ($columns as $col) {
            $schema['tables'][$table]['columns'][$col['COLUMN_NAME']] = [
                'type' => $col['COLUMN_TYPE'],
                'nullable' => $col['IS_NULLABLE'] === 'YES',
                'primary' => $col['COLUMN_KEY'] === 'PRI',
                'default' => $col['COLUMN_DEFAULT']
            ];
        }
    }
    
    echo json_encode($schema, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
