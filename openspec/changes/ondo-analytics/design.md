# Evidence-Aware Ondo Analytics: Corrected Technical Design

This design keeps the dashboard a static Astro site and adds a build-time, provenance-aware analytics snapshot. It corrects the boundary failures identified in the design gate: the existing catalog parser is treated as lossy and identity-unsafe until migrated, endpoint adapters are fail-closed behind a complete verification manifest, metric records carry their semantic context, sector/geography views are explicit but single-dimension, delivery is hard-capped below the 800-line review budget, and publication uses an immutable candidate/pointer sequence that does not touch unrelated worktree files.

## Decision summary

- **Static boundary:** `astro.config.mjs` remains `output: 'static'`. The browser makes no provider calls and receives no credentials.
- **Update boundary:** a Node update command fetches only approved sources, records evidence, normalizes data, validates a candidate, builds against that candidate, and publishes an immutable snapshot pointer.
- **Catalog safety:** `src/data/ondoAssets.ts` must preserve raw numeric tokens and parse states. Missing and malformed values are not zero. Truncated addresses are display text only and never canonical dedupe keys.
- **Verification gate:** a provider adapter cannot be enabled until its `SourceRecord` has complete request, response, semantic, coverage, failure, and licensing evidence plus a replayable redacted fixture.
- **Metric safety:** current observations, historical series, fundamentals, and derived metrics have explicit units, currency, venue, period, series identity, adjustment, source/as-of, method, and cohort eligibility. Token-market liquidity and underlying-market liquidity are separate fields.
- **Navigation:** type remains the primary block. Within the selected type, sector or geography can be an inspectable block view and a secondary filter, but only one secondary dimension is active at a time.
- **First delivery:** the implementation is four bounded slices with a hard maximum of **790 changed lines**. The protected value path is the safe data boundary, type-first blocks, compatible-cohort comparison, and the highest-value evidence: total return, revenue/EPS, and core factor eligibility/provenance. Broad provider enrichment, full fundamental breadth, editable score controls, low-coverage cohorts, and extra UI polish are deferred first if a cap or verification gate requires it.
- **Score:** the approved cohort-relative policy remains visible and versioned: Growth 20%, Value 15%, Quality 20%, Momentum 15%, Risk 15%, Liquidity 15%; at least four factors and 70% configured-weight coverage are required.

## Quick path and data flow

1. Parse `ontonew.md` into lossless catalog rows with row-level validation and unresolved identity state.
2. Load `data/ondo/verification/manifest.json`; only `passed` and redistributable sources with replay fixtures can enter an adapter.
3. Fetch approved sources into a run-scoped audit directory, normalize full identities and semantic observations, calculate only eligible metrics, and validate a candidate snapshot.
4. Build the Astro site against the isolated candidate. If validation or build fails, leave the current pointer unchanged.
5. Publish the immutable snapshot and manifest by replacing one atomic pointer. The loader consumes build-local data only and otherwise constructs a visible catalog-only fallback.

```text
ontonew.md
  -> src/data/ondoAssets.ts (raw-preserving catalog rows)
  -> src/data/analytics/catalogAdapter.ts (unresolved-safe fallback)

verified endpoint + redacted fixture
  -> run audit/<run-id>
  -> source gate -> normalize -> eligibility -> metrics -> score
  -> candidate snapshot + hash manifest
  -> isolated static build
  -> immutable snapshot directory + atomic current pointer
  -> src/data/ondoAnalytics.ts -> Astro HTML
```

PWM/Perplexity remains discovery and review support only. Its prose may create an identity/classification review item, never a production numeric value.

## 1. Exact implementation boundary

The following files are the planned change surface. No implementation is performed by this design phase.

| Area | Exact files | Responsibility |
|---|---|---|
| Catalog migration | `src/data/ondoAssets.ts`, `src/data/analytics/catalogAdapter.ts`, `src/data/analytics/types.ts` | Lossless parsing, row statuses, unresolved fallback, normalized contracts |
| Source gate | `data/ondo/verification/manifest.json`, `data/ondo/verification/fixtures/README.md`, `src/data/analytics/sourceRegistry.ts`, `scripts/ondo/providers/index.mjs` | Verification records, fixture lookup, fail-closed adapter enablement |
| Snapshot/update | `src/data/ondoAnalytics.ts`, `scripts/ondo/update.mjs`, `scripts/ondo/validate.mjs`, `package.json` | Build-local loader, candidate validation, audit, publication, commands |
| Catalog compatibility | `src/pages/index.astro`, `src/components/OndoTable.astro` | Nullable/missing display and unchanged catalog search/sort behavior |
| Analytics UI | `src/components/AnalyticsDashboard.astro`, `src/components/ComparisonTable.astro` | Type blocks, one active secondary dimension, provenance, compatible comparison |
| Metric modules | `src/data/analytics/eligibility.ts`, `src/data/analytics/metrics/returns.ts`, `fundamentals.ts`, `quality.ts`, `value.ts`, `momentum.ts`, `risk.ts`, `liquidity.ts` | Pure semantic eligibility and derived metric calculations |
| Score and evidence | `src/data/analytics/normalization.ts`, `src/data/analytics/score.ts`, `scripts/ondo/check-fixtures.mjs`, `scripts/ondo/check-publication.mjs` | Cohort normalization, score policy, replay and rollback evidence |

