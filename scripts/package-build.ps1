param(
    [switch]$IncludeApiEnv
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distPath  = Join-Path $repoRoot "dist"
$apiPath   = Join-Path $repoRoot "api"
$buildPath = Join-Path $repoRoot "build"
$zipPath   = Join-Path $buildPath "deploy.zip"

if (-not (Test-Path $distPath)) { throw "dist folder not found. Run vite build first." }
if (-not (Test-Path $apiPath))  { throw "api folder not found." }

if (-not (Test-Path $buildPath)) { New-Item -Path $buildPath -ItemType Directory | Out-Null }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    # Add the complete production API, including runtime dependencies. Exclude
    # development/test material and generated files that are not needed online.
    $apiRoot = [System.IO.Path]::GetFullPath($apiPath)
    Get-ChildItem -Path $apiPath -Recurse -File | Where-Object {
        $relative = $_.FullName.Substring($apiRoot.Length).TrimStart('\','/').Replace('\','/')
        $relative -notmatch '^(tests|coverage|invoices|receipts|exports|uploads|geoip|logs)/' -and
        ($IncludeApiEnv -or $relative -ne '.env') -and
        $relative -ne '.env.example' -and
        $relative -notmatch '(^|/)\.git' -and
        $relative -notmatch '(^|/)(phpunit\.xml|README\.md|CONTRIBUTING\.md|CHANGELOG\.md)$' -and
        $relative -notmatch '\.(log|cache|tmp|bak|old)$'
    } | ForEach-Object {
        $rel = "api/" + $_.FullName.Substring($apiRoot.Length).TrimStart('\','/').Replace('\','/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }

    # Add dist/ contents at zip root (not under dist/)
    $distRoot = [System.IO.Path]::GetFullPath($distPath)
    Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($distRoot.Length).TrimStart('\','/').Replace('\','/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
}
finally {
    $zip.Dispose()
}

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
$envNote = if ($IncludeApiEnv) { ' including the private api/.env' } else { '' }
Write-Host "Created build\deploy.zip ($sizeMB MB)$envNote and production API dependencies."
