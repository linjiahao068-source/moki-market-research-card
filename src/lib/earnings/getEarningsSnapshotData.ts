import { BasicCompanyData } from '@/types/basic-data';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData } from '@/types/earnings';
import { SecurityRecord } from '@/types/security';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { calcSurprise } from './earningsMath';
import { fetchFmpEarningsEstimates } from './fmpEarningsEstimatesProvider';
import { getEmptyGuidanceResult } from './guidanceProvider';
import { buildSecQuarterActuals } from './secQuarterActualsProvider';

interface GetEarningsSnapshotDataInput {
  query: string;
  basicData?: BasicCompanyData;
}

function createMissingMetric(metricKey: EarningsMetricKey, label: string, warning: string): EarningsMetricComparison {
  return {
    metricKey,
    label,
    quality: 'missing',
    warnings: [warning],
  };
}

function findMetric(metrics: EarningsMetricComparison[] | undefined, metricKey: EarningsMetricKey) {
  return metrics?.find((metric) => metric.metricKey === metricKey);
}

function mergeMetric({
  metricKey,
  label,
  actualMetric,
  estimateMetric,
  preferFmpActual = false,
  missingWarning,
}: {
  metricKey: EarningsMetricKey;
  label: string;
  actualMetric?: EarningsMetricComparison;
  estimateMetric?: EarningsMetricComparison;
  preferFmpActual?: boolean;
  missingWarning: string;
}): EarningsMetricComparison {
  const actual = preferFmpActual
    ? estimateMetric?.actual ?? actualMetric?.actual
    : actualMetric?.actual ?? estimateMetric?.actual;
  const estimate = estimateMetric?.estimate;
  const surprise = calcSurprise(actual, estimate);
  const warnings = [
    ...(actualMetric?.warnings ?? []),
    ...(estimateMetric?.warnings ?? []),
  ];

  if (actual === undefined && estimate === undefined) {
    warnings.push(missingWarning);
  }

  return {
    metricKey,
    label,
    currency: metricKey === 'eps' ? 'USD/share' : 'USD',
    actual,
    estimate,
    surpriseAbs: surprise.surpriseAbs,
    surprisePct: surprise.surprisePct,
    yoyPct: actualMetric?.yoyPct,
    fiscalYear: actualMetric?.fiscalYear ?? estimateMetric?.fiscalYear,
    fiscalQuarter: actualMetric?.fiscalQuarter ?? estimateMetric?.fiscalQuarter,
    periodEnd: actualMetric?.periodEnd ?? estimateMetric?.periodEnd,
    periodLabel: actualMetric?.periodLabel ?? estimateMetric?.periodLabel,
    actualSource: actual !== undefined ? (preferFmpActual && estimateMetric?.actual !== undefined ? 'fmp' : actualMetric?.actualSource) : undefined,
    estimateSource: estimate !== undefined ? estimateMetric?.estimateSource ?? 'fmp' : undefined,
    quality: actual !== undefined || estimate !== undefined ? 'estimated' : 'missing',
    warnings,
  };
}

function getSecurityFromResolution(query: string): SecurityRecord | undefined {
  const resolution = resolveSecurityInput(query);

  if (resolution.status === 'ambiguous') {
    return undefined;
  }

  return resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
}

function createEmptySnapshot(query: string, warnings: string[]): EarningsSnapshotData {
  return {
    provider: 'mock',
    fetchedAt: new Date().toISOString(),
    companyName: query || 'Unknown Company',
    symbol: query || '--',
    metrics: [
      createMissingMetric('revenue', 'Revenue', 'Revenue actual / estimate data is unavailable.'),
      createMissingMetric('netIncome', 'Net income', 'Net income actual data is unavailable.'),
      createMissingMetric('eps', 'EPS', 'EPS actual / estimate data is unavailable.'),
    ],
    guidance: [],
    sourceLinks: [],
    warnings,
  };
}

