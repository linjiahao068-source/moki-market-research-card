import { fetchYahooChart, type YahooChartBar } from '@/lib/globalStockData/yahooChart';
import { getMarketSymbolMapping } from '@/lib/globalStockData/marketSymbol';
import type {
  TechnicalDashboardSignal,
  TechnicalDataAdapterStatus,
  TechnicalKLineBar,
  TechnicalKLineChart,
  TechnicalDataPoint,
  TechnicalDataSnapshot,
  TechnicalDataZone,
} from '@/types/research-report';
import type { SecurityMarket, SecurityRecord } from '@/types/security';

interface MarketTechnicalDataInput {
  ticker: string;
  companyName?: string;
  market?: string;
  numericCode?: string;
  slug?: string;
}

interface IndicatorValue {
  value?: number;
  warning?: string;
}

const PROVIDER = 'market_data_provider' as const;
const TRADING_DAYS_PER_YEAR = 252;

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'security';
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function inferMarket(input: MarketTechnicalDataInput): SecurityMarket {
  const market = input.market?.toUpperCase();

  if (market === 'HK' || input.numericCode || /^\d{4,5}$/.test(input.ticker.trim())) {
    return 'HK';
  }

  if (market === 'US' || /^[A-Z.]{1,8}$/i.test(input.ticker.trim())) {
    return 'US';
  }

  return 'UNKNOWN';
}

function toSecurityRecord(input: MarketTechnicalDataInput): SecurityRecord {
  const trimmedTicker = input.ticker.trim().toUpperCase();
  const numericCode = input.numericCode ?? (/^\d{4,5}$/.test(trimmedTicker) ? trimmedTicker : undefined);

  return {
    id: input.slug ?? trimmedTicker,
    market: inferMarket({ ...input, numericCode }),
    symbol: numericCode ? undefined : trimmedTicker,
    numericCode,
    companyName: input.companyName ?? trimmedTicker,
  };
}

function benchmarkSymbol(input: MarketTechnicalDataInput) {
  return inferMarket(input) === 'HK' ? '^HSI' : '^GSPC';
}

function latest(bars: YahooChartBar[]) {
  return bars.at(-1);
}

function previous(bars: YahooChartBar[]) {
  return bars.at(-2);
}

function average(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sma(bars: YahooChartBar[], length: number): IndicatorValue {
  if (bars.length < length) {
    return {
      warning: `Need ${length} bars for SMA${length}; received ${bars.length}.`,
    };
  }

  return {
    value: average(bars.slice(-length).map((bar) => bar.close)),
  };
}

function rsi(bars: YahooChartBar[], period = 14): IndicatorValue {
  if (bars.length <= period) {
    return {
      warning: `Need ${period + 1} bars for RSI${period}; received ${bars.length}.`,
    };
  }

  const window = bars.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < window.length; index += 1) {
    const change = window[index].close - window[index - 1].close;

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return {
      value: 100,
    };
  }

  const relativeStrength = averageGain / averageLoss;

  return {
    value: 100 - (100 / (1 + relativeStrength)),
  };
}

function annualizedVolatility(bars: YahooChartBar[], length = 20): IndicatorValue {
  if (bars.length <= length) {
    return {
      warning: `Need ${length + 1} bars for ${length}d realized volatility; received ${bars.length}.`,
    };
  }

  const window = bars.slice(-(length + 1));
  const returns = window.slice(1).map((bar, index) => Math.log(bar.close / window[index].close));
  const mean = average(returns);

  if (mean === undefined) {
    return {};
  }

  const variance = average(returns.map((value) => (value - mean) ** 2));

  if (variance === undefined) {
    return {};
  }

  return {
    value: Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR),
  };
}

function emaValues(bars: YahooChartBar[], length: number) {
  const values: Array<number | undefined> = Array.from({ length: bars.length });

  if (bars.length < length) {
    return values;
  }

  const multiplier = 2 / (length + 1);
  let previousEma = average(bars.slice(0, length).map((bar) => bar.close));

  if (previousEma === undefined) {
    return values;
  }

  values[length - 1] = previousEma;

  for (let index = length; index < bars.length; index += 1) {
    previousEma = ((bars[index].close - previousEma) * multiplier) + previousEma;
    values[index] = previousEma;
  }

  return values;
}

