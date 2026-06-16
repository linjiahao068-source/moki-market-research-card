import { GlobalAnalystEstimate, GlobalQuarterFinancial } from '@/types/global-stock-data';
import { serverFetchJson, serverFetchText } from './http';

export type YahooQuoteSummaryModule =
  | 'earnings'
  | 'earningsTrend'
  | 'earningsHistory'
  | 'financialData'
  | 'defaultKeyStatistics'
  | 'incomeStatementHistoryQuarterly'
  | 'balanceSheetHistoryQuarterly'
  | 'cashflowStatementHistoryQuarterly'
  | 'calendarEvents';

interface YahooQuoteSummaryResult {
  ok: true;
  quarterlyFinancials: GlobalQuarterFinancial[];
  analystEstimates: GlobalAnalystEstimate[];
  earningsHistory: GlobalAnalystEstimate[];
  currentPrice?: number;
  targetPriceMean?: number;
  targetPriceHigh?: number;
  targetPriceLow?: number;
  trailingPE?: number;
  forwardPE?: number;
  trailingEps?: number;
  forwardEps?: number;
  warnings: string[];
  raw: unknown;
}

interface YahooQuoteSummaryFailure {
  ok: false;
  error: string;
}

type YahooQuoteSummaryResponse = YahooQuoteSummaryResult | YahooQuoteSummaryFailure;

const YAHOO_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let yahooCrumbCache: string | null = null;
let yahooCookieCache: string | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRawValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (isRecord(value)) {
    const raw = value.raw;

    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
  }

  return undefined;
}

function getString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (isRecord(value)) {
    const fmt = value.fmt;

    if (typeof fmt === 'string' && fmt.trim()) {
      return fmt;
    }
  }

  return undefined;
}

async function getYahooCookieAndCrumb() {
  if (yahooCrumbCache && yahooCookieCache) {
    return {
      cookie: yahooCookieCache,
      crumb: yahooCrumbCache,
    };
  }

  const cookieResponse = await serverFetchText('https://fc.yahoo.com', {
    headers: {
      'User-Agent': YAHOO_USER_AGENT,
    },
  });

  if (!cookieResponse.ok) {
    return cookieResponse;
  }

  const crumbResponse = await serverFetchText('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': YAHOO_USER_AGENT,
    },
  });

  if (!crumbResponse.ok) {
    return crumbResponse;
  }

  yahooCookieCache = '';
  yahooCrumbCache = crumbResponse.data;

  return {
    cookie: yahooCookieCache,
    crumb: yahooCrumbCache,
  };
}

function parseQuarterlyFinancials(symbol: string, result: Record<string, unknown>): GlobalQuarterFinancial[] {
  const incomeHistory = result.incomeStatementHistoryQuarterly;

  if (!isRecord(incomeHistory) || !Array.isArray(incomeHistory.incomeStatementHistory)) {
    return [];
  }

  return incomeHistory.incomeStatementHistory.filter(isRecord).map((item) => ({
    symbol,
    fiscalYear: getString(item.endDate)?.slice(0, 4),
    periodEnd: getString(item.endDate),
    revenue: getRawValue(item.totalRevenue),
    netIncome: getRawValue(item.netIncome),
    dilutedEps: getRawValue(item.dilutedEPS),
    currency: 'USD',
    source: 'yahoo',
    sourceLabel: 'Yahoo quoteSummary incomeStatementHistoryQuarterly',
    raw: item,
    warnings: [],
  }));
}

function parseAnalystEstimates(symbol: string, result: Record<string, unknown>): GlobalAnalystEstimate[] {
  const earningsTrend = result.earningsTrend;

  if (!isRecord(earningsTrend) || !Array.isArray(earningsTrend.trend)) {
    return [];
  }

  return earningsTrend.trend.filter(isRecord).map((item) => {
    const earningsEstimate = isRecord(item.earningsEstimate) ? item.earningsEstimate : undefined;
    const revenueEstimate = isRecord(item.revenueEstimate) ? item.revenueEstimate : undefined;

    return {
      symbol,
      fiscalQuarter: getString(item.period),
      periodEnd: getString(item.endDate),
      revenueEstimate: getRawValue(revenueEstimate?.avg),
      epsEstimate: getRawValue(earningsEstimate?.avg),
      source: 'yahoo',
      raw: item,
      warnings: [],
    };
  });
}

