import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCatalogRows } from '../../src/data/analytics/catalogParser.mjs';
import { qualityStatesForAsset, summarizeCatalogQuality } from '../../src/data/analytics/catalogQuality.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../data/ondo/fixtures/catalog-parser-cases.json', import.meta.url), 'utf8'));

test('catalog quality preserves zero, missing, malformed, unresolved, and duplicate states', () => {
  const rows = parseCatalogRows(fixture.rows, 'catalog-parser-fixture');
  const quality = summarizeCatalogQuality(rows, 'catalog-parser-fixture');

  assert.equal(rows.length, 5);
  assert.equal(rows[0].marketCap.value, 0);
  assert.equal(rows[0].marketCap.state, 'valid-zero');
  assert.equal(rows[0].holders.value, 0);
  assert.equal(rows[1].marketCap.value, null);
  assert.equal(rows[1].marketCap.state, 'missing');
  assert.equal(rows[2].holders.value, null);
  assert.equal(rows[2].holders.state, 'malformed');
  assert.equal(quality.rowCount, 5);
  assert.equal(quality.unresolvedIdentityCount, 2);
  assert.equal(quality.unavailableFieldCount, 4);
  assert.equal(quality.missingFieldCount, 2);
  assert.equal(quality.malformedFieldCount, 2);
  assert.equal(quality.duplicateDisplayRowCount, 2);
  assert.equal(quality.duplicateDisplayGroupCount, 1);
  assert.deepEqual({ valid: quality.validRowCount, partial: quality.partialRowCount, invalid: quality.invalidRowCount }, { valid: 1, partial: 2, invalid: 0 });
  assert.deepEqual(qualityStatesForAsset(rows[0]), []);
  assert.deepEqual(qualityStatesForAsset(rows[1]), ['partial', 'missing-numeric']);
  assert.deepEqual(qualityStatesForAsset(rows[2]), ['partial', 'malformed-numeric']);
  assert.deepEqual(qualityStatesForAsset(rows[3]), ['unresolved-identity', 'display-duplicate']);
});

test('missing catalog source remains unavailable instead of looking fresh', () => {
  const quality = summarizeCatalogQuality([], 'ontonew.md', 'catalog-source-missing');

  assert.equal(quality.availability, 'missing');
  assert.equal(quality.reason, 'catalog-source-missing');
  assert.equal(quality.asOf, null);
});