function buildChartPayload({
  symbol,
  bars,
  currency,
  dataAsOf,
  warnings,
}: {
  symbol: string;
  bars: YahooChartBar[];
  currency?: string;
  dataAsOf?: string;
  warnings: string[];
}): TechnicalKLineChart {
  const ema5 = emaValues(bars, 5);
  const ema10 = emaValues(bars, 10);
  const ema20 = emaValues(bars, 20);
  const ema50 = emaValues(bars, 50);
  const chartBars: TechnicalKLineBar[] = bars.map((bar, index) => ({
    date: bar.date.slice(0, 10),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    ema5: ema5[index],
    ema10: ema10[index],
    ema20: ema20[index],
    ema50: ema50[index],
  }));

  return {
    symbol,
    range: '6mo',
    interval: '1d',
    currency,
    dataAsOf,
    bars: chartBars,
    warnings,
  };
}

function percentChange(bars: YahooChartBar[], lookback = 60): IndicatorValue {
  if (bars.length <= lookback) {
    return {
      warning: `Need ${lookback + 1} bars for ${lookback}d change; received ${bars.length}.`,
    };
  }

  const end = latest(bars);
  const start = bars.at(-(lookback + 1));

  if (!end || !start || start.close === 0) {
    return {};
  }

  return {
    value: (end.close / start.close) - 1,
  };
}

function formatPrice(value?: number) {
  if (value === undefined) {
    return 'n/a';
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits: value >= 100 ? 2 : 3,
    minimumFractionDigits: value >= 100 ? 2 : 2,
  });
}

