-- Admin Settings Table for storing notification preferences and other settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'json', 'boolean', 'number') DEFAULT 'string',
    description VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('notification_emails', '["admin@ieosuia.com"]', 'json', 'Email addresses that receive instant alerts for new contact submissions'),
('notify_on_contact', 'true', 'boolean', 'Send notification when new contact form is submitted'),
('notify_on_failed', 'true', 'boolean', 'Send notification when email delivery fails'),
('notify_on_bounce', 'true', 'boolean', 'Send notification when email bounces'),
('daily_digest_enabled', 'false', 'boolean', 'Send daily digest of all contact submissions'),
('daily_digest_time', '09:00', 'string', 'Time to send daily digest (24h format)')
ON DUPLICATE KEY UPDATE updated_at = NOW();
