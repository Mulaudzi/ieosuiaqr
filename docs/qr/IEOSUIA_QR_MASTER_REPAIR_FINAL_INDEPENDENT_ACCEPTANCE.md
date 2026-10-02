# IEOSUIA QR Master Repair final independent acceptance

> Historical report: this document reviewed commit `683be224e56d05259cc8d1e76751994788bbf71b` and is not the status of the current candidate. Its findings were remediated in later commits. See [IEOSUIA_QR_PRODUCTION_READINESS_2026-10-02.md](IEOSUIA_QR_PRODUCTION_READINESS_2026-10-02.md) for the latest implementer verification. A new independent review has not yet replaced this historical report.

Review date: 2026-10-01/02 (Africa/Johannesburg)  
Scope: local independent acceptance only; no remediation and no deployment.  
Verdict: **BLOCKED — INDEPENDENT REVIEW FAIL**

## Reviewer and candidate identity

- Model requested: GPT-5.6 Pro, highest available reasoning.
- Model used: GPT-5.6 Sol, `ultra` reasoning (strongest exposed matching reviewer model).
- Separate reviewer: yes — a fresh child-agent reviewer, not a fresh top-level session.
- Branch: `main`.
- Reviewed HEAD: `683be224e56d05259cc8d1e76751994788bbf71b`.
- Tree: `7b1ccdeb61ec5a424ae915987896a826ec21e770`.
- Comparison base / local `origin/main` merge-base: `6400c72781fe970c1dc9a6e0d0c7c3729c0deedf`.
- Candidate relation: 10 commits ahead, 0 behind.
- Worktree before acceptance: clean.
- Candidate paths: 63 tracked paths (14 additions, 49 modifications); 0 untracked candidate files.
- Migration inventory: 24 SQL migrations (`002` through `030`, with intentional numbering gaps).
- Production changes: none.

The candidate commits are `6e5dc8f`, `919dac9`, `56ceb21`, `05b572b`, `40dc3b9`, `7509e00`, `d49b0ae`, `23807f2`, `4768cbd`, and `683be22`.

## Gate results

| Gate | Result | Independent evidence |
|---|---|---|
| `npm run typecheck` | PASS | Exit 0; no diagnostics; 3.96 seconds |
| `npm run test` | PASS | 5/5 files and 23/23 tests; 26.66 seconds |
| Docker inventory acceptance | PASS | Exit 0; `inventory acceptance: PASS`; all labelled A-L cases are present with no skip path |
| Migration command | **FAIL as acceptance evidence** | Exit 0, but the harness does not exercise the lifecycle, replay, legacy, and referential-integrity contract it claims to prove |
| `npm run build:web` within deep harness | PASS | 3,916 modules; 34.15 seconds |
| Playwright | **FAIL** | 63 planned; 34 passed, 1 failed, 28 did not run; 0 observed skips |
| Lint | NOT RUN | Review stopped after the required failed gate; the claimed 0-error/27-warning baseline was not independently reconfirmed |
| Runtime/API logs | CLEAN | 0 fatal/error-pattern matches and 0 HTTP 5xx responses in the acceptance window |
| Current-run named cleanup | PASS | 0 named inventory, QR, and preset fixtures; 0 temporary migration databases; 0 new uploads; no Playwright process leak |
| Global synthetic cleanup | **FAIL** | Six older synthetic users and related inventory rows remain in the local database |

## Findings

### HIGH — Migration acceptance is false-green against the governing contract

The 57-line migration harness exits successfully but does not independently prove the requirements attributed to it:

- Fresh migrations are applied only once. Fresh verification checks six table names and two columns, but does not create QR records, quantity inventory, serialized inventory, or run a complete inventory lifecycle.
- The legacy fixture is one serialized item. It does not verify quantity retention, legacy QR validity, multi-location coherence, quantity drift, or duplicate opening movements after replay.
- Migration `030` is never replayed, and there is no hostile multi-location replay probe.
- Referential integrity is inferred by counting four `RESTRICT` definitions. The harness does not attempt the required owner, item, location, actor, movement, or stock-count deletion/update attacks.

