-- Versioned successor for installations that previously applied migration 030.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE inventory_locations MODIFY name VARCHAR(255) NOT NULL;
INSERT IGNORE INTO inventory_locations(user_id,name)
SELECT DISTINCT i.user_id,COALESCE(NULLIF(s.location_name,''),'Unassigned')
FROM inventory_stock_levels s JOIN inventory_items i ON i.id=s.item_id;

ALTER TABLE inventory_stock_counts DROP FOREIGN KEY IF EXISTS inventory_counts_applied_movement_fk;
ALTER TABLE inventory_stock_counts ADD CONSTRAINT inventory_counts_applied_movement_fk
  FOREIGN KEY(applied_movement_id) REFERENCES inventory_movements(id) ON DELETE RESTRICT;

-- Record aggregate corrections before changing product state.
INSERT IGNORE INTO inventory_movements
 (item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by,performed_by_name,occurred_at,notes,workflow_id,idempotency_key,metadata)
SELECT i.id,i.user_id,'migration_reconciliation',s.total-i.quantity,i.quantity,s.total,i.status,i.status,i.location,i.location,
 'Inventory aggregate reconciled by migration 031',NULL,'Migration 031',CURRENT_TIMESTAMP,
 'Existing location totals exceeded the legacy aggregate.',UUID(),CONCAT('migration-031-overage-',i.id),
 JSON_OBJECT('provenance','migration_031','stock_total',s.total,'previous_item_quantity',i.quantity)
FROM inventory_items i JOIN (SELECT item_id,SUM(quantity) total FROM inventory_stock_levels GROUP BY item_id) s ON s.item_id=i.id
WHERE i.inventory_type='quantity' AND s.total>i.quantity;

UPDATE inventory_items i
JOIN (SELECT item_id,SUM(quantity) total FROM inventory_stock_levels GROUP BY item_id) s ON s.item_id=i.id
SET i.quantity=s.total,i.version=i.version+1
WHERE i.inventory_type='quantity' AND s.total>i.quantity;

INSERT IGNORE INTO inventory_movements
 (item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by,performed_by_name,occurred_at,notes,workflow_id,idempotency_key,metadata)
SELECT i.id,i.user_id,'migration_reconciliation',0,i.quantity,i.quantity,i.status,i.status,NULL,COALESCE(NULLIF(i.location,''),'Unassigned'),
 'Inventory location allocation reconciled by migration 031',NULL,'Migration 031',CURRENT_TIMESTAMP,
 'Missing location units were restored without changing the aggregate.',UUID(),CONCAT('migration-031-shortage-',i.id),
 JSON_OBJECT('provenance','migration_031','stock_total',s.total,'item_quantity',i.quantity,'allocated_units',i.quantity-s.total)
FROM inventory_items i JOIN (SELECT item_id,SUM(quantity) total FROM inventory_stock_levels GROUP BY item_id) s ON s.item_id=i.id
WHERE i.inventory_type='quantity' AND s.total<i.quantity;

INSERT INTO inventory_stock_levels(item_id,location_name,quantity)
SELECT i.id,COALESCE(NULLIF(i.location,''),'Unassigned'),i.quantity-s.total
FROM inventory_items i JOIN (SELECT item_id,SUM(quantity) total FROM inventory_stock_levels GROUP BY item_id) s ON s.item_id=i.id
WHERE i.inventory_type='quantity' AND s.total<i.quantity
ON DUPLICATE KEY UPDATE quantity=inventory_stock_levels.quantity+VALUES(quantity);

INSERT IGNORE INTO schema_migrations(version) VALUES
 ('030_complete_inventory_management'),('031_inventory_integrity_upgrade');
