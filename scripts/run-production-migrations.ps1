param(
    [switch]$Authorized,
    [switch]$AllowCertificateMismatch,
    [switch]$AllowClearDataChannel
)

$ErrorActionPreference = 'Stop'

if (-not $Authorized) { throw 'Production migration execution requires -Authorized.' }

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$credentialsPath = Join-Path $repoRoot '.private\DEPLOYMENT_CREDENTIALS.md'
$privateDir = Split-Path $credentialsPath
$fields = @{}
foreach ($line in [System.IO.File]::ReadAllLines($credentialsPath)) {
    if ($line -match '^\s*-\s*([^:]+):\s*(.*?)\s*$') {
        $fields[$matches[1].Trim().ToLowerInvariant()] = $matches[2].Trim()
    }
}
function Required([string]$name) {
    $value = $fields[$name.ToLowerInvariant()]
    if ([string]::IsNullOrWhiteSpace($value)) { throw "Missing private field: $name" }
    return $value
}
function Escape-CurlConfig([string]$value) { $value.Replace('\', '\\').Replace('"', '\"') }

$protocol = (Required 'Protocol').ToLowerInvariant()
$server = Required 'Server/host'
$port = Required 'Port'
$username = Required 'Username'
$password = Required 'Password'
$remoteRoot = (Required 'Remote document root').Replace('\', '/').TrimEnd('/')
$transferRoot = $remoteRoot
if ($protocol -in @('ftp','ftps') -and $transferRoot -match '^/home/[^/]+/public_html/(.+)$') { $transferRoot = '/' + $matches[1] }
elseif ($protocol -in @('ftp','ftps') -and $transferRoot -match '^/home/[^/]+/(.+)$') { $transferRoot = '/' + $matches[1] }
if ($protocol -notin @('ftp','ftps')) { throw 'The one-time runner currently supports FTP or FTPS hosting.' }

$runnerName = '_migration_' + [guid]::NewGuid().ToString('N') + '.php'
$localRunner = Join-Path $privateDir $runnerName
$curlConfig = Join-Path $privateDir ('.curl-migration-' + [guid]::NewGuid().ToString('N') + '.conf')
$tokenBytes = [byte[]]::new(32)
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $random.GetBytes($tokenBytes) } finally { $random.Dispose() }
$token = ([BitConverter]::ToString($tokenBytes)).Replace('-', '').ToLowerInvariant()
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try { $tokenHashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($token)) } finally { $sha256.Dispose() }
$tokenHash = ([BitConverter]::ToString($tokenHashBytes)).Replace('-', '').ToLowerInvariant()
$remoteRelative = 'api/' + $runnerName
$remoteTransferPath = ($transferRoot.TrimStart('/') + '/' + $remoteRelative).TrimStart('/')
$runnerUrl = 'https://qr.ieosuia.com/' + $remoteRelative
$uploaded = $false

$phpTemplate = @'
<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$supplied = $_SERVER['HTTP_X_IEOSUIA_MIGRATION_TOKEN'] ?? '';
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals('__TOKEN_HASH__', hash('sha256', $supplied))) {
    http_response_code(404);
    echo json_encode(['success' => false]);
    exit;
}

function loadEnvironment(string $path): array {
    $environment = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $environment[trim($key)] = trim(trim($value), "\"'");
    }
    return $environment;
}

function executeMigration(PDO $pdo, string $path): void {
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) throw new RuntimeException('Migration file is unavailable.');
    $delimiter = ';';
    $statement = '';
    foreach ($lines as $line) {
        if (preg_match('/^\s*DELIMITER\s+(\S+)\s*$/i', $line, $match)) {
            $delimiter = $match[1];
            continue;
        }
        if (preg_match('/^\s*--/', $line) && trim($statement) === '') continue;
        $statement .= $line . "\n";
        $trimmed = rtrim($statement);
        if ($trimmed !== '' && str_ends_with($trimmed, $delimiter)) {
            $sql = trim(substr($trimmed, 0, -strlen($delimiter)));
            $statement = '';
            if ($sql !== '') $pdo->exec($sql);
        }
    }
    if (trim($statement) !== '') throw new RuntimeException('Migration ended with an incomplete statement.');
}

