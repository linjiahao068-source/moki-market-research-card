'use client';

import { useState } from 'react';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData } from '@/types/earnings';
import { formatEps, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';

interface EarningsSnapshotPanelProps {
  data: EarningsSnapshotData;
}

const metricLabels: Record<EarningsMetricKey, string> = {
  revenue: '营收',
  netIncome: '净利润',
  eps: 'EPS',
};

function getMetric(data: EarningsSnapshotData, metricKey: EarningsMetricKey): EarningsMetricComparison {
  return data.metrics.find((metric) => metric.metricKey === metricKey) ?? {
    metricKey,
    label: metricLabels[metricKey],
    quality: 'missing',
    warnings: [`${metricLabels[metricKey]} 数据缺失。`],
  };
}

function formatMetricValue(metric: EarningsMetricComparison, value?: number) {
  if (metric.metricKey === 'eps') {
    return formatEps(value);
  }

  return formatMoneyCompact(value, metric.currency ?? 'USD');
}

function MetricRow({ metric }: { metric: EarningsMetricComparison }) {
  const isMissing = metric.quality === 'missing';

  return (
    <tr className={isMissing ? 'text-[oklch(0.58_0.018_160)]' : 'text-[oklch(0.2_0.016_160)]'}>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold">
        {metricLabels[metric.metricKey]}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatMetricValue(metric, metric.estimate)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatMetricValue(metric, metric.actual)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatPercent(metric.surprisePct)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatPercent(metric.yoyPct)}
      </td>
    </tr>
  );
}

export function EarningsSnapshotPanel({ data }: EarningsSnapshotPanelProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const metrics = [getMetric(data, 'revenue'), getMetric(data, 'netIncome'), getMetric(data, 'eps')];
  const periodTitle = [data.fiscalYear, data.fiscalQuarter].filter(Boolean).join(' 财年 ');

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Earnings Snapshot</div>
          <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            财报快照
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
            {periodTitle ? `${periodTitle} 单季报` : '单季度财报数据待补充'}
          </p>
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
          <p>预测值指数据源提供的 consensus / estimate，可能缺失或口径不同。</p>
          <p className="mt-1">公布值指公司披露或数据源记录的 actual。较预期和同比仅为事实比较，不构成投资建议。</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-[8px] border border-border">
        <table className="min-w-[620px] w-full border-collapse bg-white text-left">
          <thead className="bg-[oklch(0.992_0.005_85)] text-xs font-semibold text-[oklch(0.45_0.018_160)]">
            <tr>
              <th className="px-3 py-2">指标</th>
              <th className="px-3 py-2">预测值</th>
              <th className="px-3 py-2">公布值</th>
              <th className="px-3 py-2">较预期</th>
              <th className="px-3 py-2">同比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {metrics.map((metric) => (
              <MetricRow key={metric.metricKey} metric={metric} />
            ))}
          </tbody>
        </table>
      </div>

      {data.warnings.length > 0 && (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
          <div className="mb-1 font-semibold">数据提示</div>
          <ul className="space-y-1">
            {data.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
