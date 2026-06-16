/**
 * TAM-Adj-PEG Panel - TAM 调整 PEG 估值组件
 */

import type { TamAdjPegValuation } from '@/types/serenity';

interface TamAdjPegPanelProps {
  analysis?: TamAdjPegValuation;
}

const VALUATION_TIER_LABELS: Record<string, string> = {
  very_cheap: '非常便宜',
  clearly_attractive: '明显有吸引力',
  reasonable_to_slightly_cheap: '合理略便宜',
  reasonable_to_slightly_expensive: '合理略贵',
  expensive_unless_super_long_runway: '偏贵（除非超长跑道）',
  very_expensive_or_inputs_distorted: '非常贵/数据失真',
};

const POSITION_TYPE_LABELS: Record<string, string> = {
  core_growth: '核心成长',
  high_beta_growth: '高beta成长',
  turnaround: '反转',
  option_like: '期权特性',
  cyclical: '周期',
};

const getValuationTierColor = (tier: string) => {
  if (tier === 'very_cheap' || tier === 'clearly_attractive') return 'text-green-700';
  if (tier === 'reasonable_to_slightly_cheap' || tier === 'reasonable_to_slightly_expensive') return 'text-[var(--brand-ink)]';
  if (tier === 'expensive_unless_super_long_runway') return 'text-[oklch(0.2_0.016_160)]';
  return 'text-[var(--risk-ink)]';
};

export function TamAdjPegPanel({ analysis }: TamAdjPegPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
          TAM-Adj-PEG
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
          TAM 调整 PEG 估值
        </h3>
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂无 TAM-Adj-PEG 估值分析数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        TAM-Adj-PEG
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
        TAM 调整 PEG 估值
      </h3>

      {/* 结论先行 */}
      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">估值档位</div>
            <div className={`text-2xl font-bold ${getValuationTierColor(analysis.conclusion.valuationTier)}`}>
              {VALUATION_TIER_LABELS[analysis.conclusion.valuationTier] || analysis.conclusion.valuationTier}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">适合的仓位类型</div>
            <div className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-sm font-semibold text-[var(--brand-ink)]">
              {POSITION_TYPE_LABELS[analysis.conclusion.suitablePositionType] || analysis.conclusion.suitablePositionType}
            </div>
          </div>
        </div>
      </div>

      {/* 当前估值 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">1. 当前估值</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">当前 PE</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.currentValuation.currentPe?.toFixed(1) || '—'}x
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">Forward PE</div>
            <div className="text-xl font-bold text-[var(--brand-ink)]">
              {analysis.currentValuation.forwardPe?.toFixed(1) || '—'}x
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">传统 PEG</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.currentValuation.traditionalPeg?.toFixed(2) || '—'}x
            </div>
          </div>
        </div>
      </div>

      {/* 增长拆解 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">2. 增长拆解</div>
        <div className="grid gap-2 sm:grid-cols-5">
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">EPS CAGR (2-3yr)</div>
            <div className="text-xl font-bold text-[var(--brand-ink)]">
              {analysis.growthBreakdown.epsCagr2To3Yr ? `${(analysis.growthBreakdown.epsCagr2To3Yr * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">收入 CAGR</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.growthBreakdown.revenueCagr ? `${(analysis.growthBreakdown.revenueCagr * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">TAM CAGR</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.growthBreakdown.tamCagr ? `${(analysis.growthBreakdown.tamCagr * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">当前渗透率</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.growthBreakdown.currentRevenueVsTam ? `${(analysis.growthBreakdown.currentRevenueVsTam * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">高速增长跑道</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.growthBreakdown.highGrowthDurationYears ? `${analysis.growthBreakdown.highGrowthDurationYears}年` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 因子计算 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">3. TAM Runway Factor</div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[oklch(0.45_0.018_160)]">因子值</div>
                <div className="text-xl font-bold text-[var(--brand-ink)]">{analysis.tamRunwayFactor.estimate.toFixed(2)}x</div>
              </div>
              <div className="text-xs text-[oklch(0.45_0.018_160)] text-right">
                sqrt({analysis.growthBreakdown.highGrowthDurationYears || '—'} / 5)
              </div>
            </div>
            <div className="mt-2 text-xs text-[oklch(0.45_0.018_160)]">
              {analysis.tamRunwayFactor.reasoning}
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">4. Quality Factor</div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)] mb-1">因子值</div>
            <div className="text-xl font-bold text-[var(--brand-ink)]">{analysis.qualityFactor.estimate.toFixed(2)}x</div>
            <div className="grid gap-1 sm:grid-cols-2 mt-2">
              <div>
                <div className="text-xs text-green-700 font-semibold mb-0.5">加分项</div>
                <ul className="text-xs text-[oklch(0.2_0.016_160)] space-y-0.5">
                  {analysis.qualityFactor.positives.map((positive, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block h-1 w-1 rounded-full bg-green-700 mt-1.5 mr-1 flex-shrink-0" />
                      {positive}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-[var(--risk-ink)] font-semibold mb-0.5">扣分项</div>
                <ul className="text-xs text-[oklch(0.2_0.016_160)] space-y-0.5">
                  {analysis.qualityFactor.negatives.map((negative, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block h-1 w-1 rounded-full bg-[var(--risk-ink)] mt-1.5 mr-1 flex-shrink-0" />
                      {negative}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAM-Adj-PEG 计算 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">5. TAM-Adj-PEG 计算</div>
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs text-[oklch(0.45_0.018_160)] mb-1">
            公式：TAM-Adj-PEG = Forward PE / (EPS CAGR × TAM Runway Factor × Quality Factor)
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <div className="text-sm text-[oklch(0.2_0.016_160)]">
              {analysis.currentValuation.forwardPe?.toFixed(1)} / ({(analysis.growthBreakdown.epsCagr2To3Yr || 0) * 100} × {analysis.tamRunwayFactor.estimate.toFixed(2)} × {analysis.qualityFactor.estimate.toFixed(2)})
            </div>
            <div className="text-center">
              <div className="text-xs text-[oklch(0.45_0.018_160)]">调整后增长率</div>
              <div className="text-lg font-bold text-[var(--brand-ink)]">{((analysis.calculation.adjustedGrowth || 0) * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[var(--brand-ink)] font-semibold mb-0.5">TAM-Adj-PEG</div>
              <div className={`text-2xl font-bold ${getValuationTierColor(analysis.conclusion.valuationTier)}`}>
                {analysis.calculation.tamAdjPeg.toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 上行/下行 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">主要上行驱动</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.conclusion.upsideDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700 mt-1.5 mr-2 flex-shrink-0" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">主要下行风险</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.conclusion.downsideRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--risk-ink)] mt-1.5 mr-2 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="mt-4 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          本估值分析为研究假设，不构成投资建议。请结合权威来源独立验证数据和假设。
        </div>
      </div>
    </section>
  );
}
