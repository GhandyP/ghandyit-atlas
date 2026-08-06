import { NORMALIZATION_METHOD } from './normalization';

export const SCORE_CONFIG = {
  version: 'score-v1', cohortScope: 'compatible-cohort-only', normalization: NORMALIZATION_METHOD,
  factors: [
    { key: 'growth', weight: 0.2, direction: 'higher' }, { key: 'value', weight: 0.15, direction: 'higher' },
    { key: 'quality', weight: 0.2, direction: 'higher' }, { key: 'momentum', weight: 0.15, direction: 'higher' },
    { key: 'risk', weight: 0.15, direction: 'lower' }, { key: 'liquidity', weight: 0.15, direction: 'higher' },
  ], minimumWeightCoverage: 0.7, minimumValidFactors: 4, missingPolicy: 'exclude-and-renormalize-visible',
} as const;

const number = (value: unknown) => typeof value === 'number' ? value : (value as { value?: unknown })?.value;
const usable = (value: unknown) => { const item = value as { status?: unknown } | null; return Boolean(item && (item.status === 'derived' || item.status === 'observed') && Number.isFinite(number(value))); };
export function scoreFactors(factors: Record<string, unknown>, cohort: string, snapshot: string) {
  const originalWeights = Object.fromEntries(SCORE_CONFIG.factors.map((factor) => [factor.key, factor.weight]));
  const valid = SCORE_CONFIG.factors.filter((factor) => usable(factors[factor.key]));
  const coverage = Number(valid.reduce((sum, factor) => sum + factor.weight, 0).toFixed(10));
  const effectiveWeights = Object.fromEntries(valid.map((factor) => [factor.key, factor.weight / coverage]));
  const base = { originalWeights, effectiveWeights, coverage, method: NORMALIZATION_METHOD, cohort, snapshot };
  if (!cohort || cohort === 'unknown' || !snapshot || valid.length < SCORE_CONFIG.minimumValidFactors || coverage + 1e-9 < SCORE_CONFIG.minimumWeightCoverage) return { ...base, value: null, status: 'unavailable', reason: 'insufficient-factor-coverage' };
  return { ...base, value: valid.reduce((sum, factor) => sum + Number(number(factors[factor.key])) * (factor.weight / coverage), 0), status: 'derived', reason: null };
}
