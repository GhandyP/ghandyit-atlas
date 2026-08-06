import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const number = (v: any) => typeof v === 'number' ? v : v?.value;
export function quality(input: any): Metric {
  const s = { ...(input.semantics ?? {}), ...input, adjustment: input.adjustment ?? 'not-applicable' };
  if (!['equities', 'equity-etfs', 'fixed-income'].includes(s.cohort)) return nd('not-applicable-cohort', s, 'quality-v1');
  const ok = checkEligibility({ ...input, semantics: s, requiredSemantics: ['currency', 'period', 'venue', 'adjustment'] });
  if (!ok.eligible) return nd(ok.reason!, s, 'quality-v1');
  const profitability = number(input.profitability), strength = number(input.financialStrength);
  if (!Number.isFinite(profitability) || !Number.isFinite(strength)) return nd('field-not-present', s, 'quality-v1');
  return derived((profitability + strength) / 2, 'quality-v1', s, input.inputIds ?? []);
}
export const calculateQuality = quality;