function parseEarningsHistory(symbol: string, result: Record<string, unknown>): GlobalAnalystEstimate[] {
  const earningsHistory = result.earningsHistory;

  if (!isRecord(earningsHistory) || !Array.isArray(earningsHistory.history)) {
    return [];
  }

  return earningsHistory.history.filter(isRecord).map((item) => ({
    symbol,
    periodEnd: getString(item.quarter),
    epsEstimate: getRawValue(item.epsEstimate),
    source: 'yahoo',
    raw: item,
    warnings: [],
  }));
}

function parseValuationMetrics(result: Record<string, unknown>): {
  currentPrice?: number;
  targetPriceMean?: number;
  targetPriceHigh?: number;
  targetPriceLow?: number;
  trailingPE?: number;
  forwardPE?: number;
  trailingEps?: number;
  forwardEps?: number;
} {
  const metrics: {
    currentPrice?: number;
    targetPriceMean?: number;
    targetPriceHigh?: number;
    targetPriceLow?: number;
    trailingPE?: number;
    forwardPE?: number;
    trailingEps?: number;
    forwardEps?: number;
  } = {};

  const financialData = isRecord(result.financialData) ? result.financialData : undefined;
  const defaultKeyStats = isRecord(result.defaultKeyStatistics) ? result.defaultKeyStatistics : undefined;

  if (financialData) {
    metrics.currentPrice = getRawValue(financialData.currentPrice);
    metrics.targetPriceMean = getRawValue(financialData.targetMeanPrice);
    metrics.targetPriceHigh = getRawValue(financialData.targetHighPrice);
    metrics.targetPriceLow = getRawValue(financialData.targetLowPrice);
  }

  if (defaultKeyStats) {
    metrics.trailingPE = getRawValue(defaultKeyStats.trailingPE);
    metrics.forwardPE = getRawValue(defaultKeyStats.forwardPE);
    metrics.trailingEps = getRawValue(defaultKeyStats.trailingEps);
    metrics.forwardEps = getRawValue(defaultKeyStats.forwardEps);
  }

  return metrics;
}

// Server-side only: Yahoo quoteSummary requires cookie/crumb handling and must not be imported into client components.
export async function fetchYahooQuoteSummary(
  symbol: string,
  modules: YahooQuoteSummaryModule[]
): Promise<YahooQuoteSummaryResponse> {
  const normalizedSymbol = symbol.trim();

  if (!normalizedSymbol) {
    return {
      ok: false,
      error: 'Yahoo quoteSummary requires a symbol.',
    };
  }

  const auth = await getYahooCookieAndCrumb();

  if ('ok' in auth) {
    return {
      ok: false,
      error: auth.error,
    };
  }

  const url = new URL(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(normalizedSymbol)}`);
  url.searchParams.set('modules', modules.join(','));
  url.searchParams.set('crumb', auth.crumb);

  const response = await serverFetchJson<unknown>(url.toString(), {
    headers: {
      'User-Agent': YAHOO_USER_AGENT,
      Cookie: auth.cookie,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return response;
  }

  const root = isRecord(response.data) ? response.data.quoteSummary : undefined;
  const quoteSummaryResult = isRecord(root) && Array.isArray(root.result) ? root.result.find(isRecord) : undefined;

  if (!quoteSummaryResult) {
    return {
      ok: false,
      error: 'Yahoo quoteSummary returned no result.',
    };
  }

  const warnings: string[] = [];
  const quarterlyFinancials = parseQuarterlyFinancials(normalizedSymbol, quoteSummaryResult);
  const analystEstimates = parseAnalystEstimates(normalizedSymbol, quoteSummaryResult);
  const earningsHistory = parseEarningsHistory(normalizedSymbol, quoteSummaryResult);
  const valuationMetrics = parseValuationMetrics(quoteSummaryResult);

  if (quarterlyFinancials.length === 0) {
    warnings.push('Yahoo quarterly financials were not available.');
  }

  if (analystEstimates.length === 0) {
    warnings.push('Yahoo analyst estimates were not available.');
  }

  if (earningsHistory.length === 0) {
    warnings.push('Yahoo earnings history was not available.');
  }

  if (valuationMetrics.currentPrice === undefined) {
    warnings.push('Yahoo current price was not available.');
  }

  if (valuationMetrics.targetPriceMean === undefined) {
    warnings.push('Yahoo analyst target price mean was not available.');
  }

  return {
    ok: true,
    quarterlyFinancials,
    analystEstimates,
    earningsHistory,
    ...valuationMetrics,
    warnings,
    raw: quoteSummaryResult,
  };
}
