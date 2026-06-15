import {
  ConsensusEstimate,
  EstimateProvider,
  standardizeRevenue,
  standardizeEps,
  RawEstimateValues,
} from '../types';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Helper to get API key
function getAlphaVantageApiKey(): string | undefined {
  return earningsProviderConfig.expectations.alphaVantageApiKey;
}

// Safe number extractor
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

// Normalize fiscal quarter from Alpha Vantage format (e.g., "2023Q1")
function extractYearAndQuarter(periodStr: string): {
  fiscalYear?: string;
  fiscalQuarter?: string;
} {
  const period = safeString(periodStr);
  if (!period) return { fiscalYear: undefined, fiscalQuarter: undefined };

  // Match patterns like "2023Q1", "Q1 2023", "2023 Q1"
  const qPattern = /(?:Q|Quarter)\s*(\d)/i;
  const yearPattern = /(\d{4})/;

  const qMatch = period.match(qPattern);
  const yearMatch = period.match(yearPattern);

  const fiscalQuarter = qMatch ? `Q${qMatch[1]}` : undefined;
  const fiscalYear = yearMatch ? yearMatch[1] : undefined;

  return { fiscalYear, fiscalQuarter };
}

// Check if response is a rate limit/information note
function isNoteResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // Common Alpha Vantage note keys
  const noteKeys = ['Note', 'Information', 'Error Message', 'Information Message'];
  for (const key of noteKeys) {
    if (obj[key] && typeof obj[key] === 'string') {
      const note = obj[key].toLowerCase();
      if (
        note.includes('rate limit') ||
        note.includes('api limit') ||
        note.includes('thank you') ||
        note.includes('please') ||
        note.includes('exceeded')
      ) {
        console.debug('[AlphaVantage] Note response:', obj[key]);
        return true;
      }
    }
  }
  return false;
}