$applied = [];
try {
    $environment = loadEnvironment(__DIR__ . '/.env');
    $pdo = new PDO(
        'mysql:host=' . ($environment['DB_HOST'] ?? '') . ';dbname=' . ($environment['DB_NAME'] ?? '') . ';charset=utf8mb4',
        $environment['DB_USER'] ?? '',
        $environment['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $hasVersions = (bool) $pdo->query("SHOW TABLES LIKE 'schema_migrations'")->fetchColumn();
    $versions = $hasVersions ? $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN) : [];
    foreach ([
        '030_complete_inventory_management' => __DIR__ . '/database/migrations/030_complete_inventory_management.sql',
        '031_inventory_integrity_upgrade' => __DIR__ . '/database/migrations/031_inventory_integrity_upgrade.sql',
    ] as $version => $path) {
        if (!in_array($version, $versions, true)) {
            executeMigration($pdo, $path);
            $applied[] = $version;
            $hasVersions = (bool) $pdo->query("SHOW TABLES LIKE 'schema_migrations'")->fetchColumn();
            $versions = $hasVersions ? $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN) : [];
        }
    }
    $required = ['030_complete_inventory_management','031_inventory_integrity_upgrade'];
    $verified = count(array_intersect($required, $versions)) === count($required);
    if (!$verified) throw new RuntimeException('Migration versions could not be verified.');
    echo json_encode(['success' => true, 'applied' => $applied, 'verified' => $required]);
} catch (Throwable $exception) {
    error_log('One-time migration runner failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Migration execution failed.']);
} finally {
    @unlink(__FILE__);
}
'@

$phpSource = $phpTemplate.Replace('__TOKEN_HASH__', $tokenHash)
[System.IO.File]::WriteAllText($localRunner, $phpSource, [System.Text.UTF8Encoding]::new($false))

try {
    $scheme = 'ftp'
    $common = @('silent','show-error','fail','ftp-create-dirs','connect-timeout = 30','max-time = 300',('user = "' + (Escape-CurlConfig ($username + ':' + $password)) + '"'))
    if ($protocol -eq 'ftps' -and $AllowClearDataChannel) { $common += 'ftp-ssl-control' }
    elseif ($protocol -eq 'ftps') { $common += 'ssl-reqd' }
    if ($protocol -eq 'ftps' -and $AllowCertificateMismatch) { $common += 'insecure' }
    $encodedPath = (($remoteTransferPath -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    $uploadConfig = $common + @(
        ('url = "' + $scheme + '://' + (Escape-CurlConfig $server) + ':' + $port + '/' + $encodedPath + '"'),
        ('upload-file = "' + (Escape-CurlConfig $localRunner) + '"')
    )
    [System.IO.File]::WriteAllLines($curlConfig, $uploadConfig, [System.Text.UTF8Encoding]::new($false))
    & curl.exe --config $curlConfig
    if ($LASTEXITCODE -ne 0) { throw 'Could not upload the one-time migration runner.' }
    $uploaded = $true

    Add-Type -AssemblyName System.Net.Http
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $client = [System.Net.Http.HttpClient]::new($handler)
    try {
        $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, $runnerUrl)
        $request.Headers.Add('X-IEOSUIA-Migration-Token', $token)
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) { throw "Migration runner returned HTTP $([int]$response.StatusCode)." }
        $result = $body | ConvertFrom-Json
        if (-not $result.success -or @($result.verified).Count -ne 2) { throw 'Migration runner did not verify both required migrations.' }
        Write-Output ('MIGRATIONS_APPLIED=' + (@($result.applied) -join ','))
        Write-Output ('MIGRATIONS_VERIFIED=' + (@($result.verified) -join ','))
    }
    finally {
        $client.Dispose()
        $handler.Dispose()
    }
}
finally {
    if (Test-Path -LiteralPath $localRunner) { Remove-Item -LiteralPath $localRunner -Force }
    if (Test-Path -LiteralPath $curlConfig) { Remove-Item -LiteralPath $curlConfig -Force }
    if ($uploaded) {
        $deleteConfig = Join-Path $privateDir ('.curl-migration-delete-' + [guid]::NewGuid().ToString('N') + '.conf')
        try {
            $deleteOptions = $common + @(
                ('url = "' + $scheme + '://' + (Escape-CurlConfig $server) + ':' + $port + '/"'),
                ('quote = "DELE /' + (Escape-CurlConfig $remoteTransferPath) + '"')
            )
            [System.IO.File]::WriteAllLines($deleteConfig, $deleteOptions, [System.Text.UTF8Encoding]::new($false))
            $previousErrorPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try { & curl.exe --config $deleteConfig 2>&1 | Out-Null }
            finally { $ErrorActionPreference = $previousErrorPreference }
        }
        finally {
            if (Test-Path -LiteralPath $deleteConfig) { Remove-Item -LiteralPath $deleteConfig -Force }
        }
    }
    try {
        $probe = Invoke-WebRequest -Uri $runnerUrl -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
        if ($probe.StatusCode -lt 400) { throw 'The one-time migration runner is still publicly reachable.' }
    }
    catch {
        if (-not $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -notin @(403,404)) {
            throw
        }
    }
}
