import { parseCatalogRows, parseMarkdown } from './catalogParser.mjs';
import type { ParsedCatalogRow } from './types';

export interface OndoCatalogAsset {
  rawRowKey: string; sourceLine: number; rank: number | null;
  contractAddress: string | null; contractAddressRaw: string | null; tokenName: string | null; tokenNameRaw: string | null; symbol: string | null; symbolRaw: string | null; website: string | null; websiteRaw: string | null;
  marketCap: number | null; marketCapRaw: string | null; holders: number | null; holdersRaw: string | null;
  marketCapState: ParsedCatalogRow['marketCap']['state']; holdersState: ParsedCatalogRow['holders']['state']; identityState: ParsedCatalogRow['identityState']; addressIsTruncated: boolean; canonicalKey: string | null; rowStatus: ParsedCatalogRow['rowStatus']; validationErrors: string[];
}
export const parseCatalog = (source: string | unknown[]): ParsedCatalogRow[] => parseCatalogRows(typeof source === 'string' ? parseMarkdown(source) : source) as ParsedCatalogRow[];
export const toCatalogAsset = (row: ParsedCatalogRow): OndoCatalogAsset => ({
  rawRowKey: row.rawRowKey,
  sourceLine: row.sourceLine,
  rank: row.rank,
  contractAddress: row.contractAddressRaw,
  contractAddressRaw: row.contractAddressRaw,
  tokenName: row.tokenNameRaw,
  tokenNameRaw: row.tokenNameRaw,
  symbol: row.symbolRaw,
  symbolRaw: row.symbolRaw,
  website: row.websiteRaw,
  websiteRaw: row.websiteRaw,
  marketCap: row.marketCap.value,
  marketCapRaw: row.marketCap.raw,
  holders: row.holders.value,
  holdersRaw: row.holders.raw,
  marketCapState: row.marketCap.state,
  holdersState: row.holders.state,
  identityState: row.identityState,
  addressIsTruncated: row.addressIsTruncated,
  canonicalKey: row.canonicalKey,
  rowStatus: row.rowStatus,
  validationErrors: row.validationErrors,
});
