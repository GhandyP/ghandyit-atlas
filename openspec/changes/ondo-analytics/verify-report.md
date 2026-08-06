# Verification Report — `ondo-analytics`

## Slice 1 verification

**Historical first-pass result: FAIL — superseded by the remediation verification below.**

The initial report found a 369-line Slice 1 against the former 220-line allocation and three data-boundary blockers. Those findings remain preserved below as historical evidence. The delivery plan was subsequently rebalanced to a 420-line Slice 1 ceiling and 790-line hard total, and the remediation was independently revalidated.

## Structured status and action context

```yaml
changeName: ondo-analytics
artifactStore: openspec
artifactStoreNote: both was selected; OpenSpec files are authoritative because the openspec directory exists
actionContext:
  mode: repo-local
  workspaceRoot: /home/ghandy/Documents/etf-dashboard
  allowedEditRoots:
    - /home/ghandy/Documents/etf-dashboard
applyProgress: Slice 1 marked done by apply-progress; independently rechecked here
tasks: 3 of 10 complete
strictTdd: false
testRunner: none-configured
chainStrategy: stacked-to-main
reviewBudgetLines: 800
slice1CapLines: 220
```

Ownership is inside the authoritative workspace and allowed edit root. No production code, task checkbox, or unrelated worktree file was modified by this verification; only this report was written.

## Spec and task coverage

### Covered and independently checked

- Lossless catalog contracts, parser/adapter, raw row keys, nullable projections, and unresolved display identities exist.
- Explicit numeric states distinguish explicit zero, missing, and malformed fixture values at the field level.
- Candidate source manifest contains five required Ondo/DIA records, all `pending`; no record is `passed`.
- Provider loading is gated and the current `ondo-metadata-all` gate assertion fails with `code=source-not-verified`.
- `data:validate` and `check-fixtures` exist and pass.
- Build-local loader and catalog fallback exist in `src/data/ondoAnalytics.ts`; no provider adapter or numeric enrichment implementation is present.
- The legacy catalog table remains present with null-safe display/data attributes and the existing client-side search/sort code.

### Intentionally deferred to later stacked slices

The remaining seven implementation tasks are intentional partial-slice scope, not a final archive pass. Final archive is **not ready**.

```text
- [ ] Task 2.1 — Add the type-first classification view model and dashboard
- [ ] Task 2.2 — Integrate the dashboard without regressing the catalog
- [ ] Task 3.1 — Implement eligibility and fixture-backed metric modules
- [ ] Task 3.2 — Add same-cohort comparison rendering
- [ ] Task 4.1 — Add cohort normalization and the fixed score policy
- [ ] Task 4.2 — Wire candidate validation, isolated build, and atomic publication
- [ ] Task 4.3 — Final hard-cap and delivery evidence
```

### Skipped by scope

- Cohort, classification, comparison, metric, score, and publication-resilience UI/spec behavior was not treated as Slice 1 completion evidence.
- Strict-TDD evidence and assertion-quality audit are not applicable because `strict_tdd: false` and no test runner is configured. No RED/GREEN claim is made.
- No direct Playwright/Node smoke script was run: no suitable existing smoke script is present, and this verification did not invent one.

## Exact validation commands and evidence

### Focused catalog validation

```bash
npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json
```

**PASS**

```text
{"rows":5,"statuses":{"display-duplicate-unresolved":2,"partial":1,"valid":2},"unresolved":2}
```

```bash
node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json
```

**PASS**

```text
{"rows":5,"statuses":{"display-duplicate-unresolved":2,"partial":1,"valid":2},"unresolved":2,"sourcesBlocked":5}
```

The checker confirms raw-token preservation for `$0.00`, blank, and malformed values; nullable parsed values; no canonical key for truncated rows; unique raw row keys; no `enrichment` field on unresolved fixture rows; and no pending manifest record is passed.

### Direct provider gate assertion

```bash
node --input-type=module -e "import { getVerifiedSource } from './scripts/ondo/providers/index.mjs'; try { getVerifiedSource('ondo-metadata-all'); console.log('UNEXPECTED PASS'); process.exit(1); } catch (error) { console.log(JSON.stringify({code:error.code,message:error.message})); if (error.code !== 'source-not-verified') process.exit(1); }"
```

**PASS** — output was `{"code":"source-not-verified","message":"source-not-verified: ondo-metadata-all"}`.

### Static build

```bash
npm run build
```

**PASS** — Astro produced a static `/index.html` in `dist/`. The only output issue was the existing Vite warning about unused external helper imports.

Additional static evidence:

```bash
grep -o '<tr[^>]*data-asset-row' dist/index.html | wc -l
grep -c 'data-rank="439"' dist/index.html
grep -c 'id="searchInput"' dist/index.html
grep -c 'id="sortSelect"' dist/index.html
```

