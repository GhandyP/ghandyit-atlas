# Ondo Analytics: Evidence-Aware Cohort Comparison

## Intent

Turn the current static Ondo asset catalog into an evidence-aware analytics experience without changing the product's static Astro architecture. Users should be able to compare assets inside compatible asset-type cohorts, inspect performance and fundamental dimensions when they are valid, and understand exactly where each value came from or why it is unavailable.

This proposal is based on the completed product question round. The primary product decision is **cohort comparison, not a misleading global ranking**. The first slice must preserve analytical honesty over coverage: an unsupported or unverified metric is shown as `N/D` with a reason and provenance, never as zero, an estimate, or an inferred fact.

## Problem and target workflow

The current dashboard is useful as a catalog, but it does not support a defensible investment-research workflow. A user who wants to compare Ondo assets must currently search and sort a flat list containing rank, name, symbol, market cap, holders, contract, and website. That list does not answer:

- Which assets are comparable to one another?
- Which asset types, sectors, industries, geographies, or markets are represented?
- Which assets have valid one-year or five-year total-return history?
- Are growth, earnings, profitability, financial strength, momentum, risk, liquidity, or value measurements actually available?
- Is a displayed rank observed from a source or derived by this product?
- How fresh is a value, and what should the user conclude when the data is incomplete?

### Target workflow

1. The user opens the static dashboard and sees primary blocks grouped by verified asset type, including an explicit `Unknown`/unclassified block.
2. The user selects an asset-type block, then optionally filters by sector/industry and geography/market. Filters must only expose classifications supported by the snapshot's taxonomy and provenance.
3. The user optionally applies factor filters for growth, value, quality, momentum, risk, or liquidity.
4. The comparison view defaults to the selected compatible cohort. It shows observed catalog fields, eligible total-return windows, fundamental dimensions, factor metrics, data freshness, and source status.
5. The user can inspect separate factor metrics and a configurable composite score. The score displays its weights, coverage, methodology version, and cohort scope.
6. If a metric cannot be trusted, the UI shows `N/D` and a concise reason such as insufficient history, unavailable source, stale input, unresolved identity, or not applicable to the cohort.

Existing user-facing UI copy remains Spanish. This proposal and generated technical artifacts are in English.

## Current-state gap

The repository is a static Astro site. The current data path parses `ontonew.md` at build time and exposes only catalog fields. The exploration found 439 raw rows and 437 unique assets after the recorded deduplication, with truncated displayed identity values, no embedded as-of timestamp, and no analytical dataset. The current UI has no analytical blocks, provenance display, historical series, classification model, data-quality state, or composite methodology.

The current snapshot therefore cannot safely support annual or five-year returns, revenue/EPS growth, profitability, financial strength, value, momentum, risk, liquidity, or composite ranking. In particular:

- Truncated contracts and names are unsafe external join keys.
- Market cap and holder count are not liquidity measures.
- A token symbol suffix is not proof of the underlying ticker.
- Price history for the Ondo token and history for the underlying instrument are different series.
- The existing flat rank mixes incompatible instruments and can imply a false notion of "best".
- There is no update boundary that can fetch, validate, timestamp, and roll back enriched data reproducibly.

## Product outcome and UX behavior

The first release should feel like a transparent research dashboard rather than an opaque ranking page:

- **Primary navigation:** asset-type blocks/cohorts.
- **Secondary navigation:** sector/industry and geography/market filters, subject to taxonomy coverage.
- **Additional factor filters:** growth, value, quality, momentum, risk, and liquidity.
- **Comparison default:** same compatible cohort, same snapshot, and compatible metric definitions. The user must explicitly change cohort before comparing across blocks.
- **Observed versus derived:** observed source values, derived metrics, editorial classifications, and unavailable values are visually and semantically distinct.
- **Provenance:** each metric exposes source, retrieval/as-of time, and method/version where relevant. A data-quality summary exposes coverage, stale sources, unresolved identities, and failed fields.
- **Unavailable state:** `N/D` is rendered with a reason. `N/D` is not treated as zero and cannot silently enter a score.
- **Ranking language:** observed rankings such as market cap and holders are separate from derived factor rankings. Composite scores are cohort-relative and must not be described as objective quality, financial advice, or a global ranking.

