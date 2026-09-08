param(
    [switch]$Authorized,
    [switch]$AllowCertificateMismatch,
    [switch]$AllowClearDataChannel,
    [switch]$Diagnose
)

$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$credentialsPath = Join-Path $repoRoot '.private\DEPLOYMENT_CREDENTIALS.md'
$distPath = Join-Path $repoRoot 'dist'
$apiPath = Join-Path $repoRoot 'api'

if (-not (Test-Path -LiteralPath $credentialsPath)) { throw 'Private deployment credentials file was not found.' }
if (-not (Test-Path -LiteralPath $distPath)) { throw 'Production build was not found.' }

$fields = @{}
foreach ($line in [System.IO.File]::ReadAllLines($credentialsPath)) {
    if ($line -match '^\s*-\s*([^:]+):\s*(.*?)\s*$') {
        $fields[$matches[1].Trim().ToLowerInvariant()] = $matches[2].Trim()
    }
}

function Get-RequiredField([string]$name) {
    $key = $name.ToLowerInvariant()
    if (-not $fields.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($fields[$key])) {
        throw "Required deployment field is empty: $name"
    }
    return $fields[$key]
}

$protocol = if ($fields.ContainsKey('protocol')) { $fields['protocol'].ToLowerInvariant() } else { '' }
if ([string]::IsNullOrWhiteSpace($protocol)) { throw 'Required deployment field is empty: Protocol' }
$server = Get-RequiredField 'Server/host'
$port = Get-RequiredField 'Port'
$username = Get-RequiredField 'Username'
$password = Get-RequiredField 'Password'
$remoteRoot = (Get-RequiredField 'Remote document root').Replace('\', '/').TrimEnd('/')
$transferRoot = $remoteRoot
if ($protocol -in @('ftp', 'ftps') -and $transferRoot -match '^/home/[^/]+/public_html/(.+)$') {
    $transferRoot = '/' + $matches[1]
}
elseif ($protocol -in @('ftp', 'ftps') -and $transferRoot -match '^/home/[^/]+/(.+)$') {
    $transferRoot = '/' + $matches[1]
}
$permission = if ($Authorized) { 'authorized' } elseif ($fields.ContainsKey('deployment permission')) { $fields['deployment permission'].ToLowerInvariant() } else { '' }

if ($protocol -notin @('ftp', 'ftps', 'sftp')) { throw 'Protocol must be ftp, ftps, or sftp.' }
if ($port -notmatch '^\d{1,5}$') { throw 'Port must be numeric.' }
if ($permission -notmatch '^(yes|approved|allowed|granted|authorized|authorised|true)$') {
    throw 'Deployment permission must explicitly be yes, approved, allowed, granted, or authorized.'
}

$protected = @('.env', 'api/.env', 'api/vendor', 'api/uploads', 'api/exports', 'api/geoip')
if ($fields.ContainsKey('protected remote files') -and $fields['protected remote files']) {
    $protected += $fields['protected remote files'] -split '[,;]'
}
$protected = $protected | ForEach-Object { $_.Trim().Replace('\', '/').TrimStart('/') } | Where-Object { $_ }

function Test-Protected([string]$relativePath) {
    $normalized = $relativePath.Replace('\', '/').TrimStart('/')
    foreach ($entry in $protected) {
        $candidate = $entry
        if ($candidate.StartsWith($remoteRoot.TrimStart('/') + '/')) {
            $candidate = $candidate.Substring($remoteRoot.TrimStart('/').Length + 1)
        }
        if ($normalized -eq $candidate -or $normalized.StartsWith($candidate.TrimEnd('/') + '/')) { return $true }
    }
    return $false
}

$uploads = [System.Collections.Generic.List[object]]::new()
$distRoot = [System.IO.Path]::GetFullPath($distPath)
Get-ChildItem -LiteralPath $distPath -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($distRoot.Length).TrimStart('\', '/').Replace('\', '/')
    if (-not (Test-Protected $relative)) { $uploads.Add([pscustomobject]@{ File = $_.FullName; Relative = $relative }) }
}

$apiRoot = [System.IO.Path]::GetFullPath($apiPath)
Get-ChildItem -LiteralPath $apiPath -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($apiRoot.Length).TrimStart('\', '/').Replace('\', '/')
    $relative -notmatch '^(vendor|tests|coverage|invoices|receipts|exports|geoip|uploads)/' -and
    $relative -notmatch '(^|/)\.(env|git)' -and
    $relative -notmatch '(^|/)(phpunit\.xml|README\.md)$' -and
    $relative -notmatch '\.(log|cache|mmdb)$'
} | ForEach-Object {
    $relative = 'api/' + $_.FullName.Substring($apiRoot.Length).TrimStart('\', '/').Replace('\', '/')
    if (-not (Test-Protected $relative)) { $uploads.Add([pscustomobject]@{ File = $_.FullName; Relative = $relative }) }
}

$tempConfig = Join-Path (Split-Path $credentialsPath) ('.curl-deploy-' + [guid]::NewGuid().ToString('N') + '.conf')
function Escape-CurlConfig([string]$value) { return $value.Replace('\', '\\').Replace('"', '\"') }

try {
    $baseScheme = if ($protocol -eq 'sftp') { 'sftp' } else { 'ftp' }
    $common = @(
        'silent',
        'show-error',
        'fail',
        'ftp-create-dirs',
        'connect-timeout = 30',
        'max-time = 300',
        ('user = "' + (Escape-CurlConfig ($username + ':' + $password)) + '"')
    )
    if ($protocol -eq 'ftps' -and $AllowClearDataChannel) { $common += 'ftp-ssl-control' }
    elseif ($protocol -eq 'ftps') { $common += 'ssl-reqd' }
    if ($protocol -eq 'ftps' -and $AllowCertificateMismatch) { $common += 'insecure' }
    if ($Diagnose) { $common += 'verbose' }

    $completed = 0
    foreach ($upload in $uploads) {
        $segments = ($transferRoot.TrimStart('/') + '/' + $upload.Relative) -split '/'
        $encodedPath = ($segments | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
        $url = "${baseScheme}://${server}:${port}/${encodedPath}"
        $config = $common + @(
            ('url = "' + (Escape-CurlConfig $url) + '"'),
            ('upload-file = "' + (Escape-CurlConfig $upload.File) + '"')
        )
        [System.IO.File]::WriteAllLines($tempConfig, $config, [System.Text.UTF8Encoding]::new($false))
        if ($Diagnose) {
            $previousErrorAction = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                $diagnosticOutput = (& curl.exe --config $tempConfig 2>&1 | ForEach-Object { $_.ToString() } | Out-String)
                $curlExit = $LASTEXITCODE
            }
            finally {
                $ErrorActionPreference = $previousErrorAction
            }
            if ($curlExit -ne 0) {
                $redacted = $diagnosticOutput
                foreach ($secret in @($server, $username, $password, $remoteRoot, $transferRoot)) {
                    if ($secret) { $redacted = $redacted.Replace($secret, '[redacted]') }
                }
                $serverReplies = $redacted -split "`r?`n" | Where-Object { $_ -match '^< (4|5)\d\d' }
                if ($serverReplies) { Write-Error ($serverReplies -join [Environment]::NewLine) -ErrorAction Continue }
                throw "Upload failed for a deployment file (curl exit $curlExit)."
            }
        }
        else {
            & curl.exe --config $tempConfig
            if ($LASTEXITCODE -ne 0) { throw "Upload failed for a deployment file (curl exit $LASTEXITCODE)." }
        }
        $completed++
        if (($completed % 50) -eq 0) { Write-Host "Uploaded $completed of $($uploads.Count) files..." }
    }
    Write-Host "Deployment complete: $completed files uploaded."
}
finally {
    if (Test-Path -LiteralPath $tempConfig) { Remove-Item -LiteralPath $tempConfig -Force }
}
