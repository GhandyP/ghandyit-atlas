# Operations Guide

This document describes how the catalog snapshot is produced, published,
verified, and rolled back. It is the release-health contract for the
catalog-only build: no provider credentials are used anywhere in this flow.

## Snapshot model

`npm run data:snapshot` (`scripts/ondo/snapshot-catalog.ts`) reads
`ontonew.md`, normalizes it through `catalogAdapter`, builds a
`mode: 'catalog'` snapshot candidate, validates it, and atomically publishes:

- `src/data/generated/ondo/snapshots/<id>.json` — immutable snapshot
- `src/data/generated/ondo/snapshots/<id>.manifest.json` — manifest with SHA-256
- `src/data/generated/ondo/current.json` — pointer to the published snapshot
- `src/data/generated/ondo/previous.json` — pointer to the last published snapshot

Pointers carry `snapshotSha256` and `manifestSha256`. The loader
(`src/data/ondoAnalytics.ts`) and the health check (`releaseHealth.mjs`) verify
those hashes before treating the publication as valid.

`src/data/generated/` is git-ignored: the site regenerates a fresh snapshot
before every build (`build` runs `data:snapshot` first), so the deployed
artifact never depends on stale generated state.

## Local reproduction (no credentials required)

```sh
npm ci
npm run data:snapshot   # publish a fresh catalog-only snapshot
npm run data:ops        # release health report; exits non-zero if degraded
npm run data:validate   # catalog parser fixtures
npm run data:fixtures   # metric + candidate safety fixtures
npm run data:publication# pointer/hash publication fixtures
npm run test            # unit tests, including release health + rollback
npm run build           # typecheck via astro check + snapshot + astro build
npm run test:browser    # Playwright suite (catalog + responsive/a11y)
```

All of the above is `npm run check`.

## Scheduled update job

`.github/workflows/data-update.yml` runs weekly (Monday 06:00 UTC) and on
`workflow_dispatch`. It regenerates the snapshot, runs every validation gate,
checks release health, and only then commits the snapshot audit trail to the
`data/snapshots` branch and uploads the ops report as an artifact.

The job fails closed: any gate failure stops the job before the publish step,
so the last valid snapshot on the branch is preserved. The application build
is unaffected — the update job does not deploy and does not touch `main`.

## Rollback

Data rollback promotes the last good `previous` snapshot into `current`:

```sh
npm run data:rollback   # scripts/ondo/rollback-catalog.mjs
```

The swap is atomic (stage + rename) and fails closed when there is no distinct
previous snapshot. The previous pointer is retained, so a future publication
still has a rollback target. Rollback behavior is covered by
`scripts/ondo/update-ops.test.mjs`.

Application rollback is a normal Git operation: releases are built from
`main`, so reverting a commit (or the `data/snapshots` branch) restores the
prior code/data combination. Code and data are independently reversible.

## Visible release health

`CatalogQuality` renders a release-health line from `readReleaseHealth()`
(`src/data/analytics/releaseHealth.mjs`) showing the current snapshot ID, the
previous snapshot ID, and pointer integrity. The UI does not promise a refresh
cadence while the source has no verified as-of date and no cadence decision.

## Secrets, licensing, retention

- No API keys, cookies, or credentials exist in this flow; provider metrics
  remain disabled until a source and license are approved.
- The only data source is the local `ontonew.md`; its redistribution and
  licensing obligations are pending owner decision and are recorded in
  `PROJECT_FUNCTIONALITY_PLAN.md` (Open Decisions).
- Retention: immutable snapshots accumulate under
  `src/data/generated/ondo/snapshots/` on the `data/snapshots` branch; both
  `current` and `previous` pointers are always retained.
