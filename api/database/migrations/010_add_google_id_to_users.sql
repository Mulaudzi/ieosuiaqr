-- Add google_id column for OAuth users
ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(255) NULL AFTER `avatar_url`;

-- Add index for faster lookups
ALTER TABLE `users` ADD INDEX `idx_users_google_id` (`google_id`);
