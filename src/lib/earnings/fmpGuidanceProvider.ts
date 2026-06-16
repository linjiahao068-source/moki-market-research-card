import { fmpFetchJson, hasFmpApiKey } from '@/lib/dataProviders/fmp/fmpClient';
import type { GuidanceMetricComparison } from '@/types/earnings';
import type { GuidanceDataResult } from './guidanceTypes';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getNumber(record: UnknownRecord, keys: string[]) {
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

function getString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function buildGuidanceMetric(record: UnknownRecord, ticker: string): GuidanceMetricComparison[] {
  const periodLabel = getString(record, ['period', 'date', 'calendarYear', 'fiscalYear']);
  const revenue = getNumber(record, ['estimatedRevenueAvg', 'revenueAvg', 'revenueEstimated']);
  const eps = getNumber(record, ['estimatedEpsAvg', 'epsAvg', 'epsEstimated', 'estimatedEPSAvg']);
  const metrics: GuidanceMetricComparison[] = [];

  if (revenue !== undefined) {
    metrics.push({
      metricKey: 'fullYearRevenue',
      label: 'Revenue consensus',
      consensus: revenue,
      periodLabel,
      source: 'fmp',
      quality: 'estimated',
      evidenceText: `${ticker} FMP analyst estimate`,
      sourceUrl: `https://financialmodelingprep.com/stable/analyst-estimates?symbol=${encodeURIComponent(ticker)}`,
      warnings: ['FMP analyst estimate used as consensus reference; company-provided guidance was not separately identified.'],
    });
  }

  if (eps !== undefined) {
    metrics.push({
      metricKey: 'fullYearEps',
      label: 'EPS consensus',
      consensus: eps,
      periodLabel,
      source: 'fmp',
      quality: 'estimated',
      evidenceText: `${ticker} FMP analyst estimate`,
      sourceUrl: `https://financialmodelingprep.com/stable/analyst-estimates?symbol=${encodeURIComponent(ticker)}`,
      warnings: ['FMP analyst estimate used as consensus reference; company-provided guidance was not separately identified.'],
    });
  }

  return metrics;
}

export async function fetchFmpGuidance(ticker: string): Promise<GuidanceDataResult> {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (!hasFmpApiKey()) {
    return {
      guidance: [],
      guidanceEvidence: [],
      source: 'FMP',
      confidence: 0,
      warnings: ['FMP_API_KEY is not configured; FMP guidance lookup was skipped.'],
    };
  }

  if (!normalizedTicker) {
    return {
      guidance: [],
      guidanceEvidence: [],
      source: 'FMP',
      confidence: 0,
      warnings: ['FMP guidance lookup requires a ticker.'],
    };
  }

  try {
    const response = await fmpFetchJson<unknown>('/analyst-estimates', { symbol: normalizedTicker });
    const records = Array.isArray(response) ? response.filter(isRecord) : [];
    const latest = records[0];

    if (!latest) {
      return {
        guidance: [],
        guidanceEvidence: [],
        source: 'FMP analyst estimates',
        confidence: 0,
        warnings: ['FMP analyst estimates returned no records.'],
      };
    }

    const guidance = buildGuidanceMetric(latest, normalizedTicker);

    return {
      guidance,
      guidanceEvidence: guidance.map((metric) => ({
        symbol: normalizedTicker,
        title: `${metric.label} from FMP analyst estimates`,
        source: 'fmp',
        url: metric.sourceUrl,
        publishedAt: getString(latest, ['date']),
        snippet: metric.evidenceText,
        evidenceType: 'analyst-estimate',
        extracted: true,
        warnings: metric.warnings,
      })),
      source: 'FMP analyst estimates',
      confidence: guidance.length > 0 ? 0.55 : 0,
      warnings: guidance.length > 0
        ? ['FMP values are consensus estimates, not necessarily company-issued guidance.']
        : ['FMP analyst estimates did not include usable revenue or EPS fields.'],
    };
  } catch (error) {
    return {
      guidance: [],
      guidanceEvidence: [],
      source: 'FMP analyst estimates',
      confidence: 0,
      warnings: [error instanceof Error ? error.message : 'FMP guidance lookup failed.'],
    };
  }
}
