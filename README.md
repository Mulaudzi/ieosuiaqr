# IEOSUIA QR

IEOSUIA QR is a free-forever QR-code management platform for creating static and dynamic QR codes, tracking scans, and managing physical inventory.

## Stack

- React, TypeScript, Vite, Tailwind CSS and shadcn/ui
- PHP 8.1+ REST API
- MySQL 8.0+ or MariaDB 10.5+
- Composer and npm

## Local setup

1. Install frontend dependencies with `npm ci`.
2. Copy `api/.env.example` to `api/.env` and fill in local values.
3. Create a MySQL database and load `api/database/schema.sql`.
4. Apply every migration in filename order.
5. Run `composer install` inside `api/`.
6. Start the frontend with `npm run dev` and serve `api/` through PHP/Apache.

Never commit `api/.env`. Use different database, JWT, and SMTP credentials for each environment.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Check TypeScript |
| `npm run lint` | Run ESLint |
| `npm test` | Run frontend unit tests |
| `npm run build` | Create the portable frontend build |
| `npm run deploy:package` | Create the Windows deployment ZIP |
| `composer test` in `api/` | Run PHP unit and integration tests |

The deployment package excludes environment files, dependencies, tests, logs, GeoIP databases, and exports. Run `composer install --no-dev --optimize-autoloader` on the target server.

## Free forever

Every account receives unlimited QR codes, every QR type, dynamic editing, scan analytics, exports, custom designs, logos, inventory tools, and bulk import. There are no paid plans, subscriptions, checkout flows, or payment processors.

## Repository layout

- `src/`: frontend pages, components, hooks and API clients
- `api/src/`: API controllers, middleware, helpers and services
- `api/database/`: baseline schema and ordered migrations
- `api/tests/`: PHPUnit unit and integration tests
- `.github/workflows/`: continuous integration
- `scripts/`: deployment packaging helpers

See [SECURITY.md](SECURITY.md) before deploying. The detailed system map is in [ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md).

## License

Proprietary software owned by IEOSUIA (Pty) Ltd.
