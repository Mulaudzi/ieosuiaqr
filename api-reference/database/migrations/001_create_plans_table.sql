-- Migration: 001_create_plans_table
-- Description: Create plans table with default subscription tiers
-- Run: mysql -u user -p database_name < 001_create_plans_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `plans` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `price_monthly_zar` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `price_annual_zar` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `qr_limit` INT UNSIGNED NULL COMMENT 'NULL = unlimited',
    `features` JSON NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default plans
INSERT INTO `plans` (`name`, `price_monthly_zar`, `price_annual_zar`, `qr_limit`, `features`) VALUES
('Free', 0.00, 0.00, 5, '["basic_qr_types", "png_download"]'),
('Pro', 179.00, 1728.00, 50, '["all_qr_types", "basic_tracking", "custom_colors", "svg_download", "pdf_download"]'),
('Enterprise', 549.00, 5270.00, NULL, '["all_qr_types", "advanced_analytics", "geo_tracking", "custom_branding", "bulk_import", "api_access", "priority_support"]')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
