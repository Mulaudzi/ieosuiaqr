$ErrorActionPreference = 'Stop'

$database = 'ieosuia_qr_local'
$databaseUser = 'ieosuia_local'
$databasePassword = 'ieosuia_local_only'
$acceptanceSuffix = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$acceptanceEmail = "master-acceptance-$acceptanceSuffix@example.test"
$acceptanceOwnerId = ''
$acceptanceUploadPaths = @()

function Invoke-LocalSql([string]$Sql) {
    docker compose exec -T database mariadb "-u$databaseUser" "-p$databasePassword" $database --execute=$Sql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Local acceptance database operation failed.' }
}

function Get-LocalScalar([string]$Sql) {
    $value = docker compose exec -T database mariadb --batch --skip-column-names "-u$databaseUser" "-p$databasePassword" $database --execute=$Sql
    if ($LASTEXITCODE -ne 0) { throw 'Could not query the local acceptance database.' }
    return ($value | Out-String).Trim()
}

function Clear-InventoryForWhere([string]$UserWhere) {
    Invoke-LocalSql @"
SET @inventory_allow_history_cleanup=1;
DELETE c FROM inventory_stock_counts c JOIN inventory_items i ON i.id=c.item_id JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE m FROM inventory_movements m JOIN inventory_items i ON i.id=m.item_id JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE s FROM inventory_stock_levels s JOIN inventory_items i ON i.id=s.item_id JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE h FROM inventory_status_history h JOIN inventory_items i ON i.id=h.item_id JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE a FROM inventory_alerts a JOIN inventory_items i ON i.id=a.item_id JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE i FROM inventory_items i JOIN users u ON u.id=i.user_id WHERE $UserWhere;
DELETE ia FROM inventory_access ia JOIN users u ON u.id=ia.owner_user_id OR u.id=ia.user_id WHERE $UserWhere;
DELETE l FROM inventory_locations l JOIN users u ON u.id=l.user_id WHERE $UserWhere;
DELETE sl FROM scan_logs sl JOIN qr_codes q ON q.id=sl.qr_id JOIN users u ON u.id=q.user_id WHERE $UserWhere;
DELETE q FROM qr_codes q JOIN users u ON u.id=q.user_id WHERE $UserWhere;
DELETE u FROM users u WHERE $UserWhere;
"@
}

function Clear-AcceptanceFixtures {
    if ($acceptanceOwnerId) { Clear-InventoryForWhere "u.id=$acceptanceOwnerId" }
    $where = "i.name='Codex Lifecycle Asset' OR i.name='Atomic inventory test' OR i.name LIKE 'Human Journey % Asset' OR i.name LIKE 'Human Journey % Combined Asset'"
    Invoke-LocalSql @"
SET @inventory_allow_history_cleanup=1;
DELETE c FROM inventory_stock_counts c INNER JOIN inventory_items i ON i.id=c.item_id WHERE $where;
DELETE m FROM inventory_movements m INNER JOIN inventory_items i ON i.id=m.item_id WHERE $where;
DELETE s FROM inventory_stock_levels s INNER JOIN inventory_items i ON i.id=s.item_id WHERE $where;
DELETE h FROM inventory_status_history h INNER JOIN inventory_items i ON i.id=h.item_id WHERE $where;
DELETE a FROM inventory_alerts a INNER JOIN inventory_items i ON i.id=a.item_id WHERE $where;
DELETE i FROM inventory_items i WHERE $where;
DELETE FROM qr_codes WHERE name='Codex Bulk Valid' OR name='Codex Browser Logo QR' OR name='Codex Exact Redirect QR' OR name LIKE 'Regression %';
"@
}

function Find-AcceptanceUploads {
    if (-not $acceptanceOwnerId) { return }
    $paths = docker compose exec -T database mariadb --batch --skip-column-names "-u$databaseUser" "-p$databasePassword" $database --execute="SELECT logo_path FROM user_logos WHERE user_id=$acceptanceOwnerId"
    if ($LASTEXITCODE -ne 0) { throw 'Could not discover owned acceptance uploads.' }
    $script:acceptanceUploadPaths = @($paths | Where-Object { $_ -match '^/api/uploads/logos/[A-Za-z0-9._-]+$' })
}

function Remove-AcceptanceUploads {
    $uploadRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\api\uploads\logos'))
    foreach ($webPath in $acceptanceUploadPaths) {
        $webPath = $webPath.Trim()
        $relativePath = $webPath -replace '^/api/uploads/logos/', ''
        $target = [System.IO.Path]::GetFullPath((Join-Path $uploadRoot $relativePath))
        if (-not $target.StartsWith($uploadRoot + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)) { throw 'Refused unsafe acceptance upload cleanup path.' }
        if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force }
    }
}

