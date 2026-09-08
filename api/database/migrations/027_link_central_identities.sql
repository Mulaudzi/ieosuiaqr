-- QR phase 1: link approved identities while preserving owned QR data.

START TRANSACTION;

ALTER TABLE ejetffbz_qr.users
  ADD COLUMN IF NOT EXISTS identity_uuid CHAR(36) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS central_access_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER identity_uuid;
CREATE UNIQUE INDEX IF NOT EXISTS users_identity_uuid_unique
  ON ejetffbz_qr.users (identity_uuid);

ALTER TABLE ejetffbz_qr.admin_users
  ADD COLUMN IF NOT EXISTS identity_uuid CHAR(36) NULL AFTER id;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_identity_uuid_unique
  ON ejetffbz_qr.admin_users (identity_uuid);

UPDATE ejetffbz_qr.users u
JOIN ejetffbz_auth.customer_accounts ca ON LOWER(ca.email)=LOWER(u.email)
JOIN ejetffbz_auth.customer_app_access caa
  ON caa.customer_account_id=ca.id AND caa.status='active'
JOIN ejetffbz_auth.applications a
  ON a.id=caa.application_id AND a.slug='qr'
SET u.identity_uuid=ca.uuid,
    u.central_access_enabled=1,
    u.email_verified_at=COALESCE(u.email_verified_at,ca.email_verified_at),
    u.updated_at=CURRENT_TIMESTAMP
WHERE LOWER(u.email)<>'vendaboy.lm@gmail.com'
  AND LOWER(u.email) NOT LIKE '%@ieosuia.com';

-- Retain excluded rows solely as archival owners of their QR business data.
UPDATE ejetffbz_qr.users
SET identity_uuid=NULL,
    central_access_enabled=0,
    verification_token=NULL,
    reset_token=NULL,
    reset_token_expires=NULL,
    updated_at=CURRENT_TIMESTAMP
WHERE LOWER(email)='vendaboy.lm@gmail.com'
   OR LOWER(email) LIKE '%@ieosuia.com';

SET @central_admin_uuid := (
 SELECT uuid FROM ejetffbz_auth.admin_accounts
 WHERE LOWER(email)='lufuno@ieosuia.com' AND status='active' LIMIT 1
);

UPDATE ejetffbz_qr.admin_users
SET identity_uuid=@central_admin_uuid,
    email='lufuno@ieosuia.com',
    name='Lufuno Mulaudzi',
    is_active=1,
    failed_attempts=0,
    locked_until=NULL,
    updated_at=CURRENT_TIMESTAMP
WHERE id=1 AND @central_admin_uuid IS NOT NULL;

DELETE FROM ejetffbz_qr.admin_sessions WHERE admin_id<>1 AND @central_admin_uuid IS NOT NULL;
DELETE FROM ejetffbz_qr.admin_users WHERE id<>1 AND @central_admin_uuid IS NOT NULL;

COMMIT;

SELECT COUNT(*) AS linked_qr_customers
FROM ejetffbz_qr.users
WHERE identity_uuid IS NOT NULL AND central_access_enabled=1;
SELECT COUNT(*) AS excluded_enabled_customers
FROM ejetffbz_qr.users
WHERE (LOWER(email)='vendaboy.lm@gmail.com' OR LOWER(email) LIKE '%@ieosuia.com')
  AND (identity_uuid IS NOT NULL OR central_access_enabled<>0);
SELECT (@central_admin_uuid IS NOT NULL) AS central_admin_found;
SELECT COUNT(*) AS linked_qr_admins
FROM ejetffbz_qr.admin_users
WHERE identity_uuid=@central_admin_uuid AND email='lufuno@ieosuia.com' AND is_active=1;
