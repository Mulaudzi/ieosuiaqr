# IEOSUIA QR master repair traceability

Scope: local completion candidate only. Production deployment is excluded.

| Requirement | Implementation authority | Acceptance evidence | State |
|---|---|---|---|
| Structured checkout, return, damage/loss, maintenance, and release | `InventoryMovementService::validateActionData`; `InventoryDetail` action dialog | `api/tests/inventory_acceptance.php` lifecycle and negative validation | Implemented; independent review pending |
| Auth-derived actor and immutable movement record | Auth middleware actor passed to movement service; movement insert ignores client actor | Docker acceptance and permission rejection | Implemented; independent review pending |
| Quantity and serialized state invariants | `quantityTransition`, `serializedTransition`, row locks and optimistic version update | Arithmetic, negative stock, duplicate checkout, concurrent removal/checkout | Implemented; independent review pending |
| Idempotency and concurrency | Owner-scoped unique idempotency key, transaction, item row lock | Sequential and concurrent same-key retry; concurrent removal and checkout | Implemented; independent review pending |
| Location-specific stock count and stale guard | Stock-count location/version snapshots and locked apply | Location delta reconciliation and stale apply rejection | Implemented; independent review pending |
| Canonical locations | `inventory_locations`, access-aware location API, service validation | Docker acceptance plus UI selector | Implemented; independent review pending |
| History filters, detail, export, print | Movement query filters, expandable UI, authorized CSV export, print styles | Typecheck, PHP lint, authenticated browser route | Implemented; independent review pending |
| Movement analytics | Movement totals grouped by action and location with explicit period metadata | API/UI compilation and browser smoke | Implemented; independent review pending |
| Scan privacy and no inventory mutation | Public safe projection; movement-only inventory writes | Anonymous scan browser test and source-route audit | Implemented; independent review pending |
| QR type compatibility | Registry-derived 12-type matrix in `CreateQRCode`; API create/read/edit/scan/destination/stats test | `master-repair.spec.ts` all-type matrix | Implemented; independent review pending |
| Mobile/tablet/desktop responsiveness | Shared viewport-safe primitives and route-specific repairs | `responsive-ui.spec.ts` at 320 through 1440 pixels | Implemented; final full run pending |
| Legacy contradictory form/dead paths | Removed legacy status/location inputs and dead controller methods | Typecheck plus symbol search | Implemented; independent review pending |

## QR type matrix

The canonical discovery source is the `qrTypes` registry in `src/pages/CreateQRCode.tsx`.

| Type | Create/read | Edit/persistence | Scan/destination | Analytics | Render/download |
|---|---|---|---|---|---|
| URL | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| Text | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| Email | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| Phone | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| SMS | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| WhatsApp | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| WiFi | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| vCard | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| Event | Automated, including leap-day boundary | Automated | Automated | Automated | Shared renderer/download acceptance |
| Location | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| Social | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |
| App | Automated | Automated | Automated | Automated | Shared renderer/download acceptance |

“Shared renderer/download acceptance” refers to the common QR frame, logo persistence, and downloaded PNG byte verification in `deep-acceptance.spec.ts`; all types pass their generated payload through that same renderer.
