-- Migration: 003_create_subscriptions_table
-- Description: Create subscriptions table for plan management and billing
-- Run: mysql -u user -p database_name < 003_create_subscriptions_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `plan_id` INT UNSIGNED NOT NULL,
    `status` ENUM('active', 'trial', 'canceled', 'expired', 'pending') NOT NULL DEFAULT 'pending',
    `frequency` ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
    `renewal_date` DATE NULL,
    `payfast_token` VARCHAR(255) NULL,
    `last_payment_date` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
