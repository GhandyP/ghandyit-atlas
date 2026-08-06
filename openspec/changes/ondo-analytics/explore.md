# Exploration: `ondo-analytics`

## Executive finding

The current app is a static Astro catalog, not an analytics system. `ontonew.md` contains 439 ranked raw rows, while the existing parser/dedupe validation recorded 437 unique assets. The checked-in snapshot exposes only rank, shortened contract address, truncated token name, symbol, market cap, holders, and website. It has no as-of timestamp, historical prices, underlying ticker, type, sector, geography, fundamentals, liquidity, or risk fields. Therefore annual/5-year growth, momentum, quality, growth, risk, and a defensible composite ranking cannot be presented as facts from this snapshot.

The safe direction is to keep Astro static and add a reproducible build-time enrichment pipeline that emits a versioned generated snapshot. Every value must carry provenance, retrieval time, status, and (where derived/editorial) a method or confidence. Missing values must render as unavailable, never as zero or an inferred fact.

## Repository observations

- `astro.config.mjs` uses `output: 'static'`.
- `src/pages/index.astro` composes `Base`, `Sidebar`, and `OndoTable` and imports `ondoAssets`/`ondoStats`.
- `src/data/ondoAssets.ts` reads `ontonew.md` at build time with `process.cwd()`, parses the five logical fields after each rank, and deduplicates by lower-cased displayed contract string.
- `src/components/OndoTable.astro` renders all rows into static HTML and provides client-side search and sort for rank, name, symbol, market cap, holders, and contract. It has no grouping, analytical blocks, or data provenance UI.
- `src/components/Sidebar.astro` shows count, total market cap, total holders, and zero-market-cap count. Its current copy correctly describes the local snapshot.
- `src/layouts/Base.astro` owns global styling and the static responsive shell.
- `package.json` has only `dev`, `build`, and `preview`; no data-update command or automated test runner exists. Playwright is installed but not configured. The project context identifies `npm run build` as the baseline validation.
- The source ends at rank 439. Existing session validation recorded 439 raw rows, two repeated displayed contracts (ranks 199/201 and 200/202), and 437 unique rows after dedupe. It also recorded `CRCLon` as top market cap, `NVDAon` as top holders, and 331 unique rows with zero market cap; these are snapshot observations, not durable market facts.
- Contract addresses and names are visibly truncated with `...`; they are not safe identity keys for external API joins without a canonical full-address source. The repeated rows demonstrate why rank/name/address reconciliation is required.

## Evidence ledger: observed vs not verified

### Observed in the repository

- The local snapshot fields listed above and its 439 rank sequence.
- Static build-time parsing and client-only table search/sort.
- The current snapshot contains many `$0.00` market-cap rows; the exact deduplicated count recorded by the prior validation was 331.
- No analytical or enrichment dataset is present in `src/data`.

### Research leads supplied by the parent, not independently verified here

- Ondo available-assets documentation: `https://docs.ondo.finance/ondo-global-markets/available-assets`
- Ondo metadata endpoint documentation: `https://docs.ondo.finance/api-reference/assets/get-metadata-for-all-supported-assets`
- Ondo price/volume endpoint documentation: `https://docs.ondo.finance/api-reference/tickers/get-price-and-volume-data-for-all-supported-tickers`
- Ondo API overview: `https://docs.ondo.finance/api-reference/overview`
- DIA cross-check URL: `https://www.diadata.org/app/price/asset/Ethereum/0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3/`

The current executor has no web/pwm execution tool. I therefore cannot verify HTTP status, authentication, response shape, pagination, historical coverage, rate limits, or licensing, and I do not claim that any endpoint works. The prior repository session ledger says an earlier Perplexity pass did not confirm a reliable public Ondo catalog/API. The hypothesis that Ondo metadata exposes `assetClass`/`instrumentType`, and that the ticker endpoint supplies the needed price/volume fields, must remain hypotheses until the next research step captures real responses.

### Required endpoint verification record

For each candidate endpoint, capture retrieval date/time, URL/version, auth requirement, request parameters, status code, a redacted sample response, pagination/maximum page size, rate-limit headers, chain/address coverage, historical-vs-current semantics, error behavior, and redistribution/license terms. Verify whether the metadata uses full contract addresses and stable IDs, whether `assetClass`/`instrumentType` are actually present, whether price/volume is tokenized or underlying-market data, and whether it includes historical observations or only current values. Verify that DIA's asset/chain/address corresponds to an Ondo row before using it as a cross-check.

## Data model boundary

Use separate layers rather than putting every value in `OndoAsset`:

1. **Canonical catalog (observed):** `ondoId`, full contract address, chain, symbol, display name, source rank, market cap, holders, website, source URL, retrieved-at, and field-level missing reasons.
2. **Underlying identity (observed/validated mapping):** real ticker or instrument ID, issuer/underlying name, exchange/venue, currency, mapping source, mapping confidence, and validation status. Never map `NVDAon -> NVDA` merely by suffix; validate it.
3. **Classification (observed or editorial):** instrument type/asset class when supplied by a source; sector/geography only with a defined taxonomy and source. Editorial assignments need an owner, rationale, source, version, and confidence. ETF sector/geography should describe exposure/benchmark, not the fund issuer's business sector.
4. **Current market data (observed):** value, unit/currency, timestamp, source, and whether it describes the Ondo token or its underlying asset. Do not call holders or market cap a liquidity measure.
5. **Historical series (observed input):** timestamped adjusted/raw prices, distributions policy, calendar, currency, source, and coverage interval. Keep underlying and tokenized series distinct.
6. **Derived analytics:** formula version, input IDs, calculation timestamp, valid/invalid status, and missing-data reason.
7. **Editorial/fundamental analytics:** only for eligible cohorts. Quality/growth for equities/ETFs cannot be silently applied to stablecoins, cash-like products, or bonds.

A generated artifact should contain `schemaVersion`, `generatedAt`, `catalogSnapshotAt`, `sources[]`, `assets[]`, and per-metric `status: observed | derived | editorial | unavailable`, plus `source`, `retrievedAt`, `methodVersion`, and `missingReason` where applicable.

## Candidate formulas (derived, not observed facts)

- 1-year return: `P_t / P_{t-1y} - 1`.
- Five-year CAGR: `(P_t / P_{t-5y})^(1/5) - 1`.
- Use adjusted/total-return prices consistently when comparing instruments with distributions; otherwise label price return. Do not calculate a 5-year number when history is shorter or the underlying changed identity.
- Momentum candidate: expose raw 1-month/3-month/12-month returns first; a momentum score can be a documented percentile or weighted combination of those windows. A 12-month-minus-1-month variant is a possible later policy, not an established fact.
- Annualized volatility candidate: `std(log(P_t/P_{t-1})) * sqrt(252)` using a documented daily series and calendar.
- Maximum drawdown candidate: minimum of `P_t / runningMax(P) - 1` over a declared lookback.
- Liquidity must use verified volume/turnover and identify whether it is tokenized-market liquidity or an underlying-market proxy. Market cap divided by holders is an adoption/concentration indicator, not liquidity.
- Quality candidate for eligible equity cohorts: a transparent, source-backed percentile of profitability/margins/cash-flow/balance-sheet measures. Growth candidate: revenue/EPS or other explicitly selected fundamental growth measures over a declared period. Do not assign these scores where the required fields are absent or not meaningful.
- Composite rank must be cohort-relative (for example, stocks, equity ETFs, bonds, stablecoins separately), expose its weights and coverage, and return `N/D` below a minimum field-coverage threshold. Any weights are a product decision, not a discovered truth.

## Product recommendation

Restore the analytical blocks as evidence-aware views, not unqualified claims:

- **Type block:** counts, total snapshot market cap, and data coverage by verified instrument type; include `Unknown`.
- **Sector/geography blocks:** only where the classification source and taxonomy are present; show coverage and `Not applicable` for non-equity instruments.
- **Comparison view:** same-type default cohort, with market cap, holders, current price/volume if verified, 1-year and 5-year return only when valid, risk/momentum fields only when valid, and provenance/missing badges.
- **Ranking view:** separate observed rankings (market cap/holders) from derived rankings (momentum/risk/composite). Never imply that the rank is financial advice.
- **Data quality block:** coverage by field, stale-source warnings, unknown classifications, failed mappings, and snapshot timestamp.

### Recommended narrow first slice

1. Verify the Ondo endpoints and licensing with real requests; do not implement against guessed response fields.
2. Build the normalized snapshot/validation schema and ingestion boundary while retaining the current 437-asset catalog as the fallback.
3. Obtain canonical IDs/full addresses and authoritative type metadata in bulk if the endpoint supports it. Otherwise begin with a curated, high-coverage subset (for example, non-zero-market-cap assets) and mark the rest unknown rather than guessing.
4. Add type blocks, source/timestamp/missing-state display, and same-type comparison using the existing observed market cap/holders plus only verified current fields.
5. Add 1-year/5-year performance and volatility only for mappings with a validated underlying series and sufficient history; display `N/D` with a reason elsewhere.
6. Defer fundamental quality/growth and the final composite weights until a licensed fundamentals source, eligible cohorts, and product weights are approved. A provisional composite may be designed but should not be presented as the first release's truth.

