ALTER TABLE users ADD COLUMN identity_uuid CHAR(36) NULL AFTER id;
CREATE UNIQUE INDEX users_identity_uuid_unique ON users (identity_uuid);
