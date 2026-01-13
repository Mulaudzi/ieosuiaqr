-- Admin users table with secure password hashing
-- Uses bcrypt (same as regular users) for password storage

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    -- Multi-step authentication passwords (all bcrypt hashed)
    password_step2 VARCHAR(255) NOT NULL,
    password_step3 VARCHAR(255) NOT NULL,
    
    -- Security tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    
    INDEX idx_admin_email (email),
    INDEX idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial admin user (password: billionaires, step2: Mu1@udz!, step3: 7211018830)
-- These are bcrypt hashes - you should change these after first login
INSERT INTO admin_users (email, password, name, password_step2, password_step3) VALUES (
    'godtheson@ieosuia.com',
    '$2y$10$LKdFg6RUVGBmrL1sS.UODO0FoABr6y0ZYx7gxvXEJT9e1Ds6Hx7HS', -- billionaires
    'Admin',
    '$2y$10$RGp0u/Q/kpF6XJhBnGVqOugx1qFX0Mx9N7p7OHVZkCK5X9YQz8Xd6', -- Mu1@udz!
    '$2y$10$5VxE2pLCh9ZBp7xNwJE8O.z1xzLsJHGVYbMqF5GKz0nKbYk1h7Qxu'  -- 7211018830
);
