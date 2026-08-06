# Apply Progress — ondo-analytics

## Slice 1 boundary

- Delivery strategy: auto-forecast.
- Chain strategy: stacked-to-main (approved).
- Work unit: Slice 1 — safe data boundary only; maximum 420 authored changed lines (replanned hard total: 790).
- Strict TDD: inactive (`openspec/config.yaml` declares `strict_tdd: false`); no RED/GREEN evidence claimed.
- Status consumed: `changeName=ondo-analytics`, `applyState=ready`, `nextRecommended=apply`, `actionContext.mode=repo-local`, workspace root `/home/ghandy/Documents/etf-dashboard`, allowed edit root is the project root, and `blockedReasons=[]`.
- Action-context warning: preserve unrelated dirty/untracked worktree paths; no forbidden path was edited. `Base.astro`, `Sidebar.astro`, and `astro.config.mjs` remain untouched.

## Completed tasks and persisted checkboxes

- [x] Task 1.1 — normalized contracts, pending verification manifest, fixture rules, and fail-closed provider gate. Persisted as `- [x]` in `tasks.md`.
- [x] Task 1.2 — raw-preserving catalog parser/adapter, explicit zero versus missing/malformed states, unresolved display identities, fixture cases, and null-safe catalog table. Persisted as `- [x]` in `tasks.md`.
- [x] Task 1.3 — catalog validation command, build-local snapshot loader, deterministic catalog fallback, and focused npm script. Persisted as `- [x]` in `tasks.md`.

No provider adapter or numeric enrichment was enabled. All five manifest records remain `pending`; blocked sources cannot load through the provider gate.

## Files changed in Slice 1

- `src/data/analytics/types.ts`
- `src/data/analytics/catalogParser.mjs`
- `src/data/analytics/catalogAdapter.ts`
- `src/data/analytics/sourceRegistry.ts`
- `src/data/ondoAssets.ts`
- `src/data/ondoAnalytics.ts`
- `src/components/OndoTable.astro`
- `scripts/ondo/providers/index.mjs`
- `scripts/ondo/validate.mjs`
- `scripts/ondo/check-fixtures.mjs`
- `data/ondo/verification/manifest.json`
- `data/ondo/verification/fixtures/README.md`
- `data/ondo/fixtures/catalog-parser-cases.json`
- `package.json`
- `openspec/changes/ondo-analytics/tasks.md`
- `openspec/changes/ondo-analytics/apply-progress.md`

## Validation evidence

- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` — PASS; machine-readable result: `rows=5`, statuses `display-duplicate-unresolved=2`, `partial=1`, `valid=2`, unresolved `=2`.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json` — PASS; all five sources blocked and parser assertions passed.
- Direct provider gate assertion — PASS; `ondo-metadata-all` throws `code=source-not-verified`.
- Catalog parser smoke — PASS; `ontonew.md` parses 439 raw rows, including ranks 1–439, without display-string deduplication.
- `npm run build` — PASS; Astro static build produced `/index.html`. Astro emitted only the existing unused external-helper warning. The current catalog search/sort path remains in the page; null fields render `N/D` and use empty numeric data attributes.

The loader is build-local and network-free. It accepts a valid enriched snapshot or `ONDO_SNAPSHOT_PATH`; absent/invalid data returns `catalog-fallback` with `generatedAt=null`, `no-generated-snapshot`, unresolved counts, and no invented analytics values. Dashboard presentation of the fallback is Slice 2 scope.

## Deviations and deliberate stops

- Provider adapters were deliberately not created or enabled because endpoint response shape, identity coverage, token/underlying semantics, replay fixtures, and licensing remain unverified.
- The lossless catalog retains every raw row and uses `rawRowKey`; shortened addresses never become canonical keys. Canonical identity requires a full address plus chain and stable source ID.
- No fake retrieval or snapshot timestamp was added. Existing Spanish UI copy was preserved.
- Existing unrelated worktree changes were preserved; no commit, stage, reset, clean, publish, or destructive command was run.

