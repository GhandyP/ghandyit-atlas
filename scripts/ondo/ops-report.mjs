#!/usr/bin/env node
/**
 * Operational log / release health report for the published catalog snapshot.
 *
 * Prints a JSON audit line (snapshot id, source status, coverage, publication
 * result, integrity) and exits non-zero when the published pointer graph is
 * not healthy, so CI can fail closed on a stale or corrupt publication.
 *
 * Run: `npm run data:ops`
 */
import { readReleaseHealth } from '../../src/data/analytics/releaseHealth.mjs';

const root = process.cwd();
const health = readReleaseHealth({ root });

const report = {
  check: 'release-health',
  integrity: health.integrity,
  currentId: health.current.snapshotId,
  currentIntegrity: health.current.integrity,
  coverage: health.current.coverage,
  previousId: health.previous.snapshotId,
  previousAvailable: health.previous.available,
  previousIntegrity: health.previous.integrity,
  policyHash: health.policyHash,
  generatedAt: health.generatedAt,
  sourceStatus: health.current.coverage?.sources === 0 ? 'static-catalog-only' : 'provider-gated',
  publication: health.published ? 'valid' : 'degraded',
  checkAt: new Date().toISOString(),
};

console.log(JSON.stringify(report));
if (health.integrity !== 'ok') {
  process.stderr.write(`release-health: ${health.integrity} (current=${health.current.integrity}, previous=${health.previous.integrity})\n`);
  process.exit(1);
}