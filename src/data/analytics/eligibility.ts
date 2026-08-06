export type Semantics = Record<string, any>;
export type Metric<T = number> = { value: T | null; status: 'derived' | 'unavailable' | 'observed'; availability: string; reason: string | null; method: string | null; sourceId: string | null; asOf: string | null; inputIds: string[]; semantics: Semantics | null };
const fullAddress = /^0x[\da-f]{40}$/i;
const pick = (value: any, key = 'value') => value && typeof value === 'object' ? value[key] ?? value.value ?? value.kind ?? value.price ?? null : value;
const known = (value: any): boolean => value !== null && value !== undefined && value !== '' && value !== 'unknown' && (typeof value !== 'object' || Object.values(value).some((item) => known(item)));
const details = (input: any): Semantics => ({ ...(input?.series?.semantics ?? {}), ...(input?.semantics ?? {}), ...(input ?? {}) });
const unavailable = (reason: string, semantics: Semantics = {}, method: string | null = null, inputIds: string[] = []): Metric => ({ value: null, status: 'unavailable', availability: reason === 'not-applicable-cohort' ? 'not-applicable' : reason === 'stale-input' ? 'stale' : 'unavailable', reason, method, sourceId: semantics.sourceId ?? null, asOf: semantics.asOf ?? null, inputIds, semantics });
const identity = (value: any) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.state !== 'verified') return null;
  const stableId = typeof value.stableId === 'string' && value.stableId.trim() ? value.stableId.trim() : null;
  const evidence = value.evidence ?? value.provenance;
  if (!((Array.isArray(evidence) && evidence.length > 0) || (evidence && typeof evidence === 'object' && Object.keys(evidence).length > 0))) return null;
  const addresses = [value.normalizedAddress, value.address].filter((item) => typeof item === 'string' && fullAddress.test(item.trim())).map((item) => item.trim().toLowerCase());
  if (new Set(addresses).size > 1) return null;
  const normalizedAddress = addresses[0] ?? null;
  return stableId || normalizedAddress ? { stableId, normalizedAddress } : null;
};
const identityKey = (value: any) => {
  const s = details(value);
  return identity(s.identity);
};

export const nd = unavailable;
export const derived = (value: number, method: string, semantics: Semantics, inputIds: string[] = []): Metric => ({ value, status: 'derived', availability: 'available', reason: null, method, sourceId: semantics.sourceId ?? null, asOf: semantics.asOf ?? null, inputIds, semantics });

export function checkEligibility(input: any, reference?: any) {
  if (!input || typeof input !== 'object') return { eligible: false, reason: 'unresolved-identity' };
  const s = details(input);
  const id = identityKey(input);
  if (!id) return { eligible: false, reason: 'unresolved-identity' };
  const cohort = s.cohort ?? s.cohortKey ?? s.cohortEligibility?.cohortKey;
  if (!known(cohort) || input.activeCohort && cohort !== input.activeCohort) return { eligible: false, reason: 'incompatible-cohort' };
  if (s.stale || s.availability === 'stale' || s.status === 'stale') return { eligible: false, reason: 'stale-input' };
  for (const key of input.requiredSemantics ?? ['currency', 'period', 'venue', 'adjustment']) if (!known(pick(s[key], key === 'period' ? 'kind' : key))) return { eligible: false, reason: 'unknown-semantics' };
  if (reference !== undefined) {
    const r = details(reference);
    const rid = identityKey(reference);
    if (!rid) return { eligible: false, reason: 'unresolved-identity' };
    if (id.stableId && rid.stableId && id.stableId !== rid.stableId || id.normalizedAddress && rid.normalizedAddress && id.normalizedAddress !== rid.normalizedAddress) return { eligible: false, reason: 'incompatible-identity' };
    for (const key of ['cohort', 'currency', 'period', 'venue', 'calendar', 'adjustment']) if (known(pick(r[key])) && known(pick(s[key])) && JSON.stringify(r[key]) !== JSON.stringify(s[key])) return { eligible: false, reason: `incompatible-${key}` };
  }
  return { eligible: true, reason: null };
}

export const isEligible = checkEligibility;
