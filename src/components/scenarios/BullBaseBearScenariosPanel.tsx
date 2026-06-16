import { BullBaseBearScenarioSummary } from '@/types/scenario';

interface BullBaseBearScenariosPanelProps {
  scenarios: BullBaseBearScenarioSummary | null;
}

export function BullBaseBearScenariosPanel({
  scenarios,
}: BullBaseBearScenariosPanelProps) {
  // 空状态：真正没有数据时展示
  if (!scenarios || scenarios.scenarios.length === 0) {
    return (
      <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
        <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        </div>
        <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
        </h3>
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          暂未生成该公司的买方情景推演，后续将接入更多估值和预期数据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">
        Bull/Base/Bear Scenarios
      </div>
      <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
        买方情景推演
      </h3>

      {/* 表格部分 */}
      <div className="mt-4 overflow-x-auto rounded-[8px] border border-border">
        <table className="min-w-[640px] w-full border-collapse bg-white text-left">
          <thead className="bg-[oklch(0.992_0.005_85)] text-xs font-semibold text-[oklch(0.45_0.018_160)]">
            <tr>
              <th className="px-3 py-2">Scenario</th>
              <th className="px-3 py-2">Probability</th>
              <th className="px-3 py-2">Core Assumptions</th>
              <th className="px-3 py-2">Valuation Output</th>
              <th className="px-3 py-2">Scenario Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scenarios.scenarios.map((s) => (
              <tr
                key={s.case}
                className={
                  s.case === 'bear'
                    ? 'bg-[var(--risk-soft)]/50'
                    : s.case === 'bull'
                      ? 'bg-[var(--brand-soft)]/30'
                      : 'bg-white'
                }
              >
                <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold" style={{ color: s.case === 'bear' ? 'var(--risk-ink)' : 'var(--brand-ink)' }}>
                  {s.label}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">
                  {(s.probability * 100).toFixed(0)}%
                </td>
                <td className="px-3 py-3 text-sm">
                  <div className="max-w-xs">
                    {s.coreAssumptions.length > 0 && (
                      <ul className="space-y-1">
                        {s.coreAssumptions.slice(0, 2).map((a, idx) => (
                          <li key={idx} className="text-[oklch(0.2_0.016_160)]">
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm">
                  <div>
                    {s.targetPrice !== null && s.targetPrice !== undefined && (
                      <div className="font-mono font-semibold text-[oklch(0.2_0.016_160)]">
                        {scenarios.currency === 'USD' ? '$' : ''}{s.targetPrice.toFixed(1)}
                      </div>
                    )}
                    {/* Phase 4: 展示推导说明 */}
                    {s.derivationNote && (
                      <div className="mt-1 text-[11px] text-[oklch(0.45_0.018_160)] leading-relaxed">
                        {s.derivationNote}
                      </div>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm">
                  {s.impliedReturnPct !== null && s.impliedReturnPct !== undefined ? (
                    <span
                      className={`font-mono font-semibold ${
                        s.impliedReturnPct > 0 ? 'text-green-700' : s.impliedReturnPct < 0 ? 'text-red-700' : 'text-[oklch(0.2_0.016_160)]'
                      }`}
                    >
                      {s.impliedReturnPct > 0 ? '+' : ''}{s.impliedReturnPct.toFixed(1)}%
                    </span>
                  ) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部汇总信息 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* 概率加权估值演算 */}
        {scenarios.probabilityWeightedTargetPrice !== null && scenarios.probabilityWeightedTargetPrice !== undefined && (
          <div className="rounded-[8px] border border-border bg-white p-3">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">
              概率加权估值演算
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-[oklch(0.16_0.014_160)]">
              {scenarios.currency === 'USD' ? '$' : ''}{scenarios.probabilityWeightedTargetPrice.toFixed(1)}
            </div>
          </div>
        )}

        {/* 情景变化汇总 */}
        {scenarios.riskRewardSummary && (
          <div className="rounded-[8px] border border-border bg-white p-3">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">
              情景变化
            </div>
            <div className="mt-1 space-y-1 text-xs text-[oklch(0.2_0.016_160)]">
              {scenarios.riskRewardSummary.expectedReturnPct !== null && scenarios.riskRewardSummary.expectedReturnPct !== undefined && (
                <div>
                  概率加权变化: {scenarios.riskRewardSummary.expectedReturnPct > 0 ? '+' : ''}{scenarios.riskRewardSummary.expectedReturnPct.toFixed(1)}%
                </div>
              )}
              {scenarios.riskRewardSummary.upsideDownsideRatio !== null && scenarios.riskRewardSummary.upsideDownsideRatio !== undefined && (
                <div>
                  上下行幅度比: {scenarios.riskRewardSummary.upsideDownsideRatio.toFixed(2)}x
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 来源说明和免责 */}
      <div className="mt-4 space-y-2 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
        {scenarios.sourceNote && (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
            {scenarios.sourceNote}
          </div>
        )}
        <div>
          本内容仅用于信息展示，不构成投资建议。
        </div>
        {scenarios.warnings && scenarios.warnings.length > 0 && (
          <ul className="space-y-1 text-[oklch(0.45_0.018_160)]">
            {scenarios.warnings.map((w, idx) => (
              <li key={idx}>
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
