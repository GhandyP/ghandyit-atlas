/**
 * Build and atomically publish a versioned catalog-only snapshot.
 *
 * Reads the current `ontonew.md` catalog, builds a mode:'catalog' snapshot
 * (no provider enrichment), validates it, and publishes immutable snapshot +
 * manifest files under `src/data/generated/ondo/snapshots/` with a `current`
 * pointer. The loader (`ondoAnalytics.ts`) consumes the same `current`/`previous`
 * pointer protocol as the provider-gated path, but for catalog-only releases the
 * sources array is empty and the policy hash refers to the static-catalog policy.
 *
 * Run: `npm run data:snapshot` (also wired as `prebuild` so every site build
 * regenerates a fresh catalog snapshot).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCatalog, toCatalogAsset } from '../../src/data/analytics/catalogAdapter';
import { summarizeCatalogQuality } from '../../src/data/analytics/catalogQuality.mjs';
import { publishCandidate, validateCandidate } from './update.mjs';

const root = process.cwd();
const generatedRoot = resolve(root, 'src/data/generated/ondo');
const snapshotsDir = resolve(generatedRoot, 'snapshots');

const snapId = () => {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`;
  return `catalog-${stamp}`;
};

const source = readFileSync(resolve(root, 'ontonew.md'), 'utf8');
const rows = parseCatalog(source);
const assets = rows.map((row) => toCatalogAsset(row));
const catalogQuality = summarizeCatalogQuality(rows, 'ontonew.md', rows.length ? 'available' : 'catalog-source-malformed');
const generatedAt = new Date().toISOString();
const snapshotId = snapId();
const policy = 'static-catalog-v1';
const policyHash = createHash('sha256').update(policy).digest('hex');

const candidate = {
  schemaVersion: 1,
  snapshotId,
  mode: 'catalog',
  generatedAt,
  catalogSnapshotAt: null,
  sources: [],
  policy,
  policyHash,
  quality: { ...catalogQuality, catalogRows: rows.length, unresolvedIdentities: catalogQuality.unresolvedIdentityCount, unavailableFields: catalogQuality.unavailableFieldCount, sourceAgeDays: null, stale: false, fallback: false },
  assets,
};
validateCandidate(candidate, root);

mkdirSync(snapshotsDir, { recursive: true });
const snapshotFile = resolve(snapshotsDir, `${snapshotId}.json`);
const manifestFile = resolve(snapshotsDir, `${snapshotId}.manifest.json`);
writeFileSync(snapshotFile, JSON.stringify(candidate, null, 2));
const snapshotSha256 = createHash('sha256').update(readFileSync(snapshotFile)).digest('hex');
const manifest = { schemaVersion: 1, snapshotId, manifestId: `manifest-${snapshotId}`, snapshotSha256, policyHash };
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
const manifestSha256 = createHash('sha256').update(readFileSync(manifestFile)).digest('hex');
const candidatePointer = { schemaVersion: 1, snapshotId, manifestId: manifest.manifestId, snapshotPath: `snapshots/${snapshotId}.json`, manifestPath: `snapshots/${snapshotId}.manifest.json`, snapshotSha256, manifestSha256, policyHash };
const candidatePath = resolve(generatedRoot, 'candidate.json');
const candidatePointerPath = resolve(generatedRoot, 'candidate.pointer.json');
const currentPointerPath = resolve(generatedRoot, 'current.json');
const previousPointerPath = resolve(generatedRoot, 'previous.json');
writeFileSync(candidatePath, JSON.stringify(candidate));
writeFileSync(candidatePointerPath, JSON.stringify(candidatePointer));
const result = publishCandidate({ candidatePath, candidatePointerPath, currentPointerPath, previousPointerPath, root, snapshotRoot: generatedRoot });
console.log(JSON.stringify({ ...result, snapshotId, mode: 'catalog', rows: rows.length, unresolved: catalogQuality.unresolvedIdentityCount, sources: 'none' }));