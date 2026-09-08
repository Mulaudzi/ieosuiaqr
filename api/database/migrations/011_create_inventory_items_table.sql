-- Create inventory_items table for Smart Inventory QR feature
CREATE TABLE IF NOT EXISTS `inventory_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `qr_id` INT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) DEFAULT 'Other',
    `notes` TEXT NULL,
    `status` ENUM('in_stock', 'out', 'maintenance', 'checked_out') DEFAULT 'in_stock',
    `location` VARCHAR(255) NULL,
    `last_scan_date` DATETIME NULL,
    `shared_access` JSON NULL COMMENT 'Enterprise: Array of user IDs with access',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_inventory_user` (`user_id`),
    INDEX `idx_inventory_qr` (`qr_id`),
    INDEX `idx_inventory_status` (`status`),
    INDEX `idx_inventory_category` (`category`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`qr_id`) REFERENCES `qr_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add user_logos table for logo uploads
CREATE TABLE IF NOT EXISTS `user_logos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `logo_path` VARCHAR(500) NOT NULL,
    `preview_thumb` VARCHAR(500) NULL,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_logos_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
