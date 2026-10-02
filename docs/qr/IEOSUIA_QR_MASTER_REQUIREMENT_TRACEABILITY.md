# IEOSUIA QR master repair traceability

Scope: local completion candidate only. Production deployment is explicitly excluded.

| Requirement | Implementation authority | Automated acceptance | State |
|---|---|---|---|
| Controlled inventory workflow reasons and conditions | `InventoryMovementService::REASONS`, `validateActionData`; `InventoryDetail` controlled selectors | PHP syntax, TypeScript, Docker inventory acceptance | PASS |
| Checkout and maintenance date ordering | `InventoryMovementService::validateActionData` | Invalid/incomplete workflow acceptance plus lifecycle suite | PASS |
| Complete pre-commit confirmation | `InventoryDetail` review shows item, action, quantity, old/new quantity and status, locations, actor, reason, dates, and count notes | TypeScript and authenticated action-dialog acceptance | PASS |
| Auth-derived actor and immutable movement record | Middleware actor passed to movement service; client actor fields ignored; migration 030 append-only movement triggers | Permission rejection, ledger assertions, and hostile movement update/delete acceptance | PASS |
| Quantity and serialized state invariants | Locked transitions and optimistic version update | Negative stock, lifecycle, and A-L race suite | PASS |
| Idempotency for all important mutations | Owner-scoped unique key inside transaction | Retries for add, remove, checkout, return, transfer, damage, loss, maintenance, release, adjust, reconciliation | PASS |
| Full concurrency matrix A-L | Transactions and row locks | `api/tests/inventory_acceptance.php` labels and asserts A-L | PASS |
| Location count and stale guard | Version/location snapshots and locked reconciliation | Count apply, stale rejection, race reconciliation | PASS |
| Count reason, notes, editable date | Count dialog and controller validation | TypeScript and Docker count lifecycle | PASS |
| Canonical locations | Location tables/API and service validation | Docker stock-level and bidirectional selected-source transfer assertions | PASS |
| Detailed paginated history | Controller pagination; independently loaded expandable metadata/evidence UI | API behavior, browser route, delayed-history non-blocking acceptance, TypeScript | PASS |
| CSV and isolated print view | Safe CSV; inventory-only print CSS with filter summary | Authenticated export and build | PASS |
| Movement analytics | Action and from/to aggregation; transfer units recorded once | Authenticated analytics API and TypeScript | PASS |
| Scan privacy and no scan mutation | Public projection and explicit movement writes | Anonymous scan and API lifecycle | PASS |
| QR type compatibility | Canonical registry and shared renderer/downloader | Per-type create/read/edit/render/SVG-download/scan/destination/analytics | PASS |
| Event boundaries | Event validation and calendar payload | Leap-day valid and impossible-date 422 | PASS |
| Responsive application layout | Shared styles and narrow auth repairs | 320, 360, 390, 430, 768, 1024, 1440 pixel matrix | PASS |
| Central Auth handoff/callback | Redirect component and safe fallback | Login/signup/admin handoff and invalid callback | PASS |
| Unauthorized admin states | Admin guards | Admin route matrix fails closed | PASS |
| Fresh schema | Ordered structural migrations, excluding operational 027/028 | Isolated database creates QR, quantity and serialized inventory and executes both service lifecycles | PASS |
| Legacy backfill/soft delete | Additive replay-safe migrations 030 and 031 | Multi-item quantity/serialized/QR/archive fixture; exact retention, reconciliation provenance, soft delete, and both replay assertions | PASS |
| Historical referential integrity | RESTRICT owner/item keys plus append-only movement/applied-count triggers | Hostile update/delete operations against movement, count, owner, item, actor, and location policy | PASS |
| Payments, subscriptions, reCAPTCHA, 2FA | Intentionally removed/disabled scope | Existing regressions | N/A - absent by design |
| Production deployment | Outside this directive | None | N/A - prohibited |

## QR type matrix

Each row is independently exercised by `tests/e2e/master-repair.spec.ts`. Download means a real browser download event with an SVG filename and readable stream.

| Type | Create/read | Edit | Render | Download | Scan/destination | Analytics |
|---|---|---|---|---|---|---|
| URL | PASS | PASS | PASS | PASS | PASS | PASS |
| Text | PASS | PASS | PASS | PASS | PASS | PASS |
| Email | PASS | PASS | PASS | PASS | PASS | PASS |
| Phone | PASS | PASS | PASS | PASS | PASS | PASS |
| SMS | PASS | PASS | PASS | PASS | PASS | PASS |
| WhatsApp | PASS | PASS | PASS | PASS | PASS | PASS |
| WiFi | PASS | PASS | PASS | PASS | PASS | PASS |
| vCard | PASS | PASS | PASS | PASS | PASS | PASS |
| Event | PASS | PASS | PASS | PASS | PASS | PASS |
| Location | PASS | PASS | PASS | PASS | PASS | PASS |
| Social | PASS | PASS | PASS | PASS | PASS | PASS |
| App | PASS | PASS | PASS | PASS | PASS | PASS |

## Evidence commands

- `npm run typecheck`
- `npm run test`
- `docker compose exec -T api php tests/inventory_acceptance.php`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-database-migrations.ps1`
- `npm run test:deep:local` (creates required local environment variables and fails rather than skipping when fixtures are absent)
- `npm run build:web`
- `npm run lint`

Latest complete implementer run (2026-10-02): typecheck PASS; 23/23 unit tests PASS; inventory A-L acceptance PASS; strengthened fresh/legacy/replay/referential-integrity migration acceptance PASS, including mutation-free replay of migrations 030 and 031; production build PASS; 64/64 Playwright tests PASS with no failures or skips. The authenticated inventory readiness test passed three consecutive executions, and the explicit delayed-history barrier proves authorized Actions become usable before history completes. Lint exits 0 with the unchanged 27-warning baseline. The owned fixture database state is clean: zero owned users, inventory/QR fixtures, temporary migration databases, untracked uploads, or Playwright processes. Successful Central Auth admin entitlement/session and protected admin feature operation remain an external, unverified boundary; local acceptance covers handoff and unauthorized fail-closed behavior only.

Change a row back to RED if its listed evidence fails after a code change.
