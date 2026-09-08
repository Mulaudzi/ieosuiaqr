param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password
)

$ErrorActionPreference = 'Stop'
$api = 'http://localhost:8081/api'
$results = [System.Collections.Generic.List[object]]::new()

function Request {
    param([string]$Name, [string]$Method, [string]$Path, $Body = $null, [string]$Token = '', [int[]]$Expected = @(200))
    $headers = @{ Origin = 'http://localhost:5173' }
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    try {
        $args = @{ Uri = "$api$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 20 }
        if ($null -ne $Body) {
            $args.ContentType = 'application/json'
            $args.Body = $Body | ConvertTo-Json -Depth 12 -Compress
        }
        $response = Invoke-WebRequest @args
        $json = if ($response.Content -and $response.Headers['Content-Type'] -match 'json') { $response.Content | ConvertFrom-Json } else { $null }
        $ok = $Expected -contains [int]$response.StatusCode
        $results.Add([pscustomobject]@{ Feature=$Name; Status=[int]$response.StatusCode; Passed=$ok })
        if (-not $ok) { throw "$Name returned $($response.StatusCode)" }
        return $json
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        $results.Add([pscustomobject]@{ Feature=$Name; Status=$status; Passed=$false })
        throw
    }
}

$login = Request 'Authentication: login' POST '/auth/login' @{ email=$Email; password=$Password }
$token = $login.data.tokens.access_token
if (-not $token) { throw 'Login did not return an access token' }

Request 'Profile: view' GET '/user/profile' $null $token | Out-Null
Request 'Profile: update' PUT '/user/profile' @{ name='Codex Local Feature Tester' } $token | Out-Null
Request 'Notifications: view' GET '/user/notifications' $null $token | Out-Null
Request 'Notifications: update' PUT '/user/notifications' @{ email_notifications=$true; scan_alerts=$true; weekly_report=$true; marketing_emails=$false } $token | Out-Null

$qr = Request 'QR: create' POST '/qr' @{ type='url'; name='Codex Local Feature QR'; content=@{ content='https://example.com/local-qr-test' }; custom_options=@{ fgColor='#0066aa'; bgColor='#ffffff' } } $token @(201)
$qrId = [int]$qr.data.id
Request 'QR: list' GET '/qr?limit=50' $null $token | Out-Null
Request 'QR: view' GET "/qr/$qrId" $null $token | Out-Null
Request 'QR: update' PUT "/qr/$qrId" @{ name='Codex Updated Local QR'; content=@{ content='https://example.com/local-qr-updated' } } $token | Out-Null

$item = Request 'Inventory: create' POST '/inventory' @{ qr_id=$qrId; name='Codex Local Asset'; category='Testing'; notes='Disposable local feature fixture'; status='in_stock'; location='Local Lab' } $token @(201)
$itemId = [int]$item.data.id
Request 'Inventory: list' GET '/inventory' $null $token | Out-Null
Request 'Inventory: view' GET "/inventory/$itemId" $null $token | Out-Null
Request 'Inventory: update' PUT "/inventory/$itemId" @{ notes='Updated successfully'; location='Updated Local Lab' } $token | Out-Null
Request 'Inventory: limits' GET '/inventory/limits' $null $token | Out-Null
Request 'Inventory: public scan' POST '/inventory/scan' @{ qr_id=$qrId; location='Scanner Test Area' } | Out-Null
Request 'Inventory: QR lookup' GET "/inventory/qr/$qrId" $null $token | Out-Null
Request 'Inventory: status update' POST "/inventory/qr/$qrId/status" @{ status='maintenance'; location='Maintenance Bay' } $token | Out-Null
Request 'Inventory: history' GET "/inventory/qr/$qrId/history" $null $token | Out-Null
Request 'Inventory: maintenance reminder' POST '/inventory/maintenance' @{ item_id=$itemId; due_date=(Get-Date).AddDays(2).ToString('yyyy-MM-dd'); priority='medium' } $token | Out-Null
Request 'Inventory: alert check' POST '/inventory/alerts/check' @{} $token | Out-Null
Request 'Inventory: alerts' GET '/inventory/alerts' $null $token | Out-Null
Request 'Inventory: mark alerts read' POST '/inventory/alerts/read' @{} $token | Out-Null
Request 'Inventory: analytics' GET '/inventory/analytics' $null $token | Out-Null

$preset = Request 'Design presets: create' POST '/design-presets' @{ name='Codex Local Preset'; description='Local feature test'; design_options=@{ fgColor='#0066aa'; bgColor='#ffffff'; shapeStyle='rounded' } } $token @(201)
$presetId = [string]$preset.data.id
Request 'Design presets: list' GET '/design-presets' $null $token | Out-Null
Request 'Design presets: view' GET "/design-presets/$presetId" $null $token | Out-Null
Request 'Design presets: update' PUT "/design-presets/$presetId" @{ name='Codex Updated Preset' } $token | Out-Null
Request 'Design presets: default' POST "/design-presets/$presetId/set-default" @{} $token | Out-Null

Request 'Analytics: dashboard' GET '/analytics/dashboard' $null $token | Out-Null
Request 'Analytics: summary' GET '/analytics/summary' $null $token | Out-Null
Request 'Analytics: top QR codes' GET '/analytics/top-qr-codes' $null $token | Out-Null
Request 'Analytics: devices' GET '/analytics/devices' $null $token | Out-Null
Request 'Analytics: daily' GET '/analytics/daily' $null $token | Out-Null
Request 'Analytics: hourly' GET '/analytics/hourly' $null $token | Out-Null
Request 'QR analytics: scans' GET "/qr/$qrId/scans" $null $token | Out-Null
Request 'QR analytics: stats' GET "/qr/$qrId/stats" $null $token | Out-Null

Request 'Contact form' POST '/contact' @{ name='Codex Local Feature Tester'; email=$Email; subject='Local feature test'; message='This message must remain inside Mailpit.' } | Out-Null
Request 'Password reset request' POST '/auth/forgot-password' @{ email=$Email } | Out-Null

Request 'Authentication: logout' POST '/auth/logout' @{} $token | Out-Null

$results | Format-Table -AutoSize
if ($results.Passed -contains $false) { exit 1 }
Write-Host "Passed $($results.Count) authenticated/local feature checks."
