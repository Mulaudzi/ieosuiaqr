-- Email Webhooks Table for tracking bounce and delivery events
CREATE TABLE IF NOT EXISTS email_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_log_id INT DEFAULT NULL,
    event_type ENUM('delivered', 'bounced', 'complained', 'opened', 'clicked', 'unsubscribed') NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(50) DEFAULT NULL,
    bounce_subtype VARCHAR(50) DEFAULT NULL,
    bounce_message TEXT DEFAULT NULL,
    raw_payload JSON DEFAULT NULL,
    source VARCHAR(50) DEFAULT 'unknown',
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email_log_id (email_log_id),
    INDEX idx_event_type (event_type),
    INDEX idx_recipient (recipient_email),
    INDEX idx_processed (processed),
    INDEX idx_created (created_at),
    
    CONSTRAINT fk_email_log FOREIGN KEY (email_log_id) REFERENCES email_logs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