`astro.config.mjs`, `src/layouts/Base.astro`, and the existing `Sidebar.astro` remain unchanged unless a later implementation task records a strictly necessary compatibility fix. Existing dirty or untracked files outside this allowlist are never cleaned, reset, deleted, or reformatted.

## 2. Catalog parsing, migration, and fallback contract

### 2.1 Current parser defect and required replacement

The current `src/data/ondoAssets.ts` does **not** satisfy the normalized-data specification:

- `parseMoney` returns `0` for an empty or malformed token.
- `parseCount` returns `0` for an empty or malformed token.
- `dedupeKey` lowercases any displayed contract string, including shortened values containing `...`, so two different assets can be collapsed by a non-canonical display value.

The migration must replace these behaviors; it must not merely wrap the current numeric output.

### 2.2 Lossless parsed-row types

`src/data/analytics/types.ts` defines the adapter-facing contract. The parser retains the original token before normalization:

```ts
type NumericParseState =
  | 'valid-positive'
  | 'valid-zero'
  | 'missing'
  | 'malformed'
  | 'unresolved';

interface RawNumericField<T extends number> {
  raw: string | null;       // original source token; empty source token is retained as ''
  value: T | null;          // null for missing, malformed, or unresolved
  state: NumericParseState;
}

type CatalogRowStatus =
  | 'valid'
  | 'partial'
  | 'invalid'
  | 'unresolved-identity'
  | 'display-duplicate-unresolved';

interface ParsedCatalogRow {
  rawRowKey: `ontonew.md:row:${number}`; // source ordinal, never a displayed address
  sourceLine: number;
  rank: number | null;
  contractAddressRaw: string | null;
  tokenNameRaw: string | null;
  symbolRaw: string | null;
  marketCap: RawNumericField<number>;
  holders: RawNumericField<number>;
  websiteRaw: string | null;
  identityState: 'unresolved' | 'candidate-display-only';
  addressIsTruncated: boolean;
  rowStatus: CatalogRowStatus;
  validationErrors: string[];
}
```

Rules:

- `$0.00`, `0`, and an equivalent explicit zero are `valid-zero` with numeric value `0`.
- An absent field or empty field is `missing` with `value: null`.
- A non-empty token that cannot be parsed under the field grammar is `malformed` with `value: null` and its raw token preserved.
- A value that cannot be assigned to a verified canonical identity is `unresolved`; this is independent of whether its numeric field is valid.
- The legacy numeric projection must use `number | null` and render `N/D` for null. Aggregates ignore null values; `zeroMarketCapCount` counts only `valid-zero`, never parse failures.
- A malformed or missing field does not discard an otherwise useful row. The row remains in the catalog fallback as `partial` or `invalid`, with field-specific reasons.

### 2.3 Identity and deduplication rules

`src/data/analytics/catalogAdapter.ts` owns the migration from parsed rows to normalized assets.

- `rawRowKey` is stable for the source row and permits the fallback to retain every parsed row, including rows whose displayed addresses repeat.
- A string containing `...`, a shortened hexadecimal address, a name, symbol, rank, website, or token suffix is `display-only`; none is a canonical external join key.
- The fallback does **not** deduplicate on the displayed address. It keeps the row, marks `identityState: 'unresolved'`, assigns `assetKey: rawRowKey`, and suppresses enrichment, factor, and score values.
- Canonical dedupe occurs only after a verified source supplies a full `(chain, normalizedAddress)` or a stable source ID. Duplicate canonical identities reject the candidate publication. An explicitly audited alias may be merged once, with both source identities retained as evidence.
- The historical `437` pseudo-deduplicated count is recorded only as a migration observation. The lossless fallback may expose all valid parsed rows (the source currently has 439 raw ranks) and must report unresolved/display duplicates rather than silently collapsing them.

The catalog fallback therefore remains useful: users retain rank, name, symbol, website, valid market cap, valid holder count, and raw/display contract text, while the dashboard clearly identifies unresolved identity and unavailable analytics. It does not present the fallback as a canonical enriched universe.

### 2.4 Exact parser acceptance evidence

Slice 1 must add a parser fixture and deterministic validation evidence:

- `data/ondo/fixtures/catalog-parser-cases.json` contains explicit zero, blank, malformed money, malformed count, a truncated address, two repeated truncated display strings, and a valid full-address example.
- `scripts/ondo/check-fixtures.mjs` asserts raw-token preservation, `valid-zero` versus `missing`/`malformed`, nullable legacy projection, one row per `rawRowKey`, no truncated-address canonical key, and no enrichment for unresolved rows.
- `npm run data:validate -- --catalog-fixture data/ondo/fixtures/catalog-parser-cases.json` must pass these assertions and emit machine-readable row counts/statuses.
- `npm run build` must render the catalog fallback with `N/D` for null numeric fields and must not regress catalog search/sort. The evidence records that malformed values were not converted to zero.

## 3. Normalized contracts and provenance

### 3.1 Common value and identity contracts

