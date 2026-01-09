-- Migration: 007_create_api_keys_table
-- Description: Create api_keys table for Enterprise API access
-- Run: mysql -u user -p database_name < 007_create_api_keys_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `key_hash` VARCHAR(64) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `last_used_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_key_hash` (`key_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
