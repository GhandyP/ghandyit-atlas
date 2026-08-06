# Product Functionality Plan: From Static Ondo Catalog to Useful Market Intelligence

**Status:** Planning document based on a read-only repository inspection on 2026-08-05  
**Audience:** Project owner and implementation team  
**Product boundary:** Ondo tokenized-asset discovery, evidence-aware comparison, and research support. This is not an investment-advice or trading product.

## Executive Outcome

The product should help a user answer four practical questions without hiding uncertainty:

1. **What is this tokenized asset?** The user can identify the token, its canonical contract or stable identifier, its underlying instrument when verified, its asset type, and the source and date of each important field.
2. **What can I compare it with?** The user can select a compatible cohort, such as equities, equity ETFs, or fixed income, instead of comparing unrelated instruments in one global list.
3. **How has it behaved?** The user can inspect current observations and derived returns, growth, momentum, risk, quality, value, and liquidity metrics only when the input data, eligibility rules, time period, and calculation method are valid.
4. **How much should I trust the result?** The user can see freshness, provenance, confidence, coverage, missing-data reasons, and whether a value is observed, derived, editorial, stale, unavailable, or not applicable.

The first genuinely useful release is therefore an **evidence-aware research dashboard**, not a larger table and not a universal ranking. It should let a user form a defensible shortlist for further investigation while making it impossible to mistake missing, stale, or unverified data for a fact.

## Current-State Diagnosis

**Executive diagnosis:** The current repository contains a functional static catalog shell and substantial analytics safety scaffolding, but it does not yet contain a production data pipeline or a connected analytical product. The minimum path is to repair repository integrity, establish canonical data contracts, verify at least one permitted source, publish a versioned snapshot, and only then activate cohort-aware analytics.

### Status Legend

| Status | Meaning |
|---|---|
| Implemented | Current checked-in code performs this behavior for the local catalog. |
| Partial / scaffolding | The shape or safety boundary exists, but it is not connected to useful production behavior. |
| Missing | No current repository implementation or configuration was found. |
| Blocked | The work cannot be trusted or released until a prerequisite such as identity, licensing, or build integrity is resolved. |
| Hypothesis | A proposed provider behavior, mapping, business rule, or product choice that still requires validation or owner approval. |

### Verified Current State

| Area | Evidence in the current repository | Status | Product consequence |
|---|---|---|---|
| Framework and rendering | `package.json` declares Astro `^6.1.3`; `astro.config.mjs` sets `output: 'static'`. | Implemented | Build-time publication is the lowest-risk first architecture. Browser runtime data calls are not required for the first release. |
| Raw catalog | `ontonew.md` is parsed at build time by `src/data/ondoAssets.ts`. A read-only parse using the checked-in parser found 439 raw rows. All 439 displayed contract strings are truncated, and two displayed contract strings repeat. | Implemented, but limited | The current rows are suitable for transparent catalog display, not for safe external identity joins. |
| Catalog parsing | `src/data/analytics/catalogParser.mjs` preserves raw fields and distinguishes valid zero, missing, malformed, truncated, unresolved, and duplicate-display states. | Implemented | This is a useful foundation, but those states must be surfaced to users and retained in the published model. |
| Catalog statistics | `src/data/ondoAssets.ts` exposes `ondoStats` for count, market cap, holders, and zero-market-cap rows. | Implemented | These are snapshot observations, not current market truth. They need an as-of date and source status. |
| Search and sorting | `src/components/OndoTable.astro` renders all rows and provides client-side text search plus rank, market-cap, holders, name, and symbol sorting. | Implemented for the shell | The controls do not yet filter by cohort, classification, data quality, freshness, or metric eligibility. |
| Asset navigation | The table displays a shortened contract and an `ondo.finance` link, but there is no asset detail route or evidence panel. | Missing | A user cannot inspect the identity, underlying, methodology, or source history of one asset. |
| Analytics loader | `src/data/ondoAnalytics.ts` validates generated snapshots, freshness, hashes, manifests, and approved sources, then falls back to `snapshotId: 'catalog-fallback'`. | Partial / safety scaffolding | The fallback is honest, but it currently supplies no useful derived analytics. |
| Generated snapshot | No files were found under `src/data/generated/ondo/**`; the default `current.json` therefore cannot load. | Missing | There is no published analytical dataset for the UI to consume. |
| Source verification | `data/ondo/verification/manifest.json` contains five candidate records and every record is `verificationStatus: "pending"`. `data/ondo/verification/fixtures/README.md` explicitly blocks unverified production numeric data and licensing claims. | Blocked | The product must not present provider data or derived metrics as verified until a source passes the gate. |
| Provider adapters | `scripts/ondo/providers/index.mjs` allowlists `ondo` and `dia` loaders, but the repository currently contains only the index file, not the referenced `ondo.mjs` or `dia.mjs` adapters. | Missing / blocked | Provider response mapping, retries, rate limits, and real-source ingestion still need implementation and verification. |
| Publication tooling | `scripts/ondo/update.mjs` contains validation and atomic `current`/`previous` pointer publication functions. `scripts/ondo/check-publication.mjs` and `scripts/ondo/check-fixtures.mjs` exercise safety cases. | Partial / scaffolding | The repository has reusable safety primitives, but no complete update command that fetches, normalizes, calculates, audits, and publishes a real snapshot. |
| Classification | `src/data/analytics/classifications.ts` defines five asset-type groups, but `ondoAnalytics` falls back to catalog assets that have no classification fields. `activeDimension` is fixed to `sector` and `dimensionOptions` is empty. | Partial / effectively unknown | The interface suggests cohort analysis, but current rows should remain `Unknown` rather than receive guessed types or sectors. |
| Metric modules | `src/data/analytics/metrics/` contains return, momentum, risk, liquidity, fundamentals, quality, and value functions. The functions enforce some eligibility and null semantics, but the page passes comparison rows containing only name, symbol, market cap, and holders. | Partial / disconnected | The existence of formulas does not mean that the dashboard has live, source-backed analytics. |
| Comparison UI | `src/components/AnalyticsDashboard.astro` renders groups and `src/components/ComparisonTable.astro` renders columns for many metrics. The active-group buttons only change CSS/ARIA state and a data attribute; they do not replace the rows. | Partial / placeholder behavior | Users see the shape of an analytical experience, not a working cohort comparison. |
| Scoring policy | `src/data/analytics/score.ts` contains a six-factor configuration, cohort scope, a 70% coverage threshold, and a four-factor minimum. | Hypothesis, not approved policy | These values must be reviewed by the owner before any score is shown as a product decision aid. |
| Repository migration | `git status` shows a large staged migration from the old ETF dashboard. `src/components/Sidebar.astro` imports `../../yo/Refined Ghandyit Logo with Distinctive Symbol.svg?url`, while that matching `yo/` asset is staged for deletion. Old `EtfTable.astro` and `src/data/etfs.json` are also staged for deletion. | Blocked until reconciled | The repository cannot be treated as a release baseline until the staged migration is intentionally made buildable. Do not discard staged work blindly. |
| Automated quality | `package.json` has `dev`, `build`, `preview`, `data:validate`, and `data:publication`, but no test, typecheck, lint, CI, or deploy script. Playwright is installed but no `playwright.config.*` was found. No test files, `tsconfig.json`, `.github/`, ESLint, or deployment configuration were found. | Missing / partial | A passing local build alone cannot protect data integrity, browser behavior, accessibility, or publication rollback. |
| Product language | `src/layouts/Base.astro` declares `lang="es"` and the current UI copy is Spanish. | Implemented, decision still open | The target audience and language policy must be made explicit before expanding copy, labels, and accessibility text. |

