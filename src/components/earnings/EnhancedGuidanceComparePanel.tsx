'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileSearch,
  FileText,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { formatEps, formatGuidanceRange, formatMoneyCompact } from '@/lib/earnings/formatEarningsValue';

interface EnhancedGuidanceComparePanelProps {
  guidance: GuidanceMetricComparison[];
  guidanceEvidence?: GlobalGuidanceEvidence[];
  warnings?: string[];
  source?: string;
  confidence?: number;
}

type GuidancePanelStatus = 'structured' | 'evidence-only' | 'source-issue' | 'empty';

const metricLabels: Record<GuidanceMetricKey, string> = {
  nextQuarterRevenue: '下一季度收入',
  nextQuarterEps: '下一季度 EPS',
  fullYearRevenue: '全年收入',
  fullYearEps: '全年 EPS',
};

const metricOrder: GuidanceMetricKey[] = [
  'nextQuarterRevenue',
  'nextQuarterEps',
  'fullYearRevenue',
  'fullYearEps',
];

const qualityLabels: Record<string, string> = {
  verified: '已验证',
  estimated: '估算',
  extracted: '文本抽取',
  fallback: '回退',
  missing: '缺失',
};

const sourceLabels: Record<string, string> = {
  'sec-edgar': 'SEC EDGAR',
  yahoo: 'Yahoo',
  fmp: 'FMP',
  eastmoney: '东方财富',
  mock: 'Fallback',
  manual: 'Manual',
  extracted: 'Extracted',
};

function uniqueList(items: string[] = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function isEpsMetric(metricKey: GuidanceMetricKey) {
  return metricKey.toLowerCase().includes('eps');
}

function formatMetricValue(value: number | undefined, metricKey: GuidanceMetricKey) {
  return isEpsMetric(metricKey) ? formatEps(value) : formatMoneyCompact(value, 'USD');
}

function formatMetricRange(metric: GuidanceMetricComparison) {
  return formatGuidanceRange(
    metric.guidanceLow,
    metric.guidanceHigh,
    metric.guidanceMid,
    isEpsMetric(metric.metricKey) ? 'eps' : 'money'
  );
}

function formatConfidence(confidence?: number) {
  if (confidence === undefined) {
    return '--';
  }

  return `${Math.round(confidence * 100)}%`;
}

function sourceLabel(source?: string) {
  if (!source) {
    return '来源待确认';
  }

  return sourceLabels[source] ?? source;
}

function evidenceTypeLabel(type?: GlobalGuidanceEvidence['evidenceType']) {
  if (type === 'sec-filing') {
    return 'SEC 文件';
  }

  if (type === 'news') {
    return '新闻线索';
  }

  if (type === 'analyst-estimate') {
    return '外部预期';
  }

  if (type === 'transcript') {
    return '会议纪要';
  }

  return '线索';
}

function isSourceIssue(warning: string) {
  return /(failed|unavailable|not configured|request|fetch|skipped|timeout|不可用|失败|未配置)/i.test(warning);
}

function getPanelStatus({
  guidance,
  evidence,
  warnings,
}: {
  guidance: GuidanceMetricComparison[];
  evidence: GlobalGuidanceEvidence[];
  warnings: string[];
}): GuidancePanelStatus {
  if (guidance.length > 0) {
    return 'structured';
  }

  if (evidence.length > 0) {
    return 'evidence-only';
  }

  if (warnings.some(isSourceIssue)) {
    return 'source-issue';
  }

  return 'empty';
}

function statusCopy(status: GuidancePanelStatus) {
  if (status === 'structured') {
    return {
      eyebrow: '已结构化',
      title: '公司指引',
      description: '已从公开来源抽取可展示的结构化指引，并保留原始证据链接。',
    };
  }

  if (status === 'evidence-only') {
    return {
      eyebrow: '发现证据',
      title: '公司指引',
      description: '已找到指引相关原文或来源，但当前只适合先展示证据，暂不强行生成指标。',
    };
  }

  if (status === 'source-issue') {
    return {
      eyebrow: '数据源诊断',
      title: '公司指引',
      description: '本次查询有数据源未成功返回，可查看诊断信息判断是否需要稍后重试。',
    };
  }

  return {
    eyebrow: '已检查',
    title: '公司指引',
    description: '本次查询未找到可展示的公开指引数据或证据。',
  };
}

function StatusIcon({ status }: { status: GuidancePanelStatus }) {
  if (status === 'structured') {
    return <CheckCircle2 className="h-5 w-5 text-[oklch(0.52_0.13_145)]" aria-hidden="true" />;
  }

  if (status === 'evidence-only') {
    return <FileSearch className="h-5 w-5 text-[var(--brand-ink)]" aria-hidden="true" />;
  }

  if (status === 'source-issue') {
    return <AlertTriangle className="h-5 w-5 text-[var(--risk-ink)]" aria-hidden="true" />;
  }

  return <FileText className="h-5 w-5 text-[oklch(0.55_0.018_160)]" aria-hidden="true" />;
}

function QualityBadge({ quality }: { quality?: string }) {
  const qualityKey = quality ?? 'missing';
  const className =
    qualityKey === 'verified'
      ? 'border-[oklch(0.82_0.08_145)] bg-[oklch(0.96_0.035_145)] text-[oklch(0.34_0.09_145)]'
      : qualityKey === 'extracted'
        ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
        : qualityKey === 'estimated'
          ? 'border-[oklch(0.82_0.055_230)] bg-[oklch(0.97_0.025_230)] text-[oklch(0.38_0.07_230)]'
          : qualityKey === 'fallback'
            ? 'border-border bg-muted text-muted-foreground'
            : 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]';

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {qualityLabels[qualityKey] ?? qualityKey}
    </span>
  );
}