```ts
type ValueStatus = 'observed' | 'derived' | 'editorial' | 'unavailable';
type Availability =
  | 'available' | 'stale' | 'missing' | 'not-applicable' | 'unresolved'
  | 'invalid' | 'insufficient-history' | 'source-error' | 'license-blocked';

type ReasonCode =
  | 'no-generated-snapshot' | 'unknown-catalog-as-of' | 'truncated-identity'
  | 'identity-conflict' | 'source-not-verified' | 'license-not-approved'
  | 'field-not-present' | 'missing-value' | 'malformed-value'
  | 'insufficient-history' | 'non-comparable-period' | 'not-applicable-cohort'
  | 'stale-input' | 'invalid-denominator' | 'invalid-series'
  | 'provider-error' | 'insufficient-factor-coverage';

interface Provenance {
  sourceId: string | null;
  sourceUrl: string | null;
  fieldPath: string | null;
  retrievedAt: string | null;
  asOf: string | null;
  methodVersion: string | null;
  inputIds: string[];
  taxonomyVersion: string | null;
  rationale: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  reviewStatus: 'unreviewed' | 'reviewed' | 'approved' | 'rejected' | null;
}

interface ValueEnvelope<T> {
  value: T | null;
  status: ValueStatus;
  availability: Availability;
  reason: ReasonCode | null;
  provenance: Provenance | null;
}

type IdentityState = 'verified' | 'unresolved' | 'conflict';

interface CanonicalIdentity {
  state: IdentityState;
  chain: string | null;
  address: string | null;
  normalizedAddress: string | null;
  stableId: string | null;
  evidence: Provenance[];
  unresolvedReason: ReasonCode | null;
}
```

An unavailable value has `value: null`; it is never encoded as zero. A fallback row can have valid catalog envelopes and an unresolved identity at the same time.

### 3.2 Endpoint verification schema and gate

`SourceRecord` is deliberately larger than a URL/status pair. It must structurally carry the evidence needed to decide whether an adapter is safe:

```ts
interface SourceFieldDefinition {
  fieldPath: string;
  meaning: string;
  unit: string | null;
  currency: string | null;
  venue: string | null;
  periodMeaning: string | null;
  seriesIdentity: 'token' | 'underlying' | 'issuer' | 'mixed' | 'unknown';
  nullable: boolean;
  validationRule: string;
}

interface SourceRecord {
  sourceId: string;
  provider: string;
  kind: 'catalog' | 'metadata' | 'market' | 'history' | 'fundamentals' | 'classification' | 'cross-check';
  documentationUrl: string;
  exactUrl: string;
  apiVersion: string;
  verificationStatus: 'pending' | 'passed' | 'blocked' | 'rejected';
  retrievedAt: string;

  request: {
    method: string;
    exactUrl: string;
    query: Record<string, string>;
    bodyHash: string | null;
    headersRedacted: Record<string, string>;
    auth: {
      mode: 'none' | 'api-key' | 'oauth' | 'session' | 'env-secret' | 'redacted';
      secretEnvName: string | null;
      scopes: string[];
      redactionEvidence: string;
    };
  };

  response: {
    httpStatus: number;
    contentType: string;
    responseFixturePath: string;
    responseSha256: string;
    redactionPolicy: string;
    representativeResponseSummary: string;
  };

  pagination: {
    mode: 'none' | 'page-number' | 'cursor' | 'next-link' | 'unknown';
    requestParameter: string | null;
    responseField: string | null;
    observedPageSize: number | null;
    documentedMaximumPageSize: number | null;
    maximumPagesTested: number | null;
    terminationRule: string;
  };

  rateLimit: {
    documentedLimit: string | null;
    observedHeaders: Record<string, string>;
    retryAfterHeader: string | null;
    retryableStatuses: number[];
    maxAttempts: number;
    backoffPolicy: string;
    retrySafety: 'idempotent' | 'conditional' | 'not-safe' | 'unknown';
  };

  coverage: {
    chains: string[];
    fullAddress: 'all' | 'some' | 'none' | 'unknown';
    stableId: 'all' | 'some' | 'none' | 'unknown';
    addressFieldPath: string | null;
    stableIdFieldPath: string | null;
    supportedAssetCount: number | null;
    duplicateBehavior: string;
  };

  semantics: {
    temporal: 'current' | 'historical' | 'current-and-historical' | 'unknown';
    seriesIdentity: 'token' | 'underlying' | 'mixed' | 'issuer' | 'not-applicable' | 'unknown';
    tokenVsUnderlyingEvidence: string;
    fieldDefinitions: SourceFieldDefinition[];
    historical: {
      depth: string | null;
      interval: string | null;
      adjustment: 'total-return' | 'adjusted-price' | 'raw-price' | 'unknown' | 'not-applicable';
      distributions: string | null;
      corporateActions: string | null;
      currency: string | null;
      tradingCalendar: string | null;
      totalReturnDefinition: string | null;
    };
    fundamentals: {
      available: boolean;
      reportingPeriod: string | null;
      fiscalCalendar: string | null;
      restatementPolicy: string | null;
      shareBasis: string | null;
      fieldDefinitions: string[];
    };
  };

  failureBehavior: {
    documentedErrors: string[];
    invalidResponseAction: string;
    partialResponseAction: string;
    staleResponseAction: string;
    credentialFailureAction: string;
    publicationAction: 'fail-closed' | 'degrade-to-unavailable' | 'unknown';
  };

  licensing: {
    termsUrl: string;
    redistributionPermission: 'approved' | 'display-only' | 'prohibited' | 'pending';
    staticArtifactPermission: 'approved' | 'prohibited' | 'pending';
    attributionRequired: boolean;
    evidencePath: string;
    expiryOrReviewDate: string | null;
  };

  verification: {
    fixtureReplayable: boolean;
    verifiedBy: string | null;
    verifiedAt: string | null;
    blockers: string[];
  };
}
```