### Facts Versus Hypotheses

The following must remain explicitly unverified until evidence is captured:

| Topic | Current evidence | Safe interpretation |
|---|---|---|
| Ondo endpoints | Candidate URLs are recorded in `data/ondo/verification/manifest.json`, but HTTP status, authentication, response shape, pagination, rate limits, historical coverage, and field semantics are not verified there. | Treat them as research leads, not available providers. |
| DIA cross-check | `dia-ondo-cross-check` is pending and its identity and redistribution terms are unverified. | Do not use it as a market-data source or identity authority yet. |
| Token versus underlying series | The manifest explicitly marks series identity as unknown. | Never mix token-market liquidity or price history with underlying-asset history without labeling and validation. |
| Sector, geography, and asset type | The current catalog contains no authoritative classification fields. | Do not infer type from symbols, names, or suffixes such as `on`. |
| Score weights | `src/data/analytics/score.ts` contains candidate weights and thresholds. | They are implementation configuration, not an approved definition of quality or preference. |
| Refresh cadence | `ontonew.md` has no embedded catalog as-of timestamp, and no deployment scheduler exists. | Do not promise daily, hourly, or real-time freshness. |
| Audience and language | The existing UI is Spanish, but the product audience has not been recorded as an owner decision. | Preserve current language behavior until the audience decision is explicit; keep terminology consistent. |

The historical planning material under `openspec/changes/ondo-analytics/` is useful context for data and safety concerns. It is not authorization to apply that SDD change, and this document is not an SDD phase or an SDD artifact.

## Product Vision and Target Users

### Product Vision

Build a calm, evidence-first workspace for exploring tokenized assets. The product should reduce the work required to find comparable assets and understand their evidence, while refusing to manufacture certainty when identity, history, classification, or licensing is incomplete.

The product should answer questions, not produce an opaque answer called "best asset". A ranking may be offered later only as a cohort-relative, methodology-versioned view with visible coverage and limitations.

### Initial Target Users

| User | Job to be done | Useful questions the dashboard must answer |
|---|---|---|
| Research-oriented user evaluating tokenized exposure | Find candidates and understand what each token represents. | What is the asset, what does it represent, where is it issued, and which identifiers are verified? |
| Data-conscious analyst | Compare like-for-like assets using consistent time periods and source semantics. | Which assets share a valid cohort, currency, calendar, series identity, and history? |
| Product owner or data operator | Know whether the published dashboard is trustworthy today. | When was the snapshot generated, which sources passed, what is stale, what is unresolved, and what changed since the previous snapshot? |
| Implementation team | Extend the product without bypassing provenance or eligibility rules. | Where does a new provider, metric, taxonomy, UI state, or release check belong, and what evidence must accompany it? |

### Core User Flows

1. **Discover:** Search by name, symbol, full or displayed identifier, then filter by supported cohort, classification, freshness, and data quality.
2. **Verify:** Open an asset detail view showing identity state, token-versus-underlying relationship, source, retrieval time, as-of period, and unresolved fields.
3. **Compare:** Select compatible assets and compare observed values and valid derived metrics in one snapshot.
4. **Investigate:** Open the formula, input coverage, and missing-data reason for any metric instead of treating `N/D` as a blank failure.
5. **Monitor:** Use the data-quality view to see whether the current release is fresh, stale, partial, source-blocked, or operating on the catalog fallback.

## Definition of Functional and Useful

The product is functional when a user can complete the flows above. It is useful when the resulting answers are both actionable for research and honest about their limits.

### Minimum Product Bar

| Capability | Minimum measurable bar for the first useful release |
|---|---|
| Catalog coverage | Every raw row from `ontonew.md` is either represented with a stable canonical identity or explicitly marked unresolved. No row disappears silently during normalization. |
| Identity trust | No external enrichment is joined using a truncated display address, token-name suffix, or symbol alone. Duplicate displayed identities are visible and unresolved until reconciled. |
| Discovery | A user can search name, symbol, and contract; filter by cohort and data status; sort numeric fields with explicit null ordering; and see the visible count. |
| Asset understanding | A user can reach a detail view or evidence panel from a catalog row and see current fields, identity state, classifications, source status, and as-of information. |
| Comparison | Comparison defaults to a compatible cohort and one snapshot. It never silently compares unrelated asset classes or mixes token and underlying series. |
| Analytics trust | Every shown metric has a status, eligibility result, method version, source/input IDs, and time semantics, or it displays `N/D` with a reason. |
| Missing data | Missing, malformed, stale, ineligible, not-applicable, and license-blocked values remain distinct. A missing value is never rendered as numeric zero. |
| Freshness | The page exposes generated time, catalog as-of time, source age, and stale/fallback state. Unknown age is displayed as unknown, not as fresh. |
| Accessibility | All primary flows work with keyboard and a screen reader; status does not rely on color; tables, tabs, dialogs, and focus changes have semantic labels. |
| Release safety | A clean install can validate data, build the static site, and reject invalid or unlicensed publication candidates before deployment. |

### Technical Success Criteria

