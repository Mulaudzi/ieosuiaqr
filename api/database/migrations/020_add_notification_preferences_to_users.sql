-- Add notification preference columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS scan_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE;

-- MariaDB does not support PostgreSQL-style partial indexes. A normal boolean
-- index still lets the weekly-report batch query use an indexed lookup.
CREATE INDEX IF NOT EXISTS idx_users_weekly_report ON users(weekly_report);
