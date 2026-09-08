# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Contact the IEOSUIA operations owner directly with the affected endpoint, reproduction steps, and impact.

## Secret handling

- Runtime secrets belong in `api/.env` or the hosting platform's secret manager.
- `api/.env` must never be committed, attached to tickets, or included in deployment archives.
- Use unique secrets per environment and a JWT secret with at least 32 random characters.
- Rotate credentials immediately after suspected disclosure.

## Required credential rotation

The repository previously tracked an API environment file and hard-coded legacy admin credentials. Before the next deployment, rotate:

1. Database password and any reused database credentials.
2. JWT secret, which invalidates existing user and admin tokens.
3. SMTP password.
4. Google OAuth client secret.
5. Cron API key.
6. FTP/hosting credentials kept in `.ftp-deploy.env`.
7. Every legacy admin password.

Removing a secret from the current tree does not remove it from Git history. Rewrite history with an approved secret-removal tool, force-push cleaned branches and tags, and require collaborators to clone afresh. Rotate first because old clones may retain the secrets.

## Deployment controls

- Set `APP_ENV=production` and `APP_DEBUG=false`.
- Restrict `CORS_ORIGIN` to the exact production frontend origin.
- Serve only over HTTPS and configure HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, and clickjacking protection.
- Keep QA routes disabled in production. The API enforces this using `APP_ENV`.
- Install Composer dependencies with `--no-dev --optimize-autoloader`.
- Run the frontend checks, PHP tests, dependency audits, and a clean database migration before release.

## Authentication

The browser clients currently use bearer tokens. Query-string tokens are prohibited because URLs leak through logs, browser history, referrers, and monitoring. A future hardening step is migrating sessions to Secure, HttpOnly, SameSite cookies with CSRF protection.
