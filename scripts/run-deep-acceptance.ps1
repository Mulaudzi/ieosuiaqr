$ErrorActionPreference = 'Stop'

$database = 'ieosuia_qr_local'
$databaseUser = 'ieosuia_local'
$databasePassword = 'ieosuia_local_only'

function Get-LocalScalar([string]$Sql) {
    $value = docker compose exec -T database mariadb --batch --skip-column-names "-u$databaseUser" "-p$databasePassword" $database --execute=$Sql
    if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the local deep-acceptance fixture.' }
    return ($value | Out-String).Trim()
}

function Clear-AcceptanceFixtures {
    $where = "i.name='Codex Lifecycle Asset' OR i.name='Atomic inventory test' OR i.name LIKE 'Human Journey % Asset' OR i.name LIKE 'Human Journey % Combined Asset'"
    $statements = @(
        "DELETE c FROM inventory_stock_counts c INNER JOIN inventory_items i ON i.id=c.item_id WHERE $where",
        "DELETE m FROM inventory_movements m INNER JOIN inventory_items i ON i.id=m.item_id WHERE $where",
        "DELETE s FROM inventory_stock_levels s INNER JOIN inventory_items i ON i.id=s.item_id WHERE $where",
        "DELETE h FROM inventory_status_history h INNER JOIN inventory_items i ON i.id=h.item_id WHERE $where",
        "DELETE a FROM inventory_alerts a INNER JOIN inventory_items i ON i.id=a.item_id WHERE $where",
        "DELETE i FROM inventory_items i WHERE $where"
    )
    foreach ($sql in $statements) {
        docker compose exec -T database mariadb "-u$databaseUser" "-p$databasePassword" $database --execute=$sql | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Could not clean local acceptance inventory fixtures.' }
    }
    $qrSql = "DELETE FROM qr_codes WHERE name='Codex Bulk Valid' OR name='Codex Browser Logo QR' OR name='Codex Exact Redirect QR' OR name LIKE 'Regression %'"
    docker compose exec -T database mariadb "-u$databaseUser" "-p$databasePassword" $database --execute=$qrSql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not clean local acceptance QR fixtures.' }
}

$ownerId = Get-LocalScalar 'SELECT user_id FROM inventory_items WHERE deleted_at IS NULL LIMIT 1'
if (-not $ownerId) { throw 'The local database needs at least one active inventory fixture.' }

$env:QR_TEST_TOKEN = (docker compose exec -T api php tests/inventory_acceptance.php token $ownerId | Out-String).Trim()
$env:QR_TEST_ITEM_ID = Get-LocalScalar "SELECT id FROM inventory_items WHERE user_id=$ownerId AND deleted_at IS NULL LIMIT 1"
$env:QR_TEST_QR_ID = Get-LocalScalar "SELECT qr_id FROM inventory_items WHERE user_id=$ownerId AND qr_id IS NOT NULL AND deleted_at IS NULL LIMIT 1"
if (-not $env:QR_TEST_TOKEN -or -not $env:QR_TEST_ITEM_ID -or -not $env:QR_TEST_QR_ID) { throw 'Local deep-acceptance fixtures are incomplete.' }
$env:QR_REQUIRE_FIXTURES = '1'

try {
    Clear-AcceptanceFixtures
    npm.cmd run typecheck
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript acceptance failed.' }
    npm.cmd run test
    if ($LASTEXITCODE -ne 0) { throw 'Unit acceptance failed.' }
    docker compose exec -T api php tests/inventory_acceptance.php
    if ($LASTEXITCODE -ne 0) { throw 'Inventory concurrency acceptance failed.' }
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-database-migrations.ps1
    if ($LASTEXITCODE -ne 0) { throw 'Database migration acceptance failed.' }
    npm.cmd run build:web
    if ($LASTEXITCODE -ne 0) { throw 'Production web build failed.' }
    npx.cmd playwright test
    if ($LASTEXITCODE -ne 0) { throw 'Complete browser/API acceptance failed.' }
} finally {
    Clear-AcceptanceFixtures
}

