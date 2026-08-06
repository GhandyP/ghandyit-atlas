# Normalized Analytics Data Specification

## Purpose

Define the normalized, provenance-aware snapshot that supports honest analytics for Ondo assets while preserving the existing catalog when enrichment is incomplete.

## Requirements

### Requirement: Canonical asset identity

The generated snapshot MUST represent each publishable asset with a canonical identity consisting of a full address where applicable, chain, and a stable source identifier or an explicit unresolved state. Names, symbols, and truncated addresses MUST NOT be used as external join keys. Duplicate canonical identities MUST prevent publication of the candidate snapshot.

#### Scenario: Duplicate or truncated catalog identities are detected

- GIVEN catalog rows contain shortened addresses or two rows resolve to the same canonical chain/address/identifier
- WHEN a candidate snapshot is validated
- THEN the validator MUST reject the duplicate canonical identity, retain unresolved rows only as non-enriched catalog records when possible, and prevent those rows from receiving derived metrics or scores

#### Scenario: A valid identity is normalized

- GIVEN a catalog row has a verified full identity and source identifier
- WHEN the row is normalized
- THEN the snapshot MUST preserve the canonical identity and distinguish it from display name, symbol, rank, and other observed fields

### Requirement: Versioned normalized snapshot

Each published snapshot MUST include a schema version, generation time, catalog snapshot time, source records, normalized asset records, and the version of every applicable mapping or calculation method. The snapshot MUST preserve the distinction between catalog observations, source observations, derived analytics, and editorial classifications.

#### Scenario: A snapshot is published with reproducibility metadata

- GIVEN an update candidate passes normalization and validation
- WHEN the candidate becomes the current snapshot
- THEN it MUST expose schema version, generation time, catalog as-of time, source references, and applicable method or taxonomy versions sufficient to identify how its values were produced

### Requirement: Field-level provenance and semantic status

Every analytical or classification field MUST expose a status of `observed`, `derived`, `editorial`, or `unavailable`, together with source and retrieval/as-of information when applicable. Derived fields MUST expose a method version and input basis. Editorial classifications MUST additionally expose taxonomy version, rationale, confidence, and review status. Unavailable fields MUST expose a reason and MUST NOT be represented as zero or an inferred value.

#### Scenario: Observed, derived, editorial, and unavailable values are distinguishable

- GIVEN an asset has a catalog market-cap observation, a calculated return, a reviewed sector classification, and no valid five-year history
- WHEN the asset is rendered
- THEN the UI MUST distinguish the four statuses, show provenance or method details appropriate to each, and render the five-year value as Spanish `N/D` with its unavailability reason

### Requirement: Verified production sources

Numeric production values MUST come from an authoritative, stable, and legally redistributable source whose endpoint semantics, identity coverage, historical depth, field definitions, licensing, and failure behavior have been verified. PWM/Perplexity MAY provide discovery leads, source validation leads, or unresolved-identity research, but its prose MUST NOT be used as numeric production truth.

#### Scenario: A candidate source has unresolved semantics

- GIVEN a candidate endpoint has not verified whether its price series is tokenized or underlying, or has unresolved licensing or historical semantics
- WHEN the update pipeline evaluates that source for production use
- THEN the affected fields MUST remain unavailable and the endpoint MUST NOT supply published numeric analytics

#### Scenario: Discovery research suggests a classification

- GIVEN PWM/Perplexity returns a possible ticker, sector, or value in prose
- WHEN the candidate mapping is considered for the snapshot
- THEN it MUST be corroborated by an approved production source or reviewed editorial record before publication, and the prose alone MUST NOT populate numeric production fields

### Requirement: Taxonomy-aware classifications

Asset type, sector, industry, geography, and market classifications MUST identify their taxonomy and source. Asset type MUST support Equities, Equity ETFs, Fixed income/Treasuries, Stablecoins/cash-like, and Other/Unknown. An asset without verified type evidence MUST remain in Other/Unknown. ETF classifications MUST describe the underlying exposure or benchmark where applicable and MUST NOT be inferred from the fund issuer alone.

#### Scenario: Classification coverage is incomplete

- GIVEN some assets have verified type and sector evidence while others have only catalog identity
- WHEN the snapshot is generated
- THEN verified classifications MUST be available with taxonomy provenance, and the remaining assets MUST appear in Other/Unknown or as unavailable without guessed labels

### Requirement: Endpoint verification evidence

Before a source endpoint supplies production data, its verification record MUST capture retrieval time, exact URL and version, request and authentication details, representative response evidence, pagination and limits, rate-limit and retry behavior, identity and chain/address coverage, current versus historical semantics, field definitions, failure behavior, and redistribution terms. The record MUST include a replayable or redacted audit fixture sufficient to validate normalization without live network access.

#### Scenario: Endpoint verification gate is incomplete

- GIVEN an endpoint lacks a verified response fixture, identity coverage, or redistribution terms
- WHEN production-source validation runs
- THEN the endpoint MUST fail the verification gate and all dependent metrics MUST remain unavailable until the missing evidence is resolved
