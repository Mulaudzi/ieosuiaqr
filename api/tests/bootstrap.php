<?php
/**
 * PHPUnit Bootstrap File
 * Sets up the testing environment
 */

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Autoload
require_once __DIR__ . '/../vendor/autoload.php';

// Load test environment variables
$_ENV['APP_ENV'] = 'testing';
$_ENV['JWT_SECRET'] = 'test-secret-key-for-jwt-testing-only';
$_ENV['JWT_EXPIRY'] = '3600';
$_ENV['APP_URL'] = 'http://localhost:8000';

// Manual class loading for custom App classes
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});
