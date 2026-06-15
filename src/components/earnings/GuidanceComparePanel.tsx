import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { formatEps, formatGuidanceRange, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';

interface GuidanceComparePanelProps {
  guidance: GuidanceMetricComparison[];
  warnings?: string[];
  evidence?: GlobalGuidanceEvidence[];
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

function getEvidenceStatus(item: GlobalGuidanceEvidence) {
  return item.extracted ? '待复核' : '待抽取';
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

export function GuidanceComparePanel({ guidance, warnings = [], evidence = [] }: GuidanceComparePanelProps) {
  const orderedGuidance = guidanceOrder.map((metricKey) =>
    guidance.find((metric) => metric.metricKey === metricKey) ?? {
      metricKey,
      label: guidanceLabels[metricKey],
      quality: 'missing' as const,
      warnings: ['未提取到公司指引。'],
    }
  );
  const allWarnings = Array.from(new Set([
    ...warnings,
    ...orderedGuidance.flatMap((metric) => metric.warnings),
  ]));

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Guidance Compare</div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
          公司指引
        </h3>
      </div>

      {guidance.length === 0 ? (
        evidence.length > 0 ? (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
            <div className="mb-3 font-semibold">发现指引相关线索</div>
            <div className="space-y-2">
              {evidence.slice(0, 4).map((item) => (
                <div key={`${item.title}-${item.url}`} className="rounded-[8px] border border-[var(--brand-border)] bg-white/70 p-3">
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="font-medium text-[oklch(0.22_0.018_160)]">{item.title ?? 'Guidance evidence'}</div>
                    <span className="w-fit rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-ink)]">
                      {getEvidenceStatus(item)}
                    </span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-[oklch(0.45_0.018_160)]">
                    <span>来源：{item.source ?? '--'}</span>
                    <span>日期：{item.publishedAt ?? '--'}</span>
                    <span>类型：{item.evidenceType ?? 'unknown'}</span>
                  </div>
                  {item.snippet && <p className="text-xs leading-relaxed">{item.snippet}</p>}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold hover:underline">
                      查看来源
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
            当前未提取到结构化公司指引。
          </div>
        )
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

      {guidance.length > 0 && allWarnings.length > 0 && (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
          <div className="mb-1 font-semibold">指引提示</div>
          <ul className="space-y-1">
            {allWarnings.slice(0, 3).map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