## Scope of the first product slice

### Included asset-type blocks

The initial block model will explicitly support these cohorts, with an `Other/Unknown` fallback:

1. **Equities** — single-company equity exposures.
2. **Equity ETFs** — diversified equity funds; sector/geography describe the underlying exposure or benchmark, not the fund issuer's business sector.
3. **Fixed income / Treasuries** — bonds, treasury instruments, and fixed-income funds where the source supports the required definitions.
4. **Stablecoins / cash-like** — instruments whose return, risk, and fundamental dimensions are not assumed to be equity-like.
5. **Other / Unknown** — assets that cannot yet be assigned to a supported cohort with verified evidence.

Crypto-related companies may remain within the equities cohort and use sector/industry classification when verified; they do not create a separate cross-cohort ranking in this slice. The precise mapping taxonomy and treatment of hybrid products remain decision gaps for specification.

### Included classification and factor dimensions

- Asset type as the primary grouping.
- Sector and industry as secondary classifications where a defined taxonomy and source exist.
- Geography and market as secondary classifications, distinguishing issuer domicile, listing market, and underlying exposure where applicable.
- **Growth:** revenue growth and EPS/earnings growth where meaningful and source-backed.
- **Value:** verified valuation measures appropriate to the cohort, such as P/E, P/B, or free-cash-flow yield for eligible equity instruments; no value score where the metric is not meaningful or unavailable.
- **Quality:** profitability and financial-strength measures for eligible cohorts.
- **Momentum:** documented trailing return windows derived from a valid series.
- **Risk:** documented volatility and drawdown or other approved risk metrics derived from a valid series.
- **Liquidity:** verified volume/turnover over a declared window, with tokenized-market liquidity distinguished from underlying-market liquidity.
- **Performance:** one-year and five-year **total return** windows when valid. The product must not silently substitute price return for total return.

The first slice includes the data model, validation states, UI states, and comparison boundaries needed for these dimensions. It does not require every asset to have every dimension.

## Data-source and provenance policy

### Source hierarchy

1. Use an authoritative, stable, and legally redistributable production source for numeric data.
2. Treat the Ondo available-assets, metadata, price/volume, and API-overview documentation as candidate primary sources until endpoint verification passes.
3. Use Perplexity/PWM for source discovery, validation leads, and unresolved identity or classification research. PWM/Perplexity prose is not the production numeric source.
4. Use DIA or another secondary source only as a cross-check after the chain, full contract address, and asset identity have been positively reconciled. A matching-looking URL is not sufficient evidence.
5. Record observed values separately from derived analytics and editorial classifications.

Each generated snapshot must include a schema version, generation time, catalog snapshot time, source records, and field-level provenance. A metric record must identify at least its status (`observed`, `derived`, `editorial`, or `unavailable`), source, retrieval time, and method version when derived. Editorial classifications must additionally record taxonomy/version, rationale, confidence, and review status.

### Concrete endpoint verification gate

No implementation may depend on guessed endpoint fields or unverified licensing. Before the ingestion implementation is approved, produce a verification record for each candidate below:

- Ondo available assets: `https://docs.ondo.finance/ondo-global-markets/available-assets`
- Ondo metadata for all supported assets: `https://docs.ondo.finance/api-reference/assets/get-metadata-for-all-supported-assets`
- Ondo price and volume for all supported tickers: `https://docs.ondo.finance/api-reference/tickers/get-price-and-volume-data-for-all-supported-tickers`
- Ondo API overview: `https://docs.ondo.finance/api-reference/overview`
- DIA cross-check candidate: `https://www.diadata.org/app/price/asset/Ethereum/0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3/`

For every endpoint or cross-check, the record must capture:

