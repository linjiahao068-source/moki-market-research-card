/**
 * Bayesian Valuation Panel - 贝叶斯内在增长估值组件
 */

import type { BayesianGrowthValuation } from '@/types/serenity';

interface BayesianValuationPanelProps {
  analysis?: BayesianGrowthValuation;
}

const VALUATION_STATE_LABELS: Record<string, string> = {
  undervalued: '低估',
  fair_value: '合理',
  expensive_but_tradable: '偏高但仍需跟踪验证',
  bubble_like: '泡沫化',
};

const DIVERGENCE_STATE_LABELS: Record<string, string> = {
  price_lagging_fundamentals: '股价落后基本面',
  price_aligned_with_fundamentals: '股价匹配基本面',
  price_ahead_of_fundamentals: '股价领先基本面',
  severe_divergence_fomo_risk: '严重背离/FOMO风险',
};

export function BayesianValuationPanel({ analysis }: BayesianValuationPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
          Bayesian Valuation
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
          贝叶斯内在增长估值
        </h3>
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂无贝叶斯估值分析数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        Bayesian Valuation
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
        贝叶斯内在增长估值
      </h3>

      {/* 一句话结论 */}
      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
        <p className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
          {analysis.conclusionOneLiner}
        </p>
      </div>

      {/* 公司定位 & 估值状态 & 价格背离 */}
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">公司定位</div>
          <p className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
            {analysis.companyOneLiner}
          </p>
        </div>
        <div className="rounded-[6px] border border-border bg-white p-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">估值状态</div>
          <div className={`text-lg font-bold ${
            analysis.valuationState === 'undervalued' ? 'text-green-700' :
            analysis.valuationState === 'fair_value' ? 'text-[oklch(0.2_0.016_160)]' :
            analysis.valuationState === 'expensive_but_tradable' ? 'text-[var(--brand-ink)]' :
            'text-[var(--risk-ink)]'
          }`}>
            {VALUATION_STATE_LABELS[analysis.valuationState] || analysis.valuationState}
          </div>
          <div className="text-xs text-[oklch(0.45_0.018_160)] mt-1">{analysis.valuationReasoning}</div>
        </div>
        <div className="rounded-[6px] border border-border bg-white p-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">价格-基本面背离</div>
          <div className={`text-lg font-bold ${
            analysis.priceGrowthDivergence.state === 'price_lagging_fundamentals' ? 'text-green-700' :
            analysis.priceGrowthDivergence.state === 'price_aligned_with_fundamentals' ? 'text-[oklch(0.2_0.016_160)]' :
            analysis.priceGrowthDivergence.state === 'price_ahead_of_fundamentals' ? 'text-[var(--brand-ink)]' :
            'text-[var(--risk-ink)]'
          }`}>
            {DIVERGENCE_STATE_LABELS[analysis.priceGrowthDivergence.state] || analysis.priceGrowthDivergence.state}
          </div>
          <div className="text-xs text-[oklch(0.45_0.018_160)] mt-1">{analysis.priceGrowthDivergence.analysis}</div>
        </div>
      </div>

      {/* 增长假设概率表 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">增长假设概率表（H0-H5）</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">假设</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">CAGR区间</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">先验概率</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">后验概率</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">核心理由</th>
              </tr>
            </thead>
            <tbody>
              {analysis.growthHypotheses.map((hypothesis) => (
                <tr key={hypothesis.hypothesis}>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] font-semibold">
                    {hypothesis.hypothesis}
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.45_0.018_160)]">{hypothesis.cagrRange}</td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-right">
                    {(hypothesis.priorProbability * 100).toFixed(0)}%
                  </td>
                  <td className="px-2 py-1 border border-border text-[var(--brand-ink)] text-right font-semibold">
                    {(hypothesis.posteriorProbability * 100).toFixed(0)}%
                  </td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] text-xs">
                    {hypothesis.coreReasoning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 内在增长 vs 隐含增长 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">加权内在增长速度</div>
          <div className="text-lg font-bold text-[var(--brand-ink)]">
            {analysis.weightedIntrinsicGrowth.cagrRange}
          </div>
          <div className="text-xs text-[oklch(0.45_0.018_160)] mt-1">
            中点：{analysis.weightedIntrinsicGrowth.midpointCagr}%
          </div>
          <ul className="mt-2 text-xs text-[oklch(0.45_0.018_160)] space-y-0.5">
            {analysis.weightedIntrinsicGrowth.keyAssumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1 w-1 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                {assumption}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[6px] border border-border bg-white p-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">市场隐含增长速度</div>
          {analysis.marketImpliedGrowth ? (
            <>
              <div className="text-lg font-bold text-[oklch(0.2_0.016_160)]">
                {analysis.marketImpliedGrowth.cagrRange}
              </div>
              <div className="text-xs text-[oklch(0.45_0.018_160)] mt-1">
                {analysis.marketImpliedGrowth.reasoning}
              </div>
              {analysis.marketImpliedGrowth.missingInputs && (
                <div className="mt-2 text-xs text-[var(--risk-ink)]">
                  缺失数据：{analysis.marketImpliedGrowth.missingInputs}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-[oklch(0.45_0.018_160)]">数据不足</div>
          )}
        </div>
      </div>

      {/* 贝叶斯更新 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">新信息的贝叶斯更新</div>
        <div className="grid gap-2">
          {analysis.bayesianUpdates.map((update, idx) => (
            <div key={idx} className="rounded-[6px] border border-border bg-white p-2 text-sm">
              <div className="text-xs font-semibold text-[var(--brand-ink)]">{update.information}</div>
              <div className="grid gap-2 sm:grid-cols-3 mt-1">
                <div>
                  <div className="text-xs text-[oklch(0.45_0.018_160)]">影响变量</div>
                  <div className="text-[oklch(0.2_0.016_160)]">{update.affectedVariables.join(', ')}</div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.45_0.018_160)]">似然解读</div>
                  <div className="text-[oklch(0.2_0.016_160)]">{update.likelihoodInterpretation}</div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.45_0.018_160)]">后验变化</div>
                  <div className="text-[var(--brand-ink)] font-semibold">{update.posteriorShift}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 上行/下行 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">上行空间</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.upsideDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700 mt-1.5 mr-2 flex-shrink-0" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">下行风险</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.downsideRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--risk-ink)] mt-1.5 mr-2 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 验证周期 & 跟踪指标 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">验证周期</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.validationTimeline.map((timeline, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                {timeline.timeframe}：{timeline.metricsToWatch.join(', ')}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">关键跟踪指标</div>
          <div className="flex flex-wrap gap-1">
            {analysis.trackingIndicators.map((indicator, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-2 py-1 text-xs text-[var(--brand-ink)]"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 研究姿态 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">研究姿态</div>
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">
            {analysis.positionGuidance.posture}
          </div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.positionGuidance.conditions.map((condition, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                {condition}
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
