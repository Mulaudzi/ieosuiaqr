-- Design Presets table for saving reusable QR code designs
-- Run this migration to add design preset functionality

CREATE TABLE IF NOT EXISTS design_presets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    design_options JSON NOT NULL COMMENT 'Stores QRDesignOptions object',
    thumbnail_url VARCHAR(500) NULL COMMENT 'Preview image URL',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (user_id, is_default),
    
    CONSTRAINT fk_design_presets_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment for table
ALTER TABLE design_presets COMMENT = 'User-saved QR code design presets for consistent branding';
