-- Add notification preference columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS scan_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE;

-- Add index for users who want weekly reports (for batch email sending)
CREATE INDEX IF NOT EXISTS idx_users_weekly_report ON users(weekly_report) WHERE weekly_report = TRUE;
