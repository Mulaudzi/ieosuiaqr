-- Migration: 006_create_invoices_table
-- Description: Create invoices table for billing records
-- Run: mysql -u user -p database_name < 006_create_invoices_table.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `invoices` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `subscription_id` INT UNSIGNED NULL,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `amount_zar` DECIMAL(10,2) NOT NULL,
    `status` ENUM('paid', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `description` VARCHAR(255) NULL,
    `payment_method` VARCHAR(50) NULL,
    `payfast_payment_id` VARCHAR(100) NULL,
    `pdf_path` VARCHAR(500) NULL,
    `invoice_date` DATE NOT NULL,
    `paid_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_invoice_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
