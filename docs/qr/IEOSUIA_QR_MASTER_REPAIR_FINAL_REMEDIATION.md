# IEOSUIA QR Master Repair final remediation

Date: 2026-10-02 (Africa/Johannesburg)

Scope: local remediation and acceptance only. Production was not changed.

## Candidate

- Previous independently reviewed commit: `683be224e56d05259cc8d1e76751994788bbf71b`
- Implementation remediation commit: `a62bf769d1f65d1a6e33a0016280b35a53753148`
- Branch: `main`
- Comparison base: `6400c72781fe970c1dc9a6e0d0c7c3729c0deedf`

## Original findings

| Finding | Implementer state | Evidence |
|---|---|---|
| HIGH: migration harness false-green | FIXED pending fresh review | Fresh application/service quantity and serialized lifecycles; representative legacy fixture; QR retention; explicit opening provenance; actual 030 replay; dedicated multi-location replay; zero invariant mismatches; hostile referential-integrity and immutability operations |
| MEDIUM: inventory detail readiness | FIXED pending fresh review | Item/capabilities render independently of history/locations; original flow passed three consecutive runs in 14.5s, 7.9s, and 4.7s; delayed-history test passed without blocking Actions |
| LOW: synthetic residue | FIXED pending fresh review | Exact fixture provenance established; run-owned fixtures, interrupted-cleanup probe, uploads, temporary databases, and processes clean to zero |

## Implementer acceptance

- Typecheck: PASS
- Unit tests: PASS, 23/23
- PHP inventory acceptance: PASS, including A-L
- Migration acceptance: PASS
- Fresh database lifecycle: PASS
- Legacy migration and quantity: PASS
- Legacy QR: PASS
- Opening provenance: PASS
- Migration 030 replay: PASS
- Multi-location replay: PASS
- Quantity invariant: PASS
- Hostile referential integrity and history immutability: PASS
- Original inventory readiness test repeated three times: PASS
- History non-blocking: PASS with a 15-second movement-history delay
- Full Playwright: PASS, 64/64, 0 failed, 0 skipped
- Responsive matrix: PASS
- QR type matrix: PASS
- Event QR lifecycle/boundaries: PASS
- Central Auth local fail-closed/handoff contract: PASS
- Real successful Central Auth entitlement: external staging verification required
- Lint: PASS, 0 errors and 27 unchanged warnings
- Build: PASS
- Runtime/API log scan: CLEAN, zero fatal/exception/database/HTTP-500 matches
- Git diff whitespace: PASS after preserving the historical report's intentional Markdown hard breaks via a file-specific Git attribute
- Production changes: NONE

## Cleanup evidence

After the successful run and exact cleanup correction:

- owned synthetic users: 0
- named inventory fixtures: 0
- named QR fixtures: 0
- temporary migration databases: 0
- new untracked uploads: 0
- Playwright processes: 0

The runner creates its own browser fixture, removes fixtures in `finally`, proves cleanup after an intentional thrown exception, and removes only upload paths owned by the acceptance user.

## Implementer finding census

- Critical: 0
- High: 0
- Medium: 0
- Low: 0

Status: ready for a fresh independent review. Controlled staging remains prohibited until that review passes. Production deployment remains separately authorized work.

## Recursive remediation cycle 2

The first fresh review rejected the candidate with two high, one medium, and one low finding. This cycle closes those findings as follows:

- Migration 030 no longer attributes an inferred owner or item creation timestamp to a historical movement. The opening record now identifies `Migration 030`, leaves `performed_by` null, records the actual migration time, and preserves the source item timestamp only as labelled metadata.
- A shared inventory application service is now the authority for HTTP and migration acceptance creation. Fresh acceptance creates quantity and serialized inventory plus QR codes and locations through that service, resolves both QRs through it, creates stock counts through it, and reads complete ordered history through it.
- Schema checks now assert required columns, nullability, unique indexes, foreign-key targets/delete rules, and immutable-ledger triggers.
- The legacy fixture asserts exact `Location A = 7` and `Location B = 5` rows, exact archived state, truthful provenance, QR resolution, non-vacuous access/count state, quantity invariants, and full row-level replay fingerprints.
- Hostile integrity tests deterministically execute owner, item, actor, location, movement, and applied-count operations. They prove actor `SET NULL` snapshot preservation and location-name history preservation.
- The history regression holds its request behind an indefinite explicit barrier, proves the real owner `Add stock` control is visible and enabled within the readiness window, then releases and verifies history.