The production gate is `verificationStatus === 'passed'`, `responseFixturePath` exists and hashes to `responseSha256`, `fixtureReplayable === true`, `httpStatus` is an accepted response, full identity/coverage and semantic fields are known for the adapter's claims, `failureBehavior.publicationAction === 'fail-closed'`, and both licensing permissions are `approved`. Any missing field leaves the record `blocked`; the adapter registry must refuse to register it. A blocked source may explain `N/D`, but it cannot publish numeric values.

### 3.3 Verification manifests and candidate fixtures

Checked-in verification evidence lives at:

```text
data/ondo/verification/
  manifest.json                         # SourceRecord[]; pending entries are allowed
  fixtures/
    README.md                           # redaction and license rules
    <source-id>.request.json             # replay request with secrets removed
    <source-id>.response.redacted.json   # representative response fixture
    <source-id>.evidence.md              # retrieval, status, semantics, license notes
```

Run-specific evidence lives at `data/ondo/runs/<run-id>/audit/`, never in the browser artifact:

```text
data/ondo/runs/<run-id>/audit/
  manifest.json
  sources/<source-id>.request.json
  sources/<source-id>.response.redacted.json
  sources/<source-id>.headers.json
  coverage-report.json
  validation-report.json
```

`src/data/analytics/sourceRegistry.ts` loads `manifest.json` and exposes only `getVerifiedSource(sourceId)`. `scripts/ondo/providers/index.mjs` calls that gate before loading `scripts/ondo/providers/<provider>.mjs`; it throws a named `source-not-verified`/`license-not-approved` error rather than returning an adapter. A candidate manifest with an unresolved response fixture, pagination, token/underlying semantics, historical definition, or redistribution term therefore blocks the provider adapter and leaves dependent metrics `N/D`.

DIA remains `kind: 'cross-check'`; it cannot become a production source merely because its URL resembles an asset record. Chain, full address, stable ID, and asset identity must be positively reconciled first.

## 4. Semantic metric contracts

A bare `Record<string, number>` or a generic value without context is not a publishable analytic field. `src/data/analytics/types.ts` defines one semantic envelope for every current, historical, fundamental, and derived record:

```ts
type MarketKind = 'ondo-token' | 'underlying';
type SeriesKind = 'token' | 'underlying' | 'issuer';

type MetricSemantics = {
  quantity: string;                 // price, return, volume, revenue, eps, margin, etc.
  unit: 'USD' | 'count' | 'shares' | 'percent' | 'ratio' | 'currency-per-share' | 'unknown';
  currency: string | null;
  venue: string | null;             // token venue, exchange, issuer filing, or explicit N/A
  period: {
    kind: 'instant' | 'interval' | 'lookback' | 'reporting-period';
    start: string | null;
    end: string | null;
    reportingDate: string | null;
    fiscalYear: number | null;
    label: string | null;
  };
  series: {
    kind: SeriesKind;
    seriesId: string;
    instrumentId: string | null;
    identityEvidence: string;
  };
  adjustment: {
    price: 'total-return' | 'adjusted-price' | 'raw-price' | 'not-applicable' | 'unknown';
    distributions: 'included' | 'excluded' | 'unknown' | 'not-applicable';
    corporateActions: 'applied' | 'not-applied' | 'unknown' | 'not-applicable';
  };
  sourceId: string | null;
  retrievedAt: string | null;
  asOf: string | null;
  cohortEligibility: {
    eligibleCohorts: string[];
    cohortKey: string | null;
    comparabilityKey: string;
    requiredSemantics: string[];
  };
  methodVersion: string | null;
};

interface SemanticMetric<T> extends ValueEnvelope<T> {
  semantics: MetricSemantics;
}
```

`comparabilityKey` includes unit, currency, venue, period definition, series identity, adjustment, and applicable cohort method. `src/data/analytics/eligibility.ts` rejects a comparison or factor when keys differ, when `cohortKey` is not the active compatible cohort, or when any required semantic is unknown. This prevents generic fields from being mixed across cohorts even if their JSON property names match.

### 4.1 Current observations: token and underlying are separate

`NormalizedAsset.current` is not one generic market record:

```ts
interface CurrentMarketData {
  tokenMarket: {
    price: SemanticMetric<number>;
    volume: SemanticMetric<number>;
    turnover: SemanticMetric<number>;
    venue: string | null;
  };
  underlyingMarket: {
    price: SemanticMetric<number>;
    volume: SemanticMetric<number>;
    turnover: SemanticMetric<number>;
    venue: string | null;
  };
}
```

The `tokenMarket` fields use `MarketKind: 'ondo-token'` and the Ondo token venue. `underlyingMarket` fields use `MarketKind: 'underlying'`, the underlying series/instrument ID, and its venue. A current value can be displayed without making a factor eligible, but it must retain unit, currency, venue, instant/as-of period, source, and series identity. Market cap and holders stay catalog/adoption observations; they cannot populate either liquidity field.

