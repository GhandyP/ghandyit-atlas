# SDD Project Context

## Project

- **Name:** `ghandyit-atlas`
- **Root:** `/home/ghandy/Documents/etf-dashboard`
- **Stack:** Astro 6.1.3, static output, TypeScript/Astro components, npm
- **Current page:** `src/pages/index.astro`
- **Current data path:** `ontonew.md` is parsed at build time by `src/data/ondoAssets.ts`; the current model contains rank, contract address, token name, symbol, market cap, holders, and website.
- **Current UI structure:** `src/layouts/Base.astro` owns global styling and responsive layout; `src/components/Sidebar.astro` renders the hero/controls; `src/components/OndoTable.astro` renders client-side search and sorting.
- **UI language:** Existing user-facing copy is Spanish. Technical SDD artifacts use English.

## Requested planning scope

Restore analytical blocks and add richer comparison dimensions for Ondo tokenized assets, including type and sector blocks, annual and five-year growth, momentum-like signals, risk, quality, growth, and ranking/comparison experiences. Keep the application static Astro unless exploration and proposal establish a justified need for another architecture. Current data must be sourced through the requested `pwm`/Perplexity workflow during exploration and proposal, with provenance and retrieval dates recorded.

## Session choices

- **Artifact store:** Both OpenSpec files and Engram when available
- **Execution mode:** Interactive
- **Delivery strategy:** Auto-forecast
- **Review budget:** 800 changed lines
- **No implementation in initialization:** This phase only bootstraps context and configuration.

## Validation capability

- No automated test runner, test script, test configuration, or test files were detected.
- Playwright `1.59.1` is present as a development dependency but is not configured for tests.
- Baseline validation command: `npm run build`.
- `strict_tdd` is therefore recorded as `false` for this project until a test runner is intentionally configured.

## Data and architecture notes

- The existing asset source is a checked-in Markdown snapshot rather than a runtime API.
- The existing parser reads from `process.cwd()`, so build-time execution depends on `ontonew.md` being present at the project root.
- The existing table has no covering tests according to the CodeGraph map.
- Planning must define how current market data, historical growth, classifications, and derived scores are sourced, timestamped, validated, and represented when unavailable. Avoid presenting estimates or editorial classifications as observed facts.
- Existing dirty and untracked files are pre-existing and must remain untouched; initialization created only the new `openspec/` context artifacts.

## Tool readiness checked during initialization

- `pwm` is installed and authenticated for the configured account.
- Quota check on 2026-07-10 reported 197 Pro Search queries and 20 Deep Research queries remaining.
- No Perplexity research query was executed during init; that work belongs to the next planning phase.
- `.atl/skill-registry.md` exists and is available for delegated phase skill resolution.
