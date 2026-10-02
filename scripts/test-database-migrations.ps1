$ErrorActionPreference = 'Stop'

$freshDatabase = 'ieosuia_qr_migration_fresh_test'
$legacyDatabase = 'ieosuia_qr_migration_legacy_test'
$rootPassword = 'ieosuia_root_local_only'
$migrationRoot = Join-Path $PSScriptRoot '..\api\database\migrations'
$excludedOperationalMigrations = @('027_link_central_identities.sql', '028_purge_local_credentials.sql')

function Invoke-DatabaseSql([string]$Database, [string]$Sql) {
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" $Database --execute=$Sql
    if ($LASTEXITCODE -ne 0) { throw "SQL failed in $Database." }
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

function Invoke-ApplicationAcceptance([string]$Database, [string]$Mode) {
    docker compose exec -T api php tests/migration_acceptance.php $Database $Mode
    if ($LASTEXITCODE -ne 0) { throw "Application migration acceptance failed: $Mode in $Database" }
}

$migrations = Get-ChildItem -LiteralPath $migrationRoot -Filter '*.sql' |
    Where-Object { $_.Name -notin $excludedOperationalMigrations } |
    Sort-Object Name
$migration030 = $migrations | Where-Object Name -EQ '030_complete_inventory_management.sql'
if (-not $migration030) { throw 'Migration 030 is missing.' }
$migration031 = $migrations | Where-Object Name -EQ '031_inventory_integrity_upgrade.sql'
if (-not $migration031) { throw 'Migration 031 is missing.' }

try {
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" --execute="DROP DATABASE IF EXISTS $freshDatabase; DROP DATABASE IF EXISTS $legacyDatabase; CREATE DATABASE $freshDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE $legacyDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON $freshDatabase.* TO 'ieosuia_local'@'%'; GRANT ALL PRIVILEGES ON $legacyDatabase.* TO 'ieosuia_local'@'%'; FLUSH PRIVILEGES;"
    if ($LASTEXITCODE -ne 0) { throw 'Could not create isolated migration test databases.' }

    foreach ($migration in $migrations) { Invoke-Migration $freshDatabase $migration }
    Invoke-ApplicationAcceptance $freshDatabase 'fresh'
    Invoke-ApplicationAcceptance $freshDatabase 'integrity'

    foreach ($migration in ($migrations | Where-Object { [int]$_.BaseName.Substring(0,3) -le 20 })) { Invoke-Migration $legacyDatabase $migration }
    # Representative partially upgraded pre-030 installations already carried
    # quantity metadata and multiple location rows before the canonical schema.
    Invoke-DatabaseSql $legacyDatabase @"
ALTER TABLE inventory_items
  ADD COLUMN inventory_type ENUM('quantity','serialized') NOT NULL DEFAULT 'serialized' AFTER category,
  ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER inventory_type,
  ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
CREATE TABLE inventory_stock_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_stock_location_unique(item_id,location_name),
  CONSTRAINT inventory_stock_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"@
    Invoke-ApplicationAcceptance $legacyDatabase 'legacy-seed'
    foreach ($migration in ($migrations | Where-Object { [int]$_.BaseName.Substring(0,3) -gt 20 })) { Invoke-Migration $legacyDatabase $migration }
    Invoke-ApplicationAcceptance $legacyDatabase 'legacy-prepare'
    Invoke-ApplicationAcceptance $legacyDatabase 'legacy-verify'

    $stateSql = @"
SELECT CONCAT_WS('|',
 (SELECT COUNT(*) FROM inventory_locations),
 (SELECT COUNT(*) FROM inventory_stock_levels),
 (SELECT COALESCE(SUM(quantity),0) FROM inventory_stock_levels),
 (SELECT COUNT(*) FROM inventory_access),
 (SELECT COUNT(*) FROM inventory_movements),
 (SELECT COUNT(*) FROM inventory_stock_counts),
 (SELECT COALESCE(SUM(quantity),0) FROM inventory_items),
 (SELECT GROUP_CONCAT(CONCAT(i.name,'=',s.location_name,':',s.quantity) ORDER BY i.name,s.location_name SEPARATOR ';') FROM inventory_stock_levels s JOIN inventory_items i ON i.id=s.item_id),
 (SELECT GROUP_CONCAT(CONCAT(id,':',action_type,':',idempotency_key,':',COALESCE(performed_by_name,''),':',DATE_FORMAT(occurred_at,'%Y-%m-%d %H:%i:%s'),':',SHA2(COALESCE(metadata,''),256)) ORDER BY id SEPARATOR ';') FROM inventory_movements),
 (SELECT GROUP_CONCAT(CONCAT(id,':',status,':',idempotency_key,':',expected_quantity,':',counted_quantity,':',location) ORDER BY id SEPARATOR ';') FROM inventory_stock_counts),
 (SELECT GROUP_CONCAT(CONCAT(owner_user_id,':',user_id,':',role,':',is_active) ORDER BY owner_user_id,user_id SEPARATOR ';') FROM inventory_access),
 (SELECT GROUP_CONCAT(CONCAT(name,':',status,':',location,':',COALESCE(DATE_FORMAT(deleted_at,'%Y-%m-%d %H:%i:%s'),'')) ORDER BY id SEPARATOR ';') FROM inventory_items)
);
"@
    $beforeReplay = Get-DatabaseScalar $legacyDatabase $stateSql
    Invoke-Migration $legacyDatabase $migration030
    $afterReplay = Get-DatabaseScalar $legacyDatabase $stateSql
    if ($beforeReplay -ne $afterReplay) { throw "Migration 030 replay changed canonical state: before=$beforeReplay after=$afterReplay" }
    Invoke-Migration $legacyDatabase $migration031
    $afterUpgradeReplay = Get-DatabaseScalar $legacyDatabase $stateSql
    if ($afterReplay -ne $afterUpgradeReplay) { throw "Migration 031 replay changed canonical state: before=$afterReplay after=$afterUpgradeReplay" }
    Invoke-ApplicationAcceptance $legacyDatabase 'legacy-verify'

    Write-Output '030 REPLAY: PASS'
    Write-Output '031 REPLAY: PASS'
    $migrationManifest = $migrations | ForEach-Object { "$($_.Name):$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)" }
    Write-Output ("ORDERED MIGRATION MANIFEST WITH SHA256: PASS - " + ($migrationManifest -join ', '))
    Write-Output 'MIGRATION ACCEPTANCE: PASS'
}
finally {
    docker compose exec -T database mariadb --user=root "--password=$rootPassword" --execute="DROP DATABASE IF EXISTS $freshDatabase; DROP DATABASE IF EXISTS $legacyDatabase;" 2>$null | Out-Null
}
