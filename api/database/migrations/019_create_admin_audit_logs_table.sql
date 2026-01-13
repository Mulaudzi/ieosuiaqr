-- Admin Audit Logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    admin_email VARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NULL,
    target_id INT NULL,
    target_name VARCHAR(255) NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status ENUM('success', 'failure', 'warning') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_admin (admin_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_category (category),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Possible categories: auth, admin_management, settings, system
-- Possible actions: login_attempt, login_success, login_failed, logout, 
--                   admin_created, admin_updated, admin_deleted, admin_activated, admin_deactivated, admin_unlocked,
--                   settings_updated, password_changed, session_expired
