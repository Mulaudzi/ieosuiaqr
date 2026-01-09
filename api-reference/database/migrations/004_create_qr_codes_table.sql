-- Migration: 004_create_qr_codes_table
-- Description: Create qr_codes table for storing generated QR codes
-- Run: mysql -u user -p database_name < 004_create_qr_codes_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `qr_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NULL,
    `content` JSON NOT NULL,
    `custom_options` JSON NULL COMMENT 'Colors, logo, etc.',
    `dynamic_id` VARCHAR(100) NULL UNIQUE COMMENT 'For dynamic QR codes',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `total_scans` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_dynamic_id` (`dynamic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
