-- Create payments table to track all payment attempts (successful and failed)
-- Supports both PayFast and Paystack payment providers

CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_id VARCHAR(100),
    invoice_id INT NULL,
    amount_zar DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'payfast',
    description VARCHAR(255),
    error_message TEXT NULL,
    provider_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_user_payments (user_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_payment_status (status),
    INDEX idx_payment_date (created_at)
);

-- Add Paystack subscription code to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS paystack_subscription_code VARCHAR(100) NULL AFTER payfast_token,
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'payfast' AFTER paystack_subscription_code;
