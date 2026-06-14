import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { formatEps, formatGuidanceRange, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';

interface GuidanceComparePanelProps {
  guidance: GuidanceMetricComparison[];
  warnings?: string[];
}

const guidanceLabels: Record<GuidanceMetricKey, string> = {
  nextQuarterRevenue: '下季度营收',
  nextQuarterEps: '下季度 EPS',
  fullYearRevenue: '下财年营收',
  fullYearEps: '下财年 EPS',
};

const guidanceOrder: GuidanceMetricKey[] = [
  'nextQuarterRevenue',
  'nextQuarterEps',
  'fullYearRevenue',
  'fullYearEps',
];

function getGuidanceType(metricKey: GuidanceMetricKey) {
  return metricKey.toLowerCase().includes('eps') ? 'eps' : 'money';
}

function formatConsensus(metric: GuidanceMetricComparison) {
  if (metric.metricKey.toLowerCase().includes('eps')) {
    return formatEps(metric.consensus);
  }

  return formatMoneyCompact(metric.consensus);
}

function getStatusLabel(metric: GuidanceMetricComparison) {
  if (metric.quality === 'verified' && metric.evidenceText) {
    return '已验证';
  }

  if (metric.quality === 'extracted') {
    return '文本抽取，待复核';
  }

  if (metric.gapPct !== undefined && metric.gapPct > 0) {
    return '高于预期';
  }

  if (metric.gapPct !== undefined && metric.gapPct < 0) {
    return '低于预期';
  }

  return '--';
}

function GuidanceRow({ metric }: { metric: GuidanceMetricComparison }) {
  const guidanceType = getGuidanceType(metric.metricKey);

  return (
    <tr className={metric.quality === 'missing' ? 'text-[oklch(0.58_0.018_160)]' : 'text-[oklch(0.2_0.016_160)]'}>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold">
        {guidanceLabels[metric.metricKey]}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatGuidanceRange(metric.guidanceLow, metric.guidanceHigh, metric.guidanceMid, guidanceType)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatConsensus(metric)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {formatPercent(metric.gapPct)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm">
        {getStatusLabel(metric)}
      </td>
    </tr>
  );
}

export function GuidanceComparePanel({ guidance, warnings = [] }: GuidanceComparePanelProps) {
  const orderedGuidance = guidanceOrder.map((metricKey) =>
    guidance.find((metric) => metric.metricKey === metricKey) ?? {
      metricKey,
      label: guidanceLabels[metricKey],
      quality: 'missing' as const,
      warnings: ['未提取到公司指引。'],
    }
  );
  const allWarnings = [
    ...warnings,
    ...orderedGuidance.flatMap((metric) => metric.warnings),
  ];

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Guidance Compare</div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
          公司指引
        </h3>
      </div>

      {guidance.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          当前未提取到结构化公司指引。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-border">
          <table className="min-w-[680px] w-full border-collapse bg-white text-left">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs font-semibold text-[oklch(0.45_0.018_160)]">
              <tr>
                <th className="px-3 py-2">指引项目</th>
                <th className="px-3 py-2">公司指引</th>
                <th className="px-3 py-2">机构预期</th>
                <th className="px-3 py-2">差距</th>
                <th className="px-3 py-2">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orderedGuidance.map((metric) => (
                <GuidanceRow key={metric.metricKey} metric={metric} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {allWarnings.length > 0 && (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
          <div className="mb-1 font-semibold">指引提示</div>
          <ul className="space-y-1">
            {Array.from(new Set(allWarnings)).map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
