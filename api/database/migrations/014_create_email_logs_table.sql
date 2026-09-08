-- Email Logs Table for tracking all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    cc_email VARCHAR(255) DEFAULT NULL,
    reply_to_email VARCHAR(255) DEFAULT NULL,
    subject VARCHAR(500) NOT NULL,
    body_preview TEXT,
    email_type ENUM('contact', 'verification', 'password_reset', 'welcome', 'notification', 'other') DEFAULT 'other',
    status ENUM('sent', 'failed', 'bounced', 'pending') DEFAULT 'pending',
    error_message TEXT DEFAULT NULL,
    
    -- Contact form specific fields
    sender_name VARCHAR(255) DEFAULT NULL,
    sender_email VARCHAR(255) DEFAULT NULL,
    sender_company VARCHAR(255) DEFAULT NULL,
    inquiry_purpose VARCHAR(100) DEFAULT NULL,
    origin_url TEXT DEFAULT NULL,
    
    -- Metadata
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recipient (recipient_email),
    INDEX idx_status (status),
    INDEX idx_type (email_type),
    INDEX idx_created (created_at),
    INDEX idx_sender (sender_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