- retrieval date/time, exact URL and API version, request parameters, and authentication requirement;
- HTTP status, a redacted representative response, pagination and maximum page size;
- rate-limit headers, retry behavior, and documented error responses;
- chain/address coverage, stable IDs, full-address availability, duplicate behavior, and whether fields are current or historical;
- whether price/volume describes the Ondo token, a supported ticker, or the underlying instrument;
- historical depth, adjusted/distribution treatment, corporate-action handling, currency, calendar, and total-return semantics;
- fundamental field definitions, reporting periods, restatement behavior, and taxonomy definitions where applicable;
- licensing and redistribution terms for a checked-in generated static snapshot; and
- a replayable fixture or redacted audit sample sufficient to validate the normalization contract without live network access.

The gate passes only when identity, field semantics, coverage, licensing, pagination, and failure behavior are documented and a representative response validates the proposed schema. Any unresolved item blocks production use of that endpoint and leaves the affected metric `N/D`.

## Compatible cohorts and metric eligibility

Comparisons and scores are evaluated only within a compatible cohort. Compatibility is based on verified asset type, instrument identity, metric meaning, currency/period rules, and the same snapshot methodology. The product must not create one pooled score for equities, equity ETFs, fixed income, stablecoins/cash-like products, and unknown assets.

### Common eligibility rules

A metric is eligible only when:

- the asset has a canonical identity with full address, chain, and stable source ID where required;
- the source is verified and permitted for the generated artifact;
- the value has a retrieval/as-of timestamp and passes schema and plausibility validation;
- the time series or fundamental periods meet the metric's minimum coverage and continuity requirements;
- currency, adjustment, calendar, and instrument identity are known; and
- the metric is meaningful for that cohort.

If a requirement fails, the metric is `N/D` with a reason and is excluded from any dependent factor or composite score.

### Total return: one-year and five-year

- Use an adjusted or explicitly total-return series with distributions and corporate actions handled consistently.
- One-year total return requires a valid current endpoint and a valid observation at least one year earlier for the same instrument identity, subject to the approved tolerance and continuity rules in the specification.
- Five-year total return requires at least five years of valid history for the same identity and is presented as the approved five-year total-return measure, such as CAGR, with the formula and period visible in the method version.
- Do not calculate a five-year value from shorter history, interpolate missing endpoints, or silently use the underlying series for an Ondo token.
- If an underlying series is used as an explicitly approved proxy, label it as underlying performance, show the mapping source/confidence, and keep it separate from tokenized price and liquidity metrics.
- For stablecoins/cash-like instruments and products without a meaningful or licensed total-return definition, show `N/D — not applicable` rather than forcing an equity-style return.

### Revenue and EPS/earnings growth

- Revenue growth and EPS/earnings growth apply primarily to single-company equities when reporting periods, currency, share basis, and issuer identity are verified.
- Equity ETFs may expose portfolio-level fundamental aggregates only if the provider defines the aggregation and its as-of date; issuer revenue must not be presented as fund exposure growth.
- Use comparable reporting periods and a documented one-year/five-year or approved period-over-period methodology. Do not mix fiscal periods, restated and unrevised values, or diluted and basic EPS without labeling.
- Missing filings, short history, non-comparable periods, or non-equity instruments produce `N/D` and a reason.

### Profitability and financial strength

- Profitability may include verified margins, ROA/ROE, or cash-flow profitability measures, but the displayed components and cohort applicability must be explicit.
- Financial strength may include verified leverage, liquidity/coverage ratios, balance-sheet measures, or an appropriate credit-quality measure for fixed-income products. Equity and fixed-income definitions need not be identical and must not be pooled as if they were.
- A quality factor is eligible only when the required profitability and financial-strength inputs are present, current enough for the declared freshness policy, and comparable within the cohort.
- Stablecoins/cash-like and unknown assets are not assigned equity quality metrics by analogy.

### Value

