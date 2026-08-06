import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCatalogRows } from '../../src/data/analytics/catalogParser.mjs';
import {
  applyCatalogFilters,
  compareCatalogRows,
  qualityMatches,
  searchMatches,
} from '../../src/data/analytics/catalogFilter.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../data/ondo/fixtures/catalog-parser-cases.json', import.meta.url), 'utf8'));

const asAsset = (row) => ({
  rawRowKey: row.rawRowKey,
  rank: row.rank,
  tokenName: row.tokenNameRaw,
  symbol: row.symbolRaw,
  contractAddress: row.contractAddressRaw,
  website: row.websiteRaw,
  marketCap: row.marketCap.value,
  holders: row.holders.value,
  marketCapState: row.marketCap.state,
  holdersState: row.holders.state,
  identityState: row.identityState,
  rowStatus: row.rowStatus,
});

const fixtureAssets = parseCatalogRows(fixture.rows, 'catalog-parser-fixture').map(asAsset);
const names = (result) => result.map((asset) => asset.tokenName);

const numericRow = (rawRowKey, rank, marketCap, holders, fields = {}) => ({
  rawRowKey,
  rank,
  tokenName: `Token ${rank}`,
  symbol: `T${rank}`,
  contractAddress: `0x${rank.toString(16).padStart(40, '0')}`,
  website: 'https://ondo.finance/',
  marketCap,
  holders,
  marketCapState: marketCap === null ? 'missing' : marketCap === 0 ? 'valid-zero' : 'valid-positive',
  holdersState: holders === null ? 'missing' : holders === 0 ? 'valid-zero' : 'valid-positive',
  identityState: 'verified',
  rowStatus: 'valid',
  ...fields,
});

test('search normalizes case and whitespace and matches name, symbol, contract, website, and rank', () => {
  assert.equal(searchMatches(fixtureAssets[0], '   ZERO   '), true);
  assert.deepEqual(names(applyCatalogFilters(fixtureAssets, { query: 'zero' })), ['Explicit Zero']);

  assert.deepEqual(names(applyCatalogFilters(fixtureAssets, { query: 'REPAon' })), ['Repeated Display']);
  assert.deepEqual(names(applyCatalogFilters(fixtureAssets, { query: '0x2222' })), ['Missing Values']);
  assert.deepEqual(names(applyCatalogFilters(fixtureAssets, { query: 'ondo.finance' })), ['Explicit Zero', 'Missing Values', 'Malformed Values', 'Repeated Display', 'Repeated Display 2']);
  assert.deepEqual(names(applyCatalogFilters(fixtureAssets, { query: ' 4 ' })), ['Repeated Display', 'Repeated Display 2']);

  assert.equal(applyCatalogFilters(fixtureAssets, { query: '   ' }).length, fixtureAssets.length);
});

test('search does not match market cap or holders values', () => {
  const secret = numericRow('cap-secret', 1, 12345, 67890);
  const rows = [secret];

  assert.equal(searchMatches(secret, '12345'), false);
  assert.equal(searchMatches(secret, '67890'), false);
  assert.equal(applyCatalogFilters(rows, { query: '12345' }).length, 0);
  assert.equal(applyCatalogFilters(rows, { query: '67890' }).length, 0);
});

test('each quality state filter matches its expected subset', () => {
  const byQuality = (quality) => names(applyCatalogFilters(fixtureAssets, { quality }));
  assert.deepEqual(byQuality('all'), ['Explicit Zero', 'Missing Values', 'Malformed Values', 'Repeated Display', 'Repeated Display 2']);
  assert.deepEqual(byQuality('unresolved-identity'), ['Repeated Display', 'Repeated Display 2']);
  assert.deepEqual(byQuality('display-duplicate'), ['Repeated Display', 'Repeated Display 2']);
  assert.deepEqual(byQuality('partial'), ['Missing Values', 'Malformed Values']);
  assert.deepEqual(byQuality('missing-numeric'), ['Missing Values']);
  assert.deepEqual(byQuality('malformed-numeric'), ['Malformed Values']);
  assert.deepEqual(byQuality('invalid-row'), []);

  assert.equal(qualityMatches(fixtureAssets[3], 'unresolved-identity'), true);
  assert.equal(qualityMatches(fixtureAssets[3], 'display-duplicate'), true);
  assert.equal(qualityMatches(fixtureAssets[1], 'partial'), true);
  assert.equal(qualityMatches(fixtureAssets[1], 'missing-numeric'), true);
  assert.equal(qualityMatches(fixtureAssets[2], 'malformed-numeric'), true);
  assert.equal(qualityMatches(fixtureAssets[0], 'invalid-row'), false);
});

