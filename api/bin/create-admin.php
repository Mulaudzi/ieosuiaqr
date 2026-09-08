<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

$env = static fn(string $key): string => (string)($_ENV[$key] ?? getenv($key) ?: '');
$email = strtolower(trim($env('ADMIN_BOOTSTRAP_EMAIL')));
$name = trim($env('ADMIN_BOOTSTRAP_NAME') ?: 'Administrator');
$password1 = $env('ADMIN_BOOTSTRAP_PASSWORD_1');
$password2 = $env('ADMIN_BOOTSTRAP_PASSWORD_2');
$password3 = $env('ADMIN_BOOTSTRAP_PASSWORD_3');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || min(strlen($password1), strlen($password2), strlen($password3)) < 12) {
    fwrite(STDERR, "Set ADMIN_BOOTSTRAP_EMAIL and three ADMIN_BOOTSTRAP_PASSWORD_* values of at least 12 characters.\n");
    exit(1);
}

$pdo = App\Config\Database::getInstance();
$existing = (int)$pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
if ($existing > 0) {
    fwrite(STDERR, "Bootstrap refused: an administrator already exists. Use the authenticated admin UI.\n");
    exit(1);
}

$stmt = $pdo->prepare(
    'INSERT INTO admin_users (email, password, name, password_step2, password_step3) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([
    $email,
    password_hash($password1, PASSWORD_DEFAULT),
    $name,
    password_hash($password2, PASSWORD_DEFAULT),
    password_hash($password3, PASSWORD_DEFAULT),
]);

fwrite(STDOUT, "Initial administrator created. Clear the ADMIN_BOOTSTRAP_* environment variables now.\n");