// Safe fetch with error handling
async function alphaVantageFetch(
  params: Record<string, string>
): Promise<unknown> {
  const apiKey = getAlphaVantageApiKey();
  if (!apiKey) {
    console.debug('[AlphaVantage] No API key configured');
    return null;
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.debug('[AlphaVantage] Request failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.debug('[AlphaVantage] Raw response:', JSON.stringify(data, null, 2));

    // Check for rate limit notes
    if (isNoteResponse(data)) {
      return null;
    }

    return data;
  } catch (error) {
    console.debug('[AlphaVantage] Fetch error:', error);
    return null;
  }
}

// Parse quarterly estimates from Alpha Vantage response
function parseQuarterlyEstimates(
  quarterlyData: unknown,
  ticker: string
): ConsensusEstimate[] {
  const estimates: ConsensusEstimate[] = [];

  if (!quarterlyData || typeof quarterlyData !== 'object') {
    return estimates;
  }

  const quarterly = quarterlyData as Record<string, unknown>;

  // Alpha Vantage may structure quarterly data in different ways
  // Try common patterns
  for (const [periodKey, periodData] of Object.entries(quarterly)) {
    if (!periodData || typeof periodData !== 'object') {
      continue;
    }

    const period = periodData as Record<string, unknown>;
    const { fiscalYear, fiscalQuarter } = extractYearAndQuarter(periodKey);

    if (!fiscalYear) {
      console.debug('[AlphaVantage] Skipping period without year:', periodKey);
      continue;
    }

    // Try common field names for estimates
    // Revenue: Alpha Vantage may use M (million) or raw numbers
    const revenueRaw: RawEstimateValues = {};

    const revenueEstimateStr = safeString(
      period['revenueEstimateAvg'] ??
        period['revenueEstimate'] ??
        period['estimatedRevenue'] ??
        period['revenueAvg'] ??
        period['estimateRevenue']
    );

    if (revenueEstimateStr) {
      // Handle units like "5.2B", "1234.5M", or just numbers
      const revStr = revenueEstimateStr.toUpperCase();
      if (revStr.includes('B')) {
        const numVal = safeNumber(revStr.replace(/[^0-9.-]/g, ''));
        if (numVal !== undefined) revenueRaw.revenueBillion = numVal;
      } else if (revStr.includes('M')) {
        const numVal = safeNumber(revStr.replace(/[^0-9.-]/g, ''));
        if (numVal !== undefined) revenueRaw.revenueMillion = numVal;
      } else {
        const numVal = safeNumber(revStr);
        if (numVal !== undefined) {
          // Assume it's raw dollars if it's a very large number, million otherwise
          if (numVal > 10000000) {
            revenueRaw.revenueUsd = numVal;
          } else {
            revenueRaw.revenueMillion = numVal;
          }
        }
      }
    }

    const revenueEstimate = standardizeRevenue(revenueRaw);

    // EPS estimate
    const epsEstimateStr = safeString(
      period['epsEstimateAvg'] ??
        period['epsEstimate'] ??
        period['estimatedEps'] ??
        period['epsAvg'] ??
        period['estimateEps']
    );
    const epsEstimate = standardizeEps(safeNumber(epsEstimateStr));

    // Analyst counts
    const analystCountRevenue = safeNumber(
      period['revenueAnalystCount'] ??
        period['revenueAnalysts'] ??
        period['numberOfAnalystsRevenue'] ??
        period['analystCountRevenue']
    );

    const analystCountEps = safeNumber(
      period['epsAnalystCount'] ??
        period['epsAnalysts'] ??
        period['numberOfAnalystsEps'] ??
        period['analystCountEps'] ??
        period['analystCount'] ??
        period['numberOfAnalysts']
    );

    // Skip if no estimates at all
    if (revenueEstimate === undefined && epsEstimate === undefined) {
      continue;
    }

    estimates.push({
      ticker,
      fiscalYear,
      fiscalQuarter,
      periodEndDate: safeString(period['periodEndDate'] ?? period['date']),
      reportDate: safeString(period['reportDate'] ?? period['date']),
      snapshotTime: new Date().toISOString(),
      revenueEstimate,
      epsEstimate,
      netIncomeEstimate: undefined,
      analystCountRevenue,
      analystCountEps,
      provider: 'alpha_vantage' as EstimateProvider,
      sourceNote: 'Alpha Vantage earnings estimates',
    });
  }

  return estimates;
}

// Main fetch function
export async function fetchAlphaVantageConsensusEstimates(
  ticker: string
): Promise<ConsensusEstimate[]> {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (!getAlphaVantageApiKey()) {
    console.debug('[AlphaVantage] No API key, skipping');
    return [];
  }

  if (!normalizedTicker) {
    console.debug('[AlphaVantage] No ticker provided');
    return [];
  }

  try {
    const response = await alphaVantageFetch({
      function: 'EARNINGS_ESTIMATES',
      symbol: normalizedTicker,
    });

    if (!response || typeof response !== 'object') {
      return [];
    }

    const data = response as Record<string, unknown>;
    const estimates: ConsensusEstimate[] = [];

    // Try common Alpha Vantage response structures
    const quarterlyData =
      data['quarterlyEarningsEstimates'] ??
      data['quarterlyEstimates'] ??
      data['quarterly'] ??
      data['estimates'] ??
      data['quarterlyEarnings'];

    if (quarterlyData) {
      const quarterlyEstimates = parseQuarterlyEstimates(
        quarterlyData,
        normalizedTicker
      );
      estimates.push(...quarterlyEstimates);
    }

    // Also try direct array response
    if (estimates.length === 0 && Array.isArray(response)) {
      for (const item of response) {
        if (item && typeof item === 'object') {
          const { fiscalYear } = extractYearAndQuarter(
            safeString((item as Record<string, unknown>)['period']) ?? ''
          );
          if (fiscalYear) {
            const parsed = parseQuarterlyEstimates(
              { period: item },
              normalizedTicker
            );
            estimates.push(...parsed);
          }
        }
      }
    }

    console.debug('[AlphaVantage] Total parsed estimates:', estimates.length);
    return estimates;
  } catch (error) {
    console.debug('[AlphaVantage] Error fetching estimates:', error);
    return [];
  }
}

// Fetch and bundle estimates
export async function fetchAlphaVantageConsensusBundle(
  ticker: string
): Promise<{
  estimates: ConsensusEstimate[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  if (!getAlphaVantageApiKey()) {
    warnings.push('ALPHA_VANTAGE_API_KEY not configured');
    return { estimates: [], warnings };
  }

  try {
    const estimates = await fetchAlphaVantageConsensusEstimates(ticker);
    if (estimates.length === 0) {
      warnings.push('No Alpha Vantage estimates available for this ticker');
    }
    return { estimates, warnings };
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? error.message
        : 'Alpha Vantage estimates fetch failed'
    );
    return { estimates: [], warnings };
  }
}
