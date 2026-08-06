import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const number = (v: any) => typeof v === 'number' ? v : v?.value;
const serialise = (value: any): string => value && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${serialise(value[key])}`).join(',')}}` : JSON.stringify(value);
const periodKey = (value: any) => serialise(value ?? null);
function growth(kind: 'revenue' | 'eps', input: any): Metric {
  const s = { ...(input.semantics ?? {}), ...input, period: input.period ?? input.currentPeriod ?? 'reporting-period', adjustment: input.adjustment ?? 'not-applicable' };
  if (s.cohort !== 'equities') return nd('not-applicable-cohort', s, `${kind}-growth-v1`);
  const ok = checkEligibility({ ...input, cohort: s.cohort, semantics: s, requiredSemantics: ['currency', 'period', 'venue', 'adjustment'] });
  if (!ok.eligible) return nd(ok.reason!, s, `${kind}-growth-v1`);
  const current = number(input.current), previous = number(input.previous), cp = input.currentPeriod, pp = input.previousPeriod;
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return nd('missing-value', s, `${kind}-growth-v1`);
  const periodKeys = ['issuerId', 'currency', 'shareBasis', 'restatementState', 'periodKind'];
  if (!cp || !pp || periodKeys.some((key) => !cp[key] || !pp[key] || periodKey(cp[key]) !== periodKey(pp[key]))) return nd('non-comparable-period', s, `${kind}-growth-v1`);
  return derived((current - previous) / Math.abs(previous), `${kind}-growth-v1`, { ...s, period: `${periodKey(cp)}/${periodKey(pp)}` }, [input.currentId, input.previousId].filter(Boolean));
}
export const revenueGrowth = (input: any) => growth('revenue', input);
export const epsGrowth = (input: any) => growth('eps', input);
export const fundamentals = (input: any) => ({ revenueGrowth: revenueGrowth(input), epsGrowth: epsGrowth(input) });