- Value is eligible only for cohorts with meaningful, verified valuation inputs and a declared as-of date.
- The first implementation may use a configured subset of P/E, P/B, and free-cash-flow yield for equities and equity ETFs where the provider defines the denominator and aggregation.
- Negative, zero, incomparable, or missing denominators produce `N/D`; the product must not invert an invalid ratio or infer value from market cap alone.

### Momentum

- Momentum must be derived from a valid, consistently adjusted price/total-return series and declared windows, initially candidate windows of one, three, and twelve months.
- The UI should show the component returns separately before any combined momentum factor is used. A momentum factor is invalid when the series has insufficient history, identity changes, or unhandled corporate actions.
- Tokenized and underlying momentum must remain separate unless an approved proxy is clearly labeled.

### Risk

- Risk must use a documented series and lookback, such as annualized volatility and maximum drawdown, with the price adjustment, trading calendar, and observation frequency recorded.
- Risk is not inferred from holders, market cap, token age, or a missing price series.
- A risk factor must be cohort-relative or otherwise normalized only within a compatible cohort; lower-risk directionality must be visible in the method.

### Liquidity

- Liquidity requires verified volume, turnover, or a similarly defined measure over a declared window and venue/currency.
- Display whether the measure is Ondo-token market liquidity or an underlying-market proxy. They must not be combined into one unlabeled value.
- Market cap divided by holders is not liquidity. Holder count and market cap remain observed catalog/adoption fields, not liquidity inputs.
- If only a current observation exists without a valid window or venue, show the current field if useful but keep the liquidity factor `N/D`.

## Composite score policy

The comparison view exposes separate factor metrics first. The composite score is an optional, transparent convenience for sorting **within one compatible cohort and one snapshot**; it is not a truth claim or global rank.

### Default policy for the first slice

The score configuration must be visible in the UI and versioned in the snapshot. A provisional default configuration for specification review is:

| Factor | Default weight | Direction |
|---|---:|---|
| Growth | 20% | higher is better |
| Value | 15% | higher value signal is better, with methodology defined for each ratio |
| Quality | 20% | higher is better |
| Momentum | 15% | higher is better |
| Risk | 15% | lower risk is better after documented normalization |
| Liquidity | 15% | higher verified liquidity is better |

These weights are configuration, not discovered facts. The user must be able to see them, and the design/spec phase must confirm the exact normalization and whether the product permits user-adjustable weights in the first release or only displays a versioned configuration.

A score is eligible only when at least **70% of the configured weight** has valid factor coverage and at least **four of six** factors are valid. Missing factors are excluded and the remaining weights are renormalized only if the UI shows both original weights and effective weights. Otherwise the score is `N/D — insufficient factor coverage`. The threshold and factor count are product policy and must be versioned.

No composite score is calculated across asset-type blocks, across incompatible instrument definitions, or across mixed currencies/periods that have not been normalized. There is no global "best Ondo asset" ranking. `Unknown` assets cannot receive a composite score until their cohort and identity are verified.

## Data quality and failure behavior

| Condition | Required behavior |
|---|---|
| Partial asset record | Preserve the asset only when its canonical catalog identity is valid; render valid fields and mark each missing metric independently as `N/D` with a reason. Do not zero-fill. |
| Missing or insufficient history | Show `N/D — insufficient history` and the available coverage interval; do not interpolate, backfill, or downgrade total return to price return silently. |
| Stale source or snapshot | Show the last known value with source age and a prominent stale status only where the freshness policy permits display; exclude stale inputs from factors/scores when the configured maximum age is exceeded. Never mix current and stale periods without labeling. |
| Unavailable or not-applicable metric | Show `N/D` with `unavailable`, `not applicable`, or the specific source reason; exclude it from dependent calculations. |
| Duplicate or truncated identity | Do not join on shortened address, name, or symbol. Require canonical full address/chain/stable ID; retain the raw catalog row as unresolved if needed, but suppress enrichment and score it as `N/D`. Reject duplicate canonical identities from publication and emit a validation error. |
| API or provider failure | The update job fails closed for the affected source, preserves the last known-good generated snapshot, and emits a coverage/error report. It must not publish a newly partial snapshot as current. |
| First run with no generated snapshot | Build deterministically from the existing catalog fallback, show that analytics are unavailable/stale, and keep all unsupported metrics `N/D`. |
| Validation or build failure after update | Do not replace the prior snapshot. Roll back atomically to the last known-good snapshot; if none exists, use catalog-only fallback and surface the failure. |

