import { checkEligibility, derived, nd, type Metric } from '../eligibility';
const number = (v: any) => typeof v === 'number' ? v : v?.value;
const market = (source: any, kind: 'token' | 'underlying'): Metric => {
  if (!source) return nd('field-not-present', {}, `liquidity-${kind}-v1`);
  const s = { ...(source.semantics ?? {}), ...source, period: source.window ?? source.period, series: kind, adjustment: source.adjustment ?? 'not-applicable' };
  const ok = checkEligibility({ ...source, semantics: s, identity: source.identity ?? source.instrumentId, requiredSemantics: ['currency', 'period', 'venue', 'adjustment'] });
  if (!ok.eligible) return nd(ok.reason!, s, `liquidity-${kind}-v1`);
  const value = number(source.turnover ?? source.volume);
  return Number.isFinite(value) ? derived(value, `liquidity-${kind}-v1`, { ...s, quantity: source.turnover !== undefined ? 'turnover' : 'volume' }, source.inputIds ?? []) : nd('field-not-present', s, `liquidity-${kind}-v1`);
};
export function liquidity(input: any): { token: Metric; underlying: Metric } { return { token: market(input.token ?? input.tokenMarket, 'token'), underlying: market(input.underlying ?? input.underlyingMarket, 'underlying') }; }
export const calculateLiquidity = liquidity;
