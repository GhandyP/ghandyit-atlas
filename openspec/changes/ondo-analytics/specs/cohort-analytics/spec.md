# Cohort Analytics Specification

## Purpose

Define the asset-type-first navigation, compatible comparison rules, eligible analytical metrics, and transparent cohort-relative scoring for the static analytics experience.

## Requirements

### Requirement: Asset-type-first blocks and secondary filters

The dashboard MUST present primary blocks for verified asset type, including an explicit Other/Unknown block. Sector and industry, geography and market, and factor filters MUST be secondary to asset type and MUST expose only values supported by the snapshot taxonomy and provenance. Factor filters MUST cover growth, value, quality, momentum, risk, and liquidity states without implying that unavailable values are zero.

#### Scenario: A user filters the catalog

- GIVEN the snapshot contains verified asset types and partial sector, geography, and factor coverage
- WHEN the user opens the analytics view
- THEN asset-type blocks MUST be the primary grouping, secondary filters MUST be scoped to supported classifications, and unsupported filter values MUST NOT be presented as verified options

### Requirement: Compatible-cohort comparison

The default comparison view MUST contain assets from one compatible cohort, one snapshot, and compatible identity, currency, period, and metric definitions. The product MUST NOT create a pooled comparison or composite ranking across equities, equity ETFs, fixed income/Treasuries, stablecoins/cash-like assets, and Other/Unknown. A user MUST explicitly change cohort before viewing another cohort, and the UI MUST identify the active cohort scope.

#### Scenario: The default comparison opens

- GIVEN the user selects an asset-type block
- WHEN the comparison view loads
- THEN it MUST show the selected compatible cohort by default, identify the cohort and snapshot, and exclude incompatible asset types from the comparison and score

#### Scenario: An asset lacks a compatible identity

- GIVEN an asset cannot be reconciled to a canonical identity, currency, period, or cohort definition
- WHEN the user views the comparison
- THEN the asset MAY remain visible as a catalog record but its affected metrics and composite score MUST be `N/D` with a reason

### Requirement: Total-return window eligibility

The system MUST expose one-year and five-year total-return metrics only when the same canonical instrument identity has valid, consistently adjusted total-return history for the required window and known currency, calendar, distribution, and corporate-action semantics. Five-year results MUST use the approved five-year method, such as a documented CAGR, and MUST NOT be calculated from shorter history, interpolated endpoints, or silently substituted price return. Tokenized and underlying series MUST remain separate; an approved underlying proxy MUST be explicitly labeled with mapping provenance and confidence. Stablecoins/cash-like assets and products without a meaningful licensed definition MUST show `N/D` as not applicable.

#### Scenario: A one-year return has valid coverage

- GIVEN the asset has the same verified identity at the current endpoint and at least one year earlier, with valid total-return semantics
- WHEN the one-year metric is calculated
- THEN the result MUST be labeled total return, include its period and method provenance, and be eligible only within compatible comparisons

#### Scenario: Five-year history is insufficient

- GIVEN an asset has less than five years of valid same-identity total-return history
- WHEN the five-year metric is requested
- THEN the UI MUST show Spanish `N/D` with an insufficient-history reason and MUST NOT interpolate, shorten the window, or substitute price return

### Requirement: Fundamental growth eligibility

Revenue growth and EPS/earnings growth MUST be represented independently and MUST be eligible primarily for single-company equities only when issuer identity, reporting periods, currency, share basis, and source provenance are verified and comparable. Equity ETFs MAY expose provider-defined portfolio aggregates only when their aggregation meaning and as-of date are explicit; ETF issuer revenue MUST NOT be presented as exposure growth. Missing filings, non-comparable periods, short history, and non-equity instruments MUST produce `N/D` with a reason.

#### Scenario: Fundamental periods are not comparable

- GIVEN revenue or EPS values use mixed fiscal periods, mixed share bases, or an unresolved issuer identity
- WHEN growth eligibility is evaluated
- THEN the affected growth metric MUST be unavailable with a specific reason and MUST NOT enter a growth factor or composite score

### Requirement: Profitability and financial-strength eligibility

Profitability and financial strength MUST be represented as separate fundamental groups with explicit components and cohort applicability. Profitability MAY use verified margins, ROA/ROE, or cash-flow profitability measures. Financial strength MAY use verified leverage, liquidity or coverage ratios, balance-sheet measures, or an appropriate fixed-income credit measure. A quality factor MUST be eligible only when the required inputs are current under the declared freshness policy and comparable within the active cohort. Stablecoins/cash-like and Other/Unknown assets MUST NOT receive equity quality metrics by analogy.

#### Scenario: Quality inputs are complete for an eligible cohort

- GIVEN an equity asset has verified, current profitability and financial-strength inputs with comparable definitions
- WHEN quality eligibility is evaluated
- THEN the UI MUST show the separate input groups and may expose a quality factor with provenance, method, and cohort scope

#### Scenario: Quality is not meaningful for the asset

- GIVEN an asset is a stablecoin, cash-like product, or unknown/unresolved instrument
- WHEN quality metrics are requested
- THEN the system MUST show `N/D` or not applicable and MUST exclude those values from scoring

### Requirement: Value eligibility

Value MUST be calculated only for a compatible cohort with meaningful, verified valuation inputs and a declared as-of date. Supported inputs MAY include P/E, P/B, and free-cash-flow yield when the provider defines the denominator and aggregation. Negative, zero, missing, or incomparable denominators MUST produce `N/D`; market cap alone MUST NOT be inverted or treated as a value signal.

#### Scenario: A valuation denominator is invalid

- GIVEN an asset has a negative earnings denominator or lacks a provider-defined valuation denominator
- WHEN value eligibility is evaluated
- THEN the value metric MUST be `N/D` with the reason and MUST NOT be normalized or included in a composite score

### Requirement: Momentum eligibility

Momentum MUST be derived from a valid, consistently adjusted price or total-return series using declared windows, initially including one-, three-, and twelve-month component returns where coverage permits. The UI MUST show component returns separately before any combined momentum factor. Insufficient history, identity changes, or unhandled corporate actions MUST make the affected metric unavailable. Tokenized and underlying momentum MUST remain separate unless an approved proxy is clearly labeled.

#### Scenario: Momentum windows have different coverage

- GIVEN an asset has valid three-month history but lacks a valid twelve-month series
- WHEN momentum is displayed
- THEN the three-month component MAY be shown with provenance, the twelve-month component MUST be `N/D` with its reason, and an aggregate momentum factor MUST follow its declared coverage rule

### Requirement: Risk eligibility

Risk MUST use a documented series, lookback, observation frequency, adjustment policy, and metric definition such as annualized volatility or maximum drawdown. Risk MUST NOT be inferred from holders, market cap, token age, or missing prices. Any cohort-relative normalization MUST be performed only within a compatible cohort and MUST make lower-risk directionality visible.

#### Scenario: A risk series is unavailable

- GIVEN an asset has no valid price history for the declared risk lookback
- WHEN risk is calculated
- THEN risk MUST be `N/D` with an insufficient-history or unavailable-source reason and MUST NOT enter the risk factor or score

### Requirement: Liquidity eligibility and market distinction

Liquidity MUST use verified volume, turnover, or a similarly defined measure over a declared window, venue, and currency. The UI MUST distinguish Ondo-token market liquidity from an underlying-market proxy. Market cap, holder count, and token age MUST remain observed catalog or adoption fields and MUST NOT be used as liquidity inputs. A current observation without a valid window MAY be displayed as a current field but MUST leave the liquidity factor unavailable.

#### Scenario: Only market cap and holders are known

- GIVEN an asset has market cap and holder count but no verified volume or turnover window
- WHEN liquidity is displayed
- THEN the catalog fields MAY remain visible, the liquidity factor MUST show `N/D`, and no liquidity score may be derived from those fields

### Requirement: Transparent configurable composite score

The system MUST present separate factor metrics before an optional composite score. The score MUST use a versioned configurable configuration that exposes factor weights, directionality, normalization method, effective weights, coverage, cohort scope, snapshot time, and methodology version. The initial configuration MUST support Growth 20%, Value 15%, Quality 20%, Momentum 15%, Risk 15% with lower-risk direction, and Liquidity 15%, unless a later approved configuration supersedes it. A score MUST require at least 70% of configured weight and at least four of six valid factors. Missing factors MAY be excluded and remaining weights renormalized only when original and effective weights are visible; otherwise the score MUST be `N/D` for insufficient coverage. The score MUST be cohort-relative and MUST NOT be described as a global best ranking, investment advice, or objective worth.

#### Scenario: A cohort meets score coverage

- GIVEN an asset is in a compatible cohort and has four valid factors covering at least 70% of configured weight
- WHEN the composite score is shown
- THEN the UI MUST show the score together with the active weights, effective coverage, method version, cohort, and snapshot scope

#### Scenario: A cohort fails score coverage

- GIVEN an asset has fewer than four valid factors or less than 70% configured weight coverage
- WHEN the composite score is requested
- THEN the system MUST show `N/D` with an insufficient-factor-coverage reason and MUST NOT rank the asset in the composite