The snapshot must be replaced only after schema, identity, duplicate, date, coverage, and metric validation succeeds. Raw responses/audit records and the generated artifact should be versioned or retained sufficiently to reproduce and investigate a published snapshot.

## Generated snapshot and update boundary

The product remains a static Astro site:

1. An explicit update pipeline runs outside the browser and outside the page build's network path.
2. It fetches permitted source data, stores raw/audit evidence, normalizes canonical identities, applies versioned mappings, validates coverage, and calculates derived metrics.
3. It writes a versioned generated snapshot containing catalog records, classifications, current data, historical coverage, metrics, provenance, freshness/status fields, and score configuration.
4. Astro imports the generated snapshot at build time. The browser performs no runtime API calls and receives no provider secrets.
5. The static build renders the snapshot timestamp and data-quality state. A failed update never silently turns into a fresh-looking page.

The update cadence remains a decision gap until endpoint rate limits, licensing, source freshness, and operational cost are verified. The pipeline must support manual or scheduled execution without making a product promise about frequency in this proposal.

Expected affected areas are the generated-data/update boundary, the existing data module/parser, page composition, sidebar/analytics blocks, comparison/table UI, validation/reporting, and package scripts or CI configuration. Existing dirty and untracked worktree files are explicitly outside this change and must remain untouched.

## Non-goals

- Runtime browser calls to Ondo, Perplexity, DIA, or another provider.
- Using PWM/Perplexity generated prose as a production numeric source.
- A single pooled ranking across stocks, ETFs, bonds, stablecoins/cash-like products, and unknown assets.
- Fabricated or inferred sector, geography, ticker, historical return, fundamental, risk, liquidity, or score values.
- Treating market cap, holder count, or token age as liquidity or quality.
- Presenting a composite score as investment advice, an objective measure of worth, a price target, or a portfolio allocation.
- A 10-year metric or unsupported historical backfill.
- Broad manual classification of all 439 rows when canonical identity or source coverage is not available.
- Reworking unrelated layout, styling, or existing dirty/untracked files.
- Introducing a new backend or persistent runtime service.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Candidate Ondo endpoints lack required history, fields, auth, or redistribution rights | Enforce the endpoint verification gate; keep unsupported metrics `N/D`; select a licensed provider before scaling. |
| Truncated or duplicated catalog identity causes wrong joins | Require full address/chain/stable IDs, reject duplicates, retain unresolved rows without enrichment, and validate row counts. |
| Underlying performance is mistaken for Ondo-token performance | Store separate series and label any approved proxy with mapping source, confidence, and method. |
| Total-return, currency, calendar, split, dividend, or bond treatment makes numbers incomparable | Require explicit series semantics and cohort-specific eligibility; fail closed on ambiguity. |
| Arbitrary factor weights create false authority | Show separate metrics, visible weights, coverage, method version, cohort scope, and provisional status; never provide a global score. |
| Stale or partially failed updates look current | Publish timestamps and source age, block stale inputs from scores, atomically preserve last known-good snapshots, and surface data-quality warnings. |
| Broad enrichment exceeds provider limits or review capacity | Prefer bulk endpoints, start with high-coverage verified subsets, retain the catalog fallback, and split implementation into reviewable slices under the line budget. |
| ETF sector/geography and fixed-income fundamentals are oversimplified | Define taxonomy and cohort-specific methods before implementation; show `N/D` or `not applicable` when definitions do not transfer. |

## Rollback and fallback

