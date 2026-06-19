import { serverFetchJson } from './http';

export interface YahooChartBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooChartResult {
  ok: true;
  symbol: string;
  currency?: string;
  exchangeTimezoneName?: string;
  dataAsOf?: string;
  bars: YahooChartBar[];
  warnings: string[];
}

export interface YahooChartFailure {
  ok: false;
  symbol: string;
  error: string;
}

export type YahooChartResponse = YahooChartResult | YahooChartFailure;

const YAHOO_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberAt(values: unknown, index: number) {
  return Array.isArray(values) ? finiteNumber(values[index]) : undefined;
}

function parseBars(result: Record<string, unknown>) {
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const indicators = isRecord(result.indicators) ? result.indicators : {};
  const quote = Array.isArray(indicators.quote) ? indicators.quote.find(isRecord) : undefined;

  if (!quote) {
    return [];
  }

  return timestamps.flatMap((timestamp, index) => {
    const seconds = finiteNumber(timestamp);
    const open = numberAt(quote.open, index);
    const high = numberAt(quote.high, index);
    const low = numberAt(quote.low, index);
    const close = numberAt(quote.close, index);
    const volume = numberAt(quote.volume, index);

    if (
      seconds === undefined ||
      open === undefined ||
      high === undefined ||
      low === undefined ||
      close === undefined
    ) {
      return [];
    }

    return [{
      date: new Date(seconds * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume: volume ?? 0,
    }];
  });
}

// Server-side only: Yahoo chart data should be fetched from API routes or server code.
export async function fetchYahooChart({
  symbol,
  range = '6mo',
  interval = '1d',
  timeoutMs = 12000,
}: {
  symbol: string;
  range?: string;
  interval?: string;
  timeoutMs?: number;
}): Promise<YahooChartResponse> {
  const normalizedSymbol = symbol.trim();

  if (!normalizedSymbol) {
    return {
      ok: false,
      symbol: normalizedSymbol,
      error: 'Yahoo chart requires a symbol.',
    };
  }

  const url = new URL(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedSymbol)}`);
  url.searchParams.set('range', range);
  url.searchParams.set('interval', interval);
  url.searchParams.set('includePrePost', 'false');
  url.searchParams.set('events', 'history');

  const response = await serverFetchJson<unknown>(url.toString(), {
    timeoutMs,
    headers: {
      Accept: 'application/json',
      'User-Agent': YAHOO_USER_AGENT,
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      symbol: normalizedSymbol,
      error: response.error,
    };
  }

  const chart = isRecord(response.data) ? response.data.chart : undefined;
  const result = isRecord(chart) && Array.isArray(chart.result) ? chart.result.find(isRecord) : undefined;

  if (!result) {
    return {
      ok: false,
      symbol: normalizedSymbol,
      error: 'Yahoo chart returned no result.',
    };
  }

  const meta = isRecord(result.meta) ? result.meta : {};
  const bars = parseBars(result);
  const warnings: string[] = [];

  if (bars.length === 0) {
    warnings.push('Yahoo chart returned no usable OHLCV bars.');
  }

  if (bars.length > 0 && bars.length < 60) {
    warnings.push(`Yahoo chart returned ${bars.length} bars; long-window indicators are partial.`);
  }

  const dataAsOf = bars.at(-1)?.date;

  return {
    ok: true,
    symbol: normalizedSymbol,
    currency: stringValue(meta.currency),
    exchangeTimezoneName: stringValue(meta.exchangeTimezoneName),
    dataAsOf,
    bars,
    warnings,
  };
}