- `npm ci` and the declared validation/build commands pass from a clean checkout after the staged migration is reconciled.
- The generated snapshot has a versioned schema, stable snapshot ID, generated timestamp, catalog snapshot timestamp, source records, quality summary, and asset-level provenance.
- A failed provider, invalid hash, stale snapshot, missing manifest, duplicate canonical ID, or license failure cannot replace the last known valid publication.
- Pure data contracts and metric functions have automated tests for valid, missing, malformed, stale, ineligible, identity-conflict, and not-applicable cases.
- Browser tests cover search, sort, cohort selection, detail navigation, comparison, empty states, responsive layout, keyboard operation, and visible provenance.
- CI rejects a build that cannot reproduce the snapshot or that presents an unapproved provider as verified.

## Scope and Non-Goals

### First Useful Release Scope

The first release should include:

- A buildable static Astro application with the staged ETF-to-Ondo migration reconciled.
- A lossless, quality-aware catalog model for the current 439-row input.
- Canonical identity when supplied by an authoritative source, and explicit unresolved states when it is not.
- A versioned build-time snapshot with a safe catalog fallback.
- One verified provider path for a bounded initial cohort, subject to real response and licensing validation.
- Search, sorting, cohort filters, data-quality filters, and a detail/evidence view.
- Same-cohort comparison using observed fields and only the derived metrics that meet eligibility requirements.
- Visible source, freshness, confidence, method, and missing-data semantics.
- Automated data validation, build validation, focused browser smoke coverage, and a repeatable publication path.

### Non-Goals

- Do not present the product as investment advice, a recommendation engine, a portfolio allocator, or a trading terminal.
- Do not claim analytics are verified when the source, identity, semantics, licensing, or snapshot has not passed its gate.
- Do not fabricate sectors, geographies, tickers, returns, risk, quality, growth, value, liquidity, or composite scores from names or symbols.
- Do not use one pooled ranking for equities, ETFs, bonds, stablecoins, cash-like instruments, and unknown assets.
- Do not put provider secrets, rate-limited fetches, or uncontrolled runtime data calls in the static browser client.
- Do not add a five-year metric when the required history or comparable identity is unavailable.
- Do not call holders, market cap, or market-cap-per-holder a liquidity measure.
- Do not build user accounts, watchlists, alerts, portfolio tracking, or personalized recommendations before the evidence model and core comparison flow are trustworthy.
- Do not turn the historical `openspec/changes/ondo-analytics/` material into new SDD artifacts as part of this plan.

## Product Requirements

### 1. Trustworthy Asset Catalog

The catalog is the foundation. Analytics must not be built on ambiguous rows.

| Requirement | Behavior | Acceptance criteria |
|---|---|---|
| Preserve source rows | Retain source row key, source line, raw display values, parser state, and validation errors. | A row with a missing or malformed field remains present and explainable. |
| Canonical identity | Store chain, full contract address, stable provider ID, and normalized identity when verified. | A join is allowed only with verified full identity or stable ID plus evidence. |
| Display identity | Keep the short address and display name for presentation, but never use them as enrichment keys. | Truncated values are marked `unresolved` or `candidate-display-only`. |
| Duplicate handling | Detect duplicate canonical IDs and duplicate displayed identifiers separately. | Duplicate display rows are visible as unresolved until a source proves whether they are the same asset. |
| Numeric semantics | Distinguish valid positive, valid zero, missing, malformed, and unresolved numeric fields. | `0` is shown only when the source explicitly reports zero; missing is shown as `N/D`. |
| Catalog as-of | Record when the raw catalog was retrieved or reviewed. | If the source has no date, the UI says `as-of unknown` and does not imply currentness. |
| Catalog quality | Publish row count, unresolved identities, missing fields, malformed fields, duplicate counts, and source status. | A user can inspect quality without reading repository code. |
| Safe external links | Validate schemes and use safe link attributes. | Invalid or absent URLs render as unavailable; no arbitrary protocol is emitted. |

### 2. Search, Filter, Sort, and Navigation

The current table is a useful base, but it must become a research navigation surface.

- Search by token name, symbol, full canonical address, displayed address, stable ID, and source URL where available.
- Normalize case, whitespace, punctuation, and common display formatting without changing the stored value.
- Filter by asset type, cohort, sector, geography, identity state, source status, freshness, metric availability, and `N/D` reason.
- Provide explicit `Unknown`, `Unresolved`, `Stale`, `Not applicable`, and `License blocked` states instead of hiding them.
- Keep sort behavior deterministic. Nulls must have a documented position and never be treated as zero.
- Show visible row count, total catalog count, active filters, and a clear reset action.
- Keep the selected filter/sort state shareable through URL query parameters or an equally inspectable state mechanism when routing is introduced.
- Provide a direct detail action from every row. Do not make the user copy a truncated contract to investigate an asset.
- Make empty, error, stale, and fallback states explain what the user can do next.

**Acceptance criteria:** A keyboard user can search, filter, sort, clear filters, and open a detail view. A screen-reader user receives the result count and active-state changes. The same input produces the same ordering in the browser and in any server-generated view.

### 3. Asset Detail and Comparison

#### Asset Detail

Each asset detail view or panel must contain:

- Display name, symbol, canonical identity state, chain, full address when permitted, and stable ID.
- Tokenized-asset identity and underlying identity as separate fields.
- Asset type, cohort, sector, geography, taxonomy version, confidence, and rationale when classified.
- Current observed values with units, currency, venue, retrieval time, and as-of time.
- Derived metrics with method version, input IDs, window, adjustment, and eligibility state.
- Source status, license status, stale status, and unresolved-field reasons.
- A clear informational disclaimer that the view is not investment advice.

#### Comparison

- Default to a compatible cohort and a single snapshot.
- Allow comparison only when identity, currency, period, calendar, venue, adjustment, and series identity are compatible.
- Show observed and derived values with separate labels.
- Show metric coverage and effective score weights when a score exists.
- Explain why an asset or metric is excluded instead of silently dropping it.
- Provide a compact mobile representation and a full desktop table without requiring horizontal scrolling for every essential decision.
- Keep global rank, market-cap order, and derived score as separate concepts.

**Current gap:** `src/components/ComparisonTable.astro` already has columns for many intended metrics, but `AnalyticsDashboard.astro` currently supplies only name, symbol, market cap, and holders. The implementation must wire real snapshot fields rather than fill the existing columns with placeholders.

### 4. Classifications and Dimensions

Classification is a comparability boundary, not decoration.