## Remaining tasks

The following exact task lines remain unchecked and are deferred to later slices:

- [ ] Task 2.1 — Add the type-first classification view model and dashboard
- [ ] Task 2.2 — Integrate the dashboard without regressing the catalog
- [ ] Task 3.1 — Implement eligibility and fixture-backed metric modules
- [ ] Task 3.2 — Add same-cohort comparison rendering
- [ ] Task 4.1 — Add cohort normalization and the fixed score policy
- [ ] Task 4.2 — Wire candidate validation, isolated build, and atomic publication
- [ ] Task 4.3 — Final hard-cap and delivery evidence

## Current batch — Slice 1 remediation

The historical Slice 1 evidence above and the failed independent verification in `verify-report.md` are preserved. This batch remediated exactly those three blockers; it did not start Slice 2–4.

- Status consumed: `changeName=ondo-analytics`, `applyState=ready`, `actionContext.mode=repo-local`, workspace root `/home/ghandy/Documents/etf-dashboard`, allowed edit root is the project root, and `blockedReasons=[]`.
- Delivery boundary: `auto-forecast`, `stacked-to-main`; Slice 1 cap **420 authored changed lines**, hard total **790**. The current authored accounting is the prior 369-line Slice 1 delta plus 21 remediation lines = **390**, with no capacity borrowed from later slices.
- Task 1.1 is persisted as `- [x]`: both source gates hash the actual fixture bytes with SHA-256 and reject missing, unreadable, or mismatched fixtures; deterministic checker coverage proves matching and mismatch rejection. All five manifest sources remain pending/blocked and no adapter is enabled.
- Task 1.2 is persisted as `- [x]`: `null` raw numeric tokens remain missing/null; malformed full-identity rows are `partial` with field-specific errors; explicit zero remains numeric; truncated/repeated displays remain unresolved and non-canonical.
- Task 1.3 is persisted as `- [x]`: snapshot, pointer, and manifest JSON errors, missing references, policy/identity/content hash mismatches, and invalid content fall back to deterministic catalog-only output with `generatedAt=null`, unavailable/stale quality state, and no network call.

### Remediation files changed

- `src/data/analytics/catalogParser.mjs`
- `src/data/analytics/sourceRegistry.ts`
- `src/data/ondoAnalytics.ts`
- `scripts/ondo/providers/index.mjs`
- `scripts/ondo/check-fixtures.mjs`
- `data/ondo/fixtures/catalog-parser-cases.json`
- `openspec/changes/ondo-analytics/tasks.md`
- `openspec/changes/ondo-analytics/apply-progress.md`

### Fresh remediation validation

- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` — PASS; `rows=5`, statuses `display-duplicate-unresolved=2`, `partial=2`, `valid=1`, unresolved `=2`.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json` — PASS; parser, malformed-row, null-raw, matching/mismatching fixture-hash, missing-fixture, blocked-source, malformed snapshot/pointer/manifest, and content-hash fallback assertions passed.
- Direct `ondo-metadata-all` provider gate assertion — PASS; named `source-not-verified` failure.
- `npm run build` — PASS; Astro static build completed with only the existing unused external-helper warning.
- Static output checks — PASS; 439 catalog rows, rank 439, search and sort controls preserved, and no provider/network/secret indicators in `dist`.

Strict TDD remains inactive (`strict_tdd: false`); no RED/GREEN evidence is claimed. No commit, stage, reset, clean, publish, or destructive command was run. `Base.astro`, `Sidebar.astro`, and `astro.config.mjs` remain untouched; unrelated dirty/untracked worktree paths were preserved.

## Slice 2 — current implementation and validation

Slice 2 is complete within its 130-line ceiling. The parent used a bounded implementation fallback after the structured apply executor exited without a response; no unrelated file was changed.