### 4.2 History: token and underlying series are distinct

```ts
interface HistorySeries {
  seriesId: string;
  seriesKind: 'token' | 'underlying';
  instrumentId: string;
  points: Array<{ timestamp: string; value: number }>;
  semantics: MetricSemantics; // includes interval, calendar, currency, adjustment
  coverageStart: string;
  coverageEnd: string;
}
```

One-year and five-year performance require a same-identity series with known currency, calendar, distributions, corporate actions, and `adjustment.price: 'total-return'` (or the explicitly approved equivalent). The five-year method is versioned CAGR unless a later approved policy changes it. A token series and an underlying series never share a `seriesId`; an underlying proxy is a separate labeled metric with mapping provenance and confidence, not a silent substitution.

### 4.3 Fundamentals and derived metrics

Fundamentals are structured observations, not an untyped map:

```ts
interface FundamentalObservation {
  key: 'revenue' | 'eps' | 'margin' | 'roa' | 'roe' | 'cash-flow' | 'leverage' | 'coverage' | 'valuation';
  value: SemanticMetric<number>;
  issuerId: string;
  reportingPeriod: { start: string; end: string; fiscalYear: number | null; basis: string };
  shareBasis: 'basic' | 'diluted' | 'not-applicable' | 'unknown';
  restatementState: 'original' | 'restated' | 'unknown';
  cohortEligibility: string[];
}

interface DerivedMetric {
  key: 'one-year-total-return' | 'five-year-total-return-cagr'
    | 'revenue-growth' | 'eps-growth' | 'quality' | 'value'
    | 'momentum-1m' | 'momentum-3m' | 'momentum-12m' | 'momentum'
    | 'volatility' | 'max-drawdown' | 'token-liquidity' | 'underlying-liquidity';
  value: SemanticMetric<number>;
  inputMetricIds: string[];
  formula: string;
  methodVersion: string;
  eligibility: { eligible: boolean; reason: ReasonCode | null; cohortKey: string | null };
}

interface NormalizedAsset {
  assetKey: string;
  identity: CanonicalIdentity;
  catalog: Record<string, ValueEnvelope<number | string>>;
  classification: {
    assetType: ValueEnvelope<string> & { taxonomyVersion: string | null; basis: string | null };
    sector: ValueEnvelope<string> & { taxonomyVersion: string | null; basis: string | null };
    industry: ValueEnvelope<string> & { taxonomyVersion: string | null; basis: string | null };
    geography: ValueEnvelope<string> & { taxonomyVersion: string | null; basis: string | null };
    market: ValueEnvelope<string> & { taxonomyVersion: string | null; basis: string | null };
  };
  current: CurrentMarketData;
  history: { token: HistorySeries[]; underlying: HistorySeries[] };
  fundamentals: FundamentalObservation[];
  metrics: DerivedMetric[];
}
```

The `catalog` map is restricted to observed catalog fields by schema validation; it is not a loophole for generic analytics. `fundamentals` and `metrics` use discriminated keys and required semantics. Revenue growth and EPS growth reject mixed reporting periods, currencies, issuer IDs, share bases, restatement states, or invalid denominators. ETF portfolio aggregates are accepted only when their aggregation definition and as-of date are present; ETF issuer revenue is never presented as exposure growth.

### 4.4 Cohort eligibility and score isolation

Every derived metric records `eligibleCohorts`, `cohortKey`, and `comparabilityKey`. The validator rejects:

- a metric whose semantic cohort is absent or differs from the active cohort;
- a token metric used with an underlying metric;
- an instant value mixed with a reporting-period value;
- differing currency, venue, calendar, adjustment, or period definitions; or
- a quality/value/fundamental metric applied to a cohort for which its definition is not meaningful.

Missing, stale, invalid, unresolved, or not-applicable values are excluded from dependent factors. The UI renders Spanish `N/D` with the specific reason and retains semantic/provenance details in the disclosure.

## 5. Cohort, sector, and geography UX

Type-first navigation is preserved:

- Primary blocks are `Equities`, `Equity ETFs`, `Fixed income / Treasuries`, `Stablecoins / cash-like`, and `Other / Unknown`.
- `Other / Unknown` is always rendered, including in catalog fallback mode.
- A type block sets the active compatible cohort and resets incompatible selections.

Sector and geography are not reduced to hidden filters. `AnalyticsDashboard.astro` provides a visible **dimension view** control inside the active type:

```ts
interface AnalyticsFilterState {
  cohort: AssetType;
  activeDimension: 'none' | 'sector' | 'geography';
  sector: string | null;
  geography: string | null;
  industry: string | null;
  market: string | null;
  factors: Partial<Record<'growth' | 'value' | 'quality' | 'momentum' | 'risk' | 'liquidity', 'available' | 'unavailable'>>;
  search: string;
}
```

Behavior:

1. `activeDimension: 'sector'` renders inspectable sector blocks/cards for the active cohort and permits sector/industry filtering.
2. `activeDimension: 'geography'` renders inspectable geography blocks/cards for the active cohort and permits geography/market filtering.
3. Only one secondary dimension is active at once. The UI does not render a sector × geography cartesian block or duplicate comparison tables. Selecting the other dimension clears the first dimension's selection and reuses the same comparison area.
4. Each dimension block shows its taxonomy version, basis (`issuer`, `underlying-exposure`, `benchmark`, `listing-market`, or `domicile`), source coverage, and `Unknown`/`Not applicable` state. ETF sector/geography describes verified underlying exposure or benchmark, never the fund issuer by inference.
5. Filter options come only from non-unavailable classifications in the active cohort. The other dimension remains available as a later view, not an implicit compound filter.

The comparison view always displays active cohort, active dimension (if any), snapshot ID/as-of, and compatibility scope. The legacy catalog table continues its independent full-catalog search/sort behavior.

## 6. Update, candidate validation, and atomic publication

### 6.1 Exact paths

Verification and run paths:

```text
data/ondo/verification/manifest.json

data/ondo/runs/<run-id>/
  audit/
    manifest.json
    sources/<source-id>.request.json
    sources/<source-id>.response.redacted.json
    sources/<source-id>.headers.json
    coverage-report.json
    validation-report.json
    update-report.json
  candidate/
    ondoSnapshot.json
    ondoSnapshot.manifest.json       # includes SHA-256 and policy/source hashes
  build/
    astro-build.log
  rollback/
    restore-plan.json                # written only when a post-swap recovery is needed
    restore-result.json
```

Published build-local paths:

```text
src/data/generated/ondo/
  snapshots/<snapshot-id>/
    ondoSnapshot.json
    ondoSnapshot.manifest.json
  current.json                        # atomic pointer to current snapshot + manifest hash
  previous.json                       # pointer to previous known-good snapshot
```

`src/data/ondoAnalytics.ts` reads `current.json`, verifies the referenced snapshot and manifest hash, and falls back to `ontonew.md` if the pointer or snapshot is absent/invalid. There is no browser fallback request.

### 6.2 Non-destructive publication sequence

`scripts/ondo/update.mjs` performs this sequence:

1. Create `data/ondo/runs/<run-id>/` with an allowlisted run ID. Record a baseline of the allowed generated paths; do not run `git clean`, `git reset`, broad deletion, or formatting.
2. Fetch only sources that pass `sourceRegistry.ts`. Write redacted request/response evidence and hashes to the run audit directory. Secrets remain in memory/environment and never enter fixtures, snapshots, or client assets.
3. Write `candidate/ondoSnapshot.json` and its manifest/hash. Validate schema, source gate, identity, duplicates, dates, units, periods, series semantics, cohort eligibility, freshness, licensing, and score configuration. A required-source failure fails closed.
4. Run `npm run build` with `ONDO_SNAPSHOT_PATH=<absolute run>/candidate/ondoSnapshot.json` and `ONDO_SNAPSHOT_MANIFEST_PATH=<absolute run>/candidate/ondoSnapshot.manifest.json`. The normal page build otherwise uses `current.json`.
5. Copy the validated candidate into `src/data/generated/ondo/snapshots/<snapshot-id>.staging/` on the same filesystem, fsync files, then rename that directory to `snapshots/<snapshot-id>/`. The old current snapshot remains untouched.
6. If `current.json` exists, write its exact pointer content to `previous.json.tmp`, fsync, and rename it to `previous.json`. This records the prior snapshot without recomputing it.
7. Write `current.json.tmp` containing the new snapshot path, manifest path, snapshot ID, run ID, SHA-256, schema version, and method/policy hashes; fsync and rename it to `current.json`. The pointer replacement is the publication boundary and is atomic on the target filesystem.
8. If pointer publication fails, keep the old `current.json`; record the failure in the run audit. If a failure occurs after step 7, use `previous.json` and the referenced immutable snapshot to restore `current.json` via a same-directory temporary pointer, then write `rollback/restore-result.json`.
9. Never overwrite or delete an unrelated dirty/untracked path. If an allowed generated target is unexpectedly modified by another process, the command fails closed rather than clobbering it. Audit run directories are additive; old snapshots are retained according to an explicit later retention policy, not deleted opportunistically.

A provider failure after a prior publication preserves `current.json` and the previous snapshot, emits stale/error coverage, and leaves affected fields `N/D` in the next valid snapshot only when the product policy permits a deliberate stale snapshot. It never publishes a newly partial snapshot as current by accident. With no current snapshot, the loader uses the deterministic catalog fallback and shows an unavailable/stale data-quality state.

### 6.3 Snapshot envelope

```ts
interface AnalyticsSnapshot {
  schemaVersion: number;
  snapshotId: string;
  generatedAt: string;
  catalogSnapshotAt: string | null;
  mode: 'enriched' | 'catalog-fallback';
  sources: SourceRecord[];
  policy: {
    freshnessVersion: string;
    taxonomyVersion: string;
    metricMethodVersion: string;
    scoreConfigVersion: string;
  };
  scoreConfig: ScoreConfig;
  quality: {
    catalogRows: number;
    normalizedAssets: number;
    verifiedIdentities: number;
    unresolvedIdentities: number;
    duplicateIdentityCount: number;
    fieldCoverage: Record<string, number>;
    staleFields: number;
    unavailableFields: number;
    errors: string[];
  };
  assets: NormalizedAsset[];
}
```

## 7. Metric policy and score