function Clear-KnownLeakedInventoryAcceptanceUsers {
    # These exact patterns are owned by the PHP and browser acceptance harnesses.
    Clear-InventoryForWhere "u.email REGEXP '^(inventory-(owner|operator|viewer)-[0-9a-f]{10}|master-acceptance-[0-9a-f]{12}|cleanup-probe-[0-9a-f]{12})@example[.]test$'"
}

function New-BrowserAcceptanceFixture {
    Invoke-LocalSql @"
INSERT INTO users(email,password,name,plan,email_verified_at,created_at) VALUES('$acceptanceEmail','disabled','Master Acceptance Owner','Free',NOW(),NOW());
SET @owner=LAST_INSERT_ID();
INSERT INTO qr_codes(user_id,type,name,content,dynamic_id) VALUES(@owner,'text','Master Acceptance Inventory QR',JSON_OBJECT('content','acceptance'),'master-acceptance-$acceptanceSuffix');
SET @qr=LAST_INSERT_ID();
INSERT INTO inventory_items(user_id,qr_id,public_token,name,category,inventory_type,quantity,minimum_stock_level,status,location,version) VALUES(@owner,@qr,UUID(),'Master Acceptance Inventory','Supplies','quantity',10,2,'in_stock','Warehouse',0);
SET @item=LAST_INSERT_ID();
INSERT INTO inventory_locations(user_id,name) VALUES(@owner,'Warehouse'),(@owner,'Office');
INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(@item,'Warehouse',10);
INSERT INTO inventory_movements(item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,to_location,reason,performed_by,performed_by_name,occurred_at,workflow_id,idempotency_key,metadata) VALUES(@item,@owner,'opening_state',10,0,10,NULL,'in_stock','Warehouse','Initial inventory state',@owner,'Master Acceptance Owner',NOW(),UUID(),'master-opening-$acceptanceSuffix',JSON_OBJECT('provenance','acceptance_fixture'));
"@
    $script:acceptanceOwnerId = Get-LocalScalar "SELECT id FROM users WHERE email='$acceptanceEmail'"
    $env:QR_TEST_TOKEN = (docker compose exec -T api php tests/inventory_acceptance.php token $acceptanceOwnerId | Out-String).Trim()
    $env:QR_TEST_ITEM_ID = Get-LocalScalar "SELECT id FROM inventory_items WHERE user_id=$acceptanceOwnerId AND deleted_at IS NULL LIMIT 1"
    $env:QR_TEST_QR_ID = Get-LocalScalar "SELECT qr_id FROM inventory_items WHERE user_id=$acceptanceOwnerId AND qr_id IS NOT NULL AND deleted_at IS NULL LIMIT 1"
    if (-not $env:QR_TEST_TOKEN -or -not $env:QR_TEST_ITEM_ID -or -not $env:QR_TEST_QR_ID) { throw 'Owned browser acceptance fixture is incomplete.' }
    $env:QR_REQUIRE_FIXTURES = '1'
}

function Test-InterruptedFixtureCleanup {
    $probeEmail = "cleanup-probe-$acceptanceSuffix@example.test"
    Invoke-LocalSql @"
INSERT INTO users(email,password,name,plan,email_verified_at) VALUES('$probeEmail','disabled','Cleanup Probe','Free',NOW());
SET @owner=LAST_INSERT_ID();
INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(@owner,UUID(),'Cleanup Probe Inventory','Supplies','quantity',1,'in_stock','Warehouse',0);
SET @item=LAST_INSERT_ID();
INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(@item,'Warehouse',1);
"@
    try { throw 'Intentional acceptance interruption probe.' }
    catch { }
    finally { Clear-InventoryForWhere "u.email='$probeEmail'" }
    if ((Get-LocalScalar "SELECT COUNT(*) FROM users WHERE email='$probeEmail'") -ne '0') { throw 'Interrupted fixture cleanup did not remove its owned user.' }
}

try {
    Clear-KnownLeakedInventoryAcceptanceUsers
    Clear-AcceptanceFixtures
    Test-InterruptedFixtureCleanup
    New-BrowserAcceptanceFixture
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
    npx.cmd playwright test tests/e2e/master-repair.spec.ts --grep "authenticated owner can open protected inventory actions and history" --repeat-each=3
    if ($LASTEXITCODE -ne 0) { throw 'Inventory readiness regression failed repeated execution.' }
    npx.cmd playwright test
    if ($LASTEXITCODE -ne 0) { throw 'Complete browser/API acceptance failed.' }
}
finally {
    Find-AcceptanceUploads
    Clear-AcceptanceFixtures
    Remove-AcceptanceUploads
}