The update process must be transactional at the generated-artifact boundary: write and validate a candidate snapshot separately, then replace the published snapshot only after all gates pass. Retain the previous known-good snapshot and its provenance. If a provider fails, validation detects a duplicate or identity conflict, a schema changes unexpectedly, or the static build fails, keep the previous snapshot and mark it stale/error rather than publishing partial data. On a first run without a prior generated snapshot, use the existing `ontonew.md` catalog-only path; the dashboard remains buildable while analytics render as unavailable with a visible data-quality explanation.

Rollback means restoring the prior generated snapshot and its matching schema/method configuration, not recomputing from current live sources. No browser fallback may call an API at runtime.

## Success criteria

The proposal is successful when the implemented first slice can demonstrate all of the following:

- The static dashboard presents explicit asset-type blocks and an `Unknown`/unclassified path.
- Sector/industry and geography/market filters are available only for verified classifications and are visibly secondary to asset type.
- The default comparison is within one compatible cohort; no global composite ranking exists.
- One-year and five-year total-return metrics appear only with valid same-identity history and correct adjustment semantics.
- Revenue growth, EPS/earnings, profitability, financial strength, value, momentum, risk, and liquidity are independently represented with cohort eligibility and provenance, rather than being silently synthesized from unavailable data.
- Every unavailable, stale, unresolved, or not-applicable value renders `N/D` with a reason; invalid values do not enter factors or scores.
- The composite score shows its visible weights, effective coverage, method version, cohort, and snapshot time, and is withheld below the 70% weighted / four-factor coverage threshold.
- The generated snapshot can be built without browser network calls or exposed secrets, and a failed update preserves a known-good snapshot or catalog-only fallback.
- The endpoint verification record exists for every candidate source and confirms schema, identity, semantics, history, limits, failure behavior, and redistribution rights before production use.
- The implementation remains within the review budget and does not mutate unrelated dirty or untracked files.

## Decision gaps before specification/design

1. Which authoritative, redistributable provider will supply historical total-return series and fundamentals if Ondo's candidate APIs do not?
2. What exact taxonomy and source govern sector, industry, geography, and market, especially for diversified ETFs and hybrid products?
3. Should underlying performance be shown by default as a clearly labeled proxy, or only when the user opts into it?
4. What freshness thresholds apply to catalog, market, historical, classification, and fundamental fields, and how long may stale values remain visible?
5. Are the proposed cohorts sufficient for the first release, and how should bonds, funds, stablecoins, and mixed exposures be handled at their boundaries?
6. Should users edit composite weights in the first release, or only inspect the versioned default configuration?
7. Are the provisional factor weights and the 70%/four-factor coverage threshold approved, or should product research adjust them?
8. What update cadence and publication process are acceptable after provider limits, licensing, and operational cost are known?
9. How prominent should provenance, source age, confidence, and `N/D` reasons be in the Spanish UI?

## Review Workload Forecast

**Review budget: 800 changed lines.** The proposal recommends delivery as reviewable slices rather than one broad UI/data diff:

| Slice | Focus | Estimated changed lines |
|---|---|---:|
| 1 | Endpoint verification record, schema, identity validation, generated-snapshot/update boundary, and catalog fallback | 180–260 |
| 2 | Asset-type blocks, coverage/data-quality states, provenance, and secondary classification filters | 180–240 |
| 3 | Same-cohort comparison, valid total-return windows, and eligible factor metric display | 180–240 |
| 4 | Configured composite score, weights/coverage explanation, and final resilience/build validation | 100–160 |
| **Total forecast** | **Expected implementation range** | **640–900** |

The forecast has a possible **800-line budget risk** if the first slice attempts full historical/fundamental enrichment and all cohort-specific UI at once. Apply should stop at a slice boundary if the forecast rises above 800 lines, defer low-coverage cohorts or composite editing, and preserve the catalog fallback. The first implementation slice must not proceed until the endpoint verification gate and the licensed-source decision are resolved.
