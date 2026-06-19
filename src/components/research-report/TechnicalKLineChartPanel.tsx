'use client';

import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import type { TechnicalKLineBar, TechnicalKLineChart } from '@/types/research-report';

interface TechnicalKLineChartPanelProps {
  chart: TechnicalKLineChart;
}

const EMA_SERIES = [
  { key: 'ema5', label: 'EMA5', color: '#d88b22' },
  { key: 'ema10', label: 'EMA10', color: '#1298a8' },
  { key: 'ema20', label: 'EMA20', color: '#c35bb8' },
  { key: 'ema50', label: 'EMA50', color: '#2476b8' },
] as const;

function formatPrice(value?: number) {
  if (value === undefined) {
    return 'n/a';
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits: value >= 100 ? 2 : 3,
    minimumFractionDigits: value >= 100 ? 2 : 2,
  });
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

  return Math.round(value).toLocaleString('en-US');
}

function latestBar(bars: TechnicalKLineBar[]) {
  return bars.at(-1);
}

function previousBar(bars: TechnicalKLineBar[]) {
  return bars.at(-2);
}

function getChange(current?: TechnicalKLineBar, previous?: TechnicalKLineBar) {
  if (!current || !previous || previous.close === 0) {
    return undefined;
  }

  return {
    absolute: current.close - previous.close,
    percent: (current.close / previous.close) - 1,
  };
}

function latestEmaValues(bar: TechnicalKLineBar | undefined) {
  return EMA_SERIES.map((series) => ({
    ...series,
    value: bar?.[series.key],
  }));
}

function mapLineData(bars: TechnicalKLineBar[], key: (typeof EMA_SERIES)[number]['key']) {
  return bars
    .filter((bar) => typeof bar[key] === 'number')
    .map((bar) => ({
      time: bar.date as Time,
      value: bar[key] as number,
    }));
}

export function TechnicalKLineChartPanel({ chart }: TechnicalKLineChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const current = latestBar(chart.bars);
  const previous = previousBar(chart.bars);
  const change = getChange(current, previous);
  const isUp = (change?.absolute ?? 0) >= 0;
  const emaValues = latestEmaValues(current);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || chart.bars.length === 0) {
      return undefined;
    }

    const instance = createChart(container, {
      autoSize: true,
      height: 430,
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#ffffff',
        },
        textColor: '#4f5b55',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(25, 48, 40, 0.08)' },
        horzLines: { color: 'rgba(25, 48, 40, 0.08)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(25, 48, 40, 0.12)',
        scaleMargins: {
          top: 0.08,
          bottom: 0.24,
        },
      },
      timeScale: {
        borderColor: 'rgba(25, 48, 40, 0.12)',
        timeVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(93, 72, 31, 0.26)',
          labelBackgroundColor: '#6e541d',
        },
        horzLine: {
          color: 'rgba(93, 72, 31, 0.26)',
          labelBackgroundColor: '#6e541d',
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = instance;

    const candles = instance.addSeries(CandlestickSeries, {
      upColor: '#e64b66',
      downColor: '#089981',
      borderUpColor: '#e64b66',
      borderDownColor: '#089981',
      wickUpColor: '#e64b66',
      wickDownColor: '#089981',
    });
    candles.setData(chart.bars.map((bar) => ({
      time: bar.date as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    })));

    EMA_SERIES.forEach((series) => {
      const line = instance.addSeries(LineSeries, {
        color: series.color,
        lineWidth: series.key === 'ema50' ? 2 : 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      line.setData(mapLineData(chart.bars, series.key));
    });

    const volume = instance.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.setData(chart.bars.map((bar) => ({
      time: bar.date as Time,
      value: bar.volume,
      color: bar.close >= bar.open ? 'rgba(230, 75, 102, 0.5)' : 'rgba(8, 153, 129, 0.56)',
    })));
    instance.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
      borderVisible: false,
    });

    instance.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      instance.applyOptions({
        width: container.clientWidth,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chartRef.current = null;
      instance.remove();
    };
  }, [chart]);

  return (
    <section className="overflow-hidden rounded-[8px] border border-border bg-white">
      <div className="border-b border-border bg-[oklch(0.992_0.005_85)] px-4 py-3">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-[oklch(0.16_0.014_160)]">
                {chart.symbol}
              </span>
              <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                Daily K-line
              </span>
              <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0.018_160)]">
                {chart.range} / {chart.interval}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className={`font-mono text-3xl font-bold ${isUp ? 'text-[#d9304f]' : 'text-[#008f72]'}`}>
                {formatPrice(current?.close)}
              </span>
              {change && (
                <span className={`font-mono text-sm font-semibold ${isUp ? 'text-[#d9304f]' : 'text-[#008f72]'}`}>
                  {change.absolute >= 0 ? '+' : ''}{formatPrice(change.absolute)}
                  {' '}
                  {change.percent >= 0 ? '+' : ''}{(change.percent * 100).toFixed(2)}%
                </span>
              )}
              <span className="text-xs font-medium text-[oklch(0.48_0.018_160)]">
                Vol {formatVolume(current?.volume)}
              </span>
            </div>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-[oklch(0.48_0.018_160)]">High</span>
              <span className="font-mono font-semibold text-[oklch(0.2_0.016_160)]">{formatPrice(current?.high)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[oklch(0.48_0.018_160)]">Open</span>
              <span className="font-mono font-semibold text-[oklch(0.2_0.016_160)]">{formatPrice(current?.open)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[oklch(0.48_0.018_160)]">Low</span>
              <span className="font-mono font-semibold text-[oklch(0.2_0.016_160)]">{formatPrice(current?.low)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[oklch(0.48_0.018_160)]">Prev</span>
              <span className="font-mono font-semibold text-[oklch(0.2_0.016_160)]">{formatPrice(previous?.close)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {emaValues.map((series) => (
            <span key={series.key} className="font-mono font-semibold" style={{ color: series.color }}>
              {series.label}:{formatPrice(series.value)}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="h-[430px] w-full" />
    </section>
  );
}