| Dimension | Requirement | Null and eligibility rule |
|---|---|---|
| Asset type | Use a versioned taxonomy with at least equities, equity ETFs, fixed income/treasuries, stablecoins/cash-like, and unknown. | Unknown remains a first-class group and cannot receive a guessed type. |
| Cohort | Define the exact compatible cohort used by each metric. | A metric returns unavailable or not applicable outside its supported cohort. |
| Sector | Document whether sector means issuer sector, primary underlying exposure, benchmark exposure, or another taxonomy. | Diversified ETFs may be `not applicable` to a single sector, not forced into one. |
| Geography | Document whether geography means issuer domicile, underlying revenue exposure, security domicile, or benchmark exposure. | Missing taxonomy or ambiguous exposure remains unavailable. |
| Classification source | Store source, taxonomy version, retrieval time, confidence, review status, and rationale. | Editorial assignments cannot appear as observed facts. |
| Classification changes | Version mappings and preserve previous snapshot values. | A reclassification is auditable and does not silently rewrite historical analysis. |

`src/data/analytics/classifications.ts` should remain the vocabulary boundary, but the data pipeline must supply verified classifications before non-unknown groups are presented as real cohorts.

### 5. Analytics and Metric Semantics

Every metric must be a typed value envelope with at least `value`, `status`, `availability`, `reason`, `provenance`, and metric semantics. A numeric value without its series identity, period, unit, and source is not a usable product fact.

| Metric family | Required implementation | Eligibility and null semantics |
|---|---|---|
| Returns | Provide 1-month, 3-month, 12-month, 1-year, and five-year CAGR where requested. Declare price return versus total return, distribution treatment, corporate-action treatment, currency, calendar, and series identity. | Require verified identity and sufficient history. Five-year CAGR is `insufficient-history` when coverage is shorter. Never substitute token history with underlying history silently. |
| Growth | For eligible equity cohorts, calculate revenue growth, EPS growth, or an explicitly approved fundamental measure using comparable issuer, currency, share-basis, restatement, and reporting-period semantics. | `not-applicable-cohort` for instruments without meaningful fields. `non-comparable-period` or `missing-value` when periods cannot be aligned. |
| Momentum | Expose component returns first, then any documented momentum score. Keep the 1-month, 3-month, and 12-month windows visible. | Require the same validated series and period semantics. Missing one component must not become zero. |
| Risk | Define annualized volatility, maximum drawdown, lookback, sampling calendar, return series, and treatment of stale or missing observations. | `stale-input`, `insufficient-history`, or `field-not-present` is shown as `N/D`, not as low risk. Lower-is-better direction must be explicit. |
| Quality | For eligible equities or approved cohorts, use source-backed profitability, balance-sheet strength, cash-flow, or other approved inputs with a documented method. | The current average in `metrics/quality.ts` is a candidate implementation, not a product policy. Return unavailable when required inputs are absent. |
| Value | Use an approved set such as PE, PB, or FCF yield with denominator, currency, period, and issuer semantics. | Do not call every asset cheap or expensive. Reject invalid denominators and mark non-applicable cohorts. |
| Liquidity | Keep token-market liquidity and underlying-market liquidity separate. Use verified volume, turnover, venue, time window, and currency. | Market cap and holders are not liquidity. Missing venue or series identity returns unavailable. |
| Composite score | Calculate only within a compatible cohort, with versioned factors, normalization, direction, missing-data policy, coverage, and effective weights. | Return `N/D` below the approved factor count or coverage threshold. Show original and effective weights and never label the result as objectively best. |

#### Required Value States

Use the existing vocabulary in `src/data/analytics/types.ts` as the starting contract:

- `observed`: copied from an approved source without calculation.
- `derived`: calculated from validated inputs and a versioned method.
- `editorial`: assigned by a human or curated taxonomy with rationale and confidence.
- `unavailable`: no valid result is present.
- `available`: the value is usable under its declared semantics.
- `stale`: the value exists but exceeds the approved freshness window.
- `not-applicable`: the metric does not apply to the cohort.
- `unresolved`: identity or mapping is not proven.
- `insufficient-history`: the time window cannot be computed.
- `source-error` or `license-blocked`: the pipeline cannot publish the value safely.

`N/D` is a display shorthand, not a data state. The UI must expose the underlying reason on demand.

### 6. Provenance, Freshness, Confidence, and Source Status

At snapshot level, retain:

- Schema version, snapshot ID, generated-at timestamp, catalog snapshot timestamp, and publication status.
- Source ID, provider, exact URL, API version, request metadata, response hash, fixture path, pagination, rate-limit observations, coverage, semantics, failure behavior, and licensing state.
- Field or metric source path, retrieved-at, as-of, method version, taxonomy version, input IDs, confidence, rationale, and review status.
- Quality counters for unresolved identities, unavailable fields, stale values, source failures, license blocks, and coverage by cohort and metric.

At UI level, expose:

- A global snapshot badge with generated time, catalog as-of time, and fallback/stale status.
- Per-field source and freshness details in a tooltip, disclosure panel, or detail section that remains keyboard accessible.
- A clear distinction between `source pending`, `source passed`, `source failed`, `catalog fallback`, and `snapshot stale`.
- Confidence only when the confidence definition and owner are known. Do not turn confidence into an unexplained percentage.

The source gate must fail closed. An HTTP success response is not enough; identity coverage, semantics, fixture replay, integrity hash, failure behavior, and redistribution permissions must also pass.

### 7. Responsive UX and Accessibility

- Preserve the useful existing responsive table behavior, but design detail and comparison views as mobile-first surfaces rather than wide desktop tables shrunk into a viewport.
- Use semantic headings, table headers, captions, `scope`, labeled form controls, and live result summaries.
- Implement tabs with complete keyboard behavior, `aria-controls`, a real associated panel, and an updated panel when selection changes. The current buttons only update class and data attributes.
- Never use color alone for observed, derived, stale, unavailable, or blocked status. Include text and accessible labels.
- Keep focus visible and predictable after opening a detail view, changing filters, or closing a dialog.
- Ensure truncated identifiers have an accessible full-value mechanism and a copy action only when the canonical value is verified.
- Test at narrow mobile widths, zoom, reduced motion, keyboard-only navigation, and screen-reader landmarks.
- Keep the app language declaration, visible copy, number formats, date formats, and accessibility text aligned with the owner-approved audience language. The current `lang="es"` and Spanish copy must not be mixed casually with new English UI text.
- Treat remote font loading and external links as resilience concerns; the page must remain readable if the font provider is unavailable.