Cycle 2 implementer evidence:

- typecheck: PASS
- unit tests: PASS, 23/23
- inventory A-L acceptance: PASS
- strengthened fresh/legacy/replay/integrity acceptance: PASS
- original failing browser test repeated: PASS, 3/3 (3.8s, 3.6s, 4.0s)
- complete Playwright: PASS, 64/64, zero skips
- production build: PASS, 3,916 modules
- lint: PASS, 0 errors and 27 pre-existing warnings
- temporary migration databases: removed by `finally`
- production changes: NONE

Cycle 2 implementer finding census: critical 0, high 0, medium 0, low 0. Fresh independent acceptance is still required before staging readiness can be claimed.

## Recursive remediation cycle 3

The next fresh review found one real defect: secondary legacy stock-level locations were preserved as rows but were not registered in `inventory_locations`, so production movement/count validation rejected them. It also rejected parallel acceptance-only helpers and a barrier test that did not prove interception.

Cycle 3 closes those findings:

- Migration 030 registers every distinct pre-existing stock-level location for the owning account.
- The migrated `Location B` is proven through the production stock-count service and a real transfer, not only queried as raw state.
- Public inventory QR resolution and stock-count HTTP controllers now use the same shared application service exercised by migration acceptance; canonical count validation no longer has a permissive test-only branch.
- Unique-index evidence asserts ordered column composition, not names alone.
- The history barrier test must observe the movement request interception within five seconds before asserting the enabled owner `Add stock` action.
- Migration output restores all required labels and emits the ordered migration manifest with SHA-256 hashes.
- Exact reviewer-owned residue from the interrupted review was removed before the new run.

Cycle 3 implementer evidence: typecheck PASS; 23/23 unit tests PASS; inventory A-L PASS; migration lifecycle/replay/integrity PASS; original readiness test 3/3 PASS (3.9s, 3.7s, 3.8s); self-authenticating history barrier PASS (2.7s); full Playwright 64/64 PASS; build PASS (3,916 modules); production changes NONE.

Cycle 3 implementer finding census: critical 0, high 0, medium 0, low 0. Fresh independent acceptance remains mandatory.

## Recursive remediation cycle 4

The cycle-3 independent review found two additional operational defects. Cycle 4 closes them by restricting the immutable-ledger cleanup flag to the database root account and by preventing deletion or rename of a canonical location while live inventory, stock levels, counts, or movement history reference it. Acceptance now performs the hostile location delete and expects rejection, verifies applied-count reconciliation linkage, scopes every unique-index assertion to its exact table and ordered columns, and routes production history through the same application service used by acceptance.

Cleanup is now root-only, run-owner scoped, no longer deletes shared records by common names, and its `finally` block asserts zero owned users, temporary databases, and owned uploads. The application-account inventory test deliberately cannot bypass ledger immutability; outer local acceptance owns its cleanup.

Cycle 4 implementer evidence: PHP syntax PASS; typecheck PASS; 23/23 unit tests PASS; A-L inventory acceptance PASS; fresh/legacy/replay/integrity PASS; root-only immutability and location-reference guards PASS; build PASS; readiness 3/3 PASS; full Playwright 64/64 PASS; cleanup assertions PASS; production changes NONE.

Cycle 4 implementer finding census: critical 0, high 0, medium 0, low 0. Fresh independent acceptance remains mandatory.

## Recursive remediation cycle 5

The cycle-4 review exposed MariaDB trigger-definer semantics: `CURRENT_USER()` identifies the trigger definer. All root-only cleanup guards now use the authenticated session identity from `USER()` instead. The complete disposable migration/integrity suite passes with the new guard; application principals can no longer obtain the cleanup bypass by setting a session variable. Production changes remain NONE.
