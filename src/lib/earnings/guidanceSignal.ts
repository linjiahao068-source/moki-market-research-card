import { GuidanceMetricComparison } from '@/types/earnings';
import { ExpectationSignal, getExpectationLabel, getExpectationSignal } from './expectationSignal';

export function getGuidanceOverallSignal(guidance: GuidanceMetricComparison[]): ExpectationSignal {
  const values = guidance
    .map((metric) => metric.gapPct)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (values.length === 0) {
    return 'unknown';
  }

  const averageGap = values.reduce((sum, value) => sum + value, 0) / values.length;

  return getExpectationSignal(averageGap);
}

export function getGuidanceOverallLabel(guidance: GuidanceMetricComparison[]) {
  return getExpectationLabel(getGuidanceOverallSignal(guidance));
}
