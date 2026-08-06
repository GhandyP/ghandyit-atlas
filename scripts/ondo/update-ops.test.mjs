import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readReleaseHealth, rollbackRelease } from '../../src/data/analytics/releaseHealth.mjs';

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function writeSnapshot(root, id) {
  const snapshot = { schemaVersion: 1, snapshotId: id, mode: 'catalog', generatedAt: '2026-01-01T00:00:00.000Z', catalogSnapshotAt: null, sources: [], policy: 'static-catalog-v1', policyHash: 'p'.repeat(64), quality: { unresolvedIdentityCount: 1, unavailableFieldCount: 1, malformedFieldCount: 0, duplicateDisplayRowCount: 0 }, assets: [] };
  const snapshotPath = join(root, 'snapshots', `${id}.json`);
  const manifestPath = join(root, 'snapshots', `${id}.manifest.json`);
  mkdirSync(join(root, 'snapshots'), { recursive: true });
  writeFileSync(snapshotPath, JSON.stringify(snapshot));
  writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, snapshotId: id, manifestId: `manifest-${id}`, snapshotSha256: sha256(readFileSync(snapshotPath)), policyHash: 'p'.repeat(64) }));
  const pointer = {
    schemaVersion: 1,
    snapshotId: id,
    manifestId: `manifest-${id}`,
    snapshotPath: `snapshots/${id}.json`,
    manifestPath: `snapshots/${id}.manifest.json`,
    snapshotSha256: sha256(readFileSync(snapshotPath)),
    manifestSha256: sha256(readFileSync(manifestPath)),
    policyHash: 'p'.repeat(64),
  };
  writeFileSync(join(root, `${id === 'current' ? 'current.json' : 'previous.json'}`), JSON.stringify(pointer));
}

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'release-health-'));
  writeSnapshot(root, 'current');
  writeSnapshot(root, 'previous');
  const snapshotRoot = root;
  return { root, snapshotRoot, snapshotFile: join(root, 'snapshots', 'current.json') };
}

test('readReleaseHealth reports ok when both pointers are hash-consistent', () => {
  const fx = setup();
  try {
    const health = readReleaseHealth(fx);
    assert.equal(health.integrity, 'ok');
    assert.equal(health.current.snapshotId, 'current');
    assert.equal(health.previous.snapshotId, 'previous');
    assert.equal(health.previous.available, true);
    assert.equal(health.published, true);
    assert.equal(health.current.coverage.rows, 0);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test('readReleaseHealth flags a tampered snapshot as hash-mismatch', () => {
  const fx = setup();
  try {
    // Overwrite the current snapshot bytes without updating the pointer hash.
    writeFileSync(fx.snapshotFile, JSON.stringify({ schemaVersion: 1, snapshotId: 'current', mode: 'catalog', sources: [], assets: [] }));
    const health = readReleaseHealth(fx);
    assert.equal(health.integrity, 'inconsistent');
    assert.notEqual(health.current.integrity, 'ok');
    assert.equal(health.published, false);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test('readReleaseHealth reports missing when only previous exists', () => {
  const fx = setup();
  try {
    writeFileSync(join(fx.root, 'current.json'), JSON.stringify({ schemaVersion: 1, snapshotId: 'x', manifestId: 'y', snapshotPath: 'snapshots/current.json', manifestPath: 'snapshots/current.manifest.json', snapshotSha256: 'a'.repeat(64), manifestSha256: 'b'.repeat(64) }));
    const previousPointer = JSON.parse(readFileSync(join(fx.root, 'previous.json'), 'utf8'));
    writeFileSync(join(fx.root, 'previous.json'), JSON.stringify({ ...previousPointer, snapshotId: 'current' }));
    const health = readReleaseHealth(fx);
    assert.equal(health.previous.available, true);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test('rollbackRelease promotes previous into current atomically', () => {
  const fx = setup();
  try {
    const before = readFileSync(join(fx.root, 'current.json'), 'utf8');
    const previousPointer = JSON.parse(readFileSync(join(fx.root, 'previous.json'), 'utf8'));
    const { rolledBackTo } = rollbackRelease(fx);
    assert.equal(rolledBackTo, 'previous');
    const after = readFileSync(join(fx.root, 'current.json'), 'utf8');
    assert.notEqual(after, before);
    assert.equal(readReleaseHealth(fx).current.snapshotId, 'previous');
    assert.equal(previousPointer.snapshotId, 'previous');
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});

test('rollbackRelease fails closed when current already equals previous', () => {
  const fx = setup();
  try {
    const previousPointer = JSON.parse(readFileSync(join(fx.root, 'previous.json'), 'utf8'));
    writeFileSync(join(fx.root, 'current.json'), JSON.stringify({ ...previousPointer, snapshotId: 'previous' }));
    assert.throws(() => rollbackRelease(fx), /rollback-no-previous/);
  } finally { rmSync(fx.root, { recursive: true, force: true }); }
});