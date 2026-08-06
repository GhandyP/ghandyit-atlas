export const NORMALIZATION_METHOD = 'cohort-min-max-v1';
export type Direction = 'higher' | 'lower';

export function normalizeCohort(values: Array<number | null>, direction: Direction = 'higher') {
  const valid = values.filter((value): value is number => Number.isFinite(value));
  if (!valid.length) return values.map(() => null);
  const min = Math.min(...valid), max = Math.max(...valid), span = max - min || 1;
  return values.map((value) => Number.isFinite(value) ? (direction === 'lower' ? (max - value) / span : (value - min) / span) : null);
}
