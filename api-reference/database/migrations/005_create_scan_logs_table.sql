-- Migration: 005_create_scan_logs_table
-- Description: Create scan_logs table for QR code analytics
-- Run: mysql -u user -p database_name < 005_create_scan_logs_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `scan_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `qr_id` INT UNSIGNED NOT NULL,
    `ip_hash` VARCHAR(64) NOT NULL COMMENT 'MD5 hashed IP for privacy',
    `location` JSON NULL COMMENT '{city, country, lat, long}',
    `device` JSON NULL COMMENT '{platform, browser, version, is_mobile}',
    `user_agent` TEXT NULL,
    `referer` VARCHAR(500) NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`qr_id`) REFERENCES `qr_codes`(`id`) ON DELETE CASCADE,
    INDEX `idx_qr_id` (`qr_id`),
    INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
