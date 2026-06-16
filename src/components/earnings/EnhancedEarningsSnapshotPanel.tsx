'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData, MetricSource } from '@/types/earnings';
import { EnhancedEarningsSnapshot } from '@/lib/earnings/enhancedEarningsProvider';
import { formatEps, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';

interface EnhancedEarningsSnapshotPanelProps {
  data: EarningsSnapshotData | EnhancedEarningsSnapshot;
}

const metricLabels: Record<EarningsMetricKey, string> = {
  revenue: '营收',
  netIncome: '净利润',
  eps: 'EPS',
};

const providerLabels: Record<MetricSource, string> = {
  'sec-edgar': 'SEC',
  fmp: 'FMP',
  eastmoney: '东财',
  yahoo: 'Yahoo',
  mock: 'fallback',
  manual: 'manual',
  extracted: '文本抽取',
};

// 类型守卫
function isEnhancedSnapshot(data: EarningsSnapshotData | EnhancedEarningsSnapshot): data is EnhancedEarningsSnapshot {
  return 'dataQualityScore' in data;
}

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

/**
 * 数据质量头部组件
 */
function DataQualityHeader({ data }: { data: EarningsSnapshotData | EnhancedEarningsSnapshot }) {
  const isEnhanced = isEnhancedSnapshot(data);
  const score = isEnhanced ? data.dataQualityScore : null;

  let scoreColor = 'text-gray-600';
  if (score !== null && score !== undefined) {
    if (score >= 8) scoreColor = 'text-green-600';
    else if (score >= 5) scoreColor = 'text-yellow-600';
    else scoreColor = 'text-red-600';
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-3">
      <div className="flex items-center gap-2">
        {score !== null && score !== undefined && score >= 7 ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : score !== null && score !== undefined && score >= 4 ? (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        ) : score !== null && score !== undefined ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <div className="h-4 w-4" />
        )}
        <span className="text-xs font-semibold text-gray-700">
          财报数据
          {score !== null && score !== undefined && (
            <span className={`ml-2 font-bold ${scoreColor}`}>
              {score.toFixed(1)}/10
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>来源: {providerLabels[data.provider] || data.provider}</span>
      </div>
    </div>
  );
}

/**
 * 增长指示器组件
 */
function GrowthIndicator({ value }: { value?: number }) {
  if (value === undefined || isNaN(value)) {
    return <Minus className="h-3 w-3 text-gray-400" />;
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <TrendingUp className="h-3 w-3" />
        {formatPercent(value)}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <TrendingDown className="h-3 w-3" />
        {formatPercent(value)}
      </span>
    );
  }

  return <Minus className="h-3 w-3 text-gray-400" />;
}

/**
 * 增强版指标行组件
 */
function EnhancedMetricRow({
  metric,
  hasEnhancedData
}: {
  metric: EarningsMetricComparison & { qoqGrowthPercent?: number; yoyGrowthPercent?: number };
  hasEnhancedData: boolean;
}) {
  const isMissing = metric.quality === 'missing' && metric.actual === undefined && metric.estimate === undefined;

  return (
    <tr className={isMissing ? 'text-[oklch(0.58_0.018_160)]' : 'text-[oklch(0.2_0.016_160)]'}>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold">
        {metricLabels[metric.metricKey]}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm text-gray-600">
        {metric.estimate !== undefined ? formatMetricValue(metric, metric.estimate) : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm font-semibold">
        {metric.actual !== undefined ? formatMetricValue(metric, metric.actual) : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {metric.surprisePct !== undefined ? (
          <span className={metric.surprisePct > 0 ? 'text-green-600' : metric.surprisePct < 0 ? 'text-red-600' : 'text-gray-500'}>
            {formatPercent(metric.surprisePct)}
          </span>
        ) : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
        {metric.yoyPct !== undefined ? (
          <GrowthIndicator value={metric.yoyPct} />
        ) : hasEnhancedData && 'yoyGrowthPercent' in metric ? (
          <GrowthIndicator value={metric.yoyGrowthPercent} />
        ) : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">
        {metric.actualSource && providerLabels[metric.actualSource] ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            {providerLabels[metric.actualSource]}
          </span>
        ) : '—'}
      </td>
    </tr>
  );
}

/**
 * 估值数据展示组件
 */
function ValuationDataSection({ data }: { data: EarningsSnapshotData | EnhancedEarningsSnapshot }) {
  const hasValuation = data.currentPrice !== undefined ||
    data.forwardPE !== undefined ||
    data.trailingPE !== undefined;

  if (!hasValuation) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">估值数据</h4>
      <div className="grid gap-4 md:grid-cols-3">
        {data.currentPrice !== undefined && (
          <div>
            <p className="text-xs text-gray-500">当前价格</p>
            <p className="text-lg font-bold text-gray-900">${data.currentPrice.toFixed(2)}</p>
          </div>
        )}
        {data.forwardPE !== undefined && (
          <div>
            <p className="text-xs text-gray-500">Forward P/E</p>
            <p className="text-lg font-bold text-gray-900">{data.forwardPE.toFixed(2)}x</p>
          </div>
        )}
        {data.trailingPE !== undefined && (
          <div>
            <p className="text-xs text-gray-500">Trailing P/E</p>
            <p className="text-lg font-bold text-gray-900">{data.trailingPE.toFixed(2)}x</p>
          </div>
        )}
        {data.targetPriceMean !== undefined && (
          <div>
            <p className="text-xs text-gray-500">目标均价</p>
            <p className="text-lg font-bold text-gray-900">${data.targetPriceMean.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 历史趋势预览组件（占位，后续扩展）
 */
function HistoricalTrendsPreview({ data }: { data: EarningsSnapshotData | EnhancedEarningsSnapshot }) {
  if (!isEnhancedSnapshot(data) || !data.historicalQuarters || data.historicalQuarters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">历史趋势</h4>
      <p className="text-xs text-gray-500">
        历史季度数据共 {data.historicalQuarters.length} 个季度
      </p>
      {/* 后续可以添加图表 */}
    </div>
  );
}

/**
 * 来源和免责声明组件
 */
function SourceAndDisclaimer({ data }: { data: EarningsSnapshotData | EnhancedEarningsSnapshot }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-gray-50 p-3">
      <p className="text-xs text-gray-600">
        数据来源: {providerLabels[data.provider]}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        财报数据仅供研究参考，不构成投资建议。请结合公司公告和权威来源验证。
      </p>
    </div>
  );
}

/**
 * 增强版财报快照面板
 */
export function EnhancedEarningsSnapshotPanel({ data }: EnhancedEarningsSnapshotPanelProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const metrics = [getMetric(data, 'revenue'), getMetric(data, 'netIncome'), getMetric(data, 'eps')];
  const periodTitle = [data.fiscalYear, data.fiscalQuarter].filter(Boolean).join(' 财年 ');
  const hasManyWarnings = data.warnings.length > 3;
  const isEnhanced = isEnhancedSnapshot(data);

  return (
    <section className="space-y-4">
      {/* 数据质量头部 */}
      <DataQualityHeader data={data} />

      {/* 主要内容 */}
      <div className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Earnings Snapshot</div>
            <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              财报快照
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
              {periodTitle ? `${periodTitle} 单季报` : '单季度财报数据'}
            </p>
            {data.reportDate && (
              <p className="mt-1 text-xs text-gray-500">
                报告期: {data.reportDate}
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
                <th className="px-3 py-2">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((metric) => (
                <EnhancedMetricRow
                  key={metric.metricKey}
                  metric={isEnhanced ? metric : metric}
                  hasEnhancedData={isEnhanced}
                />
              ))}
            </tbody>
          </table>
        </div>

        {data.warnings.length > 0 && (
          <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
            <button
              type="button"
              onClick={() => setShowWarnings((value) => !value)}
              className="text-left font-semibold hover:underline"
            >
              {hasManyWarnings ? '部分字段暂缺，点击查看详情。' : '数据提示'}
            </button>
            {(!hasManyWarnings || showWarnings) && (
              <ul className="mt-2 space-y-1">
                {data.warnings.map((warning) => (
                  <li key={warning}>- {warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 估值数据 */}
      <ValuationDataSection data={data} />

      {/* 历史趋势 */}
      <HistoricalTrendsPreview data={data} />

      {/* 来源和免责 */}
      <SourceAndDisclaimer data={data} />
    </section>
  );
}
