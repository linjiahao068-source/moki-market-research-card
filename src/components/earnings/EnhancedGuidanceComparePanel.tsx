'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { GuidanceMetricComparison } from '@/types/earnings';
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { formatMoneyCompact } from '@/lib/earnings/formatEarningsValue';

interface EnhancedGuidanceComparePanelProps {
  guidance: GuidanceMetricComparison[];
  guidanceEvidence?: GlobalGuidanceEvidence[];
  warnings?: string[];
  source?: string;
  confidence?: number;
}

/**
 * 质量徽章组件
 */
function QualityBadge({ quality }: { quality?: string }) {
  const colors = {
    verified: 'bg-green-100 text-green-700 border-green-200',
    estimated: 'bg-blue-100 text-blue-700 border-blue-200',
    extracted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    fallback: 'bg-gray-100 text-gray-700 border-gray-200',
    missing: 'bg-red-100 text-red-700 border-red-200'
  };

  const labels = {
    verified: '已验证',
    estimated: '预估',
    extracted: '文本提取',
    fallback: '回退',
    missing: '缺失'
  };

  const qualityKey = (quality || 'missing') as keyof typeof colors;

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${colors[qualityKey]}`}>
      {labels[qualityKey]}
    </span>
  );
}

/**
 * 指引数据头部组件
 */
function GuidanceHeader({
  source,
  confidence,
  warningCount
}: {
  source?: string;
  confidence?: number;
  warningCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-3">
        {confidence !== undefined && confidence >= 0.7 ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : confidence !== undefined && confidence >= 0.4 ? (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        ) : (
          <FileText className="h-5 w-5 text-gray-400" />
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-800">公司指引</h3>
          <p className="text-xs text-gray-500">
            {source || '数据来源未知'}
            {confidence !== undefined && ` · 置信度 ${(confidence * 100).toFixed(0)}%`}
          </p>
        </div>
      </div>
      {warningCount > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs text-yellow-700">
          <AlertTriangle className="h-3 w-3" />
          <span>{warningCount}个提醒</span>
        </div>
      )}
    </div>
  );
}

/**
 * 指引指标表格组件
 */
function GuidanceMetricsTable({ guidance }: { guidance: GuidanceMetricComparison[] }) {
  if (guidance.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="min-w-[500px] w-full border-collapse text-left">
        <thead className="bg-[oklch(0.992_0.005_85)] text-xs font-semibold text-[oklch(0.45_0.018_160)]">
          <tr>
            <th className="px-3 py-2">指标</th>
            <th className="px-3 py-2 text-right">指引下限</th>
            <th className="px-3 py-2 text-right">指引中点</th>
            <th className="px-3 py-2 text-right">指引上限</th>
            <th className="px-3 py-2 text-right">市场共识</th>
            <th className="px-3 py-2">质量</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {guidance.map((metric) => (
            <tr key={metric.metricKey} className="text-[oklch(0.2_0.016_160)]">
              <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold">
                {metric.label}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm text-gray-600">
                {metric.guidanceLow !== undefined ? (
                  metric.label.toLowerCase().includes('eps') ?
                    `${metric.guidanceLow.toFixed(2)}` :
                    formatMoneyCompact(metric.guidanceLow, 'USD')
                ) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm font-semibold">
                {metric.guidanceMid !== undefined ? (
                  metric.label.toLowerCase().includes('eps') ?
                    `${metric.guidanceMid.toFixed(2)}` :
                    formatMoneyCompact(metric.guidanceMid, 'USD')
                ) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm text-gray-600">
                {metric.guidanceHigh !== undefined ? (
                  metric.label.toLowerCase().includes('eps') ?
                    `${metric.guidanceHigh.toFixed(2)}` :
                    formatMoneyCompact(metric.guidanceHigh, 'USD')
                ) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm text-blue-600">
                {metric.consensus !== undefined ? (
                  metric.label.toLowerCase().includes('eps') ?
                    `${metric.consensus.toFixed(2)}` :
                    formatMoneyCompact(metric.consensus, 'USD')
                ) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-xs">
                <QualityBadge quality={metric.quality} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 指引证据展示组件
 */
function GuidanceEvidenceSection({ evidence }: { evidence?: GlobalGuidanceEvidence[] }) {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FileText className="h-4 w-4" />
        指引证据来源
      </h4>
      <div className="space-y-2">
        {evidence.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
            <div className="flex-1">
              {item.snippet && (
                <p className="text-sm text-gray-700">{item.snippet}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                {item.source && <span className="rounded-full bg-white px-2 py-0.5">{item.source}</span>}
                {item.publishedAt && <span>{item.publishedAt}</span>}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    查看原文
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {evidence.length > 3 && (
          <p className="text-xs text-gray-500">还有 {evidence.length - 3} 条来源...</p>
        )}
      </div>
    </div>
  );
}

/**
 * 警告信息组件
 */
function WarningsSection({ warnings }: { warnings?: string[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!warnings || warnings.length === 0) {
    return null;
  }

  const displayWarnings = showAll ? warnings : warnings.slice(0, 3);

  return (
    <div className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
      <h4 className="text-xs font-semibold text-[var(--brand-ink)]">数据提示</h4>
      <ul className="mt-2 space-y-1">
        {displayWarnings.map((warning, index) => (
          <li key={index} className="text-xs leading-relaxed text-[var(--brand-ink)]">
            • {warning}
          </li>
        ))}
      </ul>
      {warnings.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs font-semibold text-[var(--brand-ink)] hover:underline"
        >
          {showAll ? '收起' : `显示全部 ${warnings.length} 条提示`}
        </button>
      )}
    </div>
  );
}

/**
 * 无指引数据提示组件
 */
function NoGuidanceNotice() {
  return (
    <div className="rounded-lg border border-border bg-white p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-gray-400" />
      <h3 className="mb-2 text-sm font-semibold text-gray-700">暂无公司指引数据</h3>
      <p className="text-sm text-gray-500">
        当前股票暂未找到公开的业绩指引信息
      </p>
      <ul className="mx-auto mt-3 max-w-md text-left text-xs text-gray-500">
        <li>• 可以尝试查看公司最新的财报文件（8-K、10-Q）</li>
        <li>• 关注公司业绩电话会议纪要</li>
        <li>• 查阅公司 IR 网站公告</li>
      </ul>
    </div>
  );
}

/**
 * 增强版指引对比面板
 */
export function EnhancedGuidanceComparePanel({
  guidance,
  guidanceEvidence,
  warnings,
  source,
  confidence
}: EnhancedGuidanceComparePanelProps) {
  // 如果完全没有指引数据，显示提示
  if (!guidance || guidance.length === 0) {
    return (
      <div className="space-y-4">
        <GuidanceHeader
          source={source}
          confidence={confidence}
          warningCount={warnings?.length || 0}
        />
        <NoGuidanceNotice />
        {warnings && warnings.length > 0 && <WarningsSection warnings={warnings} />}
      </div>
    );
  }

  // 有指引数据，正常显示
  return (
    <div className="space-y-4">
      {/* 头部 */}
      <GuidanceHeader
        source={source}
        confidence={confidence}
        warningCount={warnings?.length || 0}
      />

      {/* 指标表格 */}
      <GuidanceMetricsTable guidance={guidance} />

      {/* 证据部分 */}
      <GuidanceEvidenceSection evidence={guidanceEvidence} />

      {/* 警告部分 */}
      {warnings && warnings.length > 0 && <WarningsSection warnings={warnings} />}

      {/* 来源和免责 */}
      <div className="rounded-lg border border-border bg-gray-50 p-3">
        <p className="text-xs text-gray-600">
          指引数据仅供研究参考，不构成投资建议。请结合公司公告验证。
        </p>
      </div>
    </div>
  );
}
