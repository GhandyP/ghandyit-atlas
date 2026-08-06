#!/usr/bin/env node
/**
 * Promote the last good `previous` catalog snapshot into `current`.
 *
 * Restores the previous immutable snapshot as the published `current` pointer
 * (atomic write+rename) so a rejected or corrupt publication reverts to the
 * last known-good release. Fails closed when there is no distinct previous
 * snapshot available.
 *
 * Run: `npm run data:rollback`
 */
import { rollbackRelease } from '../../src/data/analytics/releaseHealth.mjs';

const root = process.cwd();
try {
  const { rolledBackTo } = rollbackRelease({ root });
  console.log(JSON.stringify({ publication: 'rolled-back', rolledBackTo, checkAt: new Date().toISOString() }));
} catch (error) {
  process.stderr.write(`rollback: ${error.message}\n`);
  process.exit(1);
}