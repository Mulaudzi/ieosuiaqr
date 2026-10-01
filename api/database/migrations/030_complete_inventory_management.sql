-- Complete inventory management, additive and legacy-safe.
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS public_token CHAR(36) NULL AFTER qr_id,
  ADD COLUMN IF NOT EXISTS inventory_type ENUM('quantity','serialized') NOT NULL DEFAULT 'serialized' AFTER category,
  ADD COLUMN IF NOT EXISTS inventory_identifier VARCHAR(100) NULL AFTER inventory_type,
  ADD COLUMN IF NOT EXISTS quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER inventory_identifier,
  ADD COLUMN IF NOT EXISTS minimum_stock_level INT UNSIGNED NOT NULL DEFAULT 0 AFTER quantity,
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) NULL AFTER location,
  ADD COLUMN IF NOT EXISTS version INT UNSIGNED NOT NULL DEFAULT 0 AFTER assigned_to,
  ADD COLUMN IF NOT EXISTS public_visibility ENUM('status_only','summary','private') NOT NULL DEFAULT 'status_only' AFTER version,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER public_visibility;

ALTER TABLE inventory_items
  MODIFY status ENUM('in_stock','available','low_stock','out_of_stock','checked_out','maintenance','damaged','lost','missing','unavailable','out') NOT NULL DEFAULT 'available';

CREATE UNIQUE INDEX IF NOT EXISTS inventory_public_token_unique ON inventory_items(public_token);
CREATE INDEX IF NOT EXISTS inventory_identifier_idx ON inventory_items(user_id, inventory_identifier);
CREATE INDEX IF NOT EXISTS inventory_type_status_idx ON inventory_items(user_id, inventory_type, status);
CREATE INDEX IF NOT EXISTS inventory_deleted_idx ON inventory_items(user_id,deleted_at);

UPDATE inventory_items SET public_token = UUID() WHERE public_token IS NULL;
UPDATE inventory_items SET status='available' WHERE inventory_type='serialized' AND status='in_stock';

CREATE TABLE IF NOT EXISTS inventory_locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NULL,
  description VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_location_name_unique(user_id,name),
  CONSTRAINT inventory_locations_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO inventory_locations(user_id,name)
SELECT DISTINCT user_id,location FROM inventory_items WHERE location IS NOT NULL AND location<>'';

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  quantity_delta INT NOT NULL DEFAULT 0,
  previous_quantity INT UNSIGNED NULL,
  new_quantity INT UNSIGNED NULL,
  previous_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NULL,
  from_location VARCHAR(255) NULL,
  to_location VARCHAR(255) NULL,
  reason VARCHAR(150) NOT NULL,
  performed_by INT UNSIGNED NULL,
  performed_by_name VARCHAR(255) NOT NULL,
  related_party VARCHAR(255) NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  workflow_id CHAR(36) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  metadata JSON NULL,
  reversed_movement_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_movement_idempotency_unique(user_id,idempotency_key),
  KEY inventory_movement_item_time_idx(item_id,occurred_at),
  KEY inventory_movement_action_idx(user_id,action_type),
  KEY inventory_movement_actor_idx(performed_by),
  CONSTRAINT inventory_movements_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_owner_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_actor_fk FOREIGN KEY(performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE inventory_movements DROP FOREIGN KEY IF EXISTS inventory_movements_item_fk;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE inventory_movements DROP FOREIGN KEY IF EXISTS inventory_movements_owner_fk;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_owner_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS inventory_stock_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_stock_location_unique(item_id,location_name),
  CONSTRAINT inventory_stock_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO inventory_movements
  (item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by,performed_by_name,occurred_at,notes,workflow_id,idempotency_key,metadata)
SELECT i.id,i.user_id,'legacy_opening_state',0,i.quantity,i.quantity,i.status,i.status,i.location,i.location,
  'Legacy opening state',i.user_id,COALESCE(u.name,'Legacy owner'),i.created_at,
  'State imported when the inventory ledger was introduced.',UUID(),CONCAT('legacy-opening-',i.id),JSON_OBJECT('provenance','migration_030')
FROM inventory_items i JOIN users u ON u.id=i.user_id
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements m WHERE m.item_id=i.id);

INSERT INTO inventory_stock_levels(item_id,location_name,quantity)
SELECT i.id,COALESCE(NULLIF(i.location,''),'Unassigned'),i.quantity
FROM inventory_items i
WHERE i.inventory_type='quantity'
  AND NOT EXISTS (SELECT 1 FROM inventory_stock_levels s WHERE s.item_id=i.id);

CREATE TABLE IF NOT EXISTS inventory_stock_counts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  expected_quantity INT UNSIGNED NOT NULL,
  counted_quantity INT UNSIGNED NOT NULL,
  difference INT NOT NULL,
  location VARCHAR(255) NULL,
  counted_by INT UNSIGNED NULL,
  counted_by_name VARCHAR(255) NOT NULL,
  count_date DATETIME NOT NULL,
  reason VARCHAR(150) NOT NULL,
  notes TEXT NULL,
  status ENUM('saved','applied','cancelled') NOT NULL DEFAULT 'saved',
  applied_movement_id BIGINT UNSIGNED NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at DATETIME NULL,
  UNIQUE KEY inventory_count_idempotency_unique(user_id,idempotency_key),
  KEY inventory_count_item_idx(item_id,count_date),
  CONSTRAINT inventory_counts_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT inventory_counts_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT inventory_counts_actor_fk FOREIGN KEY(counted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A saved count is a location-scoped observation. These snapshots let apply
-- reject a reconciliation when either the item or that location changed.
ALTER TABLE inventory_stock_counts
  ADD COLUMN IF NOT EXISTS expected_location_quantity INT UNSIGNED NULL AFTER expected_quantity,
  ADD COLUMN IF NOT EXISTS item_version INT UNSIGNED NULL AFTER expected_location_quantity;

UPDATE inventory_stock_counts c
JOIN inventory_items i ON i.id=c.item_id
SET c.expected_location_quantity=COALESCE(c.expected_location_quantity,c.expected_quantity),
    c.item_version=COALESCE(c.item_version,i.version)
WHERE c.status='saved';

ALTER TABLE inventory_stock_counts DROP FOREIGN KEY IF EXISTS inventory_counts_item_fk;
ALTER TABLE inventory_stock_counts ADD CONSTRAINT inventory_counts_item_fk FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;
ALTER TABLE inventory_stock_counts DROP FOREIGN KEY IF EXISTS inventory_counts_user_fk;
ALTER TABLE inventory_stock_counts ADD CONSTRAINT inventory_counts_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS inventory_access (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('viewer','operator','controller','admin') NOT NULL DEFAULT 'viewer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_access_unique(owner_user_id,user_id),
  CONSTRAINT inventory_access_owner_fk FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT inventory_access_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
