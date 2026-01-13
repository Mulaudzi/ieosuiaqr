-- Create payment retries table to track failed payment retry attempts
-- Supports automatic retry scheduling with grace period handling

CREATE TABLE IF NOT EXISTS payment_retries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    original_payment_id VARCHAR(100) NULL,
    amount_zar DECIMAL(10, 2) NOT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    last_retry_at TIMESTAMP NULL,
    status ENUM('pending', 'retrying', 'succeeded', 'exhausted', 'canceled') NOT NULL DEFAULT 'pending',
    grace_period_ends_at TIMESTAMP NULL,
    failure_reason TEXT NULL,
    notification_sent_count INT DEFAULT 0,
    last_notification_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    INDEX idx_retry_status (status),
    INDEX idx_next_retry (next_retry_at),
    INDEX idx_grace_period (grace_period_ends_at),
    INDEX idx_user_retries (user_id)
);

-- Add grace_period_ends_at and past_due status to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP NULL AFTER renewal_date,
ADD COLUMN IF NOT EXISTS failed_payment_count INT DEFAULT 0 AFTER grace_period_ends_at,
ADD COLUMN IF NOT EXISTS pending_plan_id INT NULL AFTER failed_payment_count;

-- Update status enum to include past_due (if needed, this may require recreating the column)
-- For MySQL, we update the enum by modifying the column
-- ALTER TABLE subscriptions MODIFY COLUMN status ENUM('pending', 'active', 'canceled', 'past_due', 'pending_downgrade') NOT NULL DEFAULT 'pending';