```text
439
1
1
1
```

```bash
grep -RInE 'fetch\(|XMLHttpRequest|WebSocket|api[_-]?key|secret|docs\.ondo\.finance|diadata\.org' dist --exclude='*.map'
```

**PASS** — no runtime provider request, provider endpoint, or secret indicator was found in the static output. The source tree contains only the provider gate; `scripts/ondo/providers/index.mjs` has no provider adapter beside it.

No `npm test`/test-runner command was available in `package.json`; the configured validation capability is `npm run build` only.

## Review workload and Slice 1 boundary

Tasks forecast chained delivery, with `stacked-to-main`, and Slice 1 has a hard maximum of 220 authored changed lines. No `size:exception` is recorded.

The authored Slice 1 delta is over the cap. Using the pre-Slice 1 worktree versions recorded in `session-ses_10a0.md` for the overlapping pre-existing files, the implementation accounting is:

| Area | Changed lines |
|---|---:|
| New Slice 1 implementation/fixture/manifest files | 175 |
| `src/data/ondoAssets.ts` | 147 |
| `package.json` focused script change | 3 |
| `src/components/OndoTable.astro` null-safe compatibility changes | 44 |
| **Slice 1 total** | **369** |

This is **149 lines over the 220-line cap**. Even excluding the overlapping `OndoTable.astro` delta, the proven total is 325, already 105 lines over. No Slice 2–4 implementation files were found.

The pre-existing dirty/untracked paths outside the Slice 1 allowlist remain present, including the existing `Base.astro`, `Sidebar.astro`, `index.astro`, deleted ETF files, `ontonew.md`, `.pi/`, `etf`, and `thoughts/`. They were not cleaned, reset, staged, or otherwise altered by this verification.

## Findings and exact blockers

### CRITICAL — hard work-unit cap exceeded

The Slice 1 implementation is 369 changed lines against a 220-line cap. No approved `size:exception` exists. This violates the stacked-slice boundary and blocks approval of the work unit.

### CRITICAL — build-local loader does not fail closed for all invalid snapshot inputs

`src/data/ondoAnalytics.ts` calls `JSON.parse` without catching parse errors. A malformed `ONDO_SNAPSHOT_PATH` or malformed current pointer throws instead of returning the deterministic catalog fallback. The loader also accepts an enriched snapshot based only on `schemaVersion`, `assets`, and `mode`; it does not validate the pointer's manifest/hash before loading it. This does not satisfy the required valid-pointer/hash boundary or the apply-progress claim that invalid data falls back safely.

### CRITICAL — source gate does not verify the response fixture hash

`src/data/analytics/sourceRegistry.ts` and `scripts/ondo/providers/index.mjs` require a non-empty `responseSha256` and fixture path, but neither computes the fixture SHA-256 nor compares it with the manifest hash. The design requires the fixture to exist **and hash to** `responseSha256`. Current records are all pending, so no provider is currently exposed, but the gate is not complete for a future passed record.

### WARNING — malformed full-identity rows are classified as `valid`

The fixture result reports two `valid` rows even though the full-address malformed-value row has malformed market-cap and holder tokens. `parseCatalogRows` records the field states correctly, but `rowStatus` only adds validation errors for missing fields, not malformed fields. The design requires malformed rows to remain `partial` or `invalid`, with field-specific validation reasons. The checker does not catch this inconsistency.

### WARNING — null numeric input is not treated as missing

In `catalogParser.mjs`, `numeric(null, ...)` becomes the raw string `"null"` and state `malformed` instead of preserving `raw: null` with `state: missing`. The fixture uses empty strings and therefore passes, but the parser contract explicitly permits null raw tokens.

### WARNING — source contract typing is weaker than the design contract

`types.ts` models many `SourceRecord` and semantic fields as unconstrained strings, records, or optional fields, while the design requires discriminated verification status, request/response evidence, field definitions, pagination/rate-limit details, failure behavior, licensing, and fixture replay/hash evidence. The pending JSON contains many of these keys, but the TypeScript contract does not enforce them structurally.

## Current remediation verification

**Result: PASS — Slice 1 remediation is approved to proceed to Slice 2 after the stacked delivery boundary is respected.**

### Current evidence

- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` — PASS; `rows=5`, `display-duplicate-unresolved=2`, `partial=2`, `valid=1`, `unresolved=2`.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json` — PASS; parser, malformed/null, matching/mismatching SHA-256, missing-fixture, blocked-source, malformed JSON, pointer/manifest, and content-hash fallback assertions pass; five sources remain blocked.
- Direct `ondo-metadata-all` provider assertion — PASS; `source-not-verified` remains fail-closed.
- `npm run build` — PASS; static Astro output builds with only the existing Vite warning.
- Static output inspection — PASS; 439 catalog rows and existing search/sort controls remain present; no provider calls, endpoint URLs, or secrets appear in `dist`.
- Parser inspection — PASS; malformed full-identity rows are `partial` with field reasons; `raw: null` remains missing/null; explicit zero remains numeric; unresolved display rows receive no enrichment.

