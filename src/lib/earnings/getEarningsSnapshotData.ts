import { BasicCompanyData } from '@/types/basic-data';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData } from '@/types/earnings';
import { getGlobalEarningsSnapshotData } from './globalEarningsProvider';

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
    guidanceEvidence: [],
    sourceLinks: [],
    warnings,
  };
}

export async function getEarningsSnapshotData({
  query,
  basicData,
}: GetEarningsSnapshotDataInput): Promise<EarningsSnapshotData> {
  try {
    return await getGlobalEarningsSnapshotData({ query, basicData });
  } catch (error) {
    return createEmptySnapshot(query, [
      error instanceof Error ? error.message : 'Global earnings provider failed.',
      'Earnings snapshot fell back to an empty mock response.',
    ]);
  }
}
