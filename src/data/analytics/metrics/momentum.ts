import { windowReturn } from './returns';
import type { Metric } from '../eligibility';
export function momentum(input: any): Record<'1m' | '3m' | '12m', Metric> {
  return { '1m': windowReturn(input, 30, '1m'), '3m': windowReturn(input, 90, '3m'), '12m': windowReturn(input, 365, '12m') };
}
export const momentumComponents = momentum;
export const calculateMomentum = momentum;
