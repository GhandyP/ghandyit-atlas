# PWM Research Addendum: Ondo Analytics Data Sources

- **Retrieved:** 2026-07-11
- **Tool:** `pwm research` (Perplexity Deep Research)
- **Purpose:** Identify source candidates and constraints for an evidence-aware, static snapshot of roughly 400 Ondo tokenized assets.
- **Status:** Discovery evidence only. No source is approved for production ingestion by this note.

## Candidate official Ondo sources

Perplexity identified these candidate API surfaces from Ondo documentation:

- Metadata: `GET /v1/assets/all/metadata`
- Market data: `GET /v1/assets/all/market`
- Enhanced prices: `GET /v1/assets/all/enhanced-prices`
- API overview: <https://docs.ondo.finance/api-reference/overview>
- Metadata documentation: <https://docs.ondo.finance/api-reference/assets/get-metadata-for-all-supported-assets>
- Market documentation: <https://docs.ondo.finance/api-reference/assets/get-market-data-for-all-supported-assets>
- Enhanced-price documentation: <https://docs.ondo.finance/api-reference/assets/get-enhanced-prices-for-all-supported-assets>
- Available assets: <https://docs.ondo.finance/ondo-global-markets/available-assets>
- Session limits: <https://docs.ondo.finance/api-reference/limits/get-session-limits>

The research response describes metadata as a possible source for symbols, tickers, and network-specific addresses, and market data as a possible source for primary/on-chain and underlying/off-chain information. It warns that enhanced prices are display-oriented and should not be treated as on-chain oracle data.

**Verification required before use:** exact request URL/version, authentication, response schema, pagination, full-address/stable-ID coverage, current versus historical semantics, token versus underlying semantics, rate limits, retry/error behavior, historical depth, and redistribution/licensing terms. The candidate paths and fields remain unverified until replayable responses are captured.

## Candidate external sources

Perplexity suggested Financial Modeling Prep (FMP) and EODHD as possible providers for financial statements, ratios, historical prices, and fundamentals. It also mentioned Alpha Vantage as a lower-confidence discovery/review source.

These providers are not approved by this research note. Direct verification must cover:

- ticker and exchange coverage for the Ondo universe;
- adjusted/total-return history and corporate actions;
- revenue, EPS, margins, ROA/ROE/ROIC, cash flow, leverage, and valuation definitions;
- historical depth and reporting-period semantics;
- API limits, cost, commercial terms, and redistribution rights for a checked-in static artifact;
- response fixtures and failure behavior.

Primary issuer filings, exchange data, or other legally redistributable sources remain preferable where practical. SEC/issuer records may validate US-listed fundamentals but do not automatically provide a complete normalized dataset for every cohort.

## SDD implications

1. Treat `pwm`/Perplexity as source discovery and validation support only; model prose must never populate production numeric fields.
2. Add an endpoint-verification fixture gate before ingestion tasks can publish data.
3. Keep Ondo token series, underlying-market series, and underlying fundamental series distinct and explicitly labeled.
4. Do not assume Ondo supplies complete historical fundamentals; plan a provider decision for revenue/EPS/quality/growth.
5. Prefer bulk metadata/market pulls and build-time generated snapshots; do not issue roughly 400 live browser calls.
6. Preserve the catalog-only fallback and render unsupported metrics as `N/D` with provenance and reasons.

## Research citations

- <https://docs.ondo.finance/api-reference/assets/get-metadata-for-all-supported-assets>
- <https://docs.ondo.finance/api-reference/overview>
- <https://docs.ondo.finance/api-reference/assets/get-market-data-for-all-supported-assets>
- <https://docs.ondo.finance/api-reference/assets/get-enhanced-prices-for-all-supported-assets>
- <https://docs.ondo.finance/api-reference/limits/get-session-limits>
- <https://eodhd.com/lp/fundamental-data-api>
- <https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds>
- <https://eodhd.com/financial-apis/api-limits>
- <https://docs.ondo.finance/ondo-global-markets/available-assets>

## MCP follow-up (2026-07-12)

Three parallel standard Perplexity MCP queries were used to accelerate source discovery in bulk:

1. **Official Ondo API:** confirmed API-key protection and candidate market/enhanced-price surfaces in current docs. Exact JSON fields, full ID/address coverage, historical depth, rate limits, and redistribution terms remain unverified. Enhanced prices are display-oriented and not an oracle source.
2. **Bulk providers:** surfaced Nasdaq Data Link, Tiingo, Financial Modeling Prep, EODHD, Polygon, Alpha Vantage, and SEC EDGAR as candidates for history/fundamentals/classification. None is approved until coverage, pricing, API limits, and static-publication rights are checked directly.
3. **Batch methodology:** reinforced cohort-relative comparison, total-return/corporate-action handling, token-vs-underlying liquidity separation, and explicit missing-data thresholds.

These results improve discovery speed but do not change the production rule: MCP/PWM prose never populates numeric fields. The next provider task must capture real response fixtures, schema evidence, and licensing approval before enabling an adapter.