Evidence: [scripts/test-database-migrations.ps1](../../scripts/test-database-migrations.ps1), especially lines 31-51. This contradicts the Fresh schema, Legacy backfill/soft delete, and Historical referential integrity PASS claims in the governing traceability document.

### MEDIUM — Required authenticated inventory browser flow failed

Playwright case `authenticated owner can open protected inventory actions and history` failed at `tests/e2e/master-repair.spec.ts:26`. The exact `Actions` locator was absent when its 20-second expectation expired.

The failure screenshot showed a loading spinner. The retained later snapshot showed `Actions` and `Movement history`, so the UI eventually loaded, but not within the test contract. Trace timing showed `/api/inventory/4` starting about 16.5 seconds into the wait and taking about 3.125 seconds; the movements request was still pending at failure. Both requests later returned HTTP 200, and no 500 was logged.

Because this required gate failed, history/filter/print checks in that case were not reached, and the run ended at 34 passed, 1 failed, and 28 not run rather than the claimed 63/63.

Retained private artifacts:

- `.private/playwright-results/master-repair-authenticate-c5ca3-ventory-actions-and-history/error-context.md` — SHA-256 `65F540F997708E849E3F3B66151F16F85351ED4D0557C9BD3A6FC0CB9B6F8287`
- `.private/playwright-results/master-repair-authenticate-c5ca3-ventory-actions-and-history/test-failed-1.png` — SHA-256 `8557714672F8E76A6E9D54692C2143298E5734F3CFB9CA82724303424D2C2D0C`
- `.private/playwright-results/master-repair-authenticate-c5ca3-ventory-actions-and-history/trace.zip` — SHA-256 `DDFB939D613E4C5C12176D4164CA8B1682075BF245B9A4D373CBEA6B3FE79293`

### LOW — Local acceptance database is not globally fixture-clean

Six pre-existing `inventory-*@example.test` users remain (IDs 28-30 and 49-51). Their related residue is eight active inventory items, four `inventory_access` links, 20 movements, and two stock counts. They predate this review and were preserved as unrelated local data. The current run introduced none of them, but the directive's zero-lingering-synthetic-user condition cannot be certified.

### Observation — candidate diff hygiene

`git diff --check 6400c72..HEAD` reports one trailing blank line at EOF in `scripts/run-deep-acceptance.ps1:58`. It did not cause a demonstrated runtime defect and was not remediated in this review.

## Traceability matrix audit

`FAIL` means a demonstrated defect or incomplete current-run evidence after the required gate stopped. A prior PASS claim is not carried forward without current independent proof.

| Requirement | Independent state | Basis |
|---|---|---|
| Controlled workflow reasons and conditions | PASS | Executed PHP service acceptance |
| Checkout and maintenance date ordering | FAIL | Full ordering coverage was not independently completed |
| Complete pre-commit confirmation | FAIL | Browser failed before the confirmation workflow |
| Auth-derived actor and immutable movement | FAIL | Client actor-forgery and historical mutation probes were incomplete |
| Quantity and serialized invariants | PASS | Lifecycle and A-L suite passed |
| Idempotency | PASS | Important mutation retries passed in service acceptance |
| Concurrency A-L | PASS | All 12 labelled cases executed with no skip path |
| Location count and stale guard | PASS | Reconciliation and stale rejection passed at service level |
| Count reason, notes, editable date | FAIL | Not completed end-to-end through controller/UI |
| Canonical locations | PASS | Selected-source transfer assertions passed |
| Detailed paginated history | FAIL | Required browser history case failed before assertions completed |
| CSV and isolated print view | FAIL | Filtered CSV passed; print assertions were not reached |
| Movement analytics | PASS | Authorized analytics API case passed |
| Scan privacy and no scan mutation | FAIL | Complete hostile projection/no-ledger-mutation proof did not finish |
| QR type compatibility | FAIL | Twelve-type lifecycle test was interrupted and incomplete |
| Event boundaries | PASS | Unit and reached browser cases covered malformed dates, leap day, ordering, and legacy ISO normalization |
| Responsive application layout | FAIL | Full seven-width/page matrix was not completed |
| Central Auth handoff/callback | FAIL | Partial local cases passed; complete callback/return attack matrix did not finish |
| Unauthorized admin states | PASS | Reached no-token and invalid-token cases failed closed |
| Fresh schema | FAIL | Harness proves partial structure, not application lifecycle |
| Legacy backfill/soft delete | FAIL | Partial single-serialized-row fixture only |
| Historical referential integrity | FAIL | Constraint metadata counted; hostile operations absent |
| Payments, subscriptions, reCAPTCHA, 2FA | N/A — absent by design | Legitimate excluded scope |
| Production deployment | N/A — prohibited | No deployment performed |

