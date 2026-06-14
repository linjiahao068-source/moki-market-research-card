import { EarningsMetricComparison, EarningsSnapshotData } from '@/types/earnings';
import { calcSurprise } from './earningsMath';
import { fmpFetchJson, hasFmpApiKey } from '@/lib/dataProviders/fmp/fmpClient';

interface FmpEarningsEstimatesInput {
  symbol: string;
  companyName?: string;
}

export type FmpEarningsEstimatesResult =
  | {
      ok: true;
      data: Partial<EarningsSnapshotData>;
    }
  | {
      ok: false;
      error: string;
    };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function firstRecord(value: unknown): UnknownRecord | undefined {
  return Array.isArray(value) ? value.find(isRecord) : undefined;
}

function getNumber(record: UnknownRecord | undefined, keys: string[]) {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const numericValue = Number(value.replace(/,/g, ''));

      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return undefined;
}

function getString(record: UnknownRecord | undefined, keys: string[]) {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function buildMetric({
  metricKey,
  label,
  actual,
  estimate,
  warning,
}: {
  metricKey: 'revenue' | 'eps';
  label: string;
  actual?: number;
  estimate?: number;
  warning?: string;
}): EarningsMetricComparison {
  const surprise = calcSurprise(actual, estimate);
  const warnings = warning ? [warning] : [];

  if (actual === undefined && estimate === undefined) {
    warnings.push(`${label} estimate and actual were not available from FMP.`);
  }

  return {
    metricKey,
    label,
    currency: metricKey === 'eps' ? 'USD/share' : 'USD',
    actual,
    estimate,
    surpriseAbs: surprise.surpriseAbs,
    surprisePct: surprise.surprisePct,
    actualSource: actual === undefined ? undefined : 'fmp',
    estimateSource: estimate === undefined ? undefined : 'fmp',
    quality: actual !== undefined || estimate !== undefined ? 'estimated' : 'missing',
    warnings,
  };
}

// Server-side only: uses process.env.FMP_API_KEY through fmpFetchJson and must not be imported into browser code.
export async function fetchFmpEarningsEstimates({
  symbol,
  companyName,
}: FmpEarningsEstimatesInput): Promise<FmpEarningsEstimatesResult> {
  if (!hasFmpApiKey()) {
    return {
      ok: false,
      error: 'FMP_API_KEY is not configured.',
    };
  }

  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    return {
      ok: false,
      error: 'FMP earnings estimates require a symbol.',
    };
  }

  try {
    const [earningsResponse, estimatesResponse] = await Promise.all([
      fmpFetchJson<unknown>('/earnings', { symbol: normalizedSymbol }),
      fmpFetchJson<unknown>('/analyst-estimates', { symbol: normalizedSymbol }),
    ]);
    const earnings = firstRecord(earningsResponse);
    const estimates = firstRecord(estimatesResponse);
    const actualEps = getNumber(earnings, ['actualEarningResult', 'epsActual', 'actualEPS', 'eps']);
    const estimatedEps = getNumber(earnings, ['estimatedEarning', 'epsEstimated', 'estimatedEPS']);
    const consensusEps = getNumber(estimates, ['estimatedEpsAvg', 'epsAvg', 'estimatedEPSAvg', 'epsEstimated']);
    const revenueEstimate = getNumber(estimates, ['estimatedRevenueAvg', 'revenueAvg', 'estimatedRevenue', 'revenueEstimated']);
    const earningsDate = getString(earnings, ['date', 'earningsDate', 'pricedate']);
    const fiscalYear = getString(estimates, ['calendarYear', 'fiscalYear']);
    const fiscalQuarter = getString(estimates, ['period', 'fiscalQuarter']);
    const warnings: string[] = [];

    if (revenueEstimate !== undefined) {
      warnings.push('FMP revenue estimate source and consensus methodology may vary by plan; verify before using for research conclusions.');
    } else {
      warnings.push('FMP revenue estimate was not available.');
    }

    if (actualEps === undefined) {
      warnings.push('FMP actual EPS was not available.');
    }

    if (estimatedEps === undefined && consensusEps === undefined) {
      warnings.push('FMP EPS estimate was not available.');
    }

    return {
      ok: true,
      data: {
        provider: 'fmp',
        fetchedAt: new Date().toISOString(),
        companyName: companyName ?? normalizedSymbol,
        symbol: normalizedSymbol,
        fiscalYear,
        fiscalQuarter,
        earningsDate,
        metrics: [
          buildMetric({
            metricKey: 'revenue',
            label: 'Revenue',
            estimate: revenueEstimate,
            warning: revenueEstimate === undefined ? 'Revenue estimate unavailable from FMP.' : undefined,
          }),
          buildMetric({
            metricKey: 'eps',
            label: 'EPS',
            actual: actualEps,
            estimate: estimatedEps ?? consensusEps,
          }),
        ],
        guidance: [],
        sourceLinks: [
          {
            label: 'FMP earnings',
            url: `https://financialmodelingprep.com/stable/earnings?symbol=${encodeURIComponent(normalizedSymbol)}`,
          },
          {
            label: 'FMP analyst estimates',
            url: `https://financialmodelingprep.com/stable/analyst-estimates?symbol=${encodeURIComponent(normalizedSymbol)}`,
          },
        ],
        warnings,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'FMP earnings estimates provider failed.',
    };
  }
}
