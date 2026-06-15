'use client';

import { useState } from 'react';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData } from '@/types/earnings';
import { formatEps, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';
import { getExpectationLabel, getExpectationSignal } from '@/lib/earnings/expectationSignal';

interface EarningsSnapshotPanelProps {
  data: EarningsSnapshotData;
}

const metricLabels: Record<EarningsMetricKey, string> = {
  revenue: '营收',
  netIncome: '净利润',
  eps: 'EPS',
};

function getMetric(data: EarningsSnapshotData, metricKey: EarningsMetricKey) {
  return data.metrics.find((metric) => metric.metricKey === metricKey);
}

function hasExpectationValue(metric: EarningsMetricComparison | undefined) {
  return metric?.actual !== undefined || metric?.estimate !== undefined;
}

function shouldShowNetIncome(metric: EarningsMetricComparison | undefined) {
  return metric?.actual !== undefined && metric?.estimate !== undefined;
}

function formatMetricValue(metric: EarningsMetricComparison, value?: number) {
  if (metric.metricKey === 'eps') {
    return formatEps(value);
  }

  return formatMoneyCompact(value, metric.currency ?? 'USD');
}

function MetricRow({ metric }: { metric: EarningsMetricComparison }) {
  return (
    <tr className="text-[oklch(0.2_0.016_160)]">
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold">
        {metricLabels[metric.metricKey]}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatMetricValue(metric, metric.actual)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatMetricValue(metric, metric.estimate)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatMetricValue(metric, metric.surpriseAbs)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatPercent(metric.surprisePct)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-[oklch(0.45_0.018_160)]">
        {getExpectationLabel(getExpectationSignal(metric.surprisePct, metric.metricKey === 'eps' ? 'eps' : 'default'))}
      </td>
    </tr>
  );
}

function getGuidanceOverallLabel(data: EarningsSnapshotData) {
  const firstGuidanceWithGap = data.guidance.find((item) => item.gapPct !== undefined);

  if (!firstGuidanceWithGap) {
    return undefined;
  }

  return getExpectationLabel(getExpectationSignal(firstGuidanceWithGap.gapPct));
}

export function EarningsSnapshotPanel({ data }: EarningsSnapshotPanelProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const revenue = getMetric(data, 'revenue');
  const eps = getMetric(data, 'eps');
  const netIncome = getMetric(data, 'netIncome');
  const metrics = [
    ...(hasExpectationValue(revenue) ? [revenue as EarningsMetricComparison] : []),
    ...(hasExpectationValue(eps) ? [eps as EarningsMetricComparison] : []),
    ...(shouldShowNetIncome(netIncome) ? [netIncome as EarningsMetricComparison] : []),
  ];
  const periodTitle = [data.fiscalYear, data.fiscalQuarter].filter(Boolean).join(' 财年 ');
  const guidanceOverallLabel = getGuidanceOverallLabel(data);

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Earnings Expectation</div>
          <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            财报预期差
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
            {periodTitle ? `${periodTitle} 本期 actual vs consensus` : '本期 actual vs consensus'}
          </p>
          {guidanceOverallLabel && (
            <p className="mt-1 text-xs leading-relaxed text-[oklch(0.5_0.018_160)]">
              公司指引：{guidanceOverallLabel}，详见下方公司指引模块。
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowExplanation((value) => !value)}
          className="inline-flex h-9 w-fit items-center justify-center rounded-[8px] border border-border bg-white px-3 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted"
        >
          指标说明
        </button>
      </div>

      {showExplanation && (
        <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
          <p>Actual 为本期公布值，consensus 为第三方数据源提供的机构平均预期。</p>
          <p className="mt-1">较预期为公布值与 consensus 的差额及百分比，仅用于事实比较，不构成投资建议。</p>
        </div>
      )}

      {metrics.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂未获取到该公司的财报预期数据。
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-border">
            <table className="min-w-[720px] w-full border-collapse bg-white text-left">
              <thead className="bg-[oklch(0.992_0.005_85)] text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                <tr>
                  <th className="px-3 py-2">指标</th>
                  <th className="px-3 py-2">公布值</th>
                  <th className="px-3 py-2">Consensus</th>
                  <th className="px-3 py-2">差额</th>
                  <th className="px-3 py-2">较预期</th>
                  <th className="px-3 py-2">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.map((metric) => (
                  <MetricRow key={metric.metricKey} metric={metric} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Show message if no consensus data */}
          {metrics.every((m) => m.estimate === undefined) && (
            <p className="mt-3 text-xs leading-relaxed text-[oklch(0.5_0.018_160)]">
              暂未获取到该公司的市场一致预期。
            </p>
          )}
        </>
      )}
    </section>
  );
}
