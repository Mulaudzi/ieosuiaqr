$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$credentialsPath = Join-Path $repoRoot '.private\DEPLOYMENT_CREDENTIALS.md'
$legacyPath = Join-Path $repoRoot '.ftp-deploy.env'

$fields = @{}
foreach ($line in [System.IO.File]::ReadAllLines($credentialsPath)) {
    if ($line -match '^\s*-\s*([^:]+):\s*(.*?)\s*$') { $fields[$matches[1].Trim().ToLowerInvariant()] = $matches[2].Trim() }
}
$legacy = @{}
foreach ($line in [System.IO.File]::ReadAllLines($legacyPath)) {
    if ($line -match '^([^#=]+)=(.*)$') { $legacy[$matches[1].Trim()] = $matches[2].Trim().Trim('"', "'") }
}
function EscapeConfig([string]$value) { $value.Replace('\', '\\').Replace('"', '\"') }

$server = $legacy['FTP_HOST']; $port = $legacy['FTP_PORT']; $username = $legacy['FTP_USERNAME']; $password = $legacy['FTP_PASSWORD']
$root = ''
if (@($server, $port, $username, $password) | Where-Object { [string]::IsNullOrWhiteSpace($_) }) { throw 'A required ignored deployment field is missing.' }

$privateDir = Split-Path $credentialsPath
$configPath = Join-Path $privateDir ('.curl-root-check-' + [guid]::NewGuid().ToString('N') + '.conf')
$ftpIndex = Join-Path $privateDir ('.ftp-index-' + [guid]::NewGuid().ToString('N'))
$webIndex = Join-Path $privateDir ('.web-index-' + [guid]::NewGuid().ToString('N'))
try {
    $rootList = Join-Path $privateDir ('.ftp-root-list-' + [guid]::NewGuid().ToString('N'))
    $listConfig = @(
        'silent', 'show-error', 'fail', 'ftp-ssl-control', 'insecure', 'list-only',
        ('user = "' + (EscapeConfig ($username + ':' + $password)) + '"'),
        ('url = "ftp://' + (EscapeConfig $server) + ':' + $port + '/"'),
        ('output = "' + (EscapeConfig $rootList) + '"')
    )
    [System.IO.File]::WriteAllLines($configPath, $listConfig, [System.Text.UTF8Encoding]::new($false))
    & curl.exe --config $configPath
    if ($LASTEXITCODE -ne 0) { throw 'Updated credentials could not list the FTP root.' }
    $rootEntryCount = @([System.IO.File]::ReadAllLines($rootList) | Where-Object { $_.Trim() }).Count
    Write-Output ('FTP_ROOT_LISTABLE=True')
    Write-Output ('FTP_ROOT_ENTRY_COUNT=' + $rootEntryCount)
    & curl.exe --silent --show-error --fail --output $webIndex 'https://qr.ieosuia.com/'
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the live HTTPS homepage.' }
    $liveContent = [System.IO.File]::ReadAllText($webIndex)
    $liveAsset = [regex]::Match($liveContent, 'assets/index-[A-Za-z0-9_-]+\.js').Value
    if (-not $liveAsset) { throw 'Could not identify the live frontend asset fingerprint.' }
    $savedCandidate = $legacy['FTP_FRONTEND_PATH'].Replace('\', '/').Trim('/')
    $documentRootCandidate = $fields['remote document root'].Replace('\', '/').Trim('/')
    if ($documentRootCandidate -match '^home/[^/]+/(.+)$') { $documentRootCandidate = $matches[1] }
    $candidates = @('', 'qr', 'public_html', 'qr.ieosuia.com', 'public_html/qr.ieosuia.com', $savedCandidate, $documentRootCandidate) | Select-Object -Unique
    $found = $false
    foreach ($candidate in $candidates) {
        $relative = if ($candidate) { $candidate + '/index.html' } else { 'index.html' }
        $encodedPath = (($relative -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
        $config = @(
            'silent', 'show-error', 'fail', 'ftp-ssl-control', 'insecure',
            ('user = "' + (EscapeConfig ($username + ':' + $password)) + '"'),
            ('url = "ftp://' + (EscapeConfig $server) + ':' + $port + '/' + $encodedPath + '"'),
            ('output = "' + (EscapeConfig $ftpIndex) + '"')
        )
        [System.IO.File]::WriteAllLines($configPath, $config, [System.Text.UTF8Encoding]::new($false))
        $previousErrorAction = $ErrorActionPreference
        $ErrorActionPreference = 'SilentlyContinue'
        try {
            & curl.exe --config $configPath 2>$null
            $curlExit = $LASTEXITCODE
        }
        finally { $ErrorActionPreference = $previousErrorAction }
        $ftpAsset = if ($curlExit -eq 0) { [regex]::Match([System.IO.File]::ReadAllText($ftpIndex), 'assets/index-[A-Za-z0-9_-]+\.js').Value } else { '' }
        $candidateLabel = if ($candidate -eq $documentRootCandidate -and $documentRootCandidate) { 'DOCUMENT_ROOT' } elseif ($candidate -eq $savedCandidate -and $savedCandidate) { 'SAVED_PATH' } elseif ($candidate) { $candidate } else { '/' }
        Write-Output ($candidateLabel + '_INDEX_EXISTS=' + ($curlExit -eq 0))
        if ($curlExit -eq 0 -and $ftpAsset -eq $liveAsset) {
            Write-Output ('LIVE_ROOT=' + $(if ($candidate) { $candidate } else { '/' }))
            $found = $true
            break
        }
    }
    if (-not $found) { throw 'None of the standard FTP paths matches the live website.' }
}
finally {
    foreach ($file in @($configPath, $ftpIndex, $webIndex, $rootList)) { if ($file -and (Test-Path -LiteralPath $file)) { Remove-Item -LiteralPath $file -Force } }
}