- **Total return:** one-year return uses a valid same-identity total-return series; five-year return uses the versioned CAGR method only with five years of valid coverage. No interpolation, shortened window, or silent price-return substitution.
- **Revenue/EPS:** independent derived metrics with comparable issuer/reporting-period/currency/share-basis inputs. Missing or non-comparable periods produce `N/D`.
- **Fundamentals:** profitability, financial strength, value, and growth retain separate components and cohort applicability. Full provider breadth and full enrichment are not prerequisites for the fallback or contract delivery.
- **Momentum:** one-, three-, and twelve-month components are shown independently; an aggregate requires its declared coverage rule.
- **Risk:** volatility and maximum drawdown carry frequency, lookback, calendar, adjustment, and directionality. Holders and market cap never infer risk.
- **Liquidity:** token volume/turnover and underlying volume/turnover are separate, with venue and window. A current volume observation alone does not create a liquidity factor.

```ts
interface ScoreConfig {
  version: string;
  cohortScope: 'compatible-cohort-only';
  factors: Array<{
    key: 'growth' | 'value' | 'quality' | 'momentum' | 'risk' | 'liquidity';
    weight: number;
    direction: 'higher' | 'lower';
    normalization: string;
  }>;
  minimumWeightCoverage: 0.7;
  minimumValidFactors: 4;
  missingPolicy: 'exclude-and-renormalize-visible';
}
```

The initial visible configuration is Growth 20%, Value 15%, Quality 20%, Momentum 15%, Risk 15% with lower-risk direction, and Liquidity 15%. A score is cohort-relative and snapshot-relative, never a global “best” ranking or investment advice. User-editable controls are deferred from this delivery; the checked-in configuration, original/effective weights, coverage, method version, cohort, and snapshot are inspectable.

## 8. Review slices and hard line boundary

This is an evidence-based delivery amendment, not a scope expansion. The original Slice 1 was measured at **369 authored changed lines** against the original 220-line allocation. Its remediation is now functionally passing the catalog-status, matching/mismatching fixture-hash, malformed/null handling, JSON/pointer/manifest/hash fallback, blocked-source-gate, and static-build checks. However, exact current authored accounting cannot be proven from an immutable baseline. This design therefore does not treat `369 + remediation` as an authoritative current total and does not weaken the safe data boundary to fit the unrealistic 220/390 allocations. The revised provisional allocations are enforced as **hard ceilings**: Slice 1 max 420, Slice 2 max 130, Slice 3 max 150, and Slice 4 max 90, for a hard total of **790 changed lines**. The 800-line review budget is not a target, and capacity cannot be borrowed between slices. Any actual or forecast authored diff over a slice ceiling stops that slice; the remaining feature scope is deferred rather than compressed into an unsafe or misleading implementation.

| Slice | Exact ownership and priority | Hard ceiling | Stop/defer rule |
|---|---|---:|---|
| 1. Data-boundary remediation, lossless fallback, and verification hash gate | Remediate `src/data/ondoAssets.ts`, `src/data/analytics/catalogAdapter.ts`, `src/data/analytics/types.ts`, `src/data/analytics/sourceRegistry.ts`, `src/data/ondoAnalytics.ts`, `scripts/ondo/providers/index.mjs`, `scripts/ondo/validate.mjs`, `scripts/ondo/check-fixtures.mjs`, the verification manifest/README, parser fixtures, and focused `package.json` commands. Fix malformed full-identity rows so they are `partial`/`invalid`, preserve `null` raw tokens as missing, make the build-local loader catch JSON errors and validate the pointer/manifest/hash, and make the source registry compute and compare fixture SHA-256 before admitting a source. Preserve the deterministic catalog fallback and blocked-provider boundary; publish no unverified numeric enrichment. | **420** | If the actual or forecast authored total for Slice 1 is over **420**, stop the slice immediately; it does not borrow capacity from Slices 2–4. No provider adapter, broad enrichment, or later UI work may be added to fit it. A **fresh Slice 1 verification is required before Slice 2** and must re-run the focused checks/build while confirming all three remediation blockers are closed and the current cap evidence is recorded. |
| 2. Type-first blocks and quality state | `AnalyticsDashboard.astro`, the minimum `index.astro` integration, classification view-model additions, provenance/quality rendering, explicit `Other / Unknown`, and exactly one active secondary dimension. This protects the primary user navigation and truthful `N/D`/snapshot-state disclosure. | **130** | Stop at type blocks plus one secondary dimension. Defer extra UI polish, industry/market breadth, and broad manual classification first; never remove the Unknown path, provenance, freshness, or unavailable-state disclosure to fit the cap. |
| 3. Core compatible-cohort comparison and metrics | `eligibility.ts`, the core metric modules and fixture paths, and `ComparisonTable.astro`. Prioritize same-cohort comparison, valid one-/five-year total-return eligibility, independent revenue-growth and EPS-growth evidence, and core factor evidence for quality, value, momentum, risk, and liquidity, all with semantic provenance and token/underlying separation. Unsupported or unverified inputs remain `N/D`; contract coverage does not authorize provider enrichment. | **150** | Preserve the compatible-cohort comparison boundary and the total-return, revenue/EPS, and core-factor evidence needed for the user's analysis. Defer broad provider enrichment, full fundamental breadth beyond the core evidence, low-coverage cohorts, and nonessential metric breadth before weakening identity, semantic eligibility, provenance, or `N/D` behavior. |
| 4. Fixed score/publication evidence and final rollout checks | Minimal `normalization.ts`, `score.ts`, publication/rollback checks and wiring, plus final hard-cap evidence. The fixed cohort-relative score policy remains versioned and transparent if this slice fits; editable score controls are not part of the delivery. | **90** | Defer editable scores, optional score presentation, extra polish, and other lower-value breadth first if threatened. Retain static-only loading, fail-closed publication, provenance, and rollback correctness; do not trade safety or core comparison value for score/UI breadth. |
| **Hard total** |  | **790** | If any actual or forecast allocation exceeds its ceiling, stop at the last complete boundary and defer the remaining scope. Do not borrow capacity, split a contract mid-slice, weaken a verification gate, or claim completion from an over-cap diff. |

