-- Add read/unread status and reply tracking to email_logs table
ALTER TABLE email_logs 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER user_agent,
ADD COLUMN read_at TIMESTAMP NULL DEFAULT NULL AFTER is_read,
ADD COLUMN read_by VARCHAR(255) DEFAULT NULL AFTER read_at,
ADD COLUMN is_replied BOOLEAN DEFAULT FALSE AFTER read_by,
ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL AFTER is_replied,
ADD COLUMN replied_by VARCHAR(255) DEFAULT NULL AFTER replied_at,
ADD COLUMN reply_notes TEXT DEFAULT NULL AFTER replied_by,
ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' AFTER reply_notes,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE AFTER priority,
ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL AFTER is_archived;

-- Add indexes for filtering
CREATE INDEX idx_is_read ON email_logs (is_read);
CREATE INDEX idx_is_replied ON email_logs (is_replied);
CREATE INDEX idx_priority ON email_logs (priority);
CREATE INDEX idx_is_archived ON email_logs (is_archived);
