# Snapshot Resilience and Static Build Specification

## Purpose

Ensure enriched analytics are published transactionally, remain honest under incomplete data, and preserve the static Astro delivery boundary without browser provider access or exposed secrets.

## Requirements

### Requirement: Independent missing and stale states

The dashboard MUST preserve a valid canonical catalog asset when enrichment is partial and MUST evaluate missingness independently for each metric. Missing, stale, unavailable, not-applicable, unresolved, and insufficient-history states MUST render as Spanish `N/D` with a concise reason and relevant coverage or source-age information. Invalid values MUST NOT be zero-filled, silently substituted, or included in dependent factors or scores.

#### Scenario: An asset record is partial

- GIVEN an asset has a valid canonical catalog identity but missing history, fundamentals, and liquidity
- WHEN the dashboard renders the asset
- THEN valid catalog fields MUST remain visible, each missing analytical field MUST show its own `N/D` reason, and no dependent factor or score may use the missing fields

#### Scenario: A source is stale

- GIVEN a value exceeds the configured freshness limit for its field
- WHEN the snapshot is rendered and scored
- THEN the UI MUST show the value's age and stale status when display is permitted, while stale inputs beyond the policy MUST be excluded from factors and composite scores

### Requirement: Failed update preserves last known-good data

An update MUST validate schema, canonical identities, duplicates, dates, coverage, metric semantics, source status, and licensing before replacing the published snapshot. A provider or API failure affecting a source MUST fail closed for that source, emit a coverage/error report, and preserve the last known-good snapshot rather than publishing a newly partial snapshot as current.

#### Scenario: A provider fails during update

- GIVEN a source request fails or returns an invalid response after a previous snapshot was published
- WHEN the update process completes
- THEN the previous snapshot MUST remain published, the affected data MUST be marked stale or errored, and an update error report MUST identify the failed source and affected coverage

### Requirement: Atomic rollback after validation or build failure

Candidate snapshot output MUST be isolated from the current published snapshot until all update and static-build validation succeeds. If validation or the build fails, the system MUST restore the prior snapshot with its matching schema and method configuration. Rollback MUST restore known-good generated data rather than recomputing from current live sources.

#### Scenario: Candidate validation fails on a duplicate identity

- GIVEN an update candidate contains a duplicate canonical identity
- WHEN validation runs before publication
- THEN the candidate MUST NOT replace the current snapshot, the prior snapshot MUST remain available, and the failure MUST be surfaced as a data-quality error

#### Scenario: Static build fails after a candidate is prepared

- GIVEN the candidate passes data validation but the static build fails
- WHEN publication is finalized
- THEN the prior known-good snapshot MUST remain the published data source, or the catalog-only fallback MUST be used when no prior snapshot exists

### Requirement: Deterministic catalog fallback

If no generated analytics snapshot exists, or if an update cannot produce a valid snapshot, the static site MUST remain buildable from the existing catalog source. The fallback MUST expose that analytics are unavailable or stale and MUST keep unsupported metrics, classifications, and scores as `N/D` rather than presenting the catalog as fresh enriched data.

#### Scenario: First build has no generated snapshot

- GIVEN the project has the existing catalog input but no valid generated analytics snapshot
- WHEN the production build runs
- THEN the dashboard MUST build deterministically from the catalog, show a visible unavailable/stale data-quality state, and render unsupported analytics as `N/D`

### Requirement: Static-only provider boundary

The production page build MUST consume a checked-in or otherwise build-local generated snapshot and MUST NOT make browser runtime calls to Ondo, PWM/Perplexity, DIA, or any other provider. Provider credentials, API keys, and other secrets MUST remain outside browser-delivered assets and generated client state.

#### Scenario: A user loads the built site

- GIVEN a production static build contains the current generated snapshot or catalog fallback
- WHEN the browser loads and interacts with the dashboard
- THEN all displayed analytics MUST come from build-local data, no provider network request may be required at runtime, and no provider secret may be exposed to the browser

### Requirement: Static build exposes freshness and quality state

The static dashboard MUST display the snapshot or catalog as-of time and a data-quality summary sufficient to identify coverage, stale sources, unresolved identities, unavailable fields, and update errors. The UI MUST use the existing Spanish user-facing convention, while technical statuses, method identifiers, and generated artifacts MAY remain in English.

#### Scenario: A snapshot contains mixed data quality

- GIVEN a snapshot has current catalog fields, stale market data, unresolved identities, and unavailable fundamentals
- WHEN the dashboard renders its quality summary
- THEN the summary MUST expose the snapshot time and those quality conditions in Spanish-facing UI copy, and the underlying technical artifact MUST retain precise machine-readable statuses and reasons