function formatPercent(value?: number) {
  if (value === undefined) {
    return 'n/a';
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPercent(value?: number) {
  if (value === undefined) {
    return 'n/a';
  }

  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function formatVolume(value?: number) {
  if (value === undefined) {
    return 'n/a';
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return Math.round(value).toLocaleString('en-US');
}

function priceSignal(close: number, ma20?: number, ma50?: number): TechnicalDashboardSignal {
  if (ma20 !== undefined && ma50 !== undefined && close > ma20 && ma20 >= ma50) {
    return 'constructive';
  }

  if (ma20 !== undefined && ma50 !== undefined && close < ma20 && ma20 < ma50) {
    return 'caution';
  }

  if (ma20 !== undefined && close < ma20) {
    return 'caution';
  }

  return 'neutral';
}

function rsiSignal(value?: number): TechnicalDashboardSignal {
  if (value === undefined) {
    return 'missing';
  }

  if (value >= 70 || value <= 30) {
    return 'caution';
  }

  if (value >= 50 && value < 70) {
    return 'constructive';
  }

  return 'neutral';
}

function volumeSignal(ratio?: number, priceChange?: number): TechnicalDashboardSignal {
  if (ratio === undefined) {
    return 'missing';
  }

  if (ratio >= 1.4 && (priceChange ?? 0) < 0) {
    return 'caution';
  }

  if (ratio >= 1.2 && (priceChange ?? 0) >= 0) {
    return 'constructive';
  }

  return 'neutral';
}

function relativeStrengthSignal(value?: number): TechnicalDashboardSignal {
  if (value === undefined) {
    return 'missing';
  }

  if (value >= 0.02) {
    return 'constructive';
  }

  if (value <= -0.02) {
    return 'caution';
  }

  return 'neutral';
}

function statusFor(warnings: string[]): TechnicalDataAdapterStatus {
  return warnings.length > 0 ? 'partial' : 'adapted';
}

function buildPoint(input: {
  id: string;
  category: TechnicalDataPoint['category'];
  label: string;
  valueLabel: string;
  rawValue?: number;
  unit?: string;
  signal: TechnicalDashboardSignal;
  asOf?: string;
  sourceIds: string[];
  warnings?: string[];
}): TechnicalDataPoint {
  const warnings = input.warnings ?? [];

  return {
    id: input.id,
    category: input.category,
    label: input.label,
    valueLabel: input.valueLabel,
    rawValue: input.rawValue,
    unit: input.unit,
    signal: input.signal,
    status: statusFor(warnings),
    provider: PROVIDER,
    asOf: input.asOf,
    evidenceIds: [],
    factIds: [],
    sourceIds: input.sourceIds,
    warnings,
  };
}

function buildZone(input: {
  id: string;
  label: string;
  level: string;
  zoneType: TechnicalDataZone['zoneType'];
  signal: TechnicalDashboardSignal;
  asOf?: string;
  sourceIds: string[];
  warnings?: string[];
}): TechnicalDataZone {
  const warnings = input.warnings ?? [];

  return {
    id: input.id,
    label: input.label,
    level: input.level,
    zoneType: input.zoneType,
    signal: input.signal,
    status: statusFor(warnings),
    provider: PROVIDER,
    asOf: input.asOf,
    evidenceIds: [],
    factIds: [],
    sourceIds: input.sourceIds,
    warnings,
  };
}

function buildZones(bars: YahooChartBar[], asOf: string | undefined, sourceIds: string[]) {
  const recent = bars.slice(-20);
  const range = bars.slice(-120);
  const support = Math.min(...recent.map((bar) => bar.low));
  const resistance = Math.max(...recent.map((bar) => bar.high));
  const rangeLow = Math.min(...range.map((bar) => bar.low));
  const rangeHigh = Math.max(...range.map((bar) => bar.high));

  return [
    buildZone({
      id: 'technical-data-zone-20d-support',
      label: '20d Support',
      level: `${formatPrice(support)} recent low from Yahoo daily K-line`,
      zoneType: 'support',
      signal: 'neutral',
      asOf,
      sourceIds,
    }),
    buildZone({
      id: 'technical-data-zone-20d-resistance',
      label: '20d Resistance',
      level: `${formatPrice(resistance)} recent high from Yahoo daily K-line`,
      zoneType: 'resistance',
      signal: 'neutral',
      asOf,
      sourceIds,
    }),
    buildZone({
      id: 'technical-data-zone-6mo-range',
      label: '6mo Range',
      level: `${formatPrice(rangeLow)} - ${formatPrice(rangeHigh)} observed range`,
      zoneType: 'range',
      signal: 'neutral',
      asOf,
      sourceIds,
      warnings: range.length < 120 ? [`Range uses ${range.length} available bars, not a full 120-session window.`] : [],
    }),
  ];
}

function unavailableSnapshot(input: MarketTechnicalDataInput, warning: string): TechnicalDataSnapshot {
  const now = new Date().toISOString();

  return {
    id: `technical-data-yahoo-${slugPart(input.slug ?? input.ticker)}`,
    ticker: input.ticker,
    provider: PROVIDER,
    status: 'unavailable',
    generatedAt: now,
    liveDataAvailable: false,
    points: [],
    zones: [],
    sourceSummary: ['Yahoo chart adapter attempted but returned no usable K-line data.'],
    warnings: [warning],
  };
}

export async function buildMarketTechnicalDataSnapshot(
  input: MarketTechnicalDataInput
): Promise<TechnicalDataSnapshot> {
  const security = toSecurityRecord(input);
  const mapping = getMarketSymbolMapping(security);
  const yahooSymbol = mapping.yahooSymbol;

  if (!yahooSymbol) {
    return unavailableSnapshot(input, 'Unable to resolve Yahoo chart symbol for technical data adapter.');
  }

  const chart = await fetchYahooChart({
    symbol: yahooSymbol,
    range: '6mo',
    interval: '1d',
  });

  if (!chart.ok) {
    return unavailableSnapshot(input, `Yahoo chart fetch failed for ${yahooSymbol}: ${chart.error}`);
  }

  const bars = chart.bars;

  if (bars.length === 0) {
    return unavailableSnapshot(input, `Yahoo chart returned no usable K-line bars for ${yahooSymbol}.`);
  }

  const benchmark = benchmarkSymbol(input);
  const benchmarkChart = await fetchYahooChart({
    symbol: benchmark,
    range: '6mo',
    interval: '1d',
    timeoutMs: 9000,
  });
  const warnings = [...chart.warnings];
  const asOf = chart.dataAsOf ?? latest(bars)?.date;
  const sourceIds = [`yahoo-chart:${yahooSymbol}`];
  const benchmarkSourceIds = benchmarkChart.ok
    ? [...sourceIds, `yahoo-chart:${benchmark}`]
    : sourceIds;
  const ma20 = sma(bars, 20);
  const ma50 = sma(bars, 50);
  const latestBar = latest(bars);
  const previousBar = previous(bars);
  const avgVolume20 = average(bars.slice(-20).map((bar) => bar.volume));
  const volumeRatio = latestBar && avgVolume20 && avgVolume20 > 0
    ? latestBar.volume / avgVolume20
    : undefined;
  const oneDayChange = latestBar && previousBar && previousBar.close !== 0
    ? (latestBar.close / previousBar.close) - 1
    : undefined;
  const rsi14 = rsi(bars, 14);
  const vol20 = annualizedVolatility(bars, 20);
  const securityChange60 = percentChange(bars, 60);
  const benchmarkChange60 = benchmarkChart.ok ? percentChange(benchmarkChart.bars, 60) : {};
  const relativeStrength = securityChange60.value !== undefined && benchmarkChange60.value !== undefined
    ? securityChange60.value - benchmarkChange60.value
    : undefined;
  const indicatorWarnings = unique([
    ma20.warning,
    ma50.warning,
    rsi14.warning,
    vol20.warning,
    securityChange60.warning,
    benchmarkChart.ok ? benchmarkChange60.warning : `Benchmark ${benchmark} chart was unavailable.`,
  ]);

  warnings.push(...indicatorWarnings);

  const points = [
    buildPoint({
      id: 'technical-data-price-trend',
      category: 'price_action',
      label: 'Price Trend',
      valueLabel: `Close ${formatPrice(latestBar?.close)}; MA20 ${formatPrice(ma20.value)}; MA50 ${formatPrice(ma50.value)}`,
      rawValue: latestBar?.close,
      signal: latestBar ? priceSignal(latestBar.close, ma20.value, ma50.value) : 'missing',
      asOf,
      sourceIds,
      warnings: unique([ma20.warning, ma50.warning]),
    }),
    buildPoint({
      id: 'technical-data-volume-pressure',
      category: 'volume',
      label: 'Volume Pressure',
      valueLabel: `${formatVolume(latestBar?.volume)} latest volume vs ${formatVolume(avgVolume20)} 20d avg (${volumeRatio?.toFixed(2) ?? 'n/a'}x)`,
      rawValue: volumeRatio,
      unit: 'x_avg_volume',
      signal: volumeSignal(volumeRatio, oneDayChange),
      asOf,
      sourceIds,
      warnings: avgVolume20 === undefined ? ['20d average volume is unavailable.'] : [],
    }),
    buildPoint({
      id: 'technical-data-momentum-volatility',
      category: 'volatility',
      label: 'Momentum / Volatility',
      valueLabel: `RSI14 ${rsi14.value?.toFixed(1) ?? 'n/a'}; 20d realized vol ${formatPercent(vol20.value)}`,
      rawValue: rsi14.value,
      unit: 'rsi',
      signal: rsiSignal(rsi14.value),
      asOf,
      sourceIds,
      warnings: unique([rsi14.warning, vol20.warning]),
    }),
    buildPoint({
      id: 'technical-data-relative-strength',
      category: 'source_quality',
      label: 'Benchmark Relative Strength',
      valueLabel: `60d relative strength ${formatSignedPercent(relativeStrength)} vs ${benchmark}`,
      rawValue: relativeStrength,
      unit: 'percentage_point_spread',
      signal: relativeStrengthSignal(relativeStrength),
      asOf,
      sourceIds: benchmarkSourceIds,
      warnings: unique([
        securityChange60.warning,
        benchmarkChart.ok ? benchmarkChange60.warning : `Benchmark ${benchmark} chart was unavailable.`,
      ]),
    }),
  ];
  const zones = buildZones(bars, asOf, sourceIds);
  const pointWarnings = points.flatMap((point) => point.warnings);
  const zoneWarnings = zones.flatMap((zone) => zone.warnings);
  const allWarnings = unique([...warnings, ...pointWarnings, ...zoneWarnings]).slice(0, 12);
  const status: TechnicalDataAdapterStatus = allWarnings.length > 0 ? 'partial' : 'adapted';

  return {
    id: `technical-data-yahoo-${slugPart(input.slug ?? input.ticker)}`,
    ticker: input.ticker,
    provider: PROVIDER,
    status,
    generatedAt: new Date().toISOString(),
    dataAsOf: asOf,
    liveDataAvailable: true,
    chart: buildChartPayload({
      symbol: yahooSymbol,
      bars,
      currency: chart.currency,
      dataAsOf: asOf,
      warnings: chart.warnings,
    }),
    points,
    zones,
    sourceSummary: unique([
      `Yahoo chart ${yahooSymbol} range=6mo interval=1d`,
      benchmarkChart.ok ? `Yahoo chart ${benchmark} benchmark range=6mo interval=1d` : undefined,
      chart.currency ? `Currency ${chart.currency}` : undefined,
    ]).slice(0, 8),
    warnings: allWarnings,
  };
}
