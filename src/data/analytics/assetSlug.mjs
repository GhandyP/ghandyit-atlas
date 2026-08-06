/**
 * URL-safe slug and detail href for a catalog asset.
 *
 * The catalog has no verified canonical identity, so the shareable detail URL
 * is derived from the display symbol plus the unique row number in the local
 * source (`ontonew.md:row:N`). This keeps every row addressable and stable
 * while the source is unchanged, without implying canonical identity.
 */

const rowNumber = (rawRowKey) => {
  const match = /(?:^|[:/]|\\|\s)row:(\d+)$/.exec(String(rawRowKey ?? ''));
  return match ? match[1] : '0';
};

export const assetSlug = (asset) => {
  const base = String(asset.symbol ?? 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
  return `${base}-${rowNumber(asset.rawRowKey)}`;
};

export const assetDetailHref = (asset) => `/assets/${assetSlug(asset)}/`;