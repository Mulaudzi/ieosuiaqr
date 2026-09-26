CREATE TABLE IF NOT EXISTS revoked_auth_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_type ENUM('customer','admin') NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX revoked_auth_expiry_idx (expires_at),
    INDEX revoked_auth_user_idx (user_id,token_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