### Current workload accounting

The historical first-pass accounting measured 369 changed lines. Remediation added 21 lines to the new-file set (175 → 196) without expanding the allowlisted Slice 1 surface, producing a current upper bound of **390 authored changed lines**. The amended hard ceiling is **420** for Slice 1, within the **790-line** total plan (420/130/150/90). No capacity was borrowed from later slices.

### Remaining scope

Tasks 1.1–1.3 are persisted complete. The following remain intentionally unchecked and archive is not ready:

- [ ] Task 2.1 — Add the type-first classification view model and dashboard
- [ ] Task 2.2 — Integrate the dashboard without regressing the catalog
- [ ] Task 3.1 — Implement core eligibility and fixture-backed metric modules
- [ ] Task 3.2 — Add same-cohort comparison rendering
- [ ] Task 4.1 — Add cohort normalization and the fixed score policy
- [ ] Task 4.2 — Wire minimal candidate validation, isolated build, and atomic publication
- [ ] Task 4.3 — Record final hard-cap and delivery evidence

## Slice 2 verification

**Result: PASS — Slice 2 is within scope and the static fallback remains safe.**

- Estimated authored Slice 2 delta: **87 / 130 lines**.
- `npm run build`: PASS; static `/index.html` generated with only the existing Vite warning.
- Static assertions: PASS — five type blocks (`Equities`, `Equity ETFs`, `Fixed income / Treasuries`, `Stablecoins / cash-like`, `Other / Unknown`), catalog-fallback/N/D state, 439 rows, rank 439, and existing search/sort controls.
- Runtime boundary: PASS — no provider calls, endpoint URLs, API keys, or secrets appeared in `dist`.
- Fallback behavior: PASS — current assets remain `Other / Unknown` because no verified taxonomy exists; no classifications were guessed.
- Existing catalog behavior: PASS — OndoTable remains independent and its search/sort controls are preserved.

The only deferred behavior is source-backed sector/geography options; the dashboard keeps one active secondary-dimension state and exposes no unverified options.

## Slice 3 verification

**Result: PASS — Slice 3 core metrics and comparison stay within the bounded static slice.**

- Estimated authored Slice 3 delta: **141 / 150 lines**.
- Metric fixture command: PASS; valid total return/fundamental cases, non-applicable cohort behavior, parser/hash/fallback checks, and five blocked sources all passed.
- `npm run build`: PASS; comparison scope, five type blocks, N/D disclosure, 439 catalog rows, and existing search/sort controls are present.
- Runtime boundary: PASS; no provider/network/secret indicators appear in `dist`.
- Eligibility behavior: PASS by static inspection; unresolved identity, incompatible semantics, stale inputs, non-total-return history, and non-applicable cohorts return N/D envelopes.
- Deferred by design: provider-backed enrichment, broad historical/fundamental coverage, and optional smoke harness.

Tasks 3.1–3.2 are persisted complete. Five later tasks remain intentionally unchecked and archive is not ready.

## Slice 4 verification

**Result: PASS — fixed score policy and publication checks remain minimal and fail-closed.**

- Estimated authored Slice 4 delta: **63 / 90 lines**.
- `npm run data:publication`: PASS; candidate/current/previous pointer checks fail closed and catalog fallback remains available.
- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json`: PASS.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json --metrics data/ondo/fixtures/metric-cases.json`: PASS.
- `npm run build`: PASS; five type blocks, compatible comparison, score policy, N/D state, 439 catalog rows and search/sort controls render.
- Static boundary: PASS; no provider/network/secret indicators appear in `dist`.
- Score policy: PASS; cohort-relative weights, lower-is-better risk, four-factor/70% coverage, effective weights and snapshot/method scope are visible. No global “best” ranking or advice is presented.
- Provider-backed data: intentionally blocked until official fixtures, identity semantics and licensing pass.

All ten tasks are persisted complete. Slice accounting is **681 / 790** authored lines (390 + 87 + 141 + 63).

## Final disposition

- **Complete SDD implementation verification:** PASS.
- **Static catalog, fallback, blocks, comparison, core metrics and score policy:** PASS.
- **Publication/fallback boundary:** PASS and fail-closed.
- **Provider-backed enrichment:** intentionally deferred and blocked pending official verification/licensing.
- **Archive readiness:** READY; all tasks are complete.
- **Next recommendation:** archive the SDD change; production data enrichment remains a separately gated follow-up.
