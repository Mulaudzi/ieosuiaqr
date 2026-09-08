# IEOSUIA QR API

Plain PHP REST API for IEOSUIA QR. The service is free forever: every registered user receives unlimited QR codes, dynamic QR codes, analytics, exports, bulk tools, custom branding, and inventory features. There are no paid plans, checkout flows, invoices, or payment processors.

## Requirements

- PHP 8.1+
- MySQL 8.0+ or MariaDB 10.5+
- Composer
- Nginx or Apache

## Installation

1. Run `composer install` in this directory.
2. Copy `.env.example` to `.env` and configure the database, `JWT_SECRET`, application URL, mail, and optional GeoIP settings.
3. Create a UTF-8 database and import `database/schema.sql`.
4. Apply every SQL file in `database/migrations` in filename order when upgrading an existing installation. Migration 025 removes the retired billing tables.
5. Make the configured upload and report directories writable by the web server.

For a new installation, temporarily configure `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, and the three `ADMIN_BOOTSTRAP_PASSWORD_*` values, run `php bin/create-admin.php`, and then clear those values. Bootstrap refuses to run after an administrator exists.

## Main endpoints

All paths are below `/v1`.

- Authentication: `/auth/register`, `/auth/login`, `/auth/logout`, email verification, and password reset.
- Profile: `/user/profile`.
- QR codes: `/qr`, including bulk creation, scan history, and statistics.
- Analytics: `/analytics/*` and report exports.
- Inventory: `/inventory/*`.
- Public redirects and scan logging: `/r/{dynamicId}` and `/scan/log`.

See `index.php` for the authoritative route list.

## Security

- Passwords use PHP password hashing.
- JWT lifetimes are configurable and admin sessions are shorter.
- Authentication endpoints are rate-limited.
- CORS is restricted to configured application origins.
- Database access uses prepared statements.
- User input and uploaded files are validated.

## Optional GeoIP

Set `GEOIP_DB_PATH` to a readable GeoLite2 City database to enrich analytics. The application continues to work without it.

## License

Proprietary - IEOSUIA (Pty) Ltd
