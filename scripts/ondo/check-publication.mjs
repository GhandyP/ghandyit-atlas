import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixtureSha256, getVerifiedSource } from './providers/index.mjs';
import { validatePublication } from './validate.mjs';

const manifest = JSON.parse(readFileSync('data/ondo/verification/manifest.json', 'utf8'));
assert.ok(manifest.length && manifest.every((source) => source.verificationStatus !== 'passed'));
assert.throws(() => getVerifiedSource(manifest[0].sourceId), (error) => error.code === 'source-not-verified');
const complete = { ...manifest[0], verificationStatus: 'passed', response: { ...manifest[0].response, httpStatus: 200, responseFixturePath: 'fixtures/README.md' }, coverage: { ...manifest[0].coverage, fullAddress: 'all' }, semantics: { ...manifest[0].semantics, seriesIdentity: 'token' }, licensing: { ...manifest[0].licensing, redistributionPermission: 'approved', staticArtifactPermission: 'approved' }, verification: { fixtureReplayable: true, blockers: [] } };
complete.response.responseSha256 = fixtureSha256(complete);
const root = mkdtempSync(join(tmpdir(), 'ondo-publication-check-')); mkdirSync(join(root, 'data/ondo/verification/fixtures'), { recursive: true });
writeFileSync(join(root, 'data/ondo/verification/fixtures/README.md'), readFileSync('data/ondo/verification/fixtures/README.md')); writeFileSync(join(root, 'data/ondo/verification/manifest.json'), JSON.stringify([complete]));
const candidate = { mode: 'enriched', schemaVersion: 1, snapshotId: 'fixture', assets: [], sources: [complete], scoreConfig: { minimumWeightCoverage: 0.7, minimumValidFactors: 4, factors: [1, 2, 3, 4, 5, 6] } };
assert.deepEqual(validatePublication(candidate, [], root), { publication: 'valid' });
assert.throws(() => validatePublication({ ...candidate, sources: [{ ...complete, response: { ...complete.response, responseSha256: '0'.repeat(64) } }] }, [], root), /candidate-invalid/);
console.log(JSON.stringify({ publication: 'source-gated', blockedSources: manifest.length, candidate: 'validated', providerDisabled: true }));
