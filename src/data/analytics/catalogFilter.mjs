import { qualityStatesForAsset } from './catalogQuality.mjs';

export const DEFAULT_QUERY = '';
export const DEFAULT_QUALITY = 'all';
export const DEFAULT_SORT = 'rank-asc';

const SEARCH_FIELDS = ['rank', 'tokenName', 'symbol', 'contractAddress', 'website'];

export const normaliseSearch = (text) => (text ?? '').toString().trim().toLowerCase();

export const searchMatches = (asset, query) => {
  const term = normaliseSearch(query);
  if (!term) return true;
  return SEARCH_FIELDS.map((field) => normaliseSearch(asset?.[field])).join(' ').includes(term);
};

export const qualityMatches = (asset, quality) => {
  if (!quality || quality === DEFAULT_QUALITY) return true;
  return qualityStatesForAsset(asset).includes(quality);
};

const isNull = (value) => value === null || value === undefined;

const compareRank = (a, b) => {
  if (isNull(a) && isNull(b)) return 0;
  if (isNull(a)) return 1;
  if (isNull(b)) return -1;
  return a - b;
};

const compareNumbers = (a, b, ascending) => {
  if (isNull(a) && isNull(b)) return 0;
  if (isNull(a)) return ascending ? -1 : 1;
  if (isNull(b)) return ascending ? 1 : -1;
  return ascending ? a - b : b - a;
};

const sortTextCompare = (a, b) => String(a ?? '').toLowerCase().localeCompare(String(b ?? '').toLowerCase());

export const compareCatalogRows = (a, b, sortKey = DEFAULT_SORT) => {
  let result = 0;
  if (sortKey === 'rank-asc') {
    result = compareRank(a.rank, b.rank);
  } else if (sortKey === 'name-asc') {
    result = sortTextCompare(a.tokenName, b.tokenName);
  } else if (sortKey === 'symbol-asc') {
    result = sortTextCompare(a.symbol, b.symbol);
  } else if (sortKey === 'contract-asc') {
    result = sortTextCompare(a.contractAddress, b.contractAddress);
  } else if (sortKey === 'market-asc' || sortKey === 'market-desc') {
    result = compareNumbers(a.marketCap, b.marketCap, sortKey === 'market-asc');
  } else if (sortKey === 'holders-asc' || sortKey === 'holders-desc') {
    result = compareNumbers(a.holders, b.holders, sortKey === 'holders-asc');
  } else {
    result = compareRank(a.rank, b.rank);
  }
  return result || String(a.rawRowKey ?? '').localeCompare(String(b.rawRowKey ?? ''));
};

export const applyCatalogFilters = (assets, { query = DEFAULT_QUERY, quality = DEFAULT_QUALITY, sort = DEFAULT_SORT } = {}) =>
  (Array.isArray(assets) ? assets : [])
    .filter((asset) => searchMatches(asset, query) && qualityMatches(asset, quality))
    .sort((a, b) => compareCatalogRows(a, b, sort));