async function resolveBasicData(query: string, basicData?: BasicCompanyData) {
  if (basicData) {
    return basicData;
  }

  const security = getSecurityFromResolution(query);

  if (!security) {
    return undefined;
  }

  return getBasicCompanyData(security);
}

export async function getEarningsSnapshotData({
  query,
  basicData,
}: GetEarningsSnapshotDataInput): Promise<EarningsSnapshotData> {
  const warnings: string[] = [];
  let resolvedBasicData: BasicCompanyData | undefined;

  try {
    resolvedBasicData = await resolveBasicData(query, basicData);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Basic data lookup failed.');
  }

  if (!resolvedBasicData) {
    return createEmptySnapshot(query, ['Unable to resolve basic data for earnings snapshot.', ...warnings]);
  }

  const secActuals = buildSecQuarterActuals(resolvedBasicData);
  const secMetrics = secActuals.metrics ?? [];
  const symbol = resolvedBasicData.security.symbol ?? resolvedBasicData.security.numericCode ?? query;
  let fmpSnapshot: Partial<EarningsSnapshotData> | undefined;

  if (resolvedBasicData.security.symbol) {
    const fmpResult = await fetchFmpEarningsEstimates({
      symbol: resolvedBasicData.security.symbol,
      companyName: resolvedBasicData.profile?.companyName ?? resolvedBasicData.security.companyName,
    });

    if (fmpResult.ok) {
      fmpSnapshot = fmpResult.data;
    } else {
      warnings.push(`FMP earnings estimates unavailable: ${fmpResult.error}`);
    }
  } else {
    warnings.push('FMP earnings estimates require a symbol; skipped for this security.');
  }

  const fmpMetrics = fmpSnapshot?.metrics ?? [];
  const guidanceResult = getEmptyGuidanceResult();
  const metrics = [
    mergeMetric({
      metricKey: 'revenue',
      label: 'Revenue',
      actualMetric: findMetric(secMetrics, 'revenue'),
      estimateMetric: findMetric(fmpMetrics, 'revenue'),
      missingWarning: 'Revenue actual / estimate fields are missing.',
    }),
    mergeMetric({
      metricKey: 'netIncome',
      label: 'Net income',
      actualMetric: findMetric(secMetrics, 'netIncome'),
      missingWarning: 'Net income actual is missing; net income estimate is not supported by current providers.',
    }),
    mergeMetric({
      metricKey: 'eps',
      label: 'EPS',
      actualMetric: findMetric(secMetrics, 'eps'),
      estimateMetric: findMetric(fmpMetrics, 'eps'),
      preferFmpActual: true,
      missingWarning: 'EPS actual / estimate fields are missing.',
    }),
  ];

  return {
    provider: fmpSnapshot ? 'fmp' : secActuals.provider ?? resolvedBasicData.provider,
    fetchedAt: new Date().toISOString(),
    companyName: resolvedBasicData.profile?.companyName ?? resolvedBasicData.security.companyName,
    symbol,
    fiscalYear: secActuals.fiscalYear ?? fmpSnapshot?.fiscalYear,
    fiscalQuarter: secActuals.fiscalQuarter ?? fmpSnapshot?.fiscalQuarter,
    reportDate: secActuals.reportDate ?? fmpSnapshot?.reportDate,
    earningsDate: fmpSnapshot?.earningsDate,
    metrics,
    guidance: guidanceResult.guidance,
    sourceLinks: [
      ...resolvedBasicData.sourceLinks,
      ...(fmpSnapshot?.sourceLinks ?? []),
      ...(secActuals.sourceLinks ?? []),
    ],
    warnings: [
      ...warnings,
      ...resolvedBasicData.warnings,
      ...(secActuals.warnings ?? []),
      ...(fmpSnapshot?.warnings ?? []),
      ...guidanceResult.warnings,
      'Net income estimate is unavailable in the current V0.2.5.1 provider set.',
    ],
  };
}