The **369-line measurement is evidence from `verify-report.md`**, not a new estimate or proof of the current total. The remediation evidence recorded in the current apply/verification records is functionally passing, but exact current accounting remains unproven without an immutable baseline. Before Slice 2 starts, a fresh verification report—not the prior failed report—must re-run the focused checks and static build, confirm malformed full-identity rows are no longer `valid`, malformed snapshot/pointer JSON falls back deterministically, manifest/hash validation is enforced, and fixture SHA-256 is computed and compared. It must also record whether the Slice 1 authored total is at or below **420**. If the fresh verification or cap evidence fails, Slice 2 remains blocked.

The priority order is deliberate: preserve the safe data boundary and remediation first; then deliver type-first blocks and quality state; then the compatible-cohort comparison and highest-value evidence—total return, revenue/EPS, and core factors—before optional score breadth. If later caps are threatened, defer broad provider enrichment, full fundamental breadth beyond core revenue/EPS evidence, editable score controls, low-coverage cohorts, and extra UI polish first, before reducing canonical identity, field-level provenance, static browser safety, token/underlying separation, rollback, or honest `N/D` states. The next tasks reconciliation must replace any stale 390/180 allocation references with 420/150 while preserving the same ownership and dependencies. A slice is complete only when its owned acceptance evidence passes. The full correctness policies remain in force even when a capability is deferred: PWM/Perplexity is discovery-only, no numbers are invented, Astro remains static, unavailable values render as Spanish `N/D` with reasons, provenance remains field-level, identity remains verified-or-unresolved, and publication rollback restores the last known-good snapshot.

## 9. Acceptance evidence and rollout

### Gate evidence

- `data/ondo/verification/manifest.json` has a `SourceRecord` for each candidate endpoint and every required field above, including exact URL/version, request/auth, HTTP status, redacted fixture/hash, pagination/page limits, rate limits/retries, chain/address/stable-ID coverage, current/historical and token/underlying semantics, field definitions, historical adjustment/currency/calendar, fundamental reporting periods, failure behavior, and licensing evidence.
- `scripts/ondo/check-fixtures.mjs` proves blocked incomplete records cannot register provider adapters and that a replayed complete fixture normalizes without network access.
- Catalog fixtures prove missing/malformed values are not zero and truncated addresses are not canonical identity.
- Metric fixtures prove total-return eligibility, short five-year `N/D`, independent revenue/EPS period validation, token/underlying liquidity separation, and cohort incompatibility rejection.
- Publication fixtures prove candidate validation/build failure leaves `current.json` unchanged, a post-swap rollback restores `previous.json`, hashes match, audit files are written under the run ID, and unrelated dirty/untracked files are untouched.
- `npm run build` remains the baseline static validation. Optional Playwright smoke uses the installed dependency directly; no unconfigured test runner is assumed.

### Rollout

1. Ship the lossless parser, catalog adapter, blocked-source registry, snapshot loader, and deterministic fallback. The static build remains useful with explicit `N/D` states.
2. Enable only endpoint adapters whose complete verification records and redistribution permissions pass. Publish only verified identities/fields; unresolved rows stay visible but unscored.
3. Enable total return and fundamental/factor modules per verified cohort and coverage. Every capability is controlled by snapshot data and policy versions, not browser calls.
4. Expose the fixed cohort-relative score after normalization and coverage fixtures pass. Editable score controls and broad provider enrichment remain outside this hard-capped first delivery.

Rollback restores the prior immutable snapshot referenced by `previous.json`; it never recomputes values from live sources. No step mutates unrelated worktree state.

## 10. Risks and deliberate stops

- The current catalog has truncated identity and no embedded as-of timestamp. Fallback analytics therefore remain unresolved/stale rather than guessed.
- Ondo endpoint fields, auth, historical depth, token/underlying semantics, limits, and licensing remain hypotheses until the manifest is populated with replayable evidence.
- Provider or licensing gaps reduce coverage but do not justify zero-filling, cross-cohort mixing, or PWM numeric substitution.
- Total-return, currency, calendar, fiscal-period, ETF aggregation, and fixed-income semantics remain explicit contract fields; unknown semantics block eligibility.
- The implementation must stop at a slice boundary before exceeding 790 changed lines. Provider breadth, full fundamental enrichment, editable score controls, and layout polish are the first deferrals—not provenance, fallback safety, `N/D`, or rollback.
