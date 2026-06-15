import {
  ConsensusEstimate,
  EstimateProvider,
  standardizeRevenue,
  standardizeEps,
  RawEstimateValues,
} from '../types';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper to get API key
function getFmpApiKey(): string | undefined {
  return earningsProviderConfig.expectations.fmpApiKey;
}

// Safe number extractor (handles strings, nulls, etc.)
function safeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// Safe string extractor
function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

// Try multiple keys for the same value (FMP field name variations)
function extractNumberByKeys(
  obj: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    const num = safeNumber(value);
    if (num !== undefined) {
      console.debug('[FMP] Found value for', key, ':', num);
      return num;
    }
  }
  return undefined;
}

function extractStringByKeys(
  obj: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    const str = safeString(value);
    if (str !== undefined && str.trim().length > 0) {
      console.debug('[FMP] Found value for', key, ':', str);
      return str;
    }
  }
  return undefined;
}

// Normalize fiscal quarter
function normalizeQuarter(q: unknown): string | undefined {
  if (q === null || q === undefined) return undefined;
  const qStr = String(q).trim();
  if (!qStr) return undefined;
  if (qStr.startsWith('Q')) return qStr;
  return `Q${qStr}`;
}

// Safe fetch with error handling
async function fmpFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T | null> {
  const apiKey = getFmpApiKey();
  if (!apiKey) {
    console.debug('[FMP] No API key configured');
    return null;
  }

  const url = new URL(`${FMP_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.debug('[FMP] Request failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.debug('[FMP] Raw response for', endpoint, ':', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.debug('[FMP] Fetch error:', error);
    return null;
  }
}

// Generic FMP estimate parser (handles field variations)
function parseGenericFmpEstimate(
  raw: Record<string, unknown>,
  ticker: string,
  sourceNote: string
): ConsensusEstimate | null {
  console.debug('[FMP] Parsing raw estimate:', raw);

  // Extract fiscal year (multiple possible field names)
  const fiscalYear = extractStringByKeys(raw, [
    'year',
    'fiscalYear',
    'calendarYear',
  ]);

  if (!fiscalYear) {
    console.debug('[FMP] Skipping - no fiscal year found');
    return null;
  }

  // Extract fiscal quarter
  const fiscalQuarter = normalizeQuarter(
    extractStringByKeys(raw, ['quarter', 'fiscalQuarter', 'period'])
  );

  // Extract revenue estimate (multiple field variations)
  const revenueRaw: RawEstimateValues = {};
  const revenueValue = extractNumberByKeys(raw, [
    'estimatedRevenueAvg',
    'estimatedRevenue',
    'revenueEstimate',
    'revenueEstimated',
    'revenueAvg',
    'estimatedRevenueMean',
    'estimatedRevenueMedian',
  ]);
  if (revenueValue !== undefined) {
    revenueRaw.revenueUsd = revenueValue;
  }

  const revenueEstimate = standardizeRevenue(revenueRaw);

  // Extract EPS estimate (multiple field variations)
  const epsValue = extractNumberByKeys(raw, [
    'estimatedEpsAvg',
    'estimatedEps',
    'epsEstimate',
    'estimatedEarning',
    'epsEstimated',
    'epsAvg',
    'estimatedEpsMean',
    'estimatedEpsMedian',
    'estimatedEPS',
  ]);
  const epsEstimate = standardizeEps(epsValue);

  // Extract analyst counts
  const analystCountRevenue = extractNumberByKeys(raw, [
    'revenueAnalysts',
    'numberAnalystsRevenue',
    'analystCountRevenue',
  ]) ?? extractNumberByKeys(raw, [
    'numberAnalysts',
    'analystCount',
    'analysts',
  ]);

  const analystCountEps = extractNumberByKeys(raw, [
    'epsAnalysts',
    'numberAnalystsEps',
    'analystCountEps',
  ]) ?? extractNumberByKeys(raw, [
    'numberAnalysts',
    'analystCount',
    'analysts',
  ]);

  // Extract dates
  const date = extractStringByKeys(raw, ['date', 'reportDate', 'periodEndDate', 'earningDate']);
  const earningDate = extractStringByKeys(raw, ['earningDate', 'earningsDate', 'reportDate', 'date']);

  return {
    ticker,
    fiscalYear,
    fiscalQuarter,
    periodEndDate: date,
    reportDate: earningDate ?? date,
    snapshotTime: new Date().toISOString(),
    revenueEstimate,
    epsEstimate,
    netIncomeEstimate: undefined, // FMP doesn't typically provide net income estimates
    analystCountRevenue,
    analystCountEps,
    provider: 'fmp' as EstimateProvider,
    sourceNote,
  };
}

// Try multiple FMP endpoints in priority order
const FMP_ENDPOINTS = [
  {
    path: '/analyst-estimates',
    note: 'FMP analyst estimates',
  },
  {
    path: '/earnings-surprises',
    note: 'FMP earnings surprises',
  },
  {
    path: '/earnings',
    note: 'FMP earnings',
  },
];

// Main fetch function
export async function fetchFmpConsensusEstimates(
  ticker: string
): Promise<ConsensusEstimate[]> {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (!getFmpApiKey()) {
    console.debug('[FMP] No API key, skipping FMP estimates');
    return [];
  }

  if (!normalizedTicker) {
    console.debug('[FMP] No ticker provided');
    return [];
  }

  const estimates: ConsensusEstimate[] = [];

  try {
    // Try multiple endpoints in order
    for (const endpoint of FMP_ENDPOINTS) {
      if (estimates.length > 0) {
        break; // Already got data, stop trying
      }

      console.debug('[FMP] Fetching', endpoint.path, 'for', normalizedTicker);
      const response = await fmpFetch<unknown>(endpoint.path, {
        symbol: normalizedTicker,
      });

      if (!response) {
        console.debug('[FMP] No response from', endpoint.path);
        continue;
      }

      // Handle array responses
      if (Array.isArray(response)) {
        console.debug('[FMP] Got array response with', response.length, 'items');
        for (const rawItem of response) {
          if (rawItem && typeof rawItem === 'object') {
            const parsed = parseGenericFmpEstimate(
              rawItem as Record<string, unknown>,
              normalizedTicker,
              endpoint.note
            );
            if (parsed && (parsed.revenueEstimate !== undefined || parsed.epsEstimate !== undefined)) {
              estimates.push(parsed);
            }
          }
        }
      }
      // Handle single object responses
      else if (response && typeof response === 'object') {
        console.debug('[FMP] Got single object response');
        const parsed = parseGenericFmpEstimate(
          response as Record<string, unknown>,
          normalizedTicker,
          endpoint.note
        );
        if (parsed && (parsed.revenueEstimate !== undefined || parsed.epsEstimate !== undefined)) {
          estimates.push(parsed);
        }
      }
    }

    console.debug('[FMP] Total parsed estimates:', estimates.length);
    return estimates;
  } catch (error) {
    console.debug('[FMP] Error fetching consensus estimates:', error);
    return [];
  }
}

// Fetch and bundle estimates
export async function fetchFmpConsensusBundle(
  ticker: string
): Promise<{
  estimates: ConsensusEstimate[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  if (!getFmpApiKey()) {
    warnings.push('FMP_API_KEY not configured');
    return { estimates: [], warnings };
  }

  try {
    const estimates = await fetchFmpConsensusEstimates(ticker);
    if (estimates.length === 0) {
      warnings.push('No FMP estimates available for this ticker');
    }
    return { estimates, warnings };
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : 'FMP estimates fetch failed'
    );
    return { estimates: [], warnings };
  }
}
