import {
  EarningsSnapshotData,
  EarningsMetricComparison,
  GuidanceMetricComparison,
} from '@/types/earnings';
import { MetricSource, MetricQuality } from '@/types/earnings';
import {
  ConsensusEstimate,
  ConsensusEstimateBundle,
  EstimateProvider,
} from './types';

// Map our new provider type to existing MetricSource
function mapProviderToSource(provider: EstimateProvider): MetricSource {
  switch (provider) {
    case 'fmp':
      return 'fmp';
    case 'yahoo':
      return 'yahoo';
    case 'sec_derived':
      return 'sec-edgar';
    case 'manual':
      return 'manual';
    case 'mock':
      return 'mock';
    case 'alpha_vantage':
      return 'mock'; // Map to mock for now
    default:
      return 'mock';
  }
}

// Map to quality
function estimateQuality(hasEstimate: boolean, hasActual?: boolean): MetricQuality {
  if (hasActual) {
    return 'verified';
  }
  if (hasEstimate) {
    return 'estimated';
  }
  return 'missing';
}

// Build revenue metric from consensus estimate
function buildRevenueMetric(
  estimate?: ConsensusEstimate,
  actualRevenueBillion?: number
): EarningsMetricComparison {
  const warnings: string[] = [];
  const estimateValue = estimate?.revenueEstimate;

  if (estimateValue === undefined) {
    warnings.push('Revenue consensus estimate unavailable.');
  }

  return {
    metricKey: 'revenue',
    label: 'Revenue',
    currency: 'USD',
    actual: actualRevenueBillion,
    estimate: estimateValue,
    surpriseAbs:
      actualRevenueBillion !== undefined && estimateValue !== undefined
        ? actualRevenueBillion - estimateValue
        : undefined,
    surprisePct:
      actualRevenueBillion !== undefined &&
      estimateValue !== undefined &&
      estimateValue !== 0
        ? ((actualRevenueBillion - estimateValue) / estimateValue) * 100
        : undefined,
    fiscalYear: estimate?.fiscalYear,
    fiscalQuarter: estimate?.fiscalQuarter,
    periodEnd: estimate?.periodEndDate,
    periodLabel: estimate?.periodEndDate
      ? `Fiscal quarter ended ${estimate.periodEndDate}`
      : undefined,
    actualSource: actualRevenueBillion !== undefined ? 'sec-edgar' : undefined,
    estimateSource: estimate?.provider
      ? mapProviderToSource(estimate.provider)
      : undefined,
    quality: estimateQuality(estimateValue !== undefined, actualRevenueBillion !== undefined),
    warnings,
  };
}

// Build EPS metric from consensus estimate
function buildEpsMetric(
  estimate?: ConsensusEstimate,
  actualEps?: number
): EarningsMetricComparison {
  const warnings: string[] = [];
  const estimateValue = estimate?.epsEstimate;

  if (estimateValue === undefined) {
    warnings.push('EPS consensus estimate unavailable.');
  }

  return {
    metricKey: 'eps',
    label: 'EPS',
    currency: 'USD/share',
    actual: actualEps,
    estimate: estimateValue,
    surpriseAbs:
      actualEps !== undefined && estimateValue !== undefined
        ? actualEps - estimateValue
        : undefined,
    surprisePct:
      actualEps !== undefined &&
      estimateValue !== undefined &&
      estimateValue !== 0
        ? ((actualEps - estimateValue) / Math.abs(estimateValue)) * 100
        : undefined,
    fiscalYear: estimate?.fiscalYear,
    fiscalQuarter: estimate?.fiscalQuarter,
    periodEnd: estimate?.periodEndDate,
    periodLabel: estimate?.periodEndDate
      ? `Fiscal quarter ended ${estimate.periodEndDate}`
      : undefined,
    actualSource: actualEps !== undefined ? 'sec-edgar' : undefined,
    estimateSource: estimate?.provider
      ? mapProviderToSource(estimate.provider)
      : undefined,
    quality: estimateQuality(estimateValue !== undefined, actualEps !== undefined),
    warnings,
  };
}

// Build net income metric (placeholder - estimate not always available)
function buildNetIncomeMetric(
  estimate?: ConsensusEstimate,
  actualNetIncomeBillion?: number
): EarningsMetricComparison {
  const warnings: string[] = ['Net income estimate is not supported by the current provider set.'];
  const estimateValue = estimate?.netIncomeEstimate;

  return {
    metricKey: 'netIncome',
    label: 'Net income',
    currency: 'USD',
    actual: actualNetIncomeBillion,
    estimate: estimateValue,
    surpriseAbs: undefined,
    surprisePct: undefined,
    fiscalYear: estimate?.fiscalYear,
    fiscalQuarter: estimate?.fiscalQuarter,
    periodEnd: estimate?.periodEndDate,
    periodLabel: estimate?.periodEndDate
      ? `Fiscal quarter ended ${estimate.periodEndDate}`
      : undefined,
    actualSource: actualNetIncomeBillion !== undefined ? 'sec-edgar' : undefined,
    estimateSource: undefined,
    quality: estimateQuality(false, actualNetIncomeBillion !== undefined),
    warnings,
  };
}

// Convert ConsensusEstimateBundle to EarningsSnapshotData
export function consensusBundleToSnapshot(
  bundle: ConsensusEstimateBundle,
  actuals?: {
    revenueBillion?: number;
    eps?: number;
    netIncomeBillion?: number;
  }
): EarningsSnapshotData {
  const currentEstimate = bundle.current;
  const warnings: string[] = [...bundle.warnings];

  return {
    provider: currentEstimate?.provider
      ? mapProviderToSource(currentEstimate.provider)
      : 'mock',
    fetchedAt: bundle.fetchedAt,
    companyName: '', // To be filled by caller
    symbol: currentEstimate?.ticker ?? '',
    fiscalYear: currentEstimate?.fiscalYear,
    fiscalQuarter: currentEstimate?.fiscalQuarter,
    reportDate: currentEstimate?.reportDate,
    earningsDate: currentEstimate?.reportDate,
    metrics: [
      buildRevenueMetric(currentEstimate, actuals?.revenueBillion),
      buildNetIncomeMetric(currentEstimate, actuals?.netIncomeBillion),
      buildEpsMetric(currentEstimate, actuals?.eps),
    ],
    guidance: [] as GuidanceMetricComparison[],
    sourceLinks: currentEstimate?.sourceNote
      ? [
          {
            label: `${currentEstimate.provider} estimate`,
            url: '',
          },
        ]
      : [],
    warnings,
  };
}

// Create an empty bundle as fallback
export function createEmptyConsensusBundle(
  ticker: string,
  warning?: string
): ConsensusEstimateBundle {
  return {
    fetchedAt: new Date().toISOString(),
    warnings: warning ? [warning] : ['No consensus estimates available.'],
  };
}
