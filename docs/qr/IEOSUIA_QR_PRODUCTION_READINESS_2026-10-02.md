# IEOSUIA QR production readiness

Review date: 2026-10-02 (Africa/Johannesburg)

Scope: current local candidate, deployment artifact, controlled FTP deployment, and post-deployment production checks. No production database mutation was performed.

## Verdict

**APPLICATION AND DEPLOYMENT PACKAGE READY. PRODUCTION RELEASE REQUIRES TWO EXTERNAL PRE-FLIGHT CONFIRMATIONS.**

The code, database migration harness, browser journeys, security-updated JavaScript dependency tree, production configuration structure, and deployment ZIP pass. Production cannot honestly be declared fully verified until an entitled real Central Auth account completes login and the production database is confirmed to have migrations 030 and 031 applied.

## Current evidence

| Gate | Result |
|---|---|
| TypeScript | PASS |
| Unit tests | PASS — 23/23 |
| Inventory service/concurrency | PASS — A through L |
| Fresh and legacy database lifecycle | PASS |
| Migration replay | PASS — 030 and 031 are mutation-free on replay |
| Referential integrity and immutable history | PASS |
| Inventory readiness regression | PASS — 3/3 |
| Complete Playwright suite | PASS — 64/64, no skips |
| QR type lifecycle matrix | PASS — all 12 types |
| Responsive matrix | PASS — 320 through 1440 pixels |
| Production build | PASS — 3,916 modules |
| PHP dependency installation | PASS — optimized, no development dependencies |
| JavaScript production dependency audit | PASS — 0 vulnerabilities after lockfile remediation |
| Lint | PASS — 0 errors, 27 existing warnings |
| PHP source syntax | PASS |
| Composer metadata validation | PASS |
| Private file isolation | PASS — credentials and API environment remain ignored/untracked |
| Production environment structure | PASS — production mode, debug disabled, HTTPS URLs, non-placeholder secrets |
| Deployment package content | PASS — required frontend, API, vendor, environment, and migration files present; tests/uploads/private/repository files absent |
| Live HTTPS homepage/favicon | PASS — HTTP 200 |
| Live Central Auth start | PASS — HTTP 302 to `auth.ieosuia.com` |
| Configured FTP target | PASS — listable; live document root resolved to `qr` |

Final artifact: `build/deploy.zip`

Artifact size: 6,934,697 bytes

SHA-256: `FD390D2789DBE365D59E39F7549FB4D1FFF6AD7D3B63966F7E0489EAD2741DAB`

## Corrections made during readiness verification

- Updated the npm lockfile to remediate the discovered DOMPurify XSS advisory and three lower-severity dependency advisories. The production audit now reports zero vulnerabilities.
- Removed `/admin` from the ordinary public-render matrix because it is an authentication handoff route; the dedicated Central Auth and unauthorized-admin tests remain authoritative and pass.
- Excluded nested dependency test suites from the production ZIP.
- Added the proprietary Composer license declaration so strict metadata validation passes.
- Repaired the read-only FTP-root checker to use `.private/DEPLOYMENT_CREDENTIALS.md` directly when the retired legacy credential file is absent.

## Required production pre-flight

1. Confirm migrations `030_complete_inventory_management` and `031_inventory_integrity_upgrade` are applied to the production database using the controlled database procedure and a backup/rollback point.
2. Complete one real customer and, if applicable, admin login through Central Auth and verify the QR entitlement/session callback succeeds.
3. Deploy the exact checked artifact, verify its SHA-256, then perform live QR create/edit/download/scan/analytics and inventory movement smoke tests.

## Deployment record

- Source commit: `ee69681db86d3b9d73d264d7b4a7f895c9d14b86`
- Deployment method: configured private FTP workflow with the hosting-specific certificate mismatch and control-only TLS overrides
- Remote document root: verified live root `qr`
- Uploaded files: 171; protected runtime files including `api/.env`, uploads, exports, GeoIP data, and vendor were preserved
- Live frontend fingerprint: `assets/index-uGeb30Jq.js`, exact match with the local production build
- Live checks: homepage 200; JavaScript 200 with JavaScript MIME type; favicon 200 image/png; `api/.env` 403; test bootstrap 404; Central Auth start 302 to `auth.ieosuia.com`; desktop/mobile Chromium smoke PASS

The production database is only reachable from the hosting environment, so its migration table could not be queried from this workstation. Migration files 030 and 031 are deployed, but their execution remains an explicit database pre-flight rather than an inferred success.
