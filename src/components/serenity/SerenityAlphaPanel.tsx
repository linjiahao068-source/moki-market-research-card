/**
 * Serenity Alpha Panel - 新闻转 Alpha 假设组件
 */

import type { SerenityAlphaAnalysis } from '@/types/serenity';

interface SerenityAlphaPanelProps {
  analysis?: SerenityAlphaAnalysis;
}

export function SerenityAlphaPanel({ analysis }: SerenityAlphaPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
          Serenity Alpha
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
          新闻转 Alpha 分析
        </h3>
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂无 Serenity Alpha 分析数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        Serenity Alpha
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)] mb-4">
        新闻转 Alpha 分析
      </h3>

      {/* 结论先行 */}
      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-2">结论先行</div>
        <p className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
          {analysis.conclusionOneLiner}
        </p>
        <p className="mt-2 text-xs text-[oklch(0.45_0.018_160)]">
          关键验证条件：{analysis.finalValidationCondition}
        </p>
      </div>

      {/* 表层新闻 & 需求变化 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">A. 表层新闻</div>
          <p className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
            {analysis.surfaceNews}
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">B. 已发生的需求变化</div>
          {analysis.observableDemand.hasObservableDemand ? (
            <ul className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)] space-y-1">
              {analysis.observableDemand.changes.map((change, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)] mt-1.5 mr-2 flex-shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
              暂无明确可观察的需求变化，仅为谈资。
            </p>
          )}
        </div>
      </div>

      {/* 财务翻译 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">C. 财务翻译</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2 text-sm">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">收入影响</div>
            <div className="text-[oklch(0.2_0.016_160)]">{analysis.financialTranslation.revenueImpact}</div>
          </div>
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2 text-sm">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">利润影响</div>
            <div className="text-[oklch(0.2_0.016_160)]">{analysis.financialTranslation.marginImpact}</div>
          </div>
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2 text-sm">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">现金流影响</div>
            <div className="text-[oklch(0.2_0.016_160)]">{analysis.financialTranslation.cashFlowImpact}</div>
          </div>
        </div>
      </div>

      {/* 受益链条 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">D. 受益链条</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {analysis.beneficiaryChain.map((beneficiary, idx) => (
            <div
              key={idx}
              className={`rounded-[6px] border border-border p-2 text-sm ${
                beneficiary.segment === 'first'
                  ? 'bg-[var(--brand-soft)]'
                  : beneficiary.segment === 'second'
                    ? 'bg-[oklch(0.992_0.005_85)]'
                    : 'bg-white'
              }`}
            >
              <div className="text-xs font-semibold text-[var(--brand-ink)]">
                {beneficiary.segment === 'first' ? '一阶' : beneficiary.segment === 'second' ? '二阶' : '三阶'}
              </div>
              <div className="text-[oklch(0.2_0.016_160)] font-semibold">
                {beneficiary.companyName}
              </div>
              {beneficiary.ticker && (
                <div className="text-[oklch(0.45_0.018_160)] text-xs">{beneficiary.ticker}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 小市值高弹性标的 */}
      {analysis.smallCapCandidates.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">E. 小市值高弹性标的</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.smallCapCandidates.map((candidate, idx) => (
              <div key={idx} className="rounded-[6px] border border-border bg-white p-2 text-sm">
                <div className="text-[oklch(0.2_0.016_160)] font-semibold">
                  {candidate.companyName} <span className="text-[oklch(0.45_0.018_160)]">{candidate.ticker}</span>
                </div>
                <ul className="mt-1 text-xs text-[oklch(0.45_0.018_160)] space-y-0.5">
                  {candidate.notes.map((note, noteIdx) => (
                    <li key={noteIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 市场误分类 */}
      {analysis.marketMisclassification && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">F. 市场误分类</div>
          <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-2 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs text-[oklch(0.45_0.018_160)]">当前市场标签</div>
                <div className="text-[oklch(0.2_0.016_160)]">{analysis.marketMisclassification.currentMarketLabel}</div>
              </div>
              <div>
                <div className="text-xs text-[oklch(0.45_0.018_160)]">潜在新标签</div>
                <div className="text-[var(--brand-ink)] font-semibold">{analysis.marketMisclassification.potentialNewLabel}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-[oklch(0.45_0.018_160)]">
              验证要求：{analysis.marketMisclassification.validationRequired}
            </div>
          </div>
        </div>
      )}

      {/* 验证指标 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">G. 验证指标</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[oklch(0.992_0.005_85)] text-xs">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">指标</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">时间</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">确认条件</th>
                <th className="px-2 py-1 text-left font-semibold text-[oklch(0.45_0.018_160)] border border-border">证伪条件</th>
              </tr>
            </thead>
            <tbody>
              {analysis.validationMetrics.map((metric, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border border-border text-[oklch(0.2_0.016_160)]">{metric.metric}</td>
                  <td className="px-2 py-1 border border-border text-[oklch(0.45_0.018_160)]">{metric.timeframe}</td>
                  <td className="px-2 py-1 border border-border text-green-700">{metric.confirmationCondition}</td>
                  <td className="px-2 py-1 border border-border text-[var(--risk-ink)]">{metric.falsificationCondition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 下行风险 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">H. 下行风险</div>
        <ul className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)] space-y-1">
          {analysis.downsideRisks.map((risk, idx) => (
            <li key={idx} className="flex items-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--risk-ink)] mt-1.5 mr-2 flex-shrink-0" />
              {risk}
            </li>
          ))}
        </ul>
      </div>

      {/* 仓位建议 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">I. 仓位建议</div>
        <div className="rounded-[6px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
          <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">
            策略：{analysis.positionGuidance.posture}
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

      {/* Alpha 强度评分 */}
      <div>
        <div className="text-xs font-semibold text-[var(--brand-ink)] mb-1">Alpha 强度评分（1-5）</div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-lg font-bold text-[var(--brand-ink)]">{analysis.alphaScores.overallScore.toFixed(1)}</div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">综合评分</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-lg font-bold text-[oklch(0.2_0.016_160)]">{analysis.alphaScores.demandCertainty.toFixed(1)}</div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">需求确定性</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-lg font-bold text-[oklch(0.2_0.016_160)]">{analysis.alphaScores.transmissionClarity.toFixed(1)}</div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">传导清晰度</div>
          </div>
          <div className="rounded-[6px] border border-border bg-white p-2 text-center">
            <div className="text-lg font-bold text-[oklch(0.2_0.016_160)]">{analysis.alphaScores.businessPurity.toFixed(1)}</div>
            <div className="text-xs text-[oklch(0.45_0.018_160)]">业务纯度</div>
          </div>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="mt-4 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          本分析为研究假设，不构成投资建议。请结合权威来源独立验证数据和假设。
        </div>
      </div>
    </section>
  );
}
