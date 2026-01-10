-- Migration: 009_add_avatar_url_to_users
-- Description: Add avatar_url column to users table
-- Run: mysql -u user -p database_name < 009_add_avatar_url_to_users.sql

SET NAMES utf8mb4;

ALTER TABLE `users` 
ADD COLUMN `avatar_url` VARCHAR(500) NULL AFTER `plan`;
