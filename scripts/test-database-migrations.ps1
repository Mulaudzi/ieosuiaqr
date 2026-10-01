$ErrorActionPreference = 'Stop'

$freshDatabase = 'ieosuia_qr_migration_fresh_test'
$legacyDatabase = 'ieosuia_qr_migration_legacy_test'
$rootPassword = 'ieosuia_root_local_only'
$migrationRoot = Join-Path $PSScriptRoot '..\api\database\migrations'
$excludedOperationalMigrations = @('027_link_central_identities.sql', '028_purge_local_credentials.sql')

function Invoke-DatabaseSql([string]$Database, [string]$Sql, [switch]$ExpectFailure) {
    $previousPreference = $ErrorActionPreference
    if ($ExpectFailure) { $ErrorActionPreference = 'Continue' }
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" $Database --execute=$Sql 2>$null
    $failed = $LASTEXITCODE -ne 0
    $ErrorActionPreference = $previousPreference
    if ($ExpectFailure -and -not $failed) { throw "Expected SQL to fail in $Database, but it succeeded." }
    if (-not $ExpectFailure -and $failed) { throw "SQL failed in $Database." }
}

function Get-DatabaseScalar([string]$Database, [string]$Sql) {
    $value = docker compose exec -T database mariadb --batch --skip-column-names --user=root "--password=$rootPassword" $Database --execute=$Sql
    if ($LASTEXITCODE -ne 0) { throw "Scalar SQL failed in $Database." }
    return ($value | Out-String).Trim()
}

function Invoke-Migration([string]$Database, [System.IO.FileInfo]$Migration) {
    Get-Content -LiteralPath $Migration.FullName -Raw |
        docker compose exec -T database mariadb --user=root "--password=$rootPassword" $Database
    if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($Migration.Name) in $Database" }
}

$migrations = Get-ChildItem -LiteralPath $migrationRoot -Filter '*.sql' |
    Where-Object { $_.Name -notin $excludedOperationalMigrations } |
    Sort-Object Name

try {
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" --execute="DROP DATABASE IF EXISTS $freshDatabase; DROP DATABASE IF EXISTS $legacyDatabase; CREATE DATABASE $freshDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE $legacyDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if ($LASTEXITCODE -ne 0) { throw 'Could not create isolated migration test databases.' }

    foreach ($migration in $migrations) { Invoke-Migration $freshDatabase $migration }
    if ((Get-DatabaseScalar $freshDatabase "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$freshDatabase' AND table_name IN ('inventory_items','inventory_locations','inventory_movements','inventory_stock_levels','inventory_stock_counts','inventory_access');") -ne '6') { throw 'Fresh schema is missing inventory tables.' }
    Invoke-DatabaseSql $freshDatabase "SELECT expected_location_quantity,item_version FROM inventory_stock_counts LIMIT 0;"

    foreach ($migration in ($migrations | Where-Object { [int]$_.BaseName.Substring(0,3) -le 20 })) { Invoke-Migration $legacyDatabase $migration }
    Invoke-DatabaseSql $legacyDatabase "INSERT INTO users(email,password,name,plan) VALUES('legacy-migration@example.test','disabled','Legacy Owner','Free'); SET @owner=LAST_INSERT_ID(); INSERT INTO qr_codes(user_id,type,name,content) VALUES(@owner,'text','Legacy QR',JSON_OBJECT('content','legacy')); SET @qr=LAST_INSERT_ID(); INSERT INTO inventory_items(user_id,qr_id,name,notes,category,status,location) VALUES(@owner,@qr,'Legacy Laptop','Preserved row','Equipment','in_stock','Old Office');"
    foreach ($migration in ($migrations | Where-Object { [int]$_.BaseName.Substring(0,3) -gt 20 })) { Invoke-Migration $legacyDatabase $migration }
    if ((Get-DatabaseScalar $legacyDatabase "SELECT COUNT(*) FROM inventory_movements WHERE reason='Legacy opening state';") -ne '1') { throw 'Legacy opening movement was not backfilled.' }
    if ((Get-DatabaseScalar $legacyDatabase "SELECT COUNT(*) FROM inventory_stock_levels;") -ne '0') { throw 'Serialized legacy data received an invalid quantity stock level.' }
    Invoke-DatabaseSql $legacyDatabase "UPDATE inventory_items SET deleted_at=NOW() WHERE name='Legacy Laptop';"
    if ((Get-DatabaseScalar $legacyDatabase "SELECT COUNT(*) FROM inventory_items WHERE deleted_at IS NOT NULL;") -ne '1') { throw 'Soft delete did not preserve the legacy row.' }
    $restrictiveRelationships = Get-DatabaseScalar $legacyDatabase "SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema='$legacyDatabase' AND constraint_name IN ('inventory_movements_item_fk','inventory_movements_owner_fk','inventory_counts_item_fk','inventory_counts_user_fk') AND delete_rule='RESTRICT';"
    if ($restrictiveRelationships -ne '4') { throw 'Historical movement/count relationships are not delete-restrictive.' }

    Write-Output 'database migration acceptance: PASS (fresh, legacy backfill, restrictive history, soft delete)'
}
finally {
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" --execute="DROP DATABASE IF EXISTS $freshDatabase; DROP DATABASE IF EXISTS $legacyDatabase;" 2>$null | Out-Null
}
