import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCatalog, toCatalogAsset } from './analytics/catalogAdapter';
import { summarizeCatalogQuality } from './analytics/catalogQuality.mjs';
import type { CatalogQuality, CatalogSourceState } from './analytics/types';
import type { OndoCatalogAsset } from './analytics/catalogAdapter';

export interface OndoAsset extends OndoCatalogAsset {}

const catalogPath = resolve(process.cwd(), 'ontonew.md');
let catalogSource = '';
let catalogState: CatalogSourceState = 'catalog-source-missing';
let ondoCatalogRows: ReturnType<typeof parseCatalog> = [];
try {
  catalogSource = readFileSync(catalogPath, 'utf-8');
  ondoCatalogRows = parseCatalog(catalogSource);
  catalogState = ondoCatalogRows.length ? 'available' : 'catalog-source-malformed';
} catch {
  catalogState = catalogSource ? 'catalog-source-malformed' : 'catalog-source-missing';
}

export { ondoCatalogRows };
export const ondoAssets: OndoAsset[] = ondoCatalogRows.map(toCatalogAsset);
export const ondoCatalogQuality: CatalogQuality = summarizeCatalogQuality(ondoCatalogRows, 'ontonew.md', catalogState);

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 });
const marketCapAssets = ondoAssets.filter((asset) => asset.marketCap !== null);
const holderAssets = ondoAssets.filter((asset) => asset.holders !== null);
const topMarketCapAsset = [...marketCapAssets].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))[0] ?? null;
const topHoldersAsset = [...holderAssets].sort((a, b) => (b.holders ?? 0) - (a.holders ?? 0))[0] ?? null;

export const ondoStats = {
  count: ondoAssets.length,
  topMarketCapAsset,
  topHoldersAsset,
  zeroMarketCapCount: ondoAssets.filter((asset) => asset.marketCapState === 'valid-zero').length,
  totalMarketCap: marketCapAssets.reduce((sum, asset) => sum + (asset.marketCap ?? 0), 0),
  totalHolders: holderAssets.reduce((sum, asset) => sum + (asset.holders ?? 0), 0),
  marketCapFormatter: compactNumber,
};
