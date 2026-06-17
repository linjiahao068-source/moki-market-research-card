import { CheckCircle2, ShieldAlert } from 'lucide-react';

const methods = [
  {
    title: '财报与指引',
    text: '把收入、利润率、capex、订单、RPO 和管理层措辞拆成可追踪指标。',
  },
  {
    title: '产业链位置',
    text: '判断公司处在芯片、云、模型、应用、能源或数据中心链条的哪个环节。',
  },
  {
    title: '市场叙事',
    text: '记录乐观叙事、谨慎叙事和 KOL 分歧，避免把热度直接当成证据。',
  },
  {
    title: '风险与反身性',
    text: '观察估值、拥挤交易、叙事反转和基本面兑现之间如何相互影响。',
  },
];

const boundaries = ['不提供投资建议', '不提供实时行情或券商交易', '不输出操作型结论', 'fallback 内容需要来源复核'];

export function MethodBoundarySection() {
  return (
    <section className="px-4 py-8 sm:px-6" id="method">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[8px] border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Research method</div>
          <h2 className="mb-4 text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
            方法：从财报、产业链和叙事之间建立研究坐标。
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {methods.map((item) => (
              <div key={item.title} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand-ink)]" aria-hidden="true" />
                  {item.title}
                </div>
                <p className="text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-5 sm:p-6">
          <div className="mb-2 text-xs font-semibold text-[var(--risk-ink)]">Boundary</div>
          <h2 className="mb-4 text-2xl font-bold leading-tight text-[var(--risk-ink)] sm:text-3xl">
            边界：研究辅助，不替代判断。
          </h2>
          <div className="space-y-3">
            {boundaries.map((item) => (
              <div key={item} className="flex gap-3 rounded-[8px] border border-[var(--risk-border)] bg-white/55 p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--risk-ink)]" aria-hidden="true" />
                <span className="min-w-0 text-sm leading-relaxed text-[var(--risk-ink)]">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--risk-ink)]">
            页面内容仅用于信息整理、研究辅助和教育参考，不构成投资建议。
          </p>
        </div>
      </div>
    </section>
  );
}
