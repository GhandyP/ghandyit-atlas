import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const number = (v: any) => typeof v === 'number' ? v : v?.value;
const component = (input: any, key: string, method: string): Metric => {
  const s = { ...(input.semantics ?? {}), ...input, period: input.lookback ?? input.period };
  const ok = checkEligibility({ ...input, semantics: s, requiredSemantics: ['currency', 'period', 'venue', 'adjustment'] });
  if (!ok.eligible) return nd(ok.reason!, s, method);
  const value = number(input[key]);
  return Number.isFinite(value) ? derived(value, method, s, input.inputIds ?? []) : nd('field-not-present', s, method);
};
export function risk(input: any): { volatility: Metric; maxDrawdown: Metric } {
  return { volatility: component(input, 'volatility', 'volatility-v1'), maxDrawdown: component(input, 'maxDrawdown', 'max-drawdown-v1') };
}
export const calculateRisk = risk;
