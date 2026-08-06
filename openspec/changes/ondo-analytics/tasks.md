# Ondo Analytics Implementation Tasks

This repaired task plan keeps the approved static Astro boundary and four reviewable slices. It remediates the failed Slice 1 verification before any later slice may begin. It preserves unrelated dirty and untracked worktree paths.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 790 maximum authored changed lines across four slices |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4, one complete slice per stacked PR |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

The approved review budget is 800 lines, but the design's slice ceilings are hard limits: Slice 1 = 420, Slice 2 = 130, Slice 3 = 150, Slice 4 = 90, hard total = 790. The prior Slice 1 allocation of 220 was disproven by verification: the implemented boundary measured 369 authored changed lines. That 369-line measurement is retained as evidence, not as approval. Tasks 1.1–1.3 are intentionally reset and require fresh verification.

## Evidence-based replan and guardrails

Previously proven context from `openspec/changes/ondo-analytics/verify-report.md`:

- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` passed with 439 catalog rows preserved by the build evidence, including `partial` and unresolved display-duplicate statuses.
- `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json` passed with all five source records blocked.
- The direct provider assertion passed with `code=source-not-verified`.
- `npm run build` passed and static output contained 439 catalog rows, `N/D` controls, and no runtime provider request or exposed secret.
- These results do not close the three remediation blockers: malformed full-identity rows can still be `valid`, invalid snapshot/pointer JSON or manifest/hash inputs do not always fall back, and the provider gate does not compute and compare fixture SHA-256.

Priority is explicit and ordered: safe data boundary first; type blocks next; core compatible-cohort comparison and metrics next. If a cap is threatened, defer broad provider enrichment, editable score controls, low-coverage cohorts, and UI polish before weakening identity, provenance, `N/D`, static-build safety, token/underlying separation, or rollback behavior.

Non-negotiable invariants:

- PWM/Perplexity remains discovery and review support only; its prose never supplies production numeric values or enables an adapter.
- No runtime provider calls, credentials, or endpoint secrets enter the browser/static artifact.
- Truncated/display identities never become canonical join or deduplication keys; unresolved rows receive no enrichment, factor, or score.
- Missing, malformed, stale, invalid, unresolved, or not-applicable values remain nullable and render Spanish `N/D` with a reason; none becomes zero by inference.
- Token-market and underlying-market series/liquidity remain separate and semantically labeled.
- Only complete, replayable, semantically verified, redistributable sources may publish numeric enrichment.
- Existing dirty or untracked paths outside the allowlist are never cleaned, reset, deleted, reformatted, or overwritten.

## Slice 1 — Safe data-boundary remediation and verification hash gate (maximum 420 changed lines)

**Dependency:** none for starting analysis; all three tasks must pass fresh verification before Slice 2.

**Start boundary:** current Slice 1 implementation, whose catalog/build evidence passed but whose verification failed at the 369-line measured boundary and three data-integrity/gate blockers.

**Finish boundary:** lossless catalog rows, unresolved-safe fallback, fail-closed source verification with fixture hash checking, and a build-local loader that falls back for invalid snapshot/pointer/manifest/hash inputs. No provider adapter or numeric provider enrichment is enabled.

- [x] Task 1.1 — Complete normalized contracts and the fail-closed source verification gate

**Files:**

- `src/data/analytics/types.ts`
- `src/data/analytics/sourceRegistry.ts`
- `data/ondo/verification/manifest.json`
- `data/ondo/verification/fixtures/README.md`
- `scripts/ondo/providers/index.mjs`

**Start:** the current contracts, pending manifest, and provider gate exist, but the gate checks non-empty fixture metadata without hashing the fixture bytes.

**Implement:**

- Preserve the design's discriminated `SourceRecord`, provenance, identity, value-envelope, semantic, coverage, failure, licensing, and replay-fixture contracts. Do not weaken them to permit unknown verification evidence.
- Keep required Ondo/DIA candidates pending or blocked until every required field and redistribution permission is evidenced. PWM/Perplexity is not a production source.
- Make `getVerifiedSource(sourceId)` fail closed unless status, HTTP evidence, fixture existence, replayability, identity/semantic coverage, failure behavior, and both licensing permissions pass.
- Compute SHA-256 from the actual `responseFixturePath` bytes and compare it with `responseSha256` before admitting a source. Missing, unreadable, or mismatched hashes must remain blocked and return a named `source-not-verified` failure; licensing failures return `license-not-approved`.
- Keep `scripts/ondo/providers/index.mjs` as the only provider-loading gate; it must not load or return an adapter after any failed check.

**Remediation acceptance criteria:**

- A fixture whose bytes differ from the manifest hash is rejected even when `verificationStatus` is `passed` and all other fields look complete.
- A complete fixture with a matching computed SHA-256 can pass only when all other source-gate requirements pass; no fixture hash is trusted merely because it is non-empty.
- The gate remains deterministic and network-free, and incomplete/blocked records cannot publish numeric values.

**Verify:** `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json`; run the direct blocked-source assertion for `ondo-metadata-all`; add a focused temporary in-memory/file mutation assertion only if the existing checker does not exercise both matching and mismatching hashes, without leaving unrelated files.

**Rollback:** revert only the contract, registry, manifest, fixture-documentation, and provider-gate changes in the five listed paths. Do not remove catalog data, generated output, or unrelated worktree changes.

- [x] Task 1.2 — Make catalog parsing lossless and classify malformed full-identity rows correctly

**Files:**

- `src/data/ondoAssets.ts`
- `src/data/analytics/catalogAdapter.ts`
- `src/data/analytics/catalogParser.mjs`
- `data/ondo/fixtures/catalog-parser-cases.json`
- `src/components/OndoTable.astro`

**Dependency:** Task 1.1 contracts remain available; do not enable provider enrichment.

**Start:** raw field states and row keys exist, but a full-address row with malformed numeric fields can still receive `rowStatus: valid`, and null raw tokens can be stringified instead of preserved as missing.

**Implement:**

- Preserve each original numeric token, including `null` as `raw: null`, and distinguish explicit zero, missing, malformed, and unresolved states with nullable values.
- Add field-specific validation errors for malformed values. A row with a verified full identity and malformed numeric fields must be `partial` or `invalid`, never `valid`; a missing or unresolved identity remains separately represented.
- Keep stable `ontonew.md:row:<ordinal>` keys. Treat truncated addresses, names, symbols, ranks, websites, and suffixes as display-only. Repeated/truncated displays remain separate unresolved rows and never become canonical dedupe keys.
- Keep nullable catalog projections and null-safe table attributes/display as Spanish `N/D`; preserve existing full-catalog search and sort behavior. Explicit zero remains numeric zero, while nulls are excluded from aggregates.
- Extend the parser fixture with explicit zero, blank, `null`, malformed money/count, truncated and repeated display addresses, and one valid full-identity row. Unresolved rows must have no enrichment/factor/score fields.

**Remediation acceptance criteria:**

- The malformed numeric full-identity fixture row is reported as `partial` or `invalid` with field-specific reasons, while its raw tokens and canonical identity state remain inspectable.
- A null raw token is reported as `missing` with `raw: null` and `value: null`; it is not the malformed string `"null"` and is not converted to zero.
- Every fixture row has exactly one raw row key; truncated/repeated display values do not collapse rows or create canonical identity keys.

**Verify:** `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json`; `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json`; `npm run build`; inspect generated catalog evidence for `N/D`, preserved rows, and unchanged search/sort controls.

**Rollback:** revert only parser, adapter, parser-bridge, fixture, and null-safe table compatibility changes in the listed paths. Keep `ontonew.md`, unrelated layout/CSS changes, and the source-gate work intact.

- [x] Task 1.3 — Make snapshot validation and build-local fallback fail closed

**Files:**

- `src/data/ondoAnalytics.ts`
- `scripts/ondo/validate.mjs`
- `scripts/ondo/check-fixtures.mjs`
- `package.json`

**Dependency:** Tasks 1.1–1.2 provide the source gate and lossless catalog contract.

**Start:** focused checks and the static build pass for normal inputs, but malformed snapshot/pointer JSON can throw, and the loader does not fully validate the referenced manifest/hash before accepting enrichment.

**Implement:**

- Keep `data:validate` with the exact `--catalog-fixture` option and machine-readable row/status counts. Exercise the shared parser rather than maintaining a divergent grammar.
- Make `src/data/ondoAnalytics.ts` catch JSON read/parse errors for `ONDO_SNAPSHOT_PATH`, `ONDO_SNAPSHOT_MANIFEST_PATH`, `current.json`, the referenced snapshot, and the referenced manifest. Return the deterministic catalog-only fallback rather than throwing.
- Validate pointer shape, referenced paths, snapshot identity, manifest identity, schema/policy hashes, and SHA-256 content hashes before accepting a generated snapshot. Any missing, malformed, mismatched, or invalid manifest/hash input returns `mode: catalog-fallback` with unavailable/stale quality state.
- Keep fallback construction deterministic from `ontonew.md`, with no fake current timestamp, network request, credential, or inferred numeric analytics. Preserve visible reasons and no-provider behavior.
- Extend `check-fixtures.mjs` to prove parser remediation, blocked source behavior, matching/mismatching fixture hashes, and invalid JSON/pointer/manifest/hash fallback cases without network access.

**Remediation acceptance criteria:**

- Malformed snapshot JSON and malformed `current.json`/manifest JSON are caught and produce the deterministic catalog fallback, not a build-time exception.
- A syntactically valid pointer whose snapshot or manifest hash is absent, invalid, stale, or mismatched is rejected and produces the same catalog fallback; no enriched data is loaded.
- A valid candidate is accepted only after pointer, manifest, snapshot, and content hashes all agree. The fallback contains unavailable/stale reasons and does not fabricate freshness.

**Verify:** `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json`; `node scripts/ondo/check-fixtures.mjs --manifest data/ondo/verification/manifest.json`; exercise malformed JSON and hash-mismatch fixtures through the checker; `npm run build`; confirm no runtime provider request or secret in static output.

**Rollback:** remove only the loader/checker additions and focused `data:validate` command, restoring the pre-change import path only with the parser compatibility edits it requires. Do not remove unrelated generated or worktree paths.

**Fresh Slice 1 gate:** after Tasks 1.1–1.3, run all applicable focused checks and `npm run build`, then create a fresh verification report. Slice 2 is blocked unless that report confirms: malformed full-identity rows are `partial`/`invalid`; JSON parse and pointer/manifest/hash failures return catalog fallback; and fixture SHA-256 is computed and compared. The prior failed report cannot satisfy this gate.

**Slice 1 stop rule:** stop immediately before the actual or forecast authored diff exceeds 420 changed lines. Do not borrow capacity from Slices 2–4, add provider adapters, broaden enrichment, or mark a task complete without the fresh verification gate.

## Slice 2 — Type-first blocks and quality state (maximum 130 changed lines)

**Dependency:** Slice 1 fresh verification passes. The only production data may still be deterministic catalog fallback data.

**Start boundary:** `src/data/ondoAnalytics.ts` exposes a validated snapshot or explicit fallback.

**Finish boundary:** type-first navigation, explicit `Other / Unknown`, one active secondary dimension, and truthful provenance/quality/N/D state without guessed classifications.

- [x] Task 2.1 — Add the type-first classification view model and dashboard

**Files:**

- `src/data/analytics/classifications.ts`
- `src/components/AnalyticsDashboard.astro`
- `src/data/ondoAnalytics.ts`

**Implement:** model Equities, Equity ETFs, Fixed income/Treasuries, Stablecoins/cash-like, and Other/Unknown; always render Other/Unknown; expose exactly one active sector/industry or geography/market dimension; scope options to verified taxonomy/provenance; render snapshot mode/time, coverage, unresolved identities, unavailable/stale/error counts, provenance, and Spanish `N/D` reasons.

**Verify:** `npm run build`; inspect the generated analytics markup for the explicit Unknown cohort, one active dimension control, provenance/quality state, and Spanish `N/D` reasons. The direct smoke command is owned by Task 2.2 after its harness exists.

**Rollback:** remove only the classification view model and dashboard additions; leave `src/components/OndoTable.astro`, `src/components/Sidebar.astro`, and Slice 1 data behavior unchanged.

- [x] Task 2.2 — Integrate the dashboard without regressing the catalog

**Files:**

- `src/pages/index.astro`
- `scripts/ondo/smoke-static.mjs`

**Dependency:** Task 2.1 provides the dashboard contract.

**Implement:** place the dashboard beside the existing catalog without changing independent full-catalog search/sort; keep `src/components/Sidebar.astro` unchanged unless a strictly necessary allowlisted compatibility fix is proven; make the direct Playwright harness assert Unknown, fallback/N/D, legacy rows, and absence of browser provider requests/secrets.

**Verify:** `npm run build`; `node scripts/ondo/smoke-static.mjs dist --analytics-fallback`.

**Rollback:** remove only page integration and smoke harness changes; retain Slice 1 and the catalog table.

**Slice 2 stop rule:** stop at type blocks plus one active secondary dimension when the actual or forecast authored diff reaches 130. Defer UI polish, industry/market breadth, and broad manual classification; do not remove Unknown, provenance, freshness, or unavailable-state disclosure.

## Slice 3 — Core compatible-cohort comparison and metrics (maximum 150 changed lines)

**Dependency:** Slices 1–2 pass. Metric fixtures may be redacted/fixture-only; no unverified provider is enabled.

**Start boundary:** the dashboard has a selected compatible cohort and build-local snapshot state.

**Finish boundary:** pure semantic eligibility, core compatible-cohort comparison, independent metric displays, and reasoned `N/D` for unsupported inputs.

- [x] Task 3.1 — Implement core eligibility and fixture-backed metric modules

**Files:**

- `src/data/analytics/eligibility.ts`
- `src/data/analytics/metrics/returns.ts`
- `src/data/analytics/metrics/fundamentals.ts`
- `src/data/analytics/metrics/quality.ts`
- `src/data/analytics/metrics/value.ts`
- `src/data/analytics/metrics/momentum.ts`
- `src/data/analytics/metrics/risk.ts`
- `src/data/analytics/metrics/liquidity.ts`
- `data/ondo/fixtures/metric-cases.json`
- `scripts/ondo/check-fixtures.mjs`

**Implement:** reject incompatible identity, cohort, currency, period, venue, calendar, adjustment, stale, and unknown-semantic inputs; cover valid one-year total return, insufficient five-year history, independent revenue/EPS period checks, cohort-inapplicable quality, invalid value denominator, partial momentum, unavailable risk, and distinct token/underlying liquidity. Preserve formulas, input IDs, method versions, coverage, provenance, and reason codes. Never use catalog fields for liquidity/risk or price return for total return.

**Verify:** `node scripts/ondo/check-fixtures.mjs --metrics data/ondo/fixtures/metric-cases.json`; `npm run build`.

**Rollback:** remove only metric modules and fixture/checker extensions; retain fallback and type blocks.

- [x] Task 3.2 — Add same-cohort comparison rendering

**Files:**

- `src/components/ComparisonTable.astro`
- `src/components/AnalyticsDashboard.astro`

**Dependency:** Task 3.1 exposes semantic metric results and reasons.

**Implement:** compare one active compatible cohort and one snapshot only; exclude unresolved/incompatible assets from metrics and score; show observed catalog fields separately from derived metrics with source/as-of/method disclosures; show one-/five-year total return eligibility, separate momentum windows, fundamental groups, risk definitions, and token versus underlying liquidity labels; add no global ranking, provider call, or silent proxy.

**Verify:** `npm run build`; `node scripts/ondo/smoke-static.mjs dist --comparison`; repeat the metric fixture check.

**Rollback:** remove comparison integration while preserving the type-first dashboard, legacy catalog, and metric contracts.

**Slice 3 stop rule:** stop at 150 actual or forecast authored changed lines. Defer broad provider enrichment, low-coverage cohorts, and nonessential metric breadth before weakening semantic eligibility, provenance, identity, or `N/D` behavior.

## Slice 4 — Fixed score and publication evidence (maximum 90 changed lines)

**Dependency:** Slices 1–3 pass. Score/publication wiring cannot enable an unverified provider.

**Start boundary:** semantic metrics and comparison rendering are independently safe.

**Finish boundary:** fixed cohort-relative score policy is transparent and minimal candidate publication/build/rollback behavior is isolated and fail closed.

- [x] Task 4.1 — Add cohort normalization and the fixed score policy

**Files:**

- `src/data/analytics/normalization.ts`
- `src/data/analytics/score.ts`
- `src/components/ComparisonTable.astro`
- `data/ondo/fixtures/metric-cases.json`
- `scripts/ondo/check-fixtures.mjs`

**Implement:** normalize only within a compatible cohort and snapshot; expose lower-is-better risk; use Growth 20%, Value 15%, Quality 20%, Momentum 15%, Risk 15%, Liquidity 15%; require at least four valid factors and 70% configured-weight coverage; expose original/effective weights, coverage, method, cohort, and snapshot; keep controls non-editable and never show a global best rank or advice.

**Verify:** `node scripts/ondo/check-fixtures.mjs --score data/ondo/fixtures/metric-cases.json`; `npm run build`; `node scripts/ondo/smoke-static.mjs dist --score`.

**Rollback:** remove score/normalization wiring and score UI; retain independent metrics and comparison.

- [x] Task 4.2 — Wire minimal candidate validation, isolated build, and atomic publication

**Files:**

- `scripts/ondo/update.mjs`
- `scripts/ondo/validate.mjs`
- `scripts/ondo/check-publication.mjs`
- `package.json`
- `src/data/ondoAnalytics.ts`
- `data/ondo/runs/<run-id>/`
- `src/data/generated/ondo/snapshots/<snapshot-id>/`
- `src/data/generated/ondo/current.json`
- `src/data/generated/ondo/previous.json`

**Implement:** admit only sources already passing `sourceRegistry`; write redacted run audit evidence; validate identity, duplicates, dates, semantics, coverage, freshness, licensing, and score configuration; build with `ONDO_SNAPSHOT_PATH` and `ONDO_SNAPSHOT_MANIFEST_PATH`; publish immutable snapshots and atomically replace one pointer only after validation/build success; preserve current on failure and restore previous through a temporary pointer when post-swap recovery is required; never run cleanup/reset/broad formatting or create a provider adapter here.

**Verify:** `node scripts/ondo/check-publication.mjs`; `npm run data:validate`; `npm run build`; `node scripts/ondo/smoke-static.mjs dist --network-assertion`.

**Rollback:** restore only the prior generated pointer/snapshot and remove publication wiring; preserve all unrelated dirty/untracked paths.

**Slice 4 stop rule:** stop at 90 actual or forecast authored changed lines and defer editable controls, optional score presentation, and polish. Never exceed the 790-line hard total or trade static-only loading, provenance, fail-closed publication, or rollback correctness for score breadth.

- [x] Task 4.3 — Record final hard-cap and delivery evidence

**Files:**

- `openspec/changes/ondo-analytics/tasks.md`
- `openspec/changes/ondo-analytics/apply-progress.md`
- `openspec/changes/ondo-analytics/verify-report.md`

**Dependency:** all selected implementation slices and their focused evidence are complete.

**Implement:** record authored additions plus deletions, command results, source-gate status, fallback behavior, publication/rollback evidence, and deferred provider breadth, editable score controls, low-coverage cohorts, and UI polish. Do not commit or publish.

**Verify:** `npm run build`; all applicable `node scripts/ondo/check-*.mjs` commands; optional direct Playwright smoke; inspect `git diff --stat` and `git status --short` without cleaning or resetting. Confirm no runtime provider request or secret is emitted.

**Rollback:** stop at the last complete slice and revert only that slice's allowlisted files/artifacts; preserve pre-existing dirty/untracked files.

## Global hard-cap and dependency stop rule

- Slice ceilings are immutable: 420 + 130 + 150 + 90 = 790 authored changed lines. Generated runtime output does not justify exceeding an authored slice ceiling, and capacity cannot be borrowed between slices.
- If actual or forecast authored additions plus deletions would exceed the current slice ceiling, stop before the next executable task and defer the remaining scope. Do not split a contract mid-task, weaken a gate, or claim completion from an over-cap diff.
- The total delivery stops at 790 even though the review budget is 800. A later slice cannot start until its dependency slice has a passing fresh verification result.
- The first mandatory gate is the fresh post-remediation Slice 1 verification; its prior failed report cannot be reused as approval.

## Apply handoff

`next_recommended` is `sdd-apply` because this repaired artifact has dependency-ordered, unchecked executable tasks, exact file boundaries, validation commands, rollback boundaries, truthful forecast lines, and explicit 420/790 stop rules. Apply one complete stacked slice at a time and stop on the first hard-cap breach or verification failure.
