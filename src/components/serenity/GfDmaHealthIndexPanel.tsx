/**
 * GF-DMA Health Index Panel - 基本面/趋势健康评分组件
 */

import type { GfDmaHealthIndex } from '@/types/serenity';

interface GfDmaHealthIndexPanelProps {
  analysis?: GfDmaHealthIndex;
}

const HEALTH_STATE_LABELS: Record<string, string> = {
  healthy_momentum: '健康上涨趋势',
  strong_but_watch: '强劲但需观察',
  hot_but_supported: '过热但有支撑',
  damaged_or_overheated: '趋势受损或过热',
  high_risk: '高风险',
  broken_or_escaping: '趋势断裂或逃逸',
};

const getHealthScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-700';
  if (score >= 75) return 'text-[var(--brand-ink)]';
  if (score >= 65) return 'text-[oklch(0.2_0.016_160)]';
  if (score >= 55) return 'text-[oklch(0.45_0.018_160)]';
  if (score >= 40) return 'text-[var(--brand-ink)]';
  return 'text-[var(--risk-ink)]';
};

export function GfDmaHealthIndexPanel({ analysis }: GfDmaHealthIndexPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
          GF-DMA Health Index
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
          基本面/趋势健康评分
        </h3>
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂无 GF-DMA 健康指数分析数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        GF-DMA Health Index
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
        基本面/趋势健康评分
      </h3>

      {/* 总体评分 */}
      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">最终评分</div>
            <div className={`text-3xl font-bold ${getHealthScoreColor(analysis.finalScore)}`}>
              {analysis.finalScore} / 100
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">健康状态</div>
            <div className="text-lg font-bold text-[oklch(0.2_0.016_160)]">
              {HEALTH_STATE_LABELS[analysis.healthState] || analysis.healthState}
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
          {analysis.oneLinerJudgement}
        </div>
      </div>

      {/* 评分分解 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">综合评分分解</div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2 text-center">
            <div className={`text-xl font-bold ${getHealthScoreColor(analysis.scoreBreakdown.growthMatchScore)}`}>
              {analysis.scoreBreakdown.growthMatchScore}
            </div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">基本面速度匹配 (40%)</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className={`text-xl font-bold ${getHealthScoreColor(analysis.scoreBreakdown.divergenceScore)}`}>
              {analysis.scoreBreakdown.divergenceScore}
            </div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">价格-均线背离 (25%)</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className={`text-xl font-bold ${getHealthScoreColor(analysis.scoreBreakdown.parallelScore)}`}>
              {analysis.scoreBreakdown.parallelScore}
            </div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">趋势平行度 (20%)</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className={`text-xl font-bold ${getHealthScoreColor(analysis.scoreBreakdown.revisionScore)}`}>
              {analysis.scoreBreakdown.revisionScore}
            </div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">预期上修确认 (15%)</div>
          </div>
        </div>
      </div>

      {/* 基本面速度 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">1. 基本面速度 (G_f)</div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">收入 QoQ</div>
            <div className="text-lg font-bold text-[var(--brand-ink)]">
              {analysis.fundamentalSpeed.revenueQoq ? `${(analysis.fundamentalSpeed.revenueQoq * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">EPS QoQ</div>
            <div className="text-lg font-bold text-[var(--brand-ink)]">
              {analysis.fundamentalSpeed.epsQoq ? `${(analysis.fundamentalSpeed.epsQoq * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">毛利润 QoQ</div>
            <div className="text-lg font-bold text-[var(--brand-ink)]">
              {analysis.fundamentalSpeed.grossProfitQoq ? `${(analysis.fundamentalSpeed.grossProfitQoq * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-[var(--brand-soft)] p-2">
            <div className="text-xs text-[var(--brand-ink)] font-semibold">综合 G_f</div>
            <div className="text-lg font-bold text-[var(--brand-ink)]">
              {(analysis.fundamentalSpeed.overallGF * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 均线速度匹配 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">2. 均线速度匹配</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">均线</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">季度化斜率</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">相对基本面速度</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">判断</th>
              </tr>
            </thead>
            <tbody>
              {analysis.dmaSpeedMatches.map((match, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] font-semibold">
                    {match.dma}
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-right">
                    {(match.quarterlySlope * 100).toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 border border-border text-[var(--brand-ink)] text-right font-semibold">
                    {match.relativeToFundamental.toFixed(2)}x
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-xs">
                    {match.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 股价-均线背离 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">3. 股价-均线背离</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">指标</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">当前背离</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">判断</th>
              </tr>
            </thead>
            <tbody>
              {analysis.priceDmaDivergences.map((div, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] font-mono text-xs">
                    {div.metric}
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-right">
                    {(div.divergence * 100).toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-xs">
                    {div.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 趋势平行度 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">4. 趋势平行度 / 逃逸比率</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">Escape Ratio</div>
            <div className="text-lg font-bold text-[var(--brand-ink)]">
              {analysis.trendParallelism.escapeRatio?.toFixed(1) || '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="text-xs text-[var(--brand-ink)] font-semibold">判断</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.trendParallelism.status}</div>
          </div>
        </div>
      </div>

      {/* 预期上修确认 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">5. 预期上修确认</div>
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="text-sm">
              <div className="text-xs text-[oklch(0.45_0.018_160)]">指引 vs 共识</div>
              <div className="text-[oklch(0.2_0.016_160)]">{analysis.revisionConfirmation.guidanceVsConsensus}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs text-[oklch(0.45_0.018_160)]">过去30天变化</div>
              <div className="text-[oklch(0.2_0.016_160)]">{analysis.revisionConfirmation.past30DayChange}</div>
            </div>
            <div className="text-sm text-center">
              <div className="text-xs text-[oklch(0.45_0.018_160)]">评分</div>
              <div className={`text-lg font-bold ${getHealthScoreColor(analysis.revisionConfirmation.score)}`}>
                {analysis.revisionConfirmation.score}
              </div>
              <div className="text-xs text-[oklch(0.45_0.018_160)]">{analysis.revisionConfirmation.status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="mt-4 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          本健康指数为研究分析，不构成投资建议。请结合权威来源独立验证数据和假设。
        </div>
      </div>
    </section>
  );
}
