$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$credentialsPath = Join-Path $repoRoot '.private\DEPLOYMENT_CREDENTIALS.md'
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
function EscapeConfig([string]$value) { $value.Replace('\', '\\').Replace('"', '\"') }

$server = Required 'Server/host'
$port = Required 'Port'
$username = Required 'Username'
$password = Required 'Password'
$legacyPath = Join-Path $repoRoot '.ftp-deploy.env'
if (Test-Path -LiteralPath $legacyPath) {
    $legacy = @{}
    foreach ($line in [System.IO.File]::ReadAllLines($legacyPath)) {
        if ($line -match '^([^#=]+)=(.*)$') { $legacy[$matches[1].Trim()] = $matches[2].Trim().Trim('"', "'") }
    }
    if ($legacy['FTP_HOST'] -and $legacy['FTP_PORT'] -and $legacy['FTP_USERNAME'] -and $legacy['FTP_PASSWORD']) {
        $server = $legacy['FTP_HOST']; $port = $legacy['FTP_PORT']; $username = $legacy['FTP_USERNAME']; $password = $legacy['FTP_PASSWORD']
    }
}
$root = (Required 'Remote document root').Replace('\', '/').Trim('/')
if ($root -match '^home/[^/]+/(.+)$') { $root = $matches[1] }
$segments = ($root + '/api/.env') -split '/'
$encodedPath = ($segments | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'

$privateDir = Split-Path $credentialsPath
$configPath = Join-Path $privateDir ('.curl-smtp-check-' + [guid]::NewGuid().ToString('N') + '.conf')
$envPath = Join-Path $privateDir ('.remote-env-' + [guid]::NewGuid().ToString('N'))
try {
    $config = @(
        'silent', 'show-error', 'fail', 'ftp-ssl-control', 'insecure',
        ('user = "' + (EscapeConfig ($username + ':' + $password)) + '"'),
        ('url = "ftp://' + (EscapeConfig $server) + ':' + $port + '/' + $encodedPath + '"'),
        ('output = "' + (EscapeConfig $envPath) + '"')
    )
    [System.IO.File]::WriteAllLines($configPath, $config, [System.Text.UTF8Encoding]::new($false))
    & curl.exe --config $configPath
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the protected production mail configuration.' }

    $environment = @{}
    foreach ($line in [System.IO.File]::ReadAllLines($envPath)) {
        if ($line -match '^\s*([^#=]+)=(.*)$') { $environment[$matches[1].Trim()] = $matches[2].Trim().Trim('"', "'") }
    }
    foreach ($name in @('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL', 'SMTP_FROM_NAME', 'APP_URL')) {
        $state = if ($environment.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($environment[$name])) { 'configured' } else { 'MISSING' }
        Write-Output ($name + ': ' + $state)
    }
    $portMode = if ($environment['SMTP_PORT'] -eq '465') { 'implicit TLS' } elseif ($environment['SMTP_PORT'] -eq '587') { 'STARTTLS expected' } else { 'nonstandard/unknown' }
    Write-Output ('SMTP port mode: ' + $portMode)
}
finally {
    if (Test-Path -LiteralPath $configPath) { Remove-Item -LiteralPath $configPath -Force }
    if (Test-Path -LiteralPath $envPath) { Remove-Item -LiteralPath $envPath -Force }
}
