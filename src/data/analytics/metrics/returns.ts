import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const day = 86400000;
const adjustment = (s: any) => s.adjustment?.price ?? s.adjustment;
const pointsOf = (input: any) => input.points ?? input.series?.points ?? [];
const serialise = (value: any): string => value && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${serialise(value[key])}`).join(',')}}` : JSON.stringify(value);
const pointIdentity = (point: any) => {
  if (point.identity) {
    const evidence = point.identity.evidence ?? point.identity.provenance;
    if (point.identity.state !== 'verified' || !((Array.isArray(evidence) && evidence.length > 0) || (evidence && typeof evidence === 'object' && Object.keys(evidence).length > 0))) return null;
    return point.identity.stableId ?? point.identity.normalizedAddress?.toLowerCase() ?? null;
  }
  return point.identityId ?? null;
};
export function windowReturn(input: any, days: number, label: string, total = false): Metric {
  const s = { ...(input.series?.semantics ?? {}), ...(input.semantics ?? {}), ...input, period: input.semantics?.period ?? input.period ?? 'daily', distribution: input.distribution ?? input.semantics?.distribution ?? input.semantics?.distributionTreatment ?? input.series?.semantics?.distribution ?? input.series?.semantics?.distributionTreatment, corporateAction: input.corporateAction ?? input.semantics?.corporateAction ?? input.semantics?.corporateActionTreatment ?? input.series?.semantics?.corporateAction ?? input.series?.semantics?.corporateActionTreatment };
  const ok = checkEligibility({ ...input, identity: input.identity ?? input.series?.identity, semantics: s, requiredSemantics: ['currency', 'period', 'venue', 'adjustment', 'calendar', 'distribution', 'corporateAction'] });
  if (!ok.eligible) return nd(ok.reason!, s, `return-${label}-v1`);
  const adj = adjustment(s);
  if (total ? adj !== 'total-return' : !['total-return', 'adjusted-price'].includes(adj)) return nd(total ? 'not-total-return' : 'invalid-series', s, `return-${label}-v1`);
  const points = pointsOf(input).filter((p: any) => Number.isFinite(p.value) && !Number.isNaN(Date.parse(p.timestamp))).sort((a: any, b: any) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  if (points.length < 2) return nd('insufficient-history', s, `return-${label}-v1`);
  const canonicalIdentity = s.identity?.stableId ?? s.identity?.normalizedAddress?.toLowerCase() ?? null;
  const identities = points.map(pointIdentity);
  if (!canonicalIdentity || identities.some((value: string | null) => !value || value !== canonicalIdentity) || new Set(identities).size > 1) return nd('identity-conflict', s, `return-${label}-v1`);
  const semanticKeys = ['currency', 'period', 'venue', 'adjustment', 'calendar', 'distribution', 'corporateAction'];
  if (points.some((point: any) => semanticKeys.some((key) => serialise({ ...s, ...(point.semantics ?? {}) }[key]) !== serialise(s[key])))) return nd('incompatible-semantics', s, `return-${label}-v1`);
  const end = points[points.length - 1], start = [...points].reverse().find((p: any) => Date.parse(p.timestamp) <= Date.parse(end.timestamp) - days * day);
  if (!start || start.value <= 0 || end.value <= 0) return nd('insufficient-history', { ...s, coverage: points[0].timestamp }, `return-${label}-v1`);
  const value = total && days >= 1825 ? (end.value / start.value) ** (1 / 5) - 1 : end.value / start.value - 1;
  return derived(value, total && days >= 1825 ? 'total-return-cagr-v1' : `total-return-${label}-v1`, { ...s, window: label, period: `${start.timestamp}/${end.timestamp}` }, input.inputIds ?? []);
}
export function calculateTotalReturn(input: any): { oneYear: Metric; fiveYear: Metric } {
  return { oneYear: windowReturn(input, 365, '1y', true), fiveYear: windowReturn(input, 1825, '5y', true) };
}
export const totalReturn = calculateTotalReturn;
