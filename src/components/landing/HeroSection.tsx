import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Radio } from 'lucide-react';

const researchSignals = [
  { label: '财报 / 指引', value: 'Earnings' },
  { label: 'AI 产业链', value: 'Supply chain' },
  { label: 'X 舆情', value: 'Sentiment' },
];

export function HeroSection() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div className="rounded-[8px] border border-border bg-white p-5 shadow-[0_16px_46px_-34px_rgba(0,0,0,0.36)] sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            AI 时代中文投资者的信息焦虑雷达
          </div>
          <h1 className="mb-5 max-w-4xl text-4xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-6xl">
            用一张研究卡，看懂 AI 时代的美股焦虑。
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-[oklch(0.42_0.018_160)] sm:text-lg">
            Moki Market 把财报、市场叙事、AI 产业链、估值风险和舆情信号，整理成中文投资者更容易理解的研究卡。
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {researchSignals.map((signal) => (
              <div key={signal.label} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                <div className="font-mono text-[11px] text-[var(--brand-ink)]">{signal.value}</div>
                <div className="mt-1 text-sm font-semibold text-[oklch(0.18_0.014_160)]">{signal.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/research-cards"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto"
            >
              查看样例研究卡
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/generate"
              className="inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-border bg-white px-5 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted sm:w-auto"
            >
              输入股票试试看
            </Link>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-[oklch(0.5_0.018_160)]">
            仅供信息整理、研究辅助和教育参考，不构成投资建议。
          </p>
        </div>

        <aside className="rounded-[8px] border border-border bg-[oklch(0.18_0.014_160)] p-5 text-white shadow-[0_16px_46px_-34px_rgba(0,0,0,0.45)]">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--brand)]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Research card preview
          </div>
          <div className="mb-4 rounded-[8px] border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand)]">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Moki 拆解顺序
            </div>
            <ol className="space-y-3 text-sm leading-relaxed text-[oklch(0.86_0.01_85)]">
              <li>1. 先把市场焦虑写成一个研究问题。</li>
              <li>2. 再拆财报、指引、产业链位置和叙事分歧。</li>
              <li>3. 最后沉淀证据链和下一步复盘任务。</li>
            </ol>
          </div>
          <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-[var(--risk-ink)]">
            <div className="mb-1 text-xs font-semibold">边界提示</div>
            <p className="text-sm leading-relaxed">
              Moki 不是实时行情屏，也不是操作建议工具；它更像一张研究桌上的信息整理卡。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
