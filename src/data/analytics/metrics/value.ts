import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const number = (v: any) => typeof v === 'number' ? v : v?.value;
export function value(input: any): Metric {
  const s = { ...(input.semantics ?? {}), ...input, adjustment: input.adjustment ?? 'not-applicable' };
  if (!['equities', 'equity-etfs'].includes(s.cohort)) return nd('not-applicable-cohort', s, 'value-v1');
  const ok = checkEligibility({ ...input, semantics: s, requiredSemantics: ['currency', 'period', 'venue', 'adjustment'] });
  if (!ok.eligible) return nd(ok.reason!, s, 'value-v1');
  const key = ['pe', 'pb', 'fcfYield'].find((name) => number(input[name]) !== undefined), raw = key ? number(input[key]) : undefined;
  if (input.denominator !== undefined && number(input.denominator) <= 0 || key && ['pe', 'pb'].includes(key) && (!Number.isFinite(raw) || raw <= 0)) return nd('invalid-denominator', s, 'value-v1');
  if (!key || !Number.isFinite(raw)) return nd('field-not-present', s, 'value-v1');
  return derived(['pe', 'pb'].includes(key) ? 1 / raw : raw, `value-${key}-v1`, s, input.inputIds ?? []);
}
export const calculateValue = value;
