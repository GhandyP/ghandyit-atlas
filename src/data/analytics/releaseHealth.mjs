/**
 * Release health and rollback for the published catalog snapshot.
 *
 * Reads the `current`/`previous` pointer protocol produced by
 * `scripts/ondo/snapshot-catalog.ts` (and consumed by `ondoAnalytics.ts`) and
 * reports whether the published pointer graph is present and hash-consistent.
 * Also provides an atomic rollback that promotes the last good `previous`
 * snapshot into `current` when the current publication is rejected.
 *
 * This module is build-time/CLI only (node:fs). The site consumes it during
 * the static build to render an honest release-health line, and the ops CLI
 * consumes the same logic so the UI and the operations log never disagree.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const defaultSnapshotRoot = (root) => resolve(root, 'src/data/generated/ondo');

const sha256File = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/** Path containment: the resolved path must stay inside the snapshot root. */
function inside(file, snapshotRoot) {
  const root = resolve(snapshotRoot);
  const target = resolve(snapshotRoot, file);
  return target === root || target.startsWith(`${root}${sep}`);
}

const tryRead = (file) => {
  if (!file || !existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
};

const validPointer = (pointer) =>
  Number.isInteger(pointer?.schemaVersion)
  && pointer.schemaVersion > 0
  && typeof pointer.snapshotId === 'string'
  && pointer.snapshotId
  && typeof pointer.manifestId === 'string'
  && typeof pointer.snapshotPath === 'string'
  && typeof pointer.manifestPath === 'string'
  && /^[a-f\d]{64}$/i.test(pointer.snapshotSha256 ?? '')
  && /^[a-f\d]{64}$/i.test(pointer.manifestSha256 ?? '');

/** Hash-check the snapshot file and the manifest file behind a pointer. */
function verifyPointerFiles(pointer, snapshotRoot) {
  if (!validPointer(pointer)) return { present: false, integrity: 'missing' };
  if (!inside(pointer.snapshotPath, snapshotRoot) || !inside(pointer.manifestPath, snapshotRoot)) {
    return { present: false, integrity: 'unsafe-path' };
  }
  const snapshotFile = resolve(snapshotRoot, pointer.snapshotPath);
  const manifestFile = resolve(snapshotRoot, pointer.manifestPath);
  if (!existsSync(snapshotFile) || !existsSync(manifestFile)) return { present: false, integrity: 'missing-file' };
  const snapshotOk = sha256File(snapshotFile) === pointer.snapshotSha256;
  const manifestOk = sha256File(manifestFile) === pointer.manifestSha256;
  if (!snapshotOk || !manifestOk) return { present: true, integrity: 'hash-mismatch' };
  const snapshot = tryRead(snapshotFile);
  return {
    present: true,
    integrity: 'ok',
    snapshotSha256: pointer.snapshotSha256,
    manifestSha256: pointer.manifestSha256,
    snapshot,
    coverage: snapshot
      ? {
          rows: Array.isArray(snapshot.assets) ? snapshot.assets.length : null,
          unresolved: snapshot?.quality?.unresolvedIdentityCount ?? snapshot?.quality?.unresolvedIdentities ?? null,
          sources: Array.isArray(snapshot.sources) ? snapshot.sources.length : null,
        }
      : null,
  };
}

/**
 * Read release health for the current and previous pointers.
 * Returns safe values; never throws on a missing/inconsistent publication.
 */
export function readReleaseHealth(options = {}) {
  const { root = process.cwd(), snapshotRoot = defaultSnapshotRoot(root) } = options;
  const currentPointer = tryRead(resolve(snapshotRoot, 'current.json'));
  const previousPointer = tryRead(resolve(snapshotRoot, 'previous.json'));
  const current = verifyPointerFiles(currentPointer, snapshotRoot);
  const previous = verifyPointerFiles(previousPointer, snapshotRoot);

  let integrity = 'missing';
  if (current.present || previous.present) integrity = 'inconsistent';
  if (current.integrity === 'ok' && (previous.integrity === 'ok' || previous.integrity === 'missing')) integrity = 'ok';

  return {
    integrity,
    current: { snapshotId: currentPointer?.snapshotId ?? null, integrity: current.integrity, coverage: current.coverage },
    previous: { snapshotId: previousPointer?.snapshotId ?? null, integrity: previous.integrity, available: previous.present },
    policyHash: currentPointer?.policyHash ?? previousPointer?.policyHash ?? null,
    generatedAt: current.present ? (current.snapshot?.generatedAt ?? null) : null,
    published: current.integrity === 'ok',
  };
}

const loadPointer = (file, snapshotRoot, label) => {
  const verified = verifyPointerFiles(tryRead(file), snapshotRoot);
  if (!verified.present) throw new Error(`${label}-${verified.integrity}`);
  if (verified.integrity !== 'ok') throw new Error(`${label}-${verified.integrity}`);
  return tryRead(file);
};

/**
 * Atomically promote the last good `previous` snapshot into `current`.
 * Fails closed when there is no distinct previous snapshot to roll back to.
 */
export function rollbackRelease(options = {}) {
  const { root = process.cwd(), snapshotRoot = defaultSnapshotRoot(root) } = options;
  const currentPath = resolve(snapshotRoot, 'current.json');

  const currentPointer = loadPointer(resolve(snapshotRoot, 'current.json'), snapshotRoot, 'current');
  const previousPointer = loadPointer(resolve(snapshotRoot, 'previous.json'), snapshotRoot, 'previous');
  if (previousPointer.snapshotId === currentPointer.snapshotId) throw new Error('rollback-no-previous');
  const stage = `${currentPath}.${process.pid}.tmp`;
  writeFileSync(stage, JSON.stringify(previousPointer));
  renameSync(stage, currentPath);
  return { rolledBackTo: previousPointer.snapshotId };
}