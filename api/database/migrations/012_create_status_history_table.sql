-- Create inventory_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS `inventory_status_history` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT UNSIGNED NOT NULL,
    `old_status` ENUM('in_stock', 'out', 'maintenance', 'checked_out') NULL,
    `new_status` ENUM('in_stock', 'out', 'maintenance', 'checked_out') NOT NULL,
    `old_location` VARCHAR(255) NULL,
    `new_location` VARCHAR(255) NULL,
    `changed_by` INT UNSIGNED NULL,
    `changed_by_name` VARCHAR(255) NULL,
    `changed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_status_history_item` (`item_id`),
    INDEX `idx_status_history_date` (`changed_at`),
    
    FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add notification_email column to users table if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notify_status_change` TINYINT(1) DEFAULT 1;
