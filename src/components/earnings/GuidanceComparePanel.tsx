import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { formatEps, formatGuidanceRange, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';
import { getExpectationLabel, getExpectationSignal } from '@/lib/earnings/expectationSignal';
import { getGuidanceOverallLabel } from '@/lib/earnings/guidanceSignal';

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

function getGuidanceType(metricKey: GuidanceMetricKey) {
  return metricKey.toLowerCase().includes('eps') ? 'eps' : 'money';
}

function formatConsensus(metric: GuidanceMetricComparison) {
  if (metric.metricKey.toLowerCase().includes('eps')) {
    return formatEps(metric.consensus);
  }

  return formatMoneyCompact(metric.consensus);
}

function getMetricSignalLabel(metric: GuidanceMetricComparison) {
  if (metric.quality === 'verified' && metric.evidenceText) {
    return '已验证';
  }

  if (metric.quality === 'extracted') {
    return '文本抽取，待复核';
  }

  return getExpectationLabel(getExpectationSignal(metric.gapPct, getGuidanceType(metric.metricKey) === 'eps' ? 'eps' : 'default'));
}

function formatGuidanceValue(metric: GuidanceMetricComparison) {
  return formatGuidanceRange(
    metric.guidanceLow,
    metric.guidanceHigh,
    metric.guidanceMid,
    getGuidanceType(metric.metricKey)
  );
}

function getEvidenceStatus(item: GlobalGuidanceEvidence) {
  return item.extracted ? '待复核' : '待抽取';
}

function GuidanceMetricCard({ metric }: { metric: GuidanceMetricComparison }) {
  return (
    <article className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold leading-tight text-[oklch(0.16_0.014_160)]">
            {guidanceLabels[metric.metricKey]}
          </div>
          {metric.periodLabel && (
            <p className="mt-1 text-xs text-[oklch(0.48_0.018_160)]">{metric.periodLabel}</p>
          )}
        </div>
        <span className="w-fit rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
          {getMetricSignalLabel(metric)}
        </span>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">公司指引</div>
          <div className="mt-1 font-mono text-[oklch(0.18_0.014_160)]">{formatGuidanceValue(metric)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">机构预期</div>
          <div className="mt-1 font-mono text-[oklch(0.18_0.014_160)]">{formatConsensus(metric)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">差距</div>
          <div className="mt-1 font-mono text-[oklch(0.18_0.014_160)]">{formatPercent(metric.gapPct)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">口径说明</div>
          <div className="mt-1 text-[oklch(0.35_0.018_160)]">{metric.quality === 'extracted' ? '文本抽取，待复核' : '依赖来源复核'}</div>
        </div>
      </div>

      {(metric.evidenceText || metric.sourceUrl) && (
        <div className="mt-3 rounded-[8px] border border-border bg-white p-3 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
          {metric.evidenceText && <p>原文摘要：{metric.evidenceText}</p>}
          {metric.sourceUrl && (
            <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex font-semibold text-[var(--brand-ink)] hover:underline">
              查看来源依据
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function GuidanceEvidenceList({ evidence }: { evidence: GlobalGuidanceEvidence[] }) {
  return (
    <div className="space-y-2">
      {evidence.slice(0, 4).map((item) => (
        <div key={`${item.title}-${item.url}`} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3 text-sm leading-relaxed">
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="font-medium text-[oklch(0.22_0.018_160)]">{item.title ?? 'Guidance evidence'}</div>
            <span className="w-fit rounded-full border border-[var(--brand-border)] bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-ink)]">
              {getEvidenceStatus(item)}
            </span>
          </div>
          <div className="mb-2 flex flex-wrap gap-2 text-xs text-[oklch(0.45_0.018_160)]">
            <span>来源：{item.source ?? '--'}</span>
            <span>日期：{item.publishedAt ?? '--'}</span>
            <span>类型：{item.evidenceType ?? 'unknown'}</span>
          </div>
          {item.snippet && <p className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">{item.snippet}</p>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[var(--brand-ink)] hover:underline">
              查看来源
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function GuidanceComparePanel({ guidance, evidence = [] }: GuidanceComparePanelProps) {
  const overallLabel = getGuidanceOverallLabel(guidance);

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Guidance Compare</div>
          <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            公司指引
          </h3>
        </div>
        {guidance.length > 0 && (
          <span className="w-fit rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            整体：{overallLabel}
          </span>
        )}
      </div>

      {guidance.length > 0 ? (
        <div className="space-y-3">
          {guidance.map((metric) => (
            <GuidanceMetricCard key={metric.metricKey} metric={metric} />
          ))}
        </div>
      ) : evidence.length > 0 ? (
        <>
          <div className="mb-3 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
            发现指引相关线索
          </div>
          <GuidanceEvidenceList evidence={evidence} />
        </>
      ) : (
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂未获取到该公司的结构化公司指引，后续将接入财报新闻稿和电话会解析。
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-[oklch(0.5_0.018_160)]">
        当前为样例数据，后续将接入公司财报新闻稿和电话会解析。
      </p>
    </section>
  );
}