- `src/data/analytics/classifications.ts` — type-first cohort view model with an explicit Other/Unknown fallback.
- `src/components/AnalyticsDashboard.astro` — static type blocks, catalog-fallback quality state, N/D messaging, and one active secondary-dimension state.
- `src/pages/index.astro` — minimal static dashboard integration; the existing OndoTable search/sort remains independent.
- Estimated authored Slice 2 lines: 87 of 130.
- `npm run build` — PASS; only the existing Vite unused-import warning.
- Static assertions — PASS; five type blocks, catalog-fallback/N/D state, 439 rows, rank 439, search/sort controls, and no provider/network/secret indicators in `dist`.
- Risk deferred by design: no verified taxonomy exists yet, so all current catalog assets remain Other/Unknown; the secondary dimension is represented as a single active state until source-backed classifications arrive.

Tasks 2.1–2.2 are persisted as `- [x]`. Tasks 3.1–4.3 remain intentionally unchecked.

## Slice 3 — current implementation and validation

Slice 3 is complete within its 150-line ceiling. It adds fixture-friendly semantic eligibility, independent core metric modules, and same-cohort comparison without enabling any provider.

- `src/data/analytics/eligibility.ts` — identity/cohort/semantic eligibility and reasoned N/D envelopes.
- `src/data/analytics/metrics/*.ts` — total return/CAGR, revenue/EPS growth, quality, value, momentum, risk, and token/underlying liquidity modules.
- `src/components/ComparisonTable.astro` — cohort-scoped observed/derived comparison with total return, fundamentals, factors, and explicit N/D.
- `data/ondo/fixtures/metric-cases.json` plus `--metrics` checker path — valid total return/fundamental cases and non-applicable cohort coverage.
- Estimated authored Slice 3 lines: 141 of 150.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json --metrics data/ondo/fixtures/metric-cases.json` — PASS.
- `npm run build` — PASS; comparison, five type blocks, N/D disclosure, 439 catalog rows, and existing search/sort controls present.
- Static boundary — PASS; no provider/network/secret indicators in `dist`.
- Provider-backed enrichment remains blocked; unsupported metrics remain N/D.

Tasks 3.1–3.2 are persisted as `- [x]`. Tasks 4.1–4.3 remain intentionally unchecked.

## Slice 4 — current implementation and validation

Slice 4 is complete within its 90-line ceiling and remains fail-closed.

- `src/data/analytics/normalization.ts` — cohort-relative min/max normalization with lower-is-better support.
- `src/data/analytics/score.ts` — fixed six-factor weights, four-factor/70% coverage gate, effective weights, method and cohort metadata.
- `src/components/ComparisonTable.astro` — visible score policy, weights, coverage threshold, cohort and snapshot scope.
- `scripts/ondo/update.mjs`, `scripts/ondo/check-publication.mjs`, `scripts/ondo/validate.mjs` — minimal candidate/current/previous pointer checks and deterministic catalog fallback; no pending source adapter enabled.
- `package.json` — focused `data:publication` command.
- Estimated authored Slice 4 lines: 63 of 90.
- `npm run data:publication` — PASS; candidate/current/previous pointers fail closed, fallback is catalog-only, score is cohort-relative.
- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` — PASS.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json --metrics data/ondo/fixtures/metric-cases.json` — PASS.
- `npm run build` — PASS; five type blocks, comparison, score policy, N/D state, 439 catalog rows and search/sort controls render; runtime provider/secret scan is clean.

Tasks 4.1–4.3 are persisted as `- [x]`. Provider-backed enrichment remains intentionally blocked until official response fixtures, identity semantics and licensing pass.

## Final delivery evidence

- Slice accounting: 390 + 87 + 141 + 63 = **681 / 790** authored lines.
- All ten implementation/evidence tasks are persisted complete.
- No commit, stage, reset, clean, publish, or destructive command was run.
- Existing dirty/untracked files outside the approved surfaces were preserved.

## Next recommendation

`verify` the complete implementation, then archive the SDD change. Production data enrichment remains a separate gated follow-up.