### Non-goals for the first slice

- No runtime API calls from the browser; secrets and rate limits stay in the update job.
- No fabricated sector, geography, ticker, annual return, five-year CAGR, quality, growth, risk, liquidity, or score values.
- No single pooled ranking across stocks, ETFs, bonds, stablecoins, and cash-like instruments.
- No 10-year metric unless explicitly requested later and the source has valid history.
- No investment recommendation, portfolio allocation, price target, or claim that a composite score means an asset is objectively “best”.
- No mass manual Perplexity answers as the production numeric data source.
- No unrelated cleanup of existing dirty/untracked worktree files.

## Realistic ingestion/update plan

1. Keep `ontonew.md` as the raw catalog input for now, but add a source timestamp externally because the file has no embedded as-of date.
2. Add a reproducible update command/script outside the Astro page. It should fetch permitted bulk metadata/current data, load versioned editorial mappings, validate schema/IDs, calculate derived metrics, write raw audit output and a checked-in generated snapshot, and emit a coverage report.
3. Use Perplexity for source discovery, unresolved identity checks, and editorial classification research in structured batches. Do not use model prose as the numeric source of truth. Validate every returned mapping against the primary API/issuer page and retain URLs, confidence, and review status.
4. Prefer bulk requests for roughly 400 assets. Per-ticker Perplexity queries are expensive, hard to reproduce, and likely to create inconsistent as-of times. Resolve a provider with legal redistribution rights for historical/fundamental data before scaling.
5. Generate a static JSON snapshot consumed by `src/data/ondoAssets.ts`/a new analytics data module. Build should succeed using the catalog fallback when enrichment fails; the UI must surface stale/unavailable coverage rather than silently mixing snapshots.
6. Schedule updates according to the verified provider limits (for example, catalog/current data more often than editorial/fundamental data), record the exact run time, and deploy the generated static site. Do not promise a cadence before rate limits and license terms are known.
7. Validate each update for row count, duplicate full IDs, symbol/ticker mapping conflicts, impossible dates/returns, stale values, missing cohorts, and source failures. Baseline remains `npm run build`; add data-validation tests or a script before relying on the composite.

## Research gaps and risks

- Endpoint availability, auth, field names, pagination, historical depth, chain coverage, and rate limits are unverified.
- The snapshot has truncated addresses/names and no timestamp, creating identity, freshness, and join risks.
- Ondo-token history may be shorter than the underlying security; using the underlying as a proxy must be labeled and should not be mixed with token liquidity.
- Price return versus total return, dividends, splits, currencies, trading calendars, delisted instruments, and newly launched assets can invalidate comparisons.
- Five-year history is unavailable for newer underlyings and meaningless or differently defined for stablecoins, bonds, and cash-like assets.
- Sector/geography taxonomy is ambiguous for diversified ETFs and fund products.
- “Quality”, “growth”, “risk”, “momentum”, and “best” are methodology choices; arbitrary weights can create false authority.
- Historical/fundamental data may be paywalled, rate-limited, or not redistributable in a static artifact. API secrets must not reach the client.
- Perplexity outputs need source-level validation and quota-aware batching; they are not a substitute for a stable production feed.
- The current parser depends on `ontonew.md` being present at project-root build time; the generated-snapshot plan should preserve a deterministic fallback and make missing input a visible build/data error.

## Product decisions needed in proposal

- Which cohorts are first-class: stocks, equity ETFs, bonds/treasuries, stablecoins/cash-like, crypto-related equity, and unknown?
- Should annual/5-year mean price return or total return?
- Is sector based on issuer, primary exposure, or a chosen taxonomy?
- What is the definition of “liquidity” for an Ondo token versus its underlying?
- Which fundamental fields and licensed provider support quality/growth?
- What minimum data coverage permits a score, and what weights are acceptable?
- How prominently should source age, confidence, and `N/D` reasons appear in the Spanish UI?

## Boundary and impact

Expected future work will likely touch the data parser/module, a new ingestion/generated-data area, the page composition, sidebar/analytics blocks, table/comparison UI, and package scripts. This exploration does not implement any of those changes and does not alter existing dirty/untracked files.

## Verification limitation

CodeGraph could not be used: the repository's `.codegraph/` directory contains only its ignore marker and no executable CodeGraph tool was available in this executor, so targeted reads were used after that failed index check. The supplied Perplexity/Ondo URLs were not fetched here because no web/pwm execution tool is exposed. Those limitations are intentionally recorded rather than hidden.
