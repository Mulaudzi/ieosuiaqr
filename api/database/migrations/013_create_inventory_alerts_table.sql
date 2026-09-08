-- Create inventory_alerts table for low-stock and maintenance reminders
CREATE TABLE IF NOT EXISTS `inventory_alerts` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `item_id` INT UNSIGNED NULL,
    `alert_type` ENUM('low_activity', 'maintenance_due', 'status_change', 'custom') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NULL,
    `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
    `is_read` TINYINT(1) DEFAULT 0,
    `is_emailed` TINYINT(1) DEFAULT 0,
    `due_date` DATE NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_alerts_user` (`user_id`),
    INDEX `idx_alerts_item` (`item_id`),
    INDEX `idx_alerts_type` (`alert_type`),
    INDEX `idx_alerts_read` (`is_read`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add maintenance_due_date and last_activity_date to inventory_items
ALTER TABLE `inventory_items` 
    ADD COLUMN IF NOT EXISTS `maintenance_due_date` DATE NULL,
    ADD COLUMN IF NOT EXISTS `alert_low_activity_days` INT DEFAULT 30;

-- Add notification preferences columns to users table
ALTER TABLE `users`
    ADD COLUMN IF NOT EXISTS `notify_low_activity` TINYINT(1) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS `notify_maintenance` TINYINT(1) DEFAULT 1;
