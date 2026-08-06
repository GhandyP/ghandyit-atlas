export const ASSET_TYPES = [
  { key: 'equities', label: 'Equities' },
  { key: 'equity-etfs', label: 'Equity ETFs' },
  { key: 'fixed-income', label: 'Fixed income / Treasuries' },
  { key: 'stablecoins', label: 'Stablecoins / cash-like' },
  { key: 'unknown', label: 'Other / Unknown' },
] as const;

const supported = new Set(ASSET_TYPES.map(({ key }) => key));
export const normalizeAssetType = (value: unknown) => {
  const key = typeof value === 'string' ? value : value && typeof value === 'object' ? (value as { value?: unknown }).value : null;
  return typeof key === 'string' && supported.has(key as (typeof ASSET_TYPES)[number]['key']) ? key : 'unknown';
};

type Asset = { classification?: { assetType?: string | { value?: string } } };

export function buildClassificationView(assets: Asset[]) {
  const counts = new Map<string, number>(ASSET_TYPES.map(({ key }) => [key, 0]));
  for (const asset of assets) {
    const key = normalizeAssetType(asset.classification?.assetType);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    groups: ASSET_TYPES.map((group) => ({ ...group, count: counts.get(group.key) ?? 0, verified: group.key !== 'unknown' && (counts.get(group.key) ?? 0) > 0 })),
    activeDimension: 'sector' as const,
    dimensionOptions: [] as string[],
  };
}