function GuidanceHeader({
  status,
  source,
  confidence,
  warningCount,
  evidenceCount,
}: {
  status: GuidancePanelStatus;
  source?: string;
  confidence?: number;
  warningCount: number;
  evidenceCount: number;
}) {
  const copy = statusCopy(status);

  return (
    <div className="rounded-[8px] border border-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)]">
            <StatusIcon status={status} />
          </div>
          <div className="min-w-0">
            <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">{copy.eyebrow}</div>
            <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">{copy.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">{copy.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:w-[260px]">
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="text-[oklch(0.48_0.018_160)]">来源</div>
            <div className="mt-1 font-semibold text-[oklch(0.22_0.018_160)]">{source || '待确认'}</div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="text-[oklch(0.48_0.018_160)]">置信度</div>
            <div className="mt-1 font-semibold text-[oklch(0.22_0.018_160)]">{formatConfidence(confidence)}</div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="text-[oklch(0.48_0.018_160)]">证据</div>
            <div className="mt-1 font-semibold text-[oklch(0.22_0.018_160)]">{evidenceCount} 条</div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="text-[oklch(0.48_0.018_160)]">诊断</div>
            <div className="mt-1 font-semibold text-[oklch(0.22_0.018_160)]">{warningCount} 条</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuidanceMetricCard({ metric }: { metric: GuidanceMetricComparison }) {
  return (
    <div className="rounded-[8px] border border-border bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[oklch(0.18_0.014_160)]">
            {metric.label || metricLabels[metric.metricKey]}
          </div>
          {metric.periodLabel && (
            <div className="mt-1 text-xs text-[oklch(0.48_0.018_160)]">{metric.periodLabel}</div>
          )}
        </div>
        <QualityBadge quality={metric.quality} />
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-[8px] bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs text-[oklch(0.48_0.018_160)]">公司指引</div>
          <div className="mt-1 font-mono font-semibold text-[oklch(0.18_0.014_160)]">
            {formatMetricRange(metric)}
          </div>
        </div>
        <div className="rounded-[8px] bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs text-[oklch(0.48_0.018_160)]">中点</div>
          <div className="mt-1 font-mono font-semibold text-[oklch(0.18_0.014_160)]">
            {formatMetricValue(metric.guidanceMid, metric.metricKey)}
          </div>
        </div>
        <div className="rounded-[8px] bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs text-[oklch(0.48_0.018_160)]">共识</div>
          <div className="mt-1 font-mono font-semibold text-[oklch(0.18_0.014_160)]">
            {formatMetricValue(metric.consensus, metric.metricKey)}
          </div>
        </div>
      </div>

      {metric.evidenceText && (
        <div className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
          {metric.evidenceText}
          {metric.sourceUrl && (
            <a
              href={metric.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 font-semibold hover:underline"
            >
              来源
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function GuidanceMetricsTable({ guidance }: { guidance: GuidanceMetricComparison[] }) {
  if (guidance.length === 0) {
    return null;
  }

  const orderedGuidance = [...guidance].sort(
    (a, b) => metricOrder.indexOf(a.metricKey) - metricOrder.indexOf(b.metricKey)
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-[oklch(0.18_0.014_160)]">结构化指引</h4>
        <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
          {orderedGuidance.length} 项
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {orderedGuidance.map((metric) => (
          <GuidanceMetricCard key={`${metric.metricKey}-${metric.periodLabel ?? 'period'}`} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function EvidenceCard({ item }: { item: GlobalGuidanceEvidence }) {
  return (
    <div className="rounded-[8px] border border-border bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-bold leading-tight text-[oklch(0.18_0.014_160)]">
              {item.title || 'Guidance evidence'}
            </h5>
            {item.extracted && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-ink)]">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                已抽取
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[oklch(0.48_0.018_160)]">
            <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2 py-0.5">
              {sourceLabel(item.source)}
            </span>
            <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2 py-0.5">
              {evidenceTypeLabel(item.evidenceType)}
            </span>
            {item.publishedAt && (
              <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2 py-0.5">
                {item.publishedAt}
              </span>
            )}
            {item.documentType && (
              <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2 py-0.5">
                {item.documentType}
              </span>
            )}
            {item.confidence !== undefined && (
              <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2 py-0.5">
                证据置信度 {formatConfidence(item.confidence)}
              </span>
            )}
          </div>
        </div>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit flex-shrink-0 items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-soft-strong)]"
          >
            原文
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {item.snippet && (
        <p className="mt-3 max-h-28 overflow-y-auto rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3 text-xs leading-relaxed text-[oklch(0.28_0.016_160)]">
          {item.snippet}
        </p>
      )}
    </div>
  );
}

function GuidanceEvidenceSection({ evidence }: { evidence: GlobalGuidanceEvidence[] }) {
  const [showAll, setShowAll] = useState(false);

  if (evidence.length === 0) {
    return null;
  }

  const displayEvidence = showAll ? evidence : evidence.slice(0, 4);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-[oklch(0.18_0.014_160)]">
          <FileText className="h-4 w-4 text-[var(--brand-ink)]" aria-hidden="true" />
          证据来源
        </h4>
        <span className="text-xs text-[oklch(0.48_0.018_160)]">
          {evidence.filter((item) => item.extracted).length} 条已抽取 / {evidence.length} 条总证据
        </span>
      </div>

      <div className="grid gap-3">
        {displayEvidence.map((item, index) => (
          <EvidenceCard key={item.textBlockId ?? item.url ?? `${item.title}-${index}`} item={item} />
        ))}
      </div>

      {evidence.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-[oklch(0.32_0.018_160)] hover:border-[var(--brand-border)] hover:text-[var(--brand-ink)]"
        >
          {showAll ? '收起证据' : `展开全部 ${evidence.length} 条证据`}
          <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function GuidanceEmptyState({
  status,
  evidenceCount,
}: {
  status: GuidancePanelStatus;
  evidenceCount: number;
}) {
  if (status === 'structured') {
    return null;
  }

  const copy =
    status === 'evidence-only'
      ? {
          icon: <FileSearch className="h-5 w-5 text-[var(--brand-ink)]" aria-hidden="true" />,
          title: '已有指引证据，等待进一步结构化',
          body: `本次找到 ${evidenceCount} 条来源证据。页面会先展示原文片段和链接，避免把尚未确认的文本误写成指标。`,
        }
      : status === 'source-issue'
        ? {
            icon: <AlertTriangle className="h-5 w-5 text-[var(--risk-ink)]" aria-hidden="true" />,
            title: '部分数据源暂未返回',
            body: '本次查询未形成可展示指标。请查看下方诊断，确认是密钥、网络还是数据源本身缺失。',
          }
        : {
            icon: <Info className="h-5 w-5 text-[oklch(0.48_0.018_160)]" aria-hidden="true" />,
            title: '暂无公开指引数据',
            body: '已检查当前可用来源，暂未发现可展示的公司指引或证据。',
          };

  return (
    <div className="rounded-[8px] border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)]">
          {copy.icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[oklch(0.18_0.014_160)]">{copy.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">{copy.body}</p>
        </div>
      </div>
    </div>
  );
}

function SourceDiagnostics({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  const sourceIssues = warnings.filter(isSourceIssue);
  const otherNotes = warnings.filter((warning) => !isSourceIssue(warning));

  return (
    <details className="group rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-[var(--brand-ink)]">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          数据源诊断
          <span className="rounded-full border border-[var(--brand-border)] bg-white px-2 py-0.5">
            {warnings.length}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="mt-3 space-y-3">
        {sourceIssues.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-bold text-[var(--risk-ink)]">需要关注</div>
            <ul className="space-y-1 text-xs leading-relaxed text-[var(--risk-ink)]">
              {sourceIssues.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        )}
        {otherNotes.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-bold text-[var(--brand-ink)]">其他说明</div>
            <ul className="space-y-1 text-xs leading-relaxed text-[var(--brand-ink)]">
              {otherNotes.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export function EnhancedGuidanceComparePanel({
  guidance,
  guidanceEvidence,
  warnings,
  source,
  confidence,
}: EnhancedGuidanceComparePanelProps) {
  const evidence = guidanceEvidence ?? [];
  const uniqueWarnings = useMemo(() => uniqueList(warnings), [warnings]);
  const status = getPanelStatus({ guidance: guidance ?? [], evidence, warnings: uniqueWarnings });

  return (
    <div className="space-y-4">
      <GuidanceHeader
        status={status}
        source={source}
        confidence={confidence}
        warningCount={uniqueWarnings.length}
        evidenceCount={evidence.length}
      />

      <GuidanceMetricsTable guidance={guidance ?? []} />

      <GuidanceEmptyState status={status} evidenceCount={evidence.length} />

      <GuidanceEvidenceSection evidence={evidence} />

      <SourceDiagnostics warnings={uniqueWarnings} />

      <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        公司指引内容仅用于研究资料整理，请以公司公告原文和后续披露为准。
      </div>
    </div>
  );
}