test('search and quality intersect across mixed rows', () => {
  const mixed = [
    { rawRowKey: 'alpha', rank: 1, tokenName: 'Alpha Fund', symbol: 'ALF', contractAddress: '0x00000000000000000000000000000000000000aa', website: 'https://ondo.finance/', marketCap: 1000, holders: 10, marketCapState: 'valid-positive', holdersState: 'valid-positive', identityState: 'verified', rowStatus: 'valid' },
    { rawRowKey: 'beta', rank: 2, tokenName: 'Alpha Token', symbol: 'ALT', contractAddress: '0x00000000000000000000000000000000000000bb', website: 'https://ondo.finance/', marketCap: null, holders: 5, marketCapState: 'missing', holdersState: 'valid-positive', identityState: 'verified', rowStatus: 'partial' },
    { rawRowKey: 'gamma', rank: 3, tokenName: 'Beta Fund', symbol: 'BEF', contractAddress: '0x00000000000000000000000000000000000000cc', website: 'https://ondo.finance/', marketCap: 2000, holders: 50, marketCapState: 'valid-positive', holdersState: 'valid-positive', identityState: 'unresolved', rowStatus: 'display-duplicate-unresolved' },
  ];
  const intersect = (query, quality) => applyCatalogFilters(mixed, { query, quality }).map((asset) => asset.tokenName);

  assert.deepEqual(intersect('alpha', 'all'), ['Alpha Fund', 'Alpha Token']);
  assert.deepEqual(intersect('alpha', 'partial'), ['Alpha Token']);
  assert.deepEqual(intersect('alpha', 'unresolved-identity'), []);
  assert.deepEqual(intersect('fund', 'all'), ['Alpha Fund', 'Beta Fund']);
  assert.deepEqual(intersect('fund', 'display-duplicate'), ['Beta Fund']);
  assert.deepEqual(intersect('fund', 'partial'), []);
});

test('null ordering for market cap and holders never treats null as zero', () => {
  const rows = [
    numericRow('m-zero', 1, 0, 7),
    numericRow('m-null', 2, null, 3),
    numericRow('m-ten', 3, 10, 5),
  ];
  const order = (result) => result.map((row) => row.rawRowKey);

  assert.deepEqual(order(applyCatalogFilters(rows, { sort: 'market-asc' })), ['m-null', 'm-zero', 'm-ten']);
  assert.deepEqual(order(applyCatalogFilters(rows, { sort: 'market-desc' })), ['m-ten', 'm-zero', 'm-null']);

  assert.deepEqual(order(applyCatalogFilters(rows, { sort: 'holders-asc' })), ['m-null', 'm-ten', 'm-zero']);
  assert.deepEqual(order(applyCatalogFilters(rows, { sort: 'holders-desc' })), ['m-zero', 'm-ten', 'm-null']);
});

test('sort is stable with rawRowKey as tie-breaker', () => {
  const ties = [
    numericRow('z-first', 1, 100, 100),
    numericRow('a-first', 1, 100, 100),
  ];
  const ranks = (result) => result.map((row) => row.rawRowKey);

  assert.deepEqual(ranks(applyCatalogFilters(ties, { sort: 'rank-asc' })), ['a-first', 'z-first']);
  assert.deepEqual(ranks(applyCatalogFilters(ties, { sort: 'market-desc' })), ['a-first', 'z-first']);
  assert.ok(compareCatalogRows(ties[0], ties[1], 'rank-asc') > 0);
  assert.ok(compareCatalogRows(ties[1], ties[0], 'rank-asc') < 0);
});

test('reset-equivalence returns all rows in canonical order', () => {
  const defaults = applyCatalogFilters(fixtureAssets);
  const explicitReset = applyCatalogFilters(fixtureAssets, { query: '', quality: 'all', sort: 'rank-asc' });

  assert.equal(defaults.length, 5);
  assert.deepEqual(explicitReset, defaults);
  assert.deepEqual(names(defaults), ['Explicit Zero', 'Missing Values', 'Malformed Values', 'Repeated Display', 'Repeated Display 2']);
});