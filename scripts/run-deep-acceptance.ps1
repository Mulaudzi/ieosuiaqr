$ErrorActionPreference = 'Stop'

$database = 'ieosuia_qr_local'
$databaseUser = 'ieosuia_local'
$databasePassword = 'ieosuia_local_only'

function Get-LocalScalar([string]$Sql) {
    $value = docker compose exec -T database mariadb --batch --skip-column-names "-u$databaseUser" "-p$databasePassword" $database --execute=$Sql
    if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the local deep-acceptance fixture.' }
    return ($value | Out-String).Trim()
}

$ownerId = Get-LocalScalar 'SELECT user_id FROM inventory_items WHERE deleted_at IS NULL LIMIT 1'
if (-not $ownerId) { throw 'The local database needs at least one active inventory fixture.' }

$env:QR_TEST_TOKEN = (docker compose exec -T api php tests/inventory_acceptance.php token $ownerId | Out-String).Trim()
$env:QR_TEST_ITEM_ID = Get-LocalScalar "SELECT id FROM inventory_items WHERE user_id=$ownerId AND deleted_at IS NULL LIMIT 1"
$env:QR_TEST_QR_ID = Get-LocalScalar "SELECT qr_id FROM inventory_items WHERE user_id=$ownerId AND qr_id IS NOT NULL AND deleted_at IS NULL LIMIT 1"
if (-not $env:QR_TEST_TOKEN -or -not $env:QR_TEST_ITEM_ID -or -not $env:QR_TEST_QR_ID) { throw 'Local deep-acceptance fixtures are incomplete.' }
$env:QR_REQUIRE_FIXTURES = '1'

npx.cmd playwright test tests/e2e/api-behavior.spec.ts tests/e2e/master-repair.spec.ts tests/e2e/responsive-ui.spec.ts
if ($LASTEXITCODE -ne 0) { throw 'Deep browser/API acceptance failed.' }

