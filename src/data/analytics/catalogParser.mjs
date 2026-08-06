const noise = (value) => !value || value === 'Show rows:' || value.startsWith('#\tContract Address') || value.startsWith('# Contract Address');
const safeUrl = (raw) => {
  if (raw == null || !/^https?:\/\//i.test(String(raw).trim())) return null;
  try { const url = new URL(String(raw).trim()); return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null; } catch { return null; }
};
const numeric = (raw, kind) => {
  const value = raw == null ? null : String(raw);
  if (value === null || value.trim() === '') return { raw: value, value: null, state: 'missing' };
  const cleaned = value.replace(/[$,]/g, '').trim();
  const valid = kind === 'count' ? /^\d+$/.test(cleaned) : /^\d+(?:\.\d+)?$/.test(cleaned);
  if (!valid) return { raw: value, value: null, state: 'malformed' };
  const parsed = Number(cleaned);
  return { raw: value, value: parsed, state: parsed === 0 ? 'valid-zero' : 'valid-positive' };
};
export const parseCatalogRows = (input, source = 'ontonew.md') => {
  const rows = Array.isArray(input) ? input : parseMarkdown(input);
  const displays = new Map();
  rows.forEach((row) => { const key = String(row.contractAddress ?? '').trim().toLowerCase(); if (key) displays.set(key, (displays.get(key) ?? 0) + 1); });
  return rows.map((raw, index) => {
    const address = raw.contractAddress == null ? null : String(raw.contractAddress).trim();
    const truncated = Boolean(address?.includes('...'));
    const chain = raw.chain ? String(raw.chain).trim() : '';
    const stableId = raw.stableId ? String(raw.stableId).trim() : '';
    const full = address && /^0x[\da-f]{40}$/i.test(address);
    const verified = Boolean(full && chain && stableId);
    const displayKey = (address ?? '').toLowerCase();
    const rankValue = raw.rank == null || String(raw.rank).trim() === '' ? null : Number(raw.rank);
    const rank = Number.isInteger(rankValue) && rankValue >= 0 ? rankValue : null;
    const marketCap = numeric(raw.marketCap, 'money');
    const holders = numeric(raw.holders, 'count');
    const errors = [marketCap, holders].flatMap((field, index) => ['missing', 'malformed'].includes(field.state) ? [`${index ? 'holders' : 'market-cap'}-${field.state}`] : []).concat(rank === null && raw.rank != null ? ['rank-malformed'] : [], truncated ? ['truncated-identity'] : []);
    const status = truncated && (displays.get(displayKey) ?? 0) > 1 ? 'display-duplicate-unresolved' : verified ? (errors.length ? 'partial' : 'valid') : 'unresolved-identity';
    return { rawRowKey: `${source}:row:${index + 1}`, sourceLine: raw.sourceLine ?? null, rank, contractAddressRaw: address || null, tokenNameRaw: raw.tokenName == null || String(raw.tokenName).trim() === '' ? null : String(raw.tokenName), symbolRaw: raw.symbol == null || String(raw.symbol).trim() === '' ? null : String(raw.symbol), websiteRaw: safeUrl(raw.website), marketCap, holders, identityState: verified ? 'verified' : truncated || !address ? 'unresolved' : 'candidate-display-only', addressIsTruncated: truncated, canonicalKey: verified ? `${chain.toLowerCase()}:${address.toLowerCase()}` : null, rowStatus: status, validationErrors: errors };
  });
};
export const parseMarkdown = (markdown) => {
  const lines = String(markdown ?? '').replace(/\r/g, '').split('\n'); const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    const rank = lines[i].trim().match(/^(\d+)$/); if (!rank) continue; const values = [];
    for (let j = i + 1; j < lines.length && values.length < 5; j += 1) {
      const value = lines[j].trim();
      if (/^\d+$/.test(value)) break;
      if (!noise(value)) values.push(value);
    }
    const [contractAddress = '', tokenName = '', symbol = '', marketLine = '', website = ''] = values;
    const [marketCap = '', holders = ''] = marketLine.split(/\t+/).map((part) => part.trim());
    rows.push({ sourceLine: i + 1, rank: rank[1], contractAddress, tokenName, symbol: symbol.replace(/^\((.*)\)$/, '$1').trim(), marketCap, holders, website });
  }
  return rows;
};