## Technical Work Required

### Build and Repository Integrity

- Reconcile the staged ETF-to-Ondo migration before adding product behavior. Verify that every import points to a file that exists in the intended final tree.
- Resolve the `Sidebar.astro` logo import versus the staged deletion under `yo/`. Move or restore the asset only through an intentional repository decision; do not hide the issue with a build-specific workaround.
- Establish a clean baseline with `npm ci`, a reproducible static build, and a documented Node/npm version policy.
- Add explicit scripts for type checking, unit/data tests, browser tests, lint/format checks if selected, and release validation.
- Keep generated snapshots and audit artifacts separate from hand-authored source. Do not allow a local runtime artifact to become an accidental production input.

### Domain and Data Contracts

- Evolve `src/data/analytics/types.ts` into the authoritative contract for identity, catalog rows, classifications, observations, series, metrics, provenance, quality, and snapshots.
- Keep raw catalog, canonical identity, underlying identity, classification, current market data, historical series, derived analytics, and editorial data as separate layers.
- Require stable identifiers and evidence before joins. Add explicit conflict states instead of selecting a winner silently.
- Make missing and malformed fields lossless through `src/data/analytics/catalogParser.mjs` and `src/data/analytics/catalogAdapter.ts`.
- Define JSON schema or equivalent runtime validation for candidate snapshots, manifests, pointers, and asset records.
- Avoid broad `any` boundaries in production data contracts. Keep provider-specific shapes inside adapters and map them into the normalized model.

### Ingestion and Provider Adapters

- Verify each candidate endpoint in `data/ondo/verification/manifest.json` with real evidence before writing an adapter around its guessed fields.
- Capture exact request, response status, redacted replayable fixture, response hash, pagination, rate limits, semantics, coverage, failure behavior, and licensing evidence.
- Implement the missing allowlisted provider modules under `scripts/ondo/providers/` only after their source records can pass the gate.
- Separate catalog/metadata, current market data, historical series, fundamentals, classifications, and cross-check providers. Do not let one adapter claim fields it does not supply.
- Use bounded timeouts, retries only for documented retryable failures, backoff, response-size limits, schema validation, and deterministic error categories.
- Keep secrets in the update environment. Never serialize credentials into static JSON, fixtures, client bundles, logs, or source control.
- Use PWM/Perplexity or similar research tools only for source discovery, unresolved mapping review, and editorial support. Never use model prose as the production numeric source.

### Snapshot Publication and Rollback

- Add a complete update command that fetches permitted data, validates source gates, normalizes records, resolves identities, applies classifications, calculates metrics, produces a quality report, and stages a candidate snapshot.
- Publish immutable snapshot files and a small `current` pointer. Preserve a valid `previous` pointer and a manifest that hashes every referenced artifact.
- Use the existing path containment, hash, manifest, and atomic rename primitives in `src/data/ondoAnalytics.ts` and `scripts/ondo/update.mjs`, but cover them with real tests and an operational command.
- Reject candidates with duplicate canonical IDs, invalid dates, impossible values, mixed series identity, stale required inputs, incomplete source evidence, policy-hash mismatch, or license failure.
- Publish only after all candidate checks pass. If publication fails, leave `current` and `previous` unchanged or restore them atomically.
- Make the build consume exactly one immutable snapshot. Do not mix fields from different generation times without recording the merge.
- Keep the catalog fallback deterministic and visibly degraded. A fallback is a resilience behavior, not an analytics success state.

### Analytics Calculation and Scoring

- Create an orchestration layer that maps normalized snapshot inputs to the metric modules in `src/data/analytics/metrics/`.
- Validate identity, cohort, currency, period, venue, calendar, adjustment, distribution treatment, corporate-action treatment, and freshness before calculation.
- Store calculation method versions and input IDs with every derived result.
- Calculate raw components before normalized scores so users can inspect the evidence behind a factor.
- Normalize only within an approved compatible cohort. Handle ties, small cohorts, missing values, outliers, and zero spans deterministically.
- Move score weights and minimum coverage from implicit code configuration to an owner-approved, versioned policy artifact.
- Treat quality, growth, value, and liquidity as cohort-specific. Do not use a generic formula to make unrelated products comparable.
- Add golden fixtures for valid series, insufficient history, identity conflict, incompatible semantics, stale input, not-applicable cohort, malformed denominator, and source error.

### UI State and Data Wiring

- Make the page consume a typed view model derived from one snapshot instead of independently reading catalog and analytics fields.
- Replace the current server-selected `activeGroup` plus CSS-only button state with real cohort state that updates the comparison rows, summary, URL state if selected, and accessibility panel state.
- Show classification coverage and `Unknown` as real data, not as an empty placeholder block.
- Connect `ComparisonTable` to actual metric envelopes. Do not render a metric column unless the row contains its value, status, semantics, and reason.
- Add detail navigation from `OndoTable` and a reusable provenance disclosure component.
- Add quality and fallback views that explain what remains usable when enrichment is unavailable.
- Keep the static architecture for the first release. If runtime data is later introduced, isolate it behind a server boundary with explicit caching, rate-limit, secret, and stale-data behavior.

### Validation and Testing

- Add parser tests for row count, source line, valid zero, missing value, malformed value, duplicate display, truncated identity, invalid rank, URL safety, and missing catalog source.
- Add contract tests for snapshot schema, source gate, fixture hash, pointer integrity, path traversal rejection, stale fallback, duplicate canonical IDs, and current/previous rollback.
- Add metric tests for all eligibility and null reasons in the metric table above.
- Add integration tests that build a candidate snapshot and verify that the page consumes the expected snapshot ID and quality state.
- Configure browser smoke tests for search, sort, filtering, active cohort, detail, comparison, empty state, fallback state, responsive layout, keyboard operation, and accessible status text.
- Add a type-checking step that validates Astro components and data modules. A static build must not be the only compiler signal.
- Keep fixture inputs deterministic and redacted. Include hashes and expected outputs in version control.

### CI, Deployment, and Operations

- Add a CI workflow under `.github/workflows/` or the chosen CI system for install, type check, unit/data tests, fixture checks, build, browser smoke, and artifact inspection.
- Separate a scheduled data-update job from the application build. The update job must produce an auditable candidate and fail closed.
- Deploy the static output only after snapshot validation and build checks pass.
- Record snapshot ID, source statuses, row counts, coverage, build commit, and publication time in CI artifacts or an operational log.
- Define how to roll back both application code and data snapshot independently.
- Add a stale/fallback alert or at least a visible release health report before promising a refresh cadence.
- Document local reproduction of an update using redacted fixtures without requiring provider credentials.
- Choose a deployment target and retention policy for immutable snapshots, previous snapshots, fixtures, and audit records.

### Security and Resilience

- Keep API keys, cookies, and provider credentials out of the browser, repository, fixtures, and logs.
- Retain the current path-containment and safe-URL checks, then test them against absolute paths, traversal, symlinks, invalid schemes, and malformed JSON.
- Restrict dynamic provider loading to an explicit allowlist and ensure unverified manifest content cannot select arbitrary modules.
- Treat all provider data as untrusted input. Validate types, lengths, dates, numeric ranges, identifiers, and URL schemes before publication.
- Fail closed on source verification, license status, identity conflict, policy mismatch, hash mismatch, stale required input, and publication failure.
- Bound update resource usage and handle provider outages without deleting the last valid snapshot.
- Avoid claims of real-time data unless architecture, licensing, monitoring, and user-visible freshness can support that claim.

## Prioritized Backlog

P0 is the minimum path to a trustworthy useful release. Dependencies are intentional: analytics tasks must not begin by bypassing catalog identity and provenance.

### P0: Minimum Trustworthy Useful Release

| ID | Work item | Dependencies | Likely affected paths | Acceptance criteria |
|---|---|---|---|---|
| P0-1 | Reconcile the staged migration and make the repository buildable. | None | `package.json`, `astro.config.mjs`, `src/components/Sidebar.astro`, staged `yo/` logo path, old ETF deletions | The intended migration has no missing imports; a clean install and static build complete from the reconciled tree. No unrelated staged work is discarded. |
| P0-2 | Freeze the normalized catalog and snapshot contracts. | P0-1 | `src/data/analytics/types.ts`, `src/data/analytics/catalogParser.mjs`, `src/data/analytics/catalogAdapter.ts`, `src/data/ondoAssets.ts` | Contracts represent raw, canonical, unresolved, observed, derived, editorial, and unavailable states. Missing values never become zero, and provider-specific fields do not leak into UI types. |
| P0-3 | Resolve canonical identity or publish explicit unresolved state. | P0-2; authoritative catalog/metadata evidence | `ontonew.md`, `src/data/analytics/catalogParser.mjs`, `src/data/ondoAssets.ts`, `data/ondo/verification/` | All 439 raw rows are retained; each has a stable identity or an explicit unresolved reason. Truncated addresses and repeated display values cannot drive enrichment. |
| P0-4 | Verify one permitted provider path and implement its adapter. | P0-2, P0-3; owner decision on source/licensing | `data/ondo/verification/manifest.json`, `data/ondo/verification/fixtures/`, `scripts/ondo/providers/` | At least one source has replayable redacted evidence, matching hash, verified semantics and coverage, documented failure behavior, and approved redistribution/static-artifact permissions. If no source qualifies, the product remains visibly catalog-only. |
| P0-5 | Publish a versioned snapshot with safe fallback and rollback. | P0-3, P0-4 | `scripts/ondo/update.mjs`, new update entry point, `src/data/generated/ondo/`, `src/data/ondoAnalytics.ts`, `package.json` | Candidate validation, immutable artifacts, `current`/`previous` pointers, hash verification, stale rejection, and atomic rollback work from fixtures. Invalid candidates cannot replace a valid current snapshot. |
| P0-6 | Make the catalog a useful research navigator. | P0-2, P0-3, P0-5 | `src/components/OndoTable.astro`, `src/components/Sidebar.astro`, `src/pages/index.astro`, new detail view/component | Search, sort, cohort/data-quality filters, result counts, empty states, detail navigation, and snapshot quality status work with real row state. |
| P0-7 | Deliver one verified, cohort-limited analytical slice. | P0-4, P0-5, approved metric policy | `src/data/analytics/metrics/returns.ts`, `momentum.ts`, `risk.ts`, `src/data/analytics/eligibility.ts`, `AnalyticsDashboard.astro`, `ComparisonTable.astro` | A bounded cohort shows at least one approved observed or derived comparison metric with source, as-of, method, eligibility, and coverage. Assets without valid history show a reasoned `N/D`; no global score is required. |
| P0-8 | Add release gates and focused browser verification. | P0-1 through P0-7 | `package.json`, new test paths, `data/ondo/fixtures/`, CI workflow | Data validation, type checking, unit/contract tests, build, and browser smoke checks run in one repeatable command path. The checks cover fallback, source blocking, mobile layout, keyboard interaction, and provenance visibility. |

### P1: Product Depth and Operational Confidence

| ID | Work item | Dependencies | Likely affected paths | Acceptance criteria |
|---|---|---|---|---|
| P1-1 | Expand verified classifications and dimension filters. | P0-4, P0-5; taxonomy decision | `src/data/analytics/classifications.ts`, snapshot schema, UI filters | Type, sector, and geography coverage is reported by cohort; unknown and not-applicable remain distinct; every editorial mapping has provenance and confidence. |
| P1-2 | Build complete detail and multi-asset comparison flows. | P0-6, P0-7 | `src/pages/`, new detail/comparison components, `OndoTable.astro`, `ComparisonTable.astro` | Users can select compatible assets, inspect the same snapshot, see metric reasons, and share or reproduce the view. |
| P1-3 | Add approved growth, quality, value, and separate token/underlying liquidity analytics. | P0-7; fundamentals provider and policy | `src/data/analytics/metrics/fundamentals.ts`, `quality.ts`, `value.ts`, `liquidity.ts`, scoring policy | Each metric has cohort eligibility, source-backed inputs, method version, null semantics, and tests for invalid denominators, stale inputs, and non-applicable cohorts. |
| P1-4 | Automate scheduled updates, deployment, monitoring, and rollback. | P0-5, P0-8; deployment decision | new CI/workflow files, `scripts/ondo/`, snapshot storage, operations docs | A scheduled run produces an auditable candidate, deploys only after gates pass, retains previous data, and exposes stale/fallback health. |
| P1-5 | Complete accessibility and responsive hardening. | P0-6, P1-2 | `src/layouts/Base.astro`, UI components, Playwright config/tests | Keyboard, screen-reader, zoom, mobile, reduced-motion, focus, table, tab, dialog, and status-state checks pass. |
| P1-6 | Introduce an owner-approved composite score, if still needed. | P1-3; scoring policy decision | `src/data/analytics/score.ts`, snapshot schema, comparison UI | Score is cohort-relative, coverage-gated, method-versioned, explainable, and clearly labeled as a methodology output rather than advice. |

