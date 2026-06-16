/**
 * Buy-Side Memo Panel - 完整买方研究备忘录组件
 */

import type { BuySideResearchMemo } from '@/types/serenity';
import { SerenityDataNotice } from './SerenityDataNotice';

interface BuySideMemoPanelProps {
  analysis?: BuySideResearchMemo;
}

const INVESTMENT_VIEW_LABELS: Record<string, string> = {
  positive: '看好',
  neutral: '中性',
  cautious: '谨慎',
};

const getInvestmentViewColor = (view: string) => {
  if (view === 'positive') return 'text-green-700';
  if (view === 'cautious') return 'text-[var(--risk-ink)]';
  return 'text-[var(--brand-ink)]';
};

export function BuySideMemoPanel({ analysis }: BuySideMemoPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
          Buy-Side Research Memo
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
          买方研究备忘录
        </h3>
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂无买方研究备忘录数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        Buy-Side Research Memo
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-1">
        买方研究备忘录
      </h3>
      <p className="text-sm text-[oklch(0.45_0.018_160)] mb-4">
        {analysis.companyName} ({analysis.ticker})
      </p>

      {/* 数据状态提示 */}
      <div className="mb-4">
        <SerenityDataNotice />
      </div>

      {/* 投资观点先行 */}
      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">投资观点</div>
            <div className={`text-2xl font-bold ${getInvestmentViewColor(analysis.investmentView.bias)}`}>
              {INVESTMENT_VIEW_LABELS[analysis.investmentView.bias] || analysis.investmentView.bias}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">核心理由</div>
            <div className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)] max-w-md">
              {analysis.investmentView.coreLogicOneLiner}
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">关键辩论</div>
            <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
              {analysis.investmentView.keyDebates.map((debate, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                  {debate}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Thesis 断点</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.investmentView.thesisBreakpoint}</div>
          </div>
        </div>
      </div>

      {/* 公司业务定位 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">公司业务定位</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">一句话描述</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.businessPositioning.oneLinerDescription}</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">商业模式</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.businessPositioning.businessModel}</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">竞争护城河</div>
          <div className="flex flex-wrap gap-1">
            {analysis.businessPositioning.moats.map((moat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 py-1 text-xs text-[var(--brand-ink)]"
              >
                {moat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 行业与需求分析 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">行业与需求分析</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">TAM</div>
            <div className="text-xl font-bold text-[var(--brand-ink)]">
              {analysis.industryAnalysis.tam ? `${(analysis.industryAnalysis.tam / 1000000000).toFixed(0)}B` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">渗透率</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.industryAnalysis.penetration ? `${(analysis.industryAnalysis.penetration * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">竞争格局</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.industryAnalysis.competitiveLandscape}</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">需求驱动</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.industryAnalysis.growthDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700 mt-1.5 mr-2 flex-shrink-0" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 财务分析 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">财务分析与验证</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">历史趋势</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.financialAnalysis.historicalTrends}</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">指引分析</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.financialAnalysis.guidanceAnalysis}</div>
          </div>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">关键指标</div>
            <div className="flex flex-wrap gap-1">
              {analysis.financialAnalysis.keyMetrics.map((metric, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-2 py-1 text-xs text-[var(--brand-ink)]"
                >
                  {metric}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">验证链条</div>
            <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
              {analysis.financialAnalysis.validationChain.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 估值分析 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">估值分析</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">P/E</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.valuationAnalysis.currentMultiples.pe ? `${analysis.valuationAnalysis.currentMultiples.pe.toFixed(1)}x` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">EV/Sales</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.valuationAnalysis.currentMultiples.evSales ? `${analysis.valuationAnalysis.currentMultiples.evSales.toFixed(1)}x` : '—'}
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-xs text-[oklch(0.45_0.018_160)]">EV/EBITDA</div>
            <div className="text-xl font-bold text-[oklch(0.2_0.016_160)]">
              {analysis.valuationAnalysis.currentMultiples.evEbitda ? `${analysis.valuationAnalysis.currentMultiples.evEbitda.toFixed(1)}x` : '—'}
            </div>
          </div>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">历史分位</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.valuationAnalysis.historicalPercentile}</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">同行对比</div>
            <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.valuationAnalysis.peerComparison}</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Serenity 交叉验证</div>
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
              analysis.valuationAnalysis.serenityCrossChecks.tamAdjPeg
                ? 'border-green-700 bg-green-50 text-green-700'
                : 'border-[var(--brand-border)] bg-white text-[oklch(0.45_0.018_160)]'
            }`}>
              {analysis.valuationAnalysis.serenityCrossChecks.tamAdjPeg ? '✓ TAM-Adj-PEG' : '○ TAM-Adj-PEG'}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
              analysis.valuationAnalysis.serenityCrossChecks.bayesianIntrinsicGrowth
                ? 'border-green-700 bg-green-50 text-green-700'
                : 'border-[var(--brand-border)] bg-white text-[oklch(0.45_0.018_160)]'
            }`}>
              {analysis.valuationAnalysis.serenityCrossChecks.bayesianIntrinsicGrowth ? '✓ Bayesian' : '○ Bayesian'}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
              analysis.valuationAnalysis.serenityCrossChecks.gfDmaHealthIndex
                ? 'border-green-700 bg-green-50 text-green-700'
                : 'border-[var(--brand-border)] bg-white text-[oklch(0.45_0.018_160)]'
            }`}>
              {analysis.valuationAnalysis.serenityCrossChecks.gfDmaHealthIndex ? '✓ GF-DMA' : '○ GF-DMA'}
            </span>
          </div>
        </div>
      </div>

      {/* Bull/Base/Bear 情景 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Bull / Base / Bear 情景</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">情景</th>
                <th className="px-2 py-1 text-right font-semibold text-[oklch(0.45_0.018_160)] border border-border">概率</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">收入增长</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">利润率</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">估值倍数</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">隐含变动</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1 border border-border text-[var(--brand-ink)] font-semibold">Bull</td>
                <td className="px-2 py-1 border border-border text-right text-[oklch(0.2_0.016_160)]">
                  {(analysis.scenarios.bull.probability * 100).toFixed(0)}%
                </td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bull.revenueGrowth}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bull.margin}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bull.multiple}</td>
                <td className="px-2 py-1 border border-border text-green-700 font-semibold">{analysis.scenarios.bull.impliedChange}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] font-semibold">Base</td>
                <td className="px-2 py-1 border border-border text-right text-[oklch(0.2_0.016_160)]">
                  {(analysis.scenarios.base.probability * 100).toFixed(0)}%
                </td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.base.revenueGrowth}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.base.margin}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.base.multiple}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.base.impliedChange}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-border text-[var(--risk-ink)] font-semibold">Bear</td>
                <td className="px-2 py-1 border border-border text-right text-[oklch(0.2_0.016_160)]">
                  {(analysis.scenarios.bear.probability * 100).toFixed(0)}%
                </td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bear.revenueGrowth}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bear.margin}</td>
                <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{analysis.scenarios.bear.multiple}</td>
                <td className="px-2 py-1 border border-border text-[var(--risk-ink)] font-semibold">{analysis.scenarios.bear.impliedChange}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 mt-2">
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Bull 假设</div>
            <ul className="text-xs text-[oklch(0.2_0.016_160)] space-y-0.5">
              {analysis.scenarios.bull.assumptions.map((assumption, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1 w-1 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-1 flex-shrink-0" />
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Base 假设</div>
            <ul className="text-xs text-[oklch(0.2_0.016_160)] space-y-0.5">
              {analysis.scenarios.base.assumptions.map((assumption, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1 w-1 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-1 flex-shrink-0" />
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2">
            <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Bear 假设</div>
            <ul className="text-xs text-[oklch(0.2_0.016_160)] space-y-0.5">
              {analysis.scenarios.bear.assumptions.map((assumption, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1 w-1 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-1 flex-shrink-0" />
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 催化剂 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">催化剂</div>
        <div className="flex flex-wrap gap-1">
          {analysis.catalysts.map((catalyst, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 py-1 text-xs text-[var(--brand-ink)]"
            >
              <span>{catalyst.description}</span>
              <span className="text-[oklch(0.45_0.018_160)]">·</span>
              <span>{catalyst.timeframe}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 风险因素 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">上行风险</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.riskFactors.upsideRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700 mt-1.5 mr-2 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">下行风险</div>
          <ul className="text-sm text-[oklch(0.2_0.016_160)] space-y-1">
            {analysis.riskFactors.downsideRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--risk-ink)] mt-1.5 mr-2 flex-shrink-0" />
                {risk.category}：{risk.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 差异化认知 */}
      {analysis.variantPerception && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">差异化认知 (Variant Perception)</div>
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-[oklch(0.45_0.018_160)] mb-1">市场共识</div>
                <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.variantPerception.marketConsensus}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">我们的差异</div>
                <div className="text-sm text-[var(--brand-ink)]">{analysis.variantPerception.ourDifference}</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs font-semibold text-[oklch(0.45_0.018_160)] mb-1">验证条件</div>
              <div className="text-sm text-[oklch(0.2_0.016_160)]">{analysis.variantPerception.validationConditions}</div>
            </div>
          </div>
        </div>
      )}

      {/* 跟踪仪表盘 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">跟踪仪表盘</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">指标</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">当前值</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">警戒阈值(上)</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">警戒阈值(下)</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">频率</th>
              </tr>
            </thead>
            <tbody>
              {analysis.trackingDashboard.map((metric, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)] font-semibold">{metric.metric}</td>
                  <td className="px-2 py-1 border border-border text-[var(--brand-ink)]">{metric.currentValue || '—'}</td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{metric.upperThreshold || '—'}</td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{metric.lowerThreshold || '—'}</td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.45_0.018_160)]">{metric.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 来源清单 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">来源清单</div>
        <div className="flex flex-wrap gap-1">
          {analysis.sources.map((source, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-xs text-[oklch(0.2_0.016_160)]"
            >
              <span className="font-semibold text-[var(--brand-ink)]">{source.type}</span>
              <span className="text-[oklch(0.45_0.018_160)]">·</span>
              <span>{source.date}</span>
              <span className="text-[oklch(0.45_0.018_160)]">·</span>
              <span>{source.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 免责声明 */}
      <div className="mt-4 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          {analysis.disclaimer}
        </div>
      </div>
    </section>
  );
}
