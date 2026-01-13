-- Create payments table to track all payment attempts (successful and failed)
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_id VARCHAR(100) UNIQUE,
    invoice_id INT NULL,
    amount_zar DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'card',
    description VARCHAR(255),
    error_message TEXT NULL,
    payfast_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_user_payments (user_id),
    INDEX idx_payment_status (status),
    INDEX idx_payment_date (created_at)
);