### P2: Optional Expansion

| ID | Work item | Dependencies | Acceptance criteria |
|---|---|---|---|
| P2-1 | Historical charts and exportable evidence views. | P1-2, verified historical licensing | Charts identify series, period, adjustment, source, and missing intervals; exports contain provenance and snapshot ID. |
| P2-2 | Watchlists, saved comparisons, and alerts. | P1-4; audience and privacy decisions | Personal state does not change the public snapshot, and alerts explain the source and threshold that triggered them. |
| P2-3 | Runtime freshness or API access. | P1-4; explicit static-versus-runtime decision | Runtime access has authentication, rate-limit, cache, stale, secret, availability, and licensing controls; it is not added only because static updates feel inconvenient. |
| P2-4 | Broader asset coverage and cross-source reconciliation. | P1-1, P1-3 | Additional providers improve coverage without weakening identity, semantics, license, or source-priority rules. |

## Phased Roadmap

| Phase | Goal | Sequence | Exit gate |
|---|---|---|---|
| Phase 0: Stabilize | Stop the repository from making false release promises. | Reconcile staged migration, resolve missing logo import, document the actual baseline, add minimal build/type/test commands. | The intended tree builds and the team knows which files are migration context versus product source. |
| Phase 1: Trust the catalog | Make the current 439-row universe lossless and identity-aware. | Freeze contracts, preserve parser states, obtain canonical IDs/full addresses, expose quality and as-of state, keep unknowns visible. | No enrichment join relies on truncated display values; every row has an explicit identity/data-quality state. |
| Phase 2: Publish one safe snapshot | Establish reproducible data operations. | Verify one provider and license, implement adapter, normalize, calculate only approved fields, validate, publish immutable `current`/`previous`, expose fallback. | A fixture-replayed update and rollback pass; a failed source cannot publish. |
| Phase 3: Deliver the first analytical workflow | Turn the catalog into a useful research tool. | Add filters, detail/evidence view, compatible comparison, and one bounded metric slice such as validated returns/momentum. | A target user can find, verify, compare, and explain at least one cohort without seeing fabricated values. |
| Phase 4: Expand breadth safely | Add classifications and additional metric families. | Add taxonomy, growth, quality, value, risk, and separate liquidity only as their sources and policies become valid. | Coverage and eligibility are visible by cohort; each new family has tests and provenance. |
| Phase 5: Operate and extend | Make the product maintainable and optionally personalized. | Schedule updates, deploy, monitor, retain snapshots, improve accessibility, then consider charts, exports, watchlists, or runtime data. | Owners can diagnose a stale or failed release and roll back without code improvisation. |

The ordering is deliberate: do not build polished analytics on top of unverified identity, unlicensed data, or an unversioned snapshot.

## Definition of Done

### Product

- [ ] A target user can discover an asset, verify what it represents, compare it with compatible assets, and understand the result.
- [ ] The page states what the data can and cannot support.
- [ ] Unknown, unresolved, stale, unavailable, and not-applicable states are visible and actionable.
- [ ] No UI copy implies investment advice, guaranteed performance, or objective best-asset status.
- [ ] Detail and comparison views show snapshot ID and evidence context.

### Data

- [ ] Raw catalog rows are retained with source keys and parse states.
- [ ] Canonical identity is proven or explicitly unresolved.
- [ ] Token and underlying identities and series are separate.
- [ ] Every observed field has source, retrieval time, and as-of semantics where available.
- [ ] Every derived field has input IDs, method version, eligibility, and missing reason when invalid.
- [ ] Classifications carry taxonomy version, confidence, source, and review status.
- [ ] Source and license gates pass before data is published.
- [ ] The snapshot has schema version, snapshot ID, quality counters, hashes, and rollback pointers.

### Code

- [ ] The staged migration has no missing imports or accidental old ETF dependencies.
- [ ] Provider-specific shapes are isolated behind adapters.
- [ ] UI components consume typed view models rather than unvalidated provider payloads.
- [ ] No missing value is coerced to numeric zero.
- [ ] No score or metric policy is enabled without an owner-approved version.
- [ ] Path, URL, module-loading, and JSON validation boundaries are covered by tests.

### Testing

- [ ] Parser and contract tests cover valid, zero, missing, malformed, duplicate, truncated, and unresolved rows.
- [ ] Metric tests cover identity, cohort, semantics, freshness, history, denominator, and source failures.
- [ ] Publication tests cover hashes, pointer integrity, atomic replacement, rollback, path traversal, and invalid candidates.
- [ ] A clean install, type check, data validation, build, and browser smoke path runs repeatably.
- [ ] Fixtures are redacted, deterministic, replayable, and hash-checked.
- [ ] No completion claim relies only on a manual visual check.

### Accessibility and UX

- [ ] Search, filters, tabs, detail views, comparison, reset, empty states, and disclosures work by keyboard.
- [ ] Focus, labels, headings, table semantics, live result counts, and status text are accessible.
- [ ] Status is not conveyed by color alone.
- [ ] Mobile layouts expose essential information without forcing the user to decode a wide table.
- [ ] Text, language declaration, number formats, dates, and accessible names are consistent.
- [ ] Reduced motion, zoom, contrast, and font-loading failure are acceptable.

### Operations

- [ ] CI validates data, code, UI, and build before deployment.
- [ ] Scheduled updates record source status, snapshot ID, coverage, and publication result.
- [ ] Failed or stale updates preserve the last valid snapshot and surface the degraded state.
- [ ] Application and data rollback procedures are documented and tested.
- [ ] Secrets are managed outside the static artifact and logs.
- [ ] Source licensing and retention obligations are recorded with the release process.

## Open Decisions and Risks

### Decisions Requiring Owner Input