## Required final status

```text
IEOSUIA QR MASTER REPAIR:
BLOCKED

INDEPENDENT REVIEW:
FAIL

MODEL USED:
GPT-5.6 Sol

THINKING LEVEL:
Ultra

SEPARATE REVIEWER:
YES — child-agent reviewer, not a fresh top-level session

BRANCH:
main

REVIEWED COMMIT:
683be224e56d05259cc8d1e76751994788bbf71b

TRACEABILITY MATRIX: FAIL
EVENT QR: FAIL — complete lifecycle did not finish
QR TYPE MATRIX: FAIL
INVENTORY QR: FAIL
PUBLIC PRIVACY: FAIL
LOGIN RETURN PATH: FAIL
ADD STOCK: PASS
REMOVE / ISSUE: PASS
CHECKOUT: PASS
RETURN: PASS
TRANSFER: PASS
DAMAGED: PASS
LOST / MISSING: PASS
MAINTENANCE: PASS
RELEASE MAINTENANCE: PASS
ADJUST: PASS
STOCK COUNT: FAIL
LOCATION COUNT: FAIL
STALE COUNT PROTECTION: PASS
RECONCILIATION: PASS
HISTORY: FAIL
HISTORY FILTERS: FAIL
EXPORT: PASS
PRINT: FAIL
ANALYTICS: PASS
PERMISSIONS: FAIL
AUDIT: FAIL
IMMUTABILITY: FAIL
IDEMPOTENCY: PASS
CONCURRENCY A-L: PASS
LEGACY DATA: FAIL
FRESH DATABASE: FAIL
MIGRATION REPLAY: FAIL
REFERENTIAL INTEGRITY: FAIL
RESPONSIVE MATRIX: FAIL
CENTRAL AUTH LOCAL CONTRACT: FAIL
CENTRAL AUTH SUCCESSFUL EXTERNAL ENTITLEMENT: EXTERNAL VERIFICATION REQUIRED
TYPECHECK: PASS
UNIT TESTS: PASS — 23/23
PHP ACCEPTANCE: PASS
PLAYWRIGHT: FAIL — 34 passed, 1 failed, 28 not run, 0 observed skips
PRODUCTION BUILD: PASS
TEST CLEANUP: FAIL — current-run data clean; pre-existing synthetic residue remains
RUNTIME LOGS: CLEAN — 0 fatal/error-pattern matches; 0 HTTP 5xx

CRITICAL FINDINGS: 0
HIGH FINDINGS: 1
MEDIUM FINDINGS: 1
LOW FINDINGS: 1

OBSERVATIONS:
- Successful Central Auth entitlement/session remains an external verification boundary.
- SWC emitted a performance recommendation.
- Browserslist data is 16 months old.
- The interrupted HTML report was not finalized; raw trace and screenshot evidence was retained.
- The comparison base used the locally configured origin/main reference; no network fetch was performed.
- One trailing blank line at EOF is reported by candidate-wide git diff checking.

OPEN FINDINGS:
- Migration harness lacks lifecycle, replay, multi-location replay, and hostile referential-integrity coverage.
- Authenticated inventory detail/history exceeded the required browser readiness window.
- Pre-existing synthetic users and linked inventory records remain locally.

READY FOR CONTROLLED STAGING: NO
READY FOR PRODUCTION: NO
PRODUCTION CHANGES: NONE
```

This acceptance cycle performed no remediation and no deployment.