| Decision | Why it matters | Current state | Required output |
|---|---|---|---|
| Data sources and licensing | Historical, fundamental, and market data may be paywalled, rate-limited, or non-redistributable. | All five manifest records are pending. | Approve provider(s), permitted fields, redistribution rights, attribution, retention, and source-priority rules. |
| Refresh cadence | Freshness requirements determine provider cost, architecture, and alerting. | `ontonew.md` has no as-of date and no scheduler exists. | Define catalog, current-market, historical, classification, and fundamentals cadences separately. |
| Static versus runtime architecture | Static is safer for secrets and reproducibility; runtime can improve freshness but adds availability and security risk. | The app is static today. | Approve static build-time first release or a documented runtime boundary and its operational guarantees. |
| Target audience and language | It controls vocabulary, detail depth, localization, and disclaimers. | Existing UI is Spanish; audience is not formalized. | Choose primary audience, language, locale, currency, date format, and translation policy. |
| Canonical identity source | Truncated display addresses cannot support joins. | Current raw catalog is display-only for identity purposes. | Select the authority for full addresses, chain, stable IDs, and conflict resolution. |
| Classification taxonomy | Sector and geography have multiple valid meanings. | Current dimensions are empty and unverified. | Choose taxonomy and whether it describes issuer, underlying exposure, benchmark, domicile, or revenue exposure. |
| Return definition | Price return and total return answer different questions. | `returns.ts` proposes total-return semantics but no provider is approved. | Approve series, distribution, corporate-action, calendar, currency, and window policy. |
| Metric eligibility | Quality, growth, value, risk, and liquidity are not universal. | Metric modules contain candidate rules. | Approve cohort matrix, required fields, minimum history, and unavailable reasons. |
| Scoring policy | Weights and missing-data policy can create false authority. | `score.ts` contains candidate configuration only. | Decide whether to show a score, its factor weights, minimum coverage, normalization, and disclosure. |
| Deployment and retention | Snapshot rollback and licensing depend on storage and hosting. | No deployment configuration was found. | Select deployment target, artifact retention, rollback authority, and operational owner. |

### Principal Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Truncated or duplicate identities | Wrong asset joins and false analytics. | Require canonical source evidence; keep unresolved rows out of enrichment. |
| Unverified provider or licensing | Legal and factual trust failure. | Fail-closed source gate with replayable evidence and explicit permission. |
| Stale or mixed snapshots | Users compare values from different dates. | Versioned immutable snapshots, generated/as-of fields, freshness checks, and visible fallback. |
| Token and underlying confusion | Liquidity, returns, and risk are attributed to the wrong instrument. | Separate series identities and require semantic compatibility. |
| Arbitrary score weights | A methodology output is mistaken for objective advice. | Owner-approved policy, cohort-relative scoring, coverage display, and no score until valid. |
| Staged migration breakage | The application cannot build or deploy. | Reconcile imports and deleted assets before feature work; add clean-install CI. |
| Provider outage or schema drift | Update fails or silently corrupts fields. | Adapter schema validation, bounded retries, fixture replay, previous snapshot retention, and fail-closed publication. |
| Misleading null handling | Missing data looks like zero or low risk. | Typed value envelopes, explicit reason codes, and tests for every null state. |
| Accessibility regression | Users cannot operate or interpret the dashboard. | Semantic components, keyboard/browser tests, non-color status, and mobile verification. |
| Scope expansion | Effort shifts to charts or accounts before trust exists. | Keep P0 gates explicit and defer P1/P2 work until the roadmap exit criteria pass. |

## Suggested First Implementation Slice

### Slice Objective

Deliver a **build-safe, trustworthy catalog foundation with visible data quality**, without pretending that provider analytics are already available. This is the smallest coherent slice because it fixes the release blocker, preserves all current catalog evidence, and creates the contract that every later metric depends on.

### Exact Files Likely Involved

- `src/components/Sidebar.astro` and the intentionally selected replacement or restored logo asset path.
- `src/pages/index.astro` and `src/components/OndoTable.astro` for snapshot status, row quality, filters, and detail entry points.
- `src/data/ondoAssets.ts` for catalog loading, quality counters, and source metadata.
- `src/data/analytics/catalogParser.mjs` and `src/data/analytics/catalogAdapter.ts` for lossless row and identity states.
- `src/data/analytics/types.ts` for the first stable catalog/value contracts.
- `src/data/ondoAnalytics.ts` for explicit fallback, freshness, and snapshot quality presentation.
- `data/ondo/fixtures/catalog-parser-cases.json` and new focused test paths for parser and contract behavior.
- `package.json` for repeatable validation/build commands, without adding a provider or claiming analytics coverage.

### Implementation Steps

1. Reconcile the staged logo deletion/import and confirm the intended ETF-to-Ondo file tree.
2. Freeze the catalog row contract: raw row key, source line, display fields, numeric parse state, identity state, row status, and validation errors.
3. Keep all 439 raw rows in the model. Mark all truncated display addresses unresolved until a canonical identity source is approved; do not manufacture full addresses.
4. Add a user-visible catalog-quality panel with row count, unresolved identity count, missing/malformed field counts, duplicate-display count, source path, and `as-of unknown` state.
5. Make search and sort state report null ordering and source-quality state; add a clear detail entry point even if the first detail view is a static disclosure panel.
6. Keep analytics sections explicitly in `catalog-fallback` state. Do not activate classification, returns, risk, quality, value, liquidity, or score values from guessed inputs.
7. Add focused automated checks for parsing, fallback, build integrity, and accessible catalog interaction.

### Verification Steps

After implementation, the team should verify all of the following:

- `npm ci` succeeds from the reconciled repository.
- `npm run build` succeeds without resolving a deleted asset or relying on an untracked local file.
- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` passes and reports the expected valid-zero, missing, malformed, and duplicate-display cases.
- `npm run data:publication` passes its source-gate safety checks while still reporting providers as disabled/pending until real evidence is approved.
- New parser/contract tests confirm 439 raw rows are retained, no truncated identity is enriched, and missing values remain `N/D` rather than zero.
- Browser verification confirms search, sort, result count, empty state, keyboard operation, mobile layout, and quality/fallback messaging.
- A final repository status check confirms that only the requested implementation files changed for this slice; historical SDD files remain untouched unless a separate, explicitly authorized task says otherwise.

This first slice should be reviewed as a product foundation, not as completion of analytics. The next slice begins only after an owner-approved source, identity policy, and licensing evidence are available.

## Verification Boundary for This Plan

- The repository was inspected read-only, including the current staged migration state, source files, manifest, fixtures, and file presence.
- The 439-row count and identity/display observations were checked with the repository's current catalog parser.
- No application build, test suite, provider request, or deployment was executed during this documentation-only pass.
- This document therefore records verified repository facts and implementation requirements; it does not claim that the current application builds, that any provider endpoint works, or that any analytics result is currently valid.